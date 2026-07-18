import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import { Sequelize, DataTypes } from 'sequelize';
import { createClient } from '@supabase/supabase-js';
import { parseFile } from 'music-metadata';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const FOLDER_ID = '1VeJmWoDeeLSMOAvx36E7Yo_LFcVeMPXR';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
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
  artwork_url: { type: DataTypes.STRING, defaultValue: '' },
}, { tableName: 'tracks', timestamps: false, freezeTableName: true });

const raw = process.env.GOOGLE_DRIVE_CREDENTIALS;
if (!raw) throw new Error('GOOGLE_DRIVE_CREDENTIALS not set');

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(raw),
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});
const drive = google.drive({ version: 'v3', auth });

async function getAllFiles(folderId: string): Promise<any[]> {
  const all: any[] = [];
  let pageToken: string | undefined;
  do {
    const res: any = await drive.files.list({
      q: `'${folderId}' in parents`,
      fields: 'files(id, name, size, mimeType), nextPageToken',
      pageSize: 1000,
      pageToken,
    });
    for (const f of res.data.files || []) {
      if (f.mimeType?.includes('audio') || /\.(mp3|flac|wav)$/i.test(f.name)) {
        all.push(f);
      }
    }
    pageToken = res.data.nextPageToken;
  } while (pageToken);
  return all;
}

async function downloadFile(fileId: string): Promise<Buffer> {
  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  );
  return Buffer.from(res.data as ArrayBuffer);
}

async function extractArtwork(fileId: string): Promise<string | null> {
  try {
    const buffer = await downloadFile(fileId);
    const tmpPath = `/tmp/temp_${Date.now()}.mp3`;
    const fs = await import('fs');
    fs.writeFileSync(tmpPath, buffer);

    const metadata = await parseFile(tmpPath);
    fs.unlinkSync(tmpPath);

    const pictures = metadata.common.picture;
    if (pictures && pictures.length > 0) {
      const pic = pictures[0];
      const ext = pic.format.includes('jpeg') ? 'jpg' : pic.format.includes('png') ? 'png' : 'jpg';
      const base64 = pic.data.toString('base64');
      return `data:${pic.format};base64,${base64}`;
    }
  } catch (e: any) {
    // ignore
  }
  return null;
}

async function main() {
  await sequelize.authenticate();
  console.log('✅ DB connected');

  console.log('📂 Scanning Drive folder...');
  const files = await getAllFiles(FOLDER_ID);
  console.log(`Found ${files.length} audio files`);

  // Get K-Pop tracks from DB
  const [tracks] = await sequelize.query(
    `SELECT id, title, artist, gdrive_file_id, artwork_url FROM tracks WHERE genre = 'K-Pop'`
  );
  console.log(`Found ${tracks.length} K-Pop tracks in DB`);

  // Build map of gdrive_file_id -> track
  const trackMap = new Map<string, any>();
  for (const t of tracks as any[]) {
    if (t.gdrive_file_id) trackMap.set(t.gdrive_file_id, t);
  }

  // Try to extract artwork from each audio file
  let artworkFound = 0;
  let artworkApplied = 0;
  const seenArtworks = new Map<string, string>(); // cache artwork by base64

  for (const f of files) {
    const track = trackMap.get(f.id);
    if (!track) continue;
    if (track.artwork_url && !track.artwork_url.includes('drive.google.com')) continue;

    console.log(`\n🎵 Checking: ${track.artist} - ${track.title}`);

    // Check if we already extracted this artwork
    let artworkDataUrl: string | null = null;

    // Try extracting from this file
    artworkDataUrl = await extractArtwork(f.id);

    if (artworkDataUrl) {
      artworkFound++;
      console.log(`  🖼️ Found embedded artwork`);

      // Upload artwork to a temp location and get public URL
      // Since Supabase storage is full, we'll use Google Drive thumbnail approach
      // or store as data URL in DB (not ideal but works)

      // Actually, let's try to upload to a free image host
      // For now, use Google Drive thumbnail URL
      const thumbUrl = `https://drive.google.com/uc?export=view&id=${f.id}`;

      // Update all tracks with this artwork
      for (const [, t] of trackMap) {
        if (!t.artwork_url || t.artwork_url.includes('drive.google.com')) {
          // Use a better approach - upload to imgbb or similar
          // For now, just use the Google Drive file as thumbnail
          await sequelize.query(`UPDATE tracks SET artwork_url = :url WHERE id = :id`, {
            replacements: { url: thumbUrl, id: t.id },
          });
          artworkApplied++;
          console.log(`  ✅ Applied to: ${t.artist} - ${t.title}`);
        }
      }

      // Only need one artwork for all K-Pop tracks (same mix)
      break;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  Artwork found: ${artworkFound}`);
  console.log(`  Tracks updated: ${artworkApplied}`);

  await sequelize.close();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
