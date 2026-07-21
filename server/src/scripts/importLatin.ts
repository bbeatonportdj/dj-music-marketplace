import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import fs from 'fs';
import { parseFile } from 'music-metadata';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const FOLDER_ID = '1Z55VrfGreKoHr7grzbMUn7Yrn0ojGFSa';
const GENRE = 'Latin';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const raw = process.env.GOOGLE_DRIVE_CREDENTIALS!;
const auth = new google.auth.GoogleAuth({ credentials: JSON.parse(raw), scopes: ['https://www.googleapis.com/auth/drive.readonly'] });
const drive = google.drive({ version: 'v3', auth });

function parseFilename(name: string) {
  const base = name.replace(/\.(mp3|flac|wav|aac|ogg|m4a)$/i, '').trim();
  let clean = base.replace(/^\d+\s*[-–]\s*/, '').trim();

  // Extract trailing key + BPM: "9B 87" or "2a 151"
  const keyBpm = clean.match(/\s+([A-B]\d{1,2})\s+(\d{2,3})\s*$/i);
  let key = '';
  let bpm = 0;
  if (keyBpm) {
    key = keyBpm[1];
    bpm = parseInt(keyBpm[2]);
    clean = clean.replace(/\s+[A-B]\d{1,2}\s+\d{2,3}\s*$/i, '').trim();
  }

  // Extract version from brackets
  let version = '';
  let versionType = 'clean';
  const versionMatch = clean.match(/\[(Intro(?:\s+(?:Clean|Dirty))?|Clean|Dirty|Extended|Instrumental|Acapella|Edit|VIP|Remix|Latin)\]/i);
  if (versionMatch) {
    version = versionMatch[1];
    versionType = version.toLowerCase().includes('dirty') ? 'dirty' : 'clean';
  }
  clean = clean.replace(/\s*\[[^\]]*\]\s*/g, ' ').trim();

  // Remove leading number prefix
  clean = clean.replace(/^\d+\.\s*/, '').trim();

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
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, size, mimeType), nextPageToken',
      pageSize: 1000,
      pageToken,
    });
    for (const f of res.data.files || []) {
      if (f.mimeType?.includes('audio') && !f.name.startsWith('._') && (f.size || 0) > 10000) all.push(f);
    }
    pageToken = res.data.nextPageToken;
  } while (pageToken);
  return all;
}

async function extractArtwork(fileId: string): Promise<string | null> {
  try {
    const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(res.data as ArrayBuffer);
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
  console.log('✅ Connected to Supabase');

  const { data: existingTracks } = await supabase.from('tracks').select('gdrive_file_id, title, artist');
  const existingIds = new Set<string>((existingTracks || []).map(t => t.gdrive_file_id).filter(Boolean));
  const existingPairs = new Set<string>((existingTracks || []).map(t =>
    `${(t.title||'').toLowerCase().replace(/[^a-z0-9]/g, '')}|${(t.artist||'').toLowerCase().replace(/[^a-z0-9]/g, '')}`
  ));

  console.log('📂 Scanning Drive folder...');
  const files = await getAllFiles(FOLDER_ID);
  console.log(`Found ${files.length} audio files`);

  let imported = 0;
  let skippedDup = 0;
  let skippedTitle = 0;

  for (const f of files) {
    if (existingIds.has(f.id)) { skippedDup++; continue; }

    const parsed = parseFilename(f.name);

    const pairKey = `${parsed.title.toLowerCase().replace(/[^a-z0-9]/g, '')}|${parsed.artist.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    if (existingPairs.has(pairKey)) {
      console.log(`  ⏭️ Skip dup: ${parsed.artist} - ${parsed.title}`);
      skippedTitle++;
      continue;
    }

    try {
      const artwork = await extractArtwork(f.id);

      const { error } = await supabase.from('tracks').insert({
        title: parsed.title,
        artist: parsed.artist,
        version: parsed.version,
        version_type: parsed.versionType,
        duration: '0:00',
        bpm: parsed.bpm,
        key: parsed.key,
        genre: GENRE,
        price: 0.00,
        gdrive_file_id: f.id,
        artwork_url: artwork || '',
        is_new: true,
        is_hot: false,
      });

      if (error) {
        console.error(`  ❌ ${f.name}: ${error.message}`);
      } else {
        imported++;
        existingPairs.add(pairKey);
        console.log(`  ✅ [${imported}] ${parsed.artist} - ${parsed.title} | ${parsed.bpm||'?'}BPM ${parsed.key||'?'}`);
      }
    } catch (err: any) {
      console.error(`  ❌ ${f.name}: ${err.message}`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  Genre: ${GENRE}`);
  console.log(`  Total files: ${files.length}`);
  console.log(`  Imported: ${imported}`);
  console.log(`  Skipped (Drive dup): ${skippedDup}`);
  console.log(`  Skipped (title dup): ${skippedTitle}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
