import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Sequelize } from 'sequelize';
import { google } from 'googleapis';
import { parseFile } from 'music-metadata';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

let dbUrl = process.env.DATABASE_URL || '';
dbUrl = dbUrl.replace(/\?sslmode=[^&]*/, '').replace(/&sslmode=[^&]*/, '');
const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  logging: false,
});

const raw = process.env.GOOGLE_DRIVE_CREDENTIALS!;
const auth = new google.auth.GoogleAuth({ credentials: JSON.parse(raw), scopes: ['https://www.googleapis.com/auth/drive.readonly'] });
const drive = google.drive({ version: 'v3', auth });

async function downloadFile(fileId: string): Promise<Buffer> {
  const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
  return Buffer.from(res.data as ArrayBuffer);
}

async function extractArtwork(fileId: string): Promise<string | null> {
  try {
    const buffer = await downloadFile(fileId);
    const tmpPath = `/tmp/temp_${Date.now()}_${Math.random().toString(36).slice(2)}.mp3`;
    fs.writeFileSync(tmpPath, buffer);
    const metadata = await parseFile(tmpPath);
    fs.unlinkSync(tmpPath);

    const pictures = metadata.common.picture;
    if (pictures && pictures.length > 0) {
      const pic = pictures[0];
      const inputPath = `/tmp/aw_${Date.now()}`;
      const outputPath = `/tmp/aw_r_${Date.now()}.jpg`;
      fs.writeFileSync(inputPath, pic.data);
      const sharp = (await import('sharp')).default;
      await sharp(inputPath).resize(300, 300, { fit: 'cover' }).jpeg({ quality: 80 }).toFile(outputPath);
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

const BAD_URL = 'https://lh3.googleusercontent.com/d/1TxDDOcRpx_9QwYKr6ioxYhedxBCXliZC';

async function main() {
  await sequelize.authenticate();
  console.log('✅ DB connected');

  // Find tracks with bad artwork
  const [tracks] = await sequelize.query(`
    SELECT id, title, artist, gdrive_file_id, artwork_url 
    FROM tracks 
    WHERE artwork_url = :badUrl
    ORDER BY created_at DESC
  `, { replacements: { badUrl: BAD_URL } });

  console.log(`📋 ${tracks.length} tracks with duplicate artwork\n`);

  let fixed = 0;
  let failed = 0;

  for (const t of tracks as any[]) {
    if (!t.gdrive_file_id) {
      console.log(`  ⏭ ${t.artist} - ${t.title} (no gdrive_file_id)`);
      failed++;
      continue;
    }

    const artwork = await extractArtwork(t.gdrive_file_id);
    if (artwork) {
      await sequelize.query(`UPDATE tracks SET artwork_url = :url WHERE id = :id`, {
        replacements: { url: artwork, id: t.id },
      });
      fixed++;
      if (fixed % 10 === 0) console.log(`  📦 ${fixed} fixed...`);
    } else {
      console.log(`  ❌ ${t.artist} - ${t.title}`);
      failed++;
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`  Fixed: ${fixed}`);
  console.log(`  Failed: ${failed}`);

  await sequelize.close();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
