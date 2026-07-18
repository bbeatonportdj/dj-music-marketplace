import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import { Sequelize, DataTypes } from 'sequelize';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const FOLDER_ID = '1oQCLYz1SHHXfbP2B5MZ57UFdJnvNBeIw';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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
  genre:      { type: DataTypes.STRING, defaultValue: 'Top 40' },
  price:      { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
  audio_url:  { type: DataTypes.STRING, defaultValue: '' },
  gdrive_file_id: { type: DataTypes.STRING, defaultValue: '' },
  artwork_url: { type: DataTypes.STRING, defaultValue: '' },
  is_new:     { type: DataTypes.BOOLEAN, defaultValue: false },
  is_hot:     { type: DataTypes.BOOLEAN, defaultValue: false },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'tracks', timestamps: false, freezeTableName: true });

const raw = process.env.GOOGLE_DRIVE_CREDENTIALS;
if (!raw) throw new Error('GOOGLE_DRIVE_CREDENTIALS not set');

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(raw),
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});
const drive = google.drive({ version: 'v3', auth });

function parseFilename(name: string) {
  const base = name.replace(/\.(mp3|flac|wav|aac|ogg|m4a)$/i, '').trim();

  const match1 = base.match(/^(.+?)\s*[-–]\s*(.+?)\s*(?:\(([^)]+)\))?\s*$/);
  if (match1) {
    return {
      artist: match1[1].trim(),
      title: (match1[2] + (match1[3] ? ` (${match1[3]})` : '')).trim(),
      version: match1[3]?.trim() || '',
    };
  }

  const match2 = base.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (match2) {
    return { artist: 'Unknown', title: base, version: match2[2] };
  }

  return { artist: 'Unknown', title: base, version: '' };
}

async function getAllFiles(folderId: string): Promise<any[]> {
  const all = [];
  let pageToken: string | undefined;
  do {
    const res: any = await drive.files.list({
      q: `'${folderId}' in parents`,
      fields: 'files(id, name, size, mimeType), nextPageToken',
      pageSize: 1000,
      pageToken,
    });
    for (const f of res.data.files || []) {
      if (f.mimeType === 'application/vnd.google-apps.folder') {
        const sub = await getAllFiles(f.id);
        all.push(...sub);
      } else if (f.mimeType?.includes('audio')) {
        all.push(f);
      }
    }
    pageToken = res.data.nextPageToken;
  } while (pageToken);
  return all;
}

async function main() {
  await sequelize.authenticate();
  console.log('✅ DB connected');

  const [existing] = await sequelize.query(`SELECT LOWER(title) as title, LOWER(artist) as artist, gdrive_file_id FROM tracks`);
  const existingMap = new Map<string, Set<string>>();
  const existingIds = new Set<string>();
  for (const t of existing as any[]) {
    const key = `${t.title}|${t.artist}`;
    if (!existingMap.has(key)) existingMap.set(key, new Set());
    existingMap.get(key)!.add(t.gdrive_file_id || '');
    if (t.gdrive_file_id) existingIds.add(t.gdrive_file_id);
  }

  console.log('📂 Scanning Drive folder...');
  const files = await getAllFiles(FOLDER_ID);
  console.log(`Found ${files.length} audio files`);

  let imported = 0;
  let skipped = 0;
  let dupInDrive = 0;

  const seenGdriveIds = new Set<string>();

  for (const f of files) {
    if (existingIds.has(f.id)) {
      console.log(`  ⏭ SKIP (already in DB): ${f.name}`);
      skipped++;
      continue;
    }

    if (seenGdriveIds.has(f.id)) {
      console.log(`  ⏭ SKIP (duplicate in folder): ${f.name}`);
      dupInDrive++;
      continue;
    }
    seenGdriveIds.add(f.id);

    const { artist, title, version } = parseFilename(f.name);
    const dupKey = `${title.toLowerCase()}|${artist.toLowerCase()}`;
    if (existingMap.has(dupKey)) {
      console.log(`  ⏭ SKIP (duplicate title+artist): ${f.name} → "${artist} - ${title}"`);
      skipped++;
      continue;
    }

    try {
      await Track.create({
        title,
        artist,
        version,
        version_type: 'clean',
        duration: '0:00',
        bpm: 0,
        key: '',
        genre: 'Top 40',
        price: 0,
        gdrive_file_id: f.id,
        artwork_url: '',
        is_new: true,
        is_hot: false,
      });
      console.log(`  ✅ IMPORTED: ${artist} - ${title}`);
      imported++;
    } catch (err: any) {
      console.error(`  ❌ ERROR: ${f.name} - ${err.message}`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  Total files found: ${files.length}`);
  console.log(`  Imported: ${imported}`);
  console.log(`  Skipped (already in DB / too large): ${skipped}`);
  console.log(`  Duplicates within folder: ${dupInDrive}`);

  await sequelize.close();
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
