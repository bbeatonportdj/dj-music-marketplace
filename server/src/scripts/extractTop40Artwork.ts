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

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
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

async function downloadFile(fileId: string): Promise<Buffer> {
  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  );
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
      const ext = pic.format.includes('png') ? 'png' : 'jpg';
      const outputPath = `/tmp/artwork_resized_${Date.now()}.jpg`;

      fs.writeFileSync(inputPath, pic.data);

      // Resize with sharp
      const sharp = (await import('sharp')).default;
      await sharp(inputPath)
        .resize(300, 300, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(outputPath);

      const resized = fs.readFileSync(outputPath);
      const base64 = resized.toString('base64');

      fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

      return `data:image/jpeg;base64,${base64}`;
    }
  } catch (e: any) {
    // skip
  }
  return null;
}

async function main() {
  await sequelize.authenticate();
  console.log('✅ DB connected');

  // Get Top 40 tracks without artwork
  const [tracks] = await sequelize.query(
    `SELECT id, title, artist, gdrive_file_id, artwork_url FROM tracks WHERE genre = 'Top 40' AND (artwork_url IS NULL OR artwork_url = '' OR artwork_url LIKE '%drive.google.com%')`
  );
  console.log(`Found ${tracks.length} Top 40 tracks needing artwork`);

  let extracted = 0;
  let failed = 0;

  for (const t of tracks as any[]) {
    if (!t.gdrive_file_id) {
      console.log(`  ⏭ SKIP (no gdrive_file_id): ${t.title}`);
      failed++;
      continue;
    }

    console.log(`🎵 ${t.artist} - ${t.title}`);
    const artworkDataUrl = await extractAndResizeArtwork(t.gdrive_file_id);

    if (artworkDataUrl) {
      await sequelize.query(`UPDATE tracks SET artwork_url = :url WHERE id = :id`, {
        replacements: { url: artworkDataUrl, id: t.id },
      });
      console.log(`  ✅ Artwork applied (${(artworkDataUrl.length / 1024).toFixed(0)}KB)`);
      extracted++;
    } else {
      console.log(`  ❌ No embedded artwork found`);
      failed++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  Artwork extracted: ${extracted}`);
  console.log(`  Failed / no artwork: ${failed}`);

  await sequelize.close();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
