import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import { parseBuffer } from 'music-metadata';
import { Readable } from 'stream';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { Sequelize, DataTypes } from 'sequelize';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const DNB_FOLDER_ID = '1cGYzJCUCVoRmHdN0hDmHnE8Z8JtLYbdg';
const ARTWORK_SIZE = 600;
const ARTWORK_BUCKET = 'artwork';

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZid3FnYnNhbHFnY3JmeGhvdXJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODQyNjI1MSwiZXhwIjoyMDk0MDAyMjUxfQ.8Wy0kmOOwTuv9cFOiBJoSfIx7HqxviKfW5ZGeAoGwKk';

const ENERGY_IMAGES: Record<number, { file: string; fileId: string; label: string }> = {
  1: { file: 'screen (1).png', fileId: '1uYHDXztq8UUayYU0fE_NjhAMjFZJcvdK', label: 'Low' },
  2: { file: 'screen (1).png', fileId: '1uYHDXztq8UUayYU0fE_NjhAMjFZJcvdK', label: 'Low' },
  3: { file: 'screen (2).png', fileId: '1UaQ6bAjIlKj9PKgCNSAonvkB7UQOK04p', label: 'Mid' },
  4: { file: 'screen.png', fileId: '17OpaMdq5gRUL0bYry_yklTbvY5A-hDry', label: 'High' },
  5: { file: 'screen.png', fileId: '17OpaMdq5gRUL0bYry_yklTbvY5A-hDry', label: 'High' },
};

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
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title:      { type: DataTypes.STRING, allowNull: false },
  artist:     { type: DataTypes.STRING, allowNull: false },
  version:    { type: DataTypes.STRING, defaultValue: '' },
  version_type: { type: DataTypes.STRING, defaultValue: 'clean' },
  duration:   { type: DataTypes.STRING, defaultValue: '0:00' },
  bpm:        { type: DataTypes.INTEGER, defaultValue: 0 },
  key:        { type: DataTypes.STRING, defaultValue: '' },
  genre:      { type: DataTypes.STRING, defaultValue: 'Uncategorized' },
  price:      { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
  audio_url:  { type: DataTypes.TEXT, defaultValue: '' },
  artwork_url:{ type: DataTypes.TEXT, defaultValue: '' },
  gdrive_file_id:{ type: DataTypes.STRING, defaultValue: null },
  is_new:     { type: DataTypes.BOOLEAN, defaultValue: true },
  is_hot:     { type: DataTypes.BOOLEAN, defaultValue: false },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'tracks', timestamps: false });

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function safeBpm(value: unknown): number {
  if (typeof value === 'number') return Math.round(value);
  if (typeof value === 'string') return Math.round(parseFloat(value));
  return 0;
}

function cleanKey(raw: string): string {
  return raw.replace(/^Key\s*/i, '').trim();
}

function randomPrice(): number {
  return Math.round((Math.random() * 0.2 + 1.90) * 100) / 100;
}

function bpmToEnergy(bpm: number): number {
  if (bpm <= 0) return 3;
  if (bpm < 100) return 1;
  if (bpm < 120) return 2;
  if (bpm < 135) return 3;
  if (bpm < 150) return 4;
  return 5;
}

async function listDriveFiles(folderId: string) {
  const raw = process.env.GOOGLE_DRIVE_CREDENTIALS;
  if (!raw) throw new Error('GOOGLE_DRIVE_CREDENTIALS not set');

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(raw),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  const drive = google.drive({ version: 'v3', auth });

  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, size)',
    pageSize: 200,
    orderBy: 'name',
  });

  const audioMimes = [
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav',
    'audio/mp4', 'audio/x-m4a', 'audio/flac', 'audio/aac', 'audio/ogg',
  ];

  return (res.data.files || []).filter(
    f => f.mimeType && audioMimes.includes(f.mimeType) && f.id && f.name
  ) as { id: string; name: string; mimeType: string; size?: string | null }[];
}

async function downloadDriveFile(fileId: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const raw = process.env.GOOGLE_DRIVE_CREDENTIALS;
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(raw!),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  const drive = google.drive({ version: 'v3', auth });

  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' },
  );

  const stream = response.data as unknown as Readable;
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('end', () => resolve({ buffer: Buffer.concat(chunks), mimeType: 'audio/mpeg' }));
    stream.on('error', reject);
  });
}

