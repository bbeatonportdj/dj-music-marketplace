import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import { Sequelize, DataTypes } from 'sequelize';
import { parseFile } from 'music-metadata';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const FOLDER_ID = '1Y1fXVOLRZ7bi-B_hNJy-V5ppX4pP5LCQ';

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
  genre:      { type: DataTypes.STRING, defaultValue: 'Bass House' },
  price:      { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.50 },
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
  let clean = base.replace(/^\d+\s*[-–]\s*/, '').trim();
  // Strip trailing " - KEY - BPM"
  clean = clean.replace(/\s*-\s*\d{1,2}[A-B]\s*-\s*\d{2,3}\s*$/, '').trim();
  // Remove (Short Edit), _v1 etc from title
  clean = clean.replace(/_v\d+$/i, '').trim();

  // Split on " - " to get artist and rest
  const parts = clean.split(/\s*[-–]\s*/);
  if (parts.length >= 2) {
    const artist = parts[0].trim();
    const rest = parts.slice(1).join(' - ').trim();
    // Extract version from brackets at the end
    const versionMatch = rest.match(/\[([^\]]+)\]\s*(?:\[([^\]]+)\])?\s*$/);
    let version = '';
    let versionType = 'clean';
    if (versionMatch) {
      const versions: string[] = [];
      if (versionMatch[1]) versions.push(versionMatch[1]);
      if (versionMatch[2]) versions.push(versionMatch[2]);
      version = versions.join(' ');
      const lower = version.toLowerCase();
      if (lower.includes('dirty')) versionType = 'dirty';
      else if (lower.includes('intro')) versionType = 'intro';
      else if (lower.includes('acapella')) versionType = 'acapella';
      else if (lower.includes('instrumental')) versionType = 'instrumental';
      else if (lower.includes('extended')) versionType = 'extended';
    }
    const title = rest.replace(/\s*\[[^\]]+\]\s*(?:\[[^\]]+\])?\s*$/, '').trim();
    return { artist, title, version, versionType };
  }
  return { artist: 'Unknown', title: base, version: '', versionType: 'clean' };
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
  const fs = await import('fs');
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
      console.log(`  ⏭ SKIP (already in DB): ${f.name}`);
      skipped++;
      continue;
    }

    const { artist, title, version, versionType } = parseFilename(f.name);

    // Extract BPM and Key from filename
    const nameClean = f.name.replace(/\.(mp3|flac|wav|aac|ogg|m4a)$/i, '').trim();
    const bpmMatch = nameClean.match(/(\d{2,3})\s*$/);
    const keyMatch = nameClean.match(/\b(\d{1,2}[A-B])\b/);
    const bpm = bpmMatch ? parseInt(bpmMatch[1]) : 0;
    const key = keyMatch ? keyMatch[1] : '';

    try {
      const track = await Track.create({
        title,
        artist,
        version,
        version_type: versionType,
        duration: '0:00',
        bpm,
        key,
        genre: 'Bass House',
        price: 0.50,
        gdrive_file_id: f.id,
        artwork_url: '',
        is_new: true,
        is_hot: false,
      });
      console.log(`  ✅ ${artist} - ${title} [${version}]`);

      // Extract artwork
      const artwork = await extractAndResizeArtwork(f.id);
      if (artwork) {
        await sequelize.query(`UPDATE tracks SET artwork_url = :url WHERE id = :id`, {
          replacements: { url: artwork, id: track.id },
        });
        console.log(`     🖼️ Artwork (${(artwork.length / 1024).toFixed(0)}KB)`);
      } else {
        console.log(`     ❌ No artwork`);
      }
      imported++;
    } catch (err: any) {
      console.error(`  ❌ ERROR: ${f.name} - ${err.message}`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  Total files: ${files.length}`);
  console.log(`  Imported: ${imported}`);
  console.log(`  Skipped: ${skipped}`);

  await sequelize.close();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
