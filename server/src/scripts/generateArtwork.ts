/**
 * Generate artwork for all tracks using energy-based images from Drive
 * and upload directly to Supabase Storage.
 *
 * Usage:
 *   npx tsx server/src/scripts/generateArtwork.ts
 *
 * Environment variables needed (in .env):
 *   DATABASE_URL, VITE_SUPABASE_URL, GOOGLE_DRIVE_CREDENTIALS
 */

import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';
import { Readable } from 'stream';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Sequelize, DataTypes } from 'sequelize';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

// ── Config ──────────────────────────────────────────────────
const ARTWORK_SIZE = 600;
const ARTWORK_BUCKET = 'artwork';

// Service role key for storage uploads (hardcoded like insertTracksFromSql.ts)
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZid3FnYnNhbHFnY3JmeGhvdXJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODQyNjI1MSwiZXhwIjoyMDk0MDAyMjUxfQ.8Wy0kmOOwTuv9cFOiBJoSfIx7HqxviKfW5ZGeAoGwKk';

// Energy level → Drive image file name mapping
const ENERGY_IMAGES: Record<number, { file: string; fileId: string; label: string }> = {
  1: { file: 'screen (1).png', fileId: '1uYHDXztq8UUayYU0fE_NjhAMjFZJcvdK', label: 'Low' },
  2: { file: 'screen (1).png', fileId: '1uYHDXztq8UUayYU0fE_NjhAMjFZJcvdK', label: 'Low' },
  3: { file: 'screen (2).png', fileId: '1UaQ6bAjIlKj9PKgCNSAonvkB7UQOK04p', label: 'Mid' },
  4: { file: 'screen.png', fileId: '17OpaMdq5gRUL0bYry_yklTbvY5A-hDry', label: 'High' },
  5: { file: 'screen.png', fileId: '17OpaMdq5gRUL0bYry_yklTbvY5A-hDry', label: 'High' },
};

// ── Supabase Storage Setup ──────────────────────────────────
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabase = createClient(supabaseUrl, SERVICE_KEY);

// ── Database Setup ──────────────────────────────────────────
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
}, { tableName: 'tracks', timestamps: false });

// ── Step 1: Download energy images from Drive ───────────────
async function downloadEnergyImages(): Promise<Map<number, Buffer>> {
  const raw = process.env.GOOGLE_DRIVE_CREDENTIALS;
  if (!raw) throw new Error('GOOGLE_DRIVE_CREDENTIALS not set');

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(raw),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  const drive = google.drive({ version: 'v3', auth });

  const imageCache = new Map<number, Buffer>();
  const downloaded = new Map<string, Buffer>(); // avoid re-downloading same file

  for (const [energy, config] of Object.entries(ENERGY_IMAGES)) {
    const e = parseInt(energy);

    // Reuse if already downloaded
    if (imageCache.has(e)) continue;
    if (downloaded.has(config.fileId)) {
      imageCache.set(e, downloaded.get(config.fileId)!);
      continue;
    }

    console.log(`  Downloading: ${config.file} (${config.label})`);

    const response = await drive.files.get(
      { fileId: config.fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    const stream = response.data as unknown as Readable;
    const chunks: Buffer[] = [];
    const buffer = await new Promise<Buffer>((resolve, reject) => {
      stream.on('data', (c: Buffer) => chunks.push(c));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });

    console.log(`    ${(buffer.length / 1024).toFixed(0)}KB`);
    downloaded.set(config.fileId, buffer);
    imageCache.set(e, buffer);
  }

  return imageCache;
}

// ── Upload artwork to Supabase Storage ──────────────────────
async function uploadArtwork(trackId: string, buffer: Buffer): Promise<string | null> {
  const fileName = `artwork_${trackId.replace(/-/g, '')}.png`;

  try {
    const { error } = await supabase.storage
      .from(ARTWORK_BUCKET)
      .upload(fileName, buffer, { contentType: 'image/png', upsert: true });

    if (error) throw error;

    return supabase.storage.from(ARTWORK_BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch (err: any) {
    console.error(`    ❌ Upload error: ${err.message}`);
    return null;
  }
}

// ── Step 4: Update track in DB ──────────────────────────────
async function updateTrackArtwork(trackId: string, artworkUrl: string): Promise<boolean> {
  try {
    const [affectedCount] = await Track.update(
      { artwork_url: artworkUrl },
      { where: { id: trackId } }
    );
    return affectedCount > 0;
  } catch (err: any) {
    console.error(`    ❌ DB update error: ${err.message}`);
    return false;
  }
}

// ── Main ────────────────────────────────────────────────────
async function main() {
  console.log('='.repeat(60));
  console.log('🎨 Generate Artwork for All Tracks');
  console.log('='.repeat(60));

  // Step 1: Download energy images from Drive
  console.log('\n📥 Downloading energy images...');
  const imageCache = await downloadEnergyImages();
  console.log(`  Downloaded ${imageCache.size} images\n`);

  // Step 2: Get all tracks from DB
  console.log('📋 Fetching all tracks...');
  const tracks = await Track.findAll({
    attributes: ['id', 'title', 'bpm', 'artwork_url'],
    order: [['created_at', 'DESC']],
    raw: true,
  });

  if (!tracks || tracks.length === 0) {
    console.log('No tracks found.');
    return;
  }

  console.log(`Found ${tracks.length} tracks.\n`);

  // Step 3: Process each track
  let updated = 0;
  let errors = 0;
  let skipped = 0;

  function bpmToEnergy(bpm: number): number {
    if (bpm <= 0) return 3;
    if (bpm < 100) return 1;
    if (bpm < 120) return 2;
    if (bpm < 135) return 3;
    if (bpm < 150) return 4;
    return 5;
  }

  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    const energy = bpmToEnergy(track.bpm || 0);
    const progress = `[${i + 1}/${tracks.length}]`;

    try {
      process.stdout.write(`${progress} ${track.title.slice(0, 40).padEnd(42)}`);

      const imageBuffer = imageCache.get(energy);
      if (!imageBuffer) throw new Error(`No image for energy ${energy}`);

      // Resize image to artwork size (600x600) and convert to PNG
      const artwork = await sharp(imageBuffer)
        .resize(ARTWORK_SIZE, ARTWORK_SIZE, { fit: 'cover' })
        .png()
        .toBuffer();

      const url = await uploadArtwork(track.id, artwork);
      if (!url) {
        errors++;
        continue;
      }

      const success = await updateTrackArtwork(track.id, url);
      if (success) {
        const config = ENERGY_IMAGES[energy];
        console.log(`✅ ${config.label}`);
        updated++;
      } else {
        console.log(`❌ DB update failed`);
        errors++;
      }
    } catch (err: any) {
      console.log(`❌ ${err.message}`);
      errors++;
    }
  }

  // ── Report ────────────────────────────────────────────────
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