async function extractMetadata(buffer: Buffer, mimeType: string, fileName: string) {
  const meta = await parseBuffer(buffer, mimeType, {
    duration: true, skipCovers: false, includeChapters: false,
  });
  const { format, common } = meta;
  return {
    title:    common.title?.trim() || path.basename(fileName, path.extname(fileName)),
    artist:   common.artist?.trim() || 'Unknown Artist',
    bpm:      safeBpm(common.bpm),
    key:      common.key?.trim() ? cleanKey(common.key.trim()) : '',
    duration: format.duration ? formatDuration(format.duration) : '0:00',
  };
}

async function downloadEnergyImages(): Promise<Map<number, Buffer>> {
  const raw = process.env.GOOGLE_DRIVE_CREDENTIALS;
  if (!raw) throw new Error('GOOGLE_DRIVE_CREDENTIALS not set');

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(raw),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  const drive = google.drive({ version: 'v3', auth });

  const imageCache = new Map<number, Buffer>();
  const downloaded = new Map<string, Buffer>();

  for (const [energy, config] of Object.entries(ENERGY_IMAGES)) {
    const e = parseInt(energy);
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

async function main() {
  console.log('='.repeat(60));
  console.log('🥁 Import Drum & Bass from Google Drive');
  console.log('='.repeat(60));

  console.log('\n📥 Downloading energy images for artwork...');
  const imageCache = await downloadEnergyImages();
  console.log(`  Downloaded ${imageCache.size} images\n`);

  console.log('📂 Listing D&B files from Drive...');
  const files = await listDriveFiles(DNB_FOLDER_ID);
  console.log(`  Found ${files.length} audio file(s)\n`);

  if (files.length === 0) {
    console.log('No audio files found. Check folder ID and sharing permissions.');
    return;
  }

  let imported = 0;
  let errors = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const progress = `[${i + 1}/${files.length}]`;

    try {
      process.stdout.write(`${progress} ${file.name} ... `);

      const { buffer } = await downloadDriveFile(file.id);
      process.stdout.write(`⬇️ ${(buffer.length / 1024 / 1024).toFixed(1)}MB `);

      const meta = await extractMetadata(buffer, file.mimeType, file.name);
      process.stdout.write(`🎵 ${meta.title} - ${meta.artist} `);

      // Calculate energy level from BPM
      const energy = bpmToEnergy(meta.bpm || 0);
      const trackPrice = randomPrice();

      // Generate artwork
      const imageBuffer = imageCache.get(energy);
      if (!imageBuffer) throw new Error(`No image for energy ${energy}`);

      const artwork = await sharp(imageBuffer)
        .resize(ARTWORK_SIZE, ARTWORK_SIZE, { fit: 'cover' })
        .png()
        .toBuffer();

      // Insert into DB first to get ID
      const track = await Track.create({
        title:         meta.title,
        artist:        meta.artist,
        genre:         'Drum & Bass',
        bpm:           meta.bpm,
        key:           meta.key,
        duration:      meta.duration,
        gdrive_file_id: file.id,
        price:         trackPrice,
        is_new:        true,
        is_hot:        false,
      });

      const trackId: string = track.get('id') as string;

      // Upload artwork to Supabase Storage
      const artworkUrl = await uploadArtwork(trackId, artwork);
      if (artworkUrl) {
        await Track.update({ artwork_url: artworkUrl }, { where: { id: trackId } });
        process.stdout.write(`🖼️ `);
      }

      const config = ENERGY_IMAGES[energy];
      console.log(`✅ $${trackPrice.toFixed(2)} ${config.label} ID: ${trackId.slice(0, 8)}...`);
      imported++;

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`❌ ${msg}`);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 REPORT');
  console.log('='.repeat(60));
  console.log(`  Total files : ${files.length}`);
  console.log(`  Imported    : ${imported}`);
  console.log(`  Errors      : ${errors}`);
  console.log(`  Genre       : Drum & Bass`);
  console.log(`  Price range : $1.90 - $2.10 (random per track)`);

  await sequelize.close();
  console.log('\n✅ Done!');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
