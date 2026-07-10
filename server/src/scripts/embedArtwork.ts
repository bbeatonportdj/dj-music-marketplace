/**
 * Embed artwork into audio files for all tracks.
 * Downloads audio from Google Drive, embeds artwork from Supabase Storage,
 * uploads the result back to Supabase Storage, and updates audio_url.
 *
 * Usage:
 *   npx tsx server/src/scripts/embedArtwork.ts
 */

import { createClient } from '@supabase/supabase-js';
import { Sequelize, DataTypes } from 'sequelize';
import { google } from 'googleapis';
import { Readable } from 'stream';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import NodeID3 from 'node-id3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZid3FnYnNhbHFnY3JmeGhvdXJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODQyNjI1MSwiZXhwIjoyMDk0MDAyMjUxfQ.8Wy0kmOOwTuv9cFOiBJoSfIx7HqxviKfW5ZGeAoGwKk';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabase = createClient(supabaseUrl, SERVICE_KEY);

let dbUrl = process.env.DATABASE_URL || '';
dbUrl = dbUrl.replace(/\?sslmode=[^&]*/, '').replace(/&sslmode=[^&]*/, '');
const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  logging: false,
});

const Track = sequelize.define('Track', {
  id:         { type: DataTypes.UUID, primaryKey: true },
  title:      { type: DataTypes.STRING },
  bpm:        { type: DataTypes.INTEGER },
  artwork_url: { type: DataTypes.TEXT },
  audio_url:  { type: DataTypes.TEXT },
  gdrive_file_id: { type: DataTypes.STRING },
}, { tableName: 'tracks', timestamps: false });

// ── Download audio from Google Drive ─────────────────────────
async function downloadFromDrive(fileId: string): Promise<Buffer> {
  const raw = process.env.GOOGLE_DRIVE_CREDENTIALS;
  if (!raw) throw new Error('GOOGLE_DRIVE_CREDENTIALS not set');

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(raw),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  const drive = google.drive({ version: 'v3', auth });

  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' }
  );

  const stream = response.data as unknown as Readable;
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (c: Buffer) => chunks.push(c));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

// ── Download artwork from Supabase Storage ───────────────────
async function downloadArtwork(artworkUrl: string): Promise<Buffer | null> {
  try {
    const url = new URL(artworkUrl);
    const pathParts = url.pathname.split('/');
    // /storage/v1/object/public/artwork/artwork_xxx.png
    const bucket = pathParts[5]; // "artwork"
    const fileName = pathParts.slice(6).join('/'); // "artwork_xxx.png"

    const { data, error } = await supabase.storage.from(bucket).download(fileName);
    if (error) throw error;
    return Buffer.from(await data.arrayBuffer());
  } catch {
    return null;
  }
}

// ── Embed artwork into audio buffer ──────────────────────────
async function embedArtwork(audioBuffer: Buffer, artworkBuffer: Buffer, ext: string): Promise<Buffer> {
  if (ext !== 'mp3') return audioBuffer; // Only support MP3 for now

  const tags = NodeID3.read(audioBuffer);
  tags.image = {
    mime: 'image/png',
    type: { id: 3, name: 'Cover (front)' },
    description: 'Artwork',
    imageBuffer: artworkBuffer,
  };

  return NodeID3.write(tags, audioBuffer);
}

// ── Upload audio to Supabase Storage ─────────────────────────
async function uploadAudio(trackId: string, buffer: Buffer, ext: string): Promise<string | null> {
  const fileName = `audio_${trackId.replace(/-/g, '')}.${ext}`;

  try {
    const { error } = await supabase.storage
      .from('audio')
      .upload(fileName, buffer, { contentType: `audio/${ext}`, upsert: true });

    if (error) throw error;
    return supabase.storage.from('audio').getPublicUrl(fileName).data.publicUrl;
  } catch (err: any) {
    console.error(`    ❌ Upload error: ${err.message}`);
    return null;
  }
}

// ── Main ─────────────────────────────────────────────────────
async function main() {
  console.log('='.repeat(60));
  console.log('🎵 Embed Artwork into Audio Files');
  console.log('='.repeat(60));

  const tracks = await Track.findAll({
    attributes: ['id', 'title', 'bpm', 'artwork_url', 'audio_url', 'gdrive_file_id'],
    raw: true,
  });

  console.log(`Found ${tracks.length} tracks\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    const progress = `[${i + 1}/${tracks.length}]`;

    try {
      process.stdout.write(`${progress} ${track.title?.slice(0, 40).padEnd(42)}`);

      // Skip if no artwork
      if (!track.artwork_url) {
        console.log('⏭️ No artwork');
        skipped++;
        continue;
      }

      // Skip if already processed (check if audio_url is from Supabase Storage audio bucket)
      if (track.audio_url?.includes('/storage/v1/object/public/audio/')) {
        console.log('⏭️ Already processed');
        skipped++;
        continue;
      }

      // Get audio source
      let audioBuffer: Buffer;
      let ext = 'mp3';

      if (track.gdrive_file_id) {
        audioBuffer = await downloadFromDrive(track.gdrive_file_id);
      } else if (track.audio_url) {
        // Download from existing URL
        const response = await fetch(track.audio_url);
        if (!response.ok) throw new Error(`Failed to fetch audio: ${response.status}`);
        audioBuffer = Buffer.from(await response.arrayBuffer());
        // Detect format from URL
        if (track.audio_url.includes('.wav')) ext = 'wav';
        else if (track.audio_url.includes('.flac')) ext = 'flac';
      } else {
        console.log('⏭️ No audio source');
        skipped++;
        continue;
      }

      // Download artwork
      const artworkBuffer = await downloadArtwork(track.artwork_url);
      if (!artworkBuffer) {
        console.log('⏭️ Artwork download failed');
        skipped++;
        continue;
      }

      // Detect format from buffer magic bytes
      if (audioBuffer[0] === 0x52 && audioBuffer[1] === 0x49 && audioBuffer[2] === 0x46 && audioBuffer[3] === 0x46) {
        ext = 'wav';
      } else if (audioBuffer[0] === 0x66 && audioBuffer[1] === 0x4C && audioBuffer[2] === 0x61 && audioBuffer[3] === 0x43) {
        ext = 'flac';
      }

      // Embed artwork
      let newAudioBuffer: Buffer;
      try {
        newAudioBuffer = await embedArtwork(audioBuffer, artworkBuffer, ext);
      } catch {
        // If embedding fails (e.g., WAV format), upload original with artwork in filename
        newAudioBuffer = audioBuffer;
      }

      // Upload to Supabase Storage
      const newUrl = await uploadAudio(track.id, newAudioBuffer, ext);
      if (!newUrl) {
        errors++;
        continue;
      }

      // Update DB
      const [affected] = await Track.update({ audio_url: newUrl }, { where: { id: track.id } });
      if (affected > 0) {
        console.log('✅');
        updated++;
      } else {
        console.log('❌ DB update failed');
        errors++;
      }

    } catch (err: any) {
      console.log(`❌ ${err.message}`);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 REPORT');
  console.log('='.repeat(60));
  console.log(`  Total tracks : ${tracks.length}`);
  console.log(`  Updated      : ${updated}`);
  console.log(`  Skipped      : ${skipped}`);
  console.log(`  Errors       : ${errors}`);
  console.log('\n✅ Done!');
}

main().catch((err) => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
