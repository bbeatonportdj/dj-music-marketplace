/**
 * ============================================================
 *  Batch Upload: Google Drive → Database
 * ============================================================
 *
 *  Scans a Google Drive folder, downloads each audio file,
 *  extracts ID3 metadata + album art, and inserts into the
 *  database (Supabase via Sequelize).
 *
 *  📦 Required (already in package.json):
 *     googleapis, music-metadata, sequelize, pg
 *
 *  🔧 Usage:
 *     1. Set in .env:
 *        GOOGLE_DRIVE_CREDENTIALS={...service account json...}
 *        GOOGLE_DRIVE_FOLDER_ID=1C3RaRyGAU0zFkzDHq5ig_idiyuue8Kuu
 *        DATABASE_URL=postgresql://postgres:...@db.fbwqgbsalqgcrfxhoure.supabase.co:5432/postgres
 *
 *     2. Run:
 *        npx tsx server/src/scripts/uploadFromDrive.ts
 *
 *     3. Dry run (no DB writes):
 *        npx tsx server/src/scripts/uploadFromDrive.ts --dry-run
 *
 *     4. SQL output (no DB connection needed):
 *        npx tsx server/src/scripts/uploadFromDrive.ts --json
 *
 *  📤 What it does per file:
 *      1. Download from Google Drive (stream → buffer)
 *      2. Parse ID3 tags → title, artist, BPM, key, genre, duration
 *      3. Extract album art → save to uploads/artwork/
 *      4. Insert Track record into database
 *      5. Store gdrive_file_id for streaming download
 * ============================================================
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env
import dotenv from 'dotenv';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

// ── Imports ─────────────────────────────────────────────────
import { google } from 'googleapis';
import { parseBuffer } from 'music-metadata';
import { Readable } from 'stream';

// ── Config ──────────────────────────────────────────────────
const FOLDER_ID    = process.env.GOOGLE_DRIVE_FOLDER_ID || '';
const DRY_RUN      = process.argv.includes('--dry-run');
const ARTWORK_DIR  = path.resolve(__dirname, '../../uploads/artwork');

if (!FOLDER_ID) {
  console.error('❌ GOOGLE_DRIVE_FOLDER_ID not set in .env');
  process.exit(1);
}

const OUTPUT_JSON = process.argv.includes('--json');
const HAS_DB = (() => {
  const u = process.env.DATABASE_URL || '';
  return !!u && !u.includes('your_') && !u.includes('placeholder');
})();

if (!DRY_RUN && !HAS_DB && !OUTPUT_JSON) {
  console.error('❌ No database connection available.');
  console.error('   Options:');
  console.error('     1. Set DATABASE_URL in .env (Supabase Postgres URL)');
  console.error('     2. Use --dry-run to scan without writing');
  console.error('     3. Use --json to output SQL insert statements');
  process.exit(1);
}

fs.mkdirSync(ARTWORK_DIR, { recursive: true });

// ── Results tracking ────────────────────────────────────────
interface UploadResult {
  fileName: string;
  title: string;
  artist: string;
  genre: string;
  bpm: number;
  key: string;
  duration: string;
  gdriveFileId: string;
  coverSaved: boolean;
  status: 'imported' | 'skipped' | 'error';
  error?: string;
}

const results: UploadResult[] = [];

// ── Helpers ─────────────────────────────────────────────────

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

function saveCoverArt(data: Uint8Array, format: string): string | null {
  try {
    const extMap: Record<string, string> = {
      'image/jpeg': '.jpg', 'image/png': '.png',
      'image/webp': '.webp', 'image/gif': '.gif',
    };
    const ext = extMap[format] || '.jpg';
    const fileName = `cover_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    const filePath = path.join(ARTWORK_DIR, fileName);
    fs.writeFileSync(filePath, Buffer.from(data));
    return `/uploads/artwork/${fileName}`;
  } catch {
    return null;
  }
}

// ── Step 1: List audio files from Drive ─────────────────────

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

// ── Step 2: Download file from Drive ────────────────────────

async function downloadDriveFile(
  fileId: string,
): Promise<{ buffer: Buffer; mimeType: string }> {
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
    stream.on('end', () => resolve({
      buffer: Buffer.concat(chunks),
      mimeType: 'audio/mpeg',
    }));
    stream.on('error', reject);
  });
}

// ── Step 3: Parse metadata ─────────────────────────────────

async function extractMetadata(buffer: Buffer, mimeType: string, fileName: string) {
  const meta = await parseBuffer(buffer, mimeType, {
    duration: true,
    skipCovers: false,
    includeChapters: false,
  });

  const { format, common } = meta;

  return {
    title:       common.title?.trim() || path.basename(fileName, path.extname(fileName)),
    artist:      common.artist?.trim() || 'Unknown Artist',
    album:       common.album?.trim() || '',
    genre:       common.genre?.[0]?.trim() || 'Uncategorized',
    bpm:         safeBpm(common.bpm),
    key:         common.key?.trim() ? cleanKey(common.key.trim()) : '',
    duration:    format.duration ? formatDuration(format.duration) : '0:00',
    picture:     common.picture?.[0] || null,
  };
}

// ── Step 4: Insert into database ────────────────────────────

async function insertTrack(data: {
  title: string; artist: string; genre: string; bpm: number;
  key: string; duration: string; gdriveFileId: string;
  artworkUrl: string | null;
}) {
  // Dynamic import — only when needed
  const { Sequelize, DataTypes } = await import('sequelize');

  const dbUrl = process.env.DATABASE_URL!;
  const sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false },
    },
    logging: false,
  });

  // Define Track model inline (matches existing schema)
  const Track = sequelize.define('Track', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title:         { type: DataTypes.STRING, allowNull: false },
    artist:        { type: DataTypes.STRING, allowNull: false },
    version:       { type: DataTypes.STRING, defaultValue: '' },
    version_type:  { type: DataTypes.STRING, defaultValue: 'clean' },
    duration:      { type: DataTypes.STRING, defaultValue: '0:00' },
    bpm:           { type: DataTypes.INTEGER, defaultValue: 0 },
    key:           { type: DataTypes.STRING, defaultValue: '' },
    genre:         { type: DataTypes.STRING, defaultValue: 'Uncategorized' },
    price:         { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
    audio_url:     { type: DataTypes.TEXT, defaultValue: '' },
    artwork_url:   { type: DataTypes.TEXT, defaultValue: '' },
    gdrive_file_id:{ type: DataTypes.STRING, defaultValue: null },
    is_new:        { type: DataTypes.BOOLEAN, defaultValue: true },
    is_hot:        { type: DataTypes.BOOLEAN, defaultValue: false },
    energy:        { type: DataTypes.INTEGER, defaultValue: 3 },
    popularity_rank: { type: DataTypes.INTEGER, defaultValue: 1 },
  }, {
    tableName: 'tracks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  await sequelize.sync();
  const track = await Track.create({
    title:         data.title,
    artist:        data.artist,
    genre:         data.genre,
    bpm:           data.bpm,
    key:           data.key,
    duration:      data.duration,
    gdrive_file_id: data.gdriveFileId,
    artwork_url:   data.artworkUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&h=600&fit=crop',
    price:         0.00,
    is_new:        true,
    is_hot:        false,
  });

  await sequelize.close();
  return track;
}

// ── Main ────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60));
  console.log(DRY_RUN ? '🔍 DRY RUN (no DB writes)' : '🚀 Upload from Google Drive to Database');
  console.log('='.repeat(60));

  // List files
  const files = await listDriveFiles(FOLDER_ID);
  console.log(`\n📂 Found ${files.length} audio file(s) in Drive folder\n`);

  if (files.length === 0) {
    console.log('No audio files found. Check folder ID and sharing permissions.');
    return;
  }

  const sqlLines: string[] = [];
  if (OUTPUT_JSON) {
    sqlLines.push('-- SQL INSERT statements generated by uploadFromDrive.ts');
    sqlLines.push('-- Run this in Supabase SQL Editor\n');
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const progress = `[${i + 1}/${files.length}]`;

    try {
      process.stdout.write(`${progress} ${file.name} ... `);

      // Download
      const { buffer } = await downloadDriveFile(file.id);
      process.stdout.write(`⬇️ ${(buffer.length / 1024 / 1024).toFixed(1)}MB `);

      // Extract metadata
      const meta = await extractMetadata(buffer, file.mimeType, file.name);
      process.stdout.write(`🎵 ${meta.title} - ${meta.artist} `);

      // Save cover art if present
      let artworkUrl: string | null = null;
      if (meta.picture) {
        artworkUrl = saveCoverArt(meta.picture.data, meta.picture.format);
        if (artworkUrl) process.stdout.write(`🖼️ `);
      }

      if (DRY_RUN) {
        console.log(`✅ (dry-run)`);
        results.push({
          fileName: file.name, title: meta.title, artist: meta.artist,
          genre: meta.genre, bpm: meta.bpm, key: meta.key, duration: meta.duration,
          gdriveFileId: file.id, coverSaved: !!artworkUrl, status: 'skipped',
        });
        continue;
      }

      if (OUTPUT_JSON) {
        // Generate SQL INSERT instead of writing to DB
        const safeTitle  = meta.title.replace(/'/g, "''");
        const safeArtist = meta.artist.replace(/'/g, "''");
        const artUrl     = artworkUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&h=600&fit=crop';

        const sql = `INSERT INTO tracks (title, artist, genre, bpm, key, duration, gdrive_file_id, artwork_url, price, is_new, is_hot, created_at, updated_at)\nVALUES ('${safeTitle}', '${safeArtist}', '${meta.genre}', ${meta.bpm}, '${meta.key}', '${meta.duration}', '${file.id}', '${artUrl}', 0.00, true, false, NOW(), NOW());\n`;
        sqlLines.push(sql);

        console.log(`✅ (sql)`);
        results.push({
          fileName: file.name, title: meta.title, artist: meta.artist,
          genre: meta.genre, bpm: meta.bpm, key: meta.key, duration: meta.duration,
          gdriveFileId: file.id, coverSaved: !!artworkUrl, status: 'imported',
        });
        continue;
      }

      // Insert into DB (Sequelize)
      const track = await insertTrack({
        title: meta.title,
        artist: meta.artist,
        genre: meta.genre,
        bpm: meta.bpm,
        key: meta.key,
        duration: meta.duration,
        gdriveFileId: file.id,
        artworkUrl,
      });

      const trackId = track.get('id') as string;
      console.log(`✅ ID: ${trackId.slice(0, 8)}...`);
      results.push({
        fileName: file.name, title: meta.title, artist: meta.artist,
        genre: meta.genre, bpm: meta.bpm, key: meta.key, duration: meta.duration,
        gdriveFileId: file.id, coverSaved: !!artworkUrl, status: 'imported',
      });

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`❌ ${msg}`);
      results.push({
        fileName: file.name, title: '', artist: '', genre: '',
        bpm: 0, key: '', duration: '', gdriveFileId: file.id,
        coverSaved: false, status: 'error', error: msg,
      });
    }
  }

  // ── Report ──────────────────────────────────────────────────
  const imported = results.filter(r => r.status === 'imported').length;
  const errors   = results.filter(r => r.status === 'error').length;
  const skipped  = results.filter(r => r.status === 'skipped').length;

  console.log('\n' + '='.repeat(60));
  console.log('📊 REPORT');
  console.log('='.repeat(60));
  console.log(`  Total files : ${results.length}`);
  if (!DRY_RUN) console.log(`  Imported    : ${imported}`);
  console.log(`  Skipped     : ${skipped}`);
  console.log(`  Errors      : ${errors}`);
  console.log('');

  if (results.length > 0) {
    const genreCounts: Record<string, number> = {};
    for (const r of results) {
      if (r.genre) genreCounts[r.genre] = (genreCounts[r.genre] || 0) + 1;
    }
    console.log('  Genre breakdown:');
    for (const [genre, count] of Object.entries(genreCounts).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${genre.padEnd(20)} ${count}`);
    }
  }

  if (errors > 0) {
    console.log('\n  Errors:');
    for (const r of results.filter(r => r.status === 'error')) {
      console.log(`    ❌ ${r.fileName}: ${r.error}`);
    }
  }

  if (OUTPUT_JSON && sqlLines.length > 1) {
    const sqlPath = path.resolve(__dirname, '../../../drive_upload_tracks.sql');
    fs.writeFileSync(sqlPath, sqlLines.join('\n'));
    console.log(`\n  📄 SQL file written: ${sqlPath}`);
    console.log('  ▶️  Open Supabase SQL Editor and paste this file content');
  }

  console.log('\n✅ Done!');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
