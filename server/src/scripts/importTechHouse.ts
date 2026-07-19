import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import { Sequelize, DataTypes } from 'sequelize';
import { parseFile } from 'music-metadata';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const FOLDER_ID = '1SBehpqKYivopTQqj6INAno2-xr-l9qtx';

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
  genre:      { type: DataTypes.STRING, defaultValue: 'House' },
  price:      { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.60 },
  audio_url:  { type: DataTypes.STRING, defaultValue: '' },
  gdrive_file_id: { type: DataTypes.STRING, defaultValue: '' },
  artwork_url: { type: DataTypes.STRING, defaultValue: '' },
  is_new:     { type: DataTypes.BOOLEAN, defaultValue: false },
  is_hot:     { type: DataTypes.BOOLEAN, defaultValue: false },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'tracks', timestamps: false, freezeTableName: true });

const raw = process.env.GOOGLE_DRIVE_CREDENTIALS!;
const auth = new google.auth.GoogleAuth({ credentials: JSON.parse(raw), scopes: ['https://www.googleapis.com/auth/drive.readonly'] });
const drive = google.drive({ version: 'v3', auth });

function parseFilename(name: string) {
  const base = name.replace(/\.(mp3|flac|wav|aac|ogg|m4a)$/i, '').trim();
  // Pattern: "XX - Artist - Title (Remix) [Intro Clean] - KEY - BPM.mp3"
  let clean = base.replace(/^\d+\s*[-–]\s*/, '').trim();
  clean = clean.replace(/\s*-\s*[A-B]\d{1,2}\s*-\s*\d{2,3}\s*$/, '').trim();

  // Extract key and BPM
  const keyBpm = base.match(/([A-B]\d{1,2})\s*-\s*(\d{2,3})\.mp3$/i);
  let key = '';
  let bpm = 0;
  if (keyBpm) { key = keyBpm[1]; bpm = parseInt(keyBpm[2]); }

  // Version
  let version = '';
  let versionType = 'clean';
  const versionMatch = clean.match(/\[(Intro(?:\s+(?:Clean|Dirty))?|Clean|Dirty|Extended|Instrumental|Acapella|Short Edit)\]/i);
  if (versionMatch) {
    version = versionMatch[1];
    versionType = version.toLowerCase().includes('dirty') ? 'dirty' : 'clean';
  }
  clean = clean.replace(/\s*\[[^\]]*\]\s*/g, ' ').trim();

  const parts = clean.split(/\s*[-–]\s*/);
  if (parts.length >= 2) {
    return { artist: parts[0].trim(), title: parts.slice(1).join(' - ').trim(), version, versionType, key, bpm };
  }
  return { artist: 'Various Artists', title: clean, version, versionType, key, bpm };
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
      if (f.mimeType?.includes('audio')) all.push(f);
    }
    pageToken = res.data.nextPageToken;
  } while (pageToken);
  return all;
}

async function downloadFile(fileId: string): Promise<Buffer> {
  const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
  return Buffer.from(res.data as ArrayBuffer);
}

async function extractAndResizeArtwork(fileId: string): Promise<string | null> {
  try {
    const buffer = await downloadFile(fileId);
    const tmpPath = `/tmp/temp_${Date.now()}.mp3`;
    fs.writeFileSync(tmpPath, buffer);
    const metadata = await parseFile(tmpPath);
    fs.unlinkSync(tmpPath);

    const pictures = metadata.common.picture;
    if (pictures && pictures.length > 0) {
      const pic = pictures[0];
      const inputPath = `/tmp/artwork_${Date.now()}`;
      const outputPath = `/tmp/artwork_resized_${Date.now()}.jpg`;
      fs.writeFileSync(inputPath, pic.data);
      const sharp = (await import('sharp')).default;
      await sharp(inputPath).resize(300, 300, { fit: 'cover' }).jpeg({ quality: 80 }).toFile(outputPath);
      const resized = fs.readFileSync(outputPath);
      const base64 = resized.toString('base64');
      fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      return `data:image/jpeg;base64,${base64}`;
    }
  } catch (e) {}
  return null;
}

async function main() {
  await sequelize.authenticate();
  console.log('✅ DB connected');

  const [existing] = await sequelize.query(`SELECT gdrive_file_id FROM tracks`);
  const existingIds = new Set<string>((existing as any[]).map(t => t.gdrive_file_id).filter(Boolean));

  console.log('📂 Scanning Drive folder...');
  const files = await getAllFiles(FOLDER_ID);
  console.log(`Found ${files.length} audio files`);

  let imported = 0;
  let skipped = 0;

  for (const f of files) {
    if (existingIds.has(f.id)) {
      skipped++;
      continue;
    }

    const { artist, title, version, versionType, key, bpm } = parseFilename(f.name);

    try {
      const track = await Track.create({
        title,
        artist,
        version,
        version_type: versionType,
        duration: '0:00',
        bpm,
        key,
        genre: 'House',
        price: 0.60,
        gdrive_file_id: f.id,
        artwork_url: '',
        is_new: true,
        is_hot: false,
      });

      const artwork = await extractAndResizeArtwork(f.id);
      if (artwork) {
        await sequelize.query(`UPDATE tracks SET artwork_url = :url WHERE id = :id`, {
          replacements: { url: artwork, id: track.id },
        });
      }
      imported++;
      if (imported % 10 === 0) console.log(`  📦 ${imported} imported...`);
    } catch (err: any) {
      console.error(`  ❌ ${f.name}: ${err.message}`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  Total files: ${files.length}`);
  console.log(`  Imported: ${imported}`);
  console.log(`  Skipped: ${skipped}`);

  await sequelize.close();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
