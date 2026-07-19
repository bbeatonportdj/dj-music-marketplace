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

const FOLDER_ID = '1e4Sv0FsvPggWN1u1npYyGujUfNLrJkMu';

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

  // Extract genre hint from brackets like [House], [Hip-Hop], [Techno]
  let genreHint = '';
  const genreMatch = base.match(/\[(?:TMU[^]]*,\s*)?([A-Za-z &\/,'-]+?)(?:\s*,\s*[A-Za-z &\/,'-]+)?\]\s*$/);
  if (genreMatch) {
    genreHint = genreMatch[1].trim();
  }
  // Also try patterns like [Clean] [House] at end
  const genreMatch2 = base.match(/\[([A-Za-z &\/,'-]+?)\]\s*$/);
  if (!genreHint && genreMatch2) {
    const g = genreMatch2[1].trim();
    if (!['Clean','Dirty','Intro','Extended','Edit','Instrumental','Acapella','Radio','Club','Short'].includes(g)) {
      genreHint = g;
    }
  }

  // Extract version from brackets
  const versions: string[] = [];
  const versionRegex = /\[(Clean|Dirty|Intro(?:\s+Clean)?|Intro(?:\s+Dirty)?|Extended|Instrumental|Acapella|Radio|Short Edit|Throwback Intro|Throwback Redrum|Urban Intro|Extended Mix|Extended Instrumental|DIY Acapella|16 Bar Acapella In|16 Bar Acapella Out|20 Bar Acapella In|16 Bar Acapella|Studio Beatgrid Acapella|No Outro|Flip Edit)\]/gi;
  let vm;
  while ((vm = versionRegex.exec(base)) !== null) {
    versions.push(vm[1]);
  }
  const version = versions.join(' ');
  let versionType = 'clean';
  if (base.includes('[Dirty]')) versionType = 'dirty';
  else if (base.includes('[Clean]')) versionType = 'clean';
  else if (base.includes('[Intro')) versionType = 'intro';

  // Extract key and BPM from pattern like "6A 140" near end
  const keyBpm = base.match(/(\d{1,2}[AB])\s+(\d{2,3})/);
  let key = '';
  let bpm = 0;
  if (keyBpm) {
    key = keyBpm[1];
    bpm = parseInt(keyBpm[2]);
  }

  // Remove brackets and their content for cleaner title/artist
  let clean = base
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Remove trailing key/bpm pattern
  clean = clean.replace(/\s*\d{1,2}[AB]\s+\d{2,3}\s*$/, '').trim();

  // Split on " - " to get artist and title
  const dashIdx = clean.indexOf(' - ');
  if (dashIdx > 0) {
    const artist = clean.substring(0, dashIdx).trim();
    const title = clean.substring(dashIdx + 3).trim();
    return { artist, title, version, versionType, key, bpm, genreHint };
  }

  // Try to find artist at end (after last known artist name)
  return { artist: 'Various Artists', title: clean, version, versionType, key, bpm, genreHint };
}

function guessGenre(genreHint: string, bpm: number, title: string, artist: string): string {
  if (genreHint) {
    const h = genreHint.toLowerCase();
    if (h.includes('hip-hop') || h.includes('hip hop') || h.includes('r&b')) return 'Hip Hop';
    if (h.includes('techno')) return 'Techno';
    if (h.includes('house') || h.includes('garage') || h.includes('disco') || h.includes('nu disco') || h.includes('funky')) return 'House';
    if (h.includes('drum & bass') || h.includes('drum and bass') || h.includes('dnb') || h.includes('indie')) return 'Drum & Bass';
    if (h.includes('hard dance') || h.includes('hardstyle')) return 'Hard Dance';
    if (h.includes('bassline') || h.includes('bass')) return 'Bass House';
    if (h.includes('country') || h.includes('pop')) return 'Top 40';
    if (h.includes('deep house')) return 'House';
    if (h.includes('latin')) return 'Latin';
    if (h.includes('afro')) return 'Afro House';
    if (h.includes('psy') || h.includes('trance')) return 'Psy Trance';
  }

  const text = `${title} ${artist}`.toLowerCase();

  if (/\b(phonk|trap|drill|rap|hip.?hop|beat)\b/i.test(text)) return 'Hip Hop';
  if (/\b(hardstyle|hard dance|rawstyle|hardcore)\b/i.test(text)) return 'Hard Dance';
  if (/\b(drum.?n.?bass|dnb|jungle)\b/i.test(text)) return 'Drum & Bass';
  if (/\b(techno|acid)\b/i.test(text)) return 'Techno';
  if (/\b(afro|amapiano)\b/i.test(text)) return 'Afro House';
  if (/\b(psy|trance|goa)\b/i.test(text)) return 'Psy Trance';
  if (/\b(reggaeton|latin)\b/i.test(text)) return 'Latin';
  if (/\b(k-?pop|korean)\b/i.test(text)) return 'K-Pop';

  // BPM-based fallback
  if (bpm >= 135) return 'Drum & Bass';
  if (bpm >= 125 && bpm <= 135) return 'House';
  if (bpm >= 85 && bpm <= 105) return 'Hip Hop';
  if (bpm >= 140) return 'Hard Dance';

  return 'House';
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
  let artworkOk = 0;

  for (const f of files) {
    if (existingIds.has(f.id)) {
      skipped++;
      continue;
    }

    const { artist, title, version, versionType, key, bpm, genreHint } = parseFilename(f.name);
    const genre = guessGenre(genreHint, bpm, title, artist);

    try {
      const track = await Track.create({
        title,
        artist,
        version,
        version_type: versionType,
        duration: '0:00',
        bpm,
        key,
        genre,
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
        artworkOk++;
      }
      imported++;
      if (imported % 20 === 0) console.log(`  📦 ${imported} imported...`);
    } catch (err: any) {
      console.error(`  ❌ ${f.name}: ${err.message}`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  Total files: ${files.length}`);
  console.log(`  Imported: ${imported}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Artwork: ${artworkOk}/${imported}`);

  // Show genre distribution for new imports
  const [genres] = await sequelize.query(`
    SELECT genre, COUNT(*) as count FROM tracks 
    WHERE gdrive_file_id IN (SELECT gdrive_file_id FROM tracks WHERE price = 0.60 AND created_at > NOW() - INTERVAL '5 minutes')
    GROUP BY genre ORDER BY count DESC
  `);
  console.log(`\n📊 New imports by genre:`);
  for (const g of genres as any[]) {
    console.log(`  ${g.genre.padEnd(20)} ${g.count}`);
  }

  await sequelize.close();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
