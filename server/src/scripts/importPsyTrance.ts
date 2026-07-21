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

const FOLDER_ID = '12JuIR-ny2SbIS4_mPx6UVBmgiPj2h0kM';
const GENRE = 'Psy Trance';
const PRICE = 0.80;

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const raw = process.env.GOOGLE_DRIVE_CREDENTIALS!;
const auth = new google.auth.GoogleAuth({ credentials: JSON.parse(raw), scopes: ['https://www.googleapis.com/auth/drive.readonly'] });
const drive = google.drive({ version: 'v3', auth });

function parseFilename(name: string) {
  const base = name.replace(/\.(mp3|flac|wav|aac|ogg|m4a|aif|aiff)$/i, '').trim();
  let clean = base;
  
  // Extract BPM and key at start (e.g., "138 - Fm - Artist - Title")
  const bpmKeyMatch = clean.match(/^(\d{2,3})\s*-\s*([A-G][#b]?m?\d?)\s*-\s*/i);
  let key = '';
  let bpm = 0;
  if (bpmKeyMatch) {
    bpm = parseInt(bpmKeyMatch[1]);
    key = bpmKeyMatch[2];
    clean = clean.replace(/^(\d{2,3})\s*-\s*[A-G][#b]?m?\d?\s*-\s*/i, '');
  }
  
  // Extract BPM only at start
  if (!bpm) {
    const bpmOnly = clean.match(/^(\d{2,3})\s*-\s*/);
    if (bpmOnly) {
      bpm = parseInt(bpmOnly[1]);
      clean = clean.replace(/^\d{2,3}\s*-\s*/, '');
    }
  }

  // Clean up underscores and other junk
  clean = clean.replace(/_/g, ' ').trim();
  clean = clean.replace(/\s+/g, ' ').trim();
  
  // Extract version info
  let version = '';
  let versionType = 'clean';
  const versionMatch = clean.match(/\[(Intro(?:\s+(?:Clean|Dirty))?|Clean|Dirty|Extended|Instrumental|Acapella|Edit|VIP|Remix|Bootleg|Mashup|Original Mix|Extended Mix)\]/i);
  if (versionMatch) {
    version = versionMatch[1];
    versionType = version.toLowerCase().includes('dirty') ? 'dirty' : 'clean';
  }
  clean = clean.replace(/\s*\[[^\]]*\]\s*/g, ' ').trim();

  // Split by " - "
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
      if (!f.name.startsWith('._') && f.size && parseInt(f.size) > 10000) all.push(f);
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
  const allFiles = await getAllFiles(FOLDER_ID);
  const audioFiles = allFiles.filter(f => /\.(mp3|wav|aif|aiff)$/i.test(f.name));
  console.log(`Total: ${audioFiles.length} audio files\n`);

  let imported = 0;
  let skippedDup = 0;

  for (const f of audioFiles) {
    if (existingIds.has(f.id)) { skippedDup++; continue; }

    const parsed = parseFilename(f.name);
    const pairKey = `${parsed.title.toLowerCase().replace(/[^a-z0-9]/g, '')}|${parsed.artist.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    if (existingPairs.has(pairKey)) {
      console.log(`  ⏭️ Skip: ${parsed.artist} - ${parsed.title}`);
      skippedDup++;
      continue;
    }

    try {
      const artwork = await extractArtwork(f.id);
      const isWav = /\.(wav|aif|aiff)$/i.test(f.name);
      const price = isWav ? PRICE : 0;

      const { error } = await supabase.from('tracks').insert({
        title: parsed.title,
        artist: parsed.artist,
        version: parsed.version,
        version_type: parsed.versionType,
        duration: '0:00',
        bpm: parsed.bpm,
        key: parsed.key,
        genre: GENRE,
        price: price,
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
        const ext = f.name.split('.').pop()?.toUpperCase();
        console.log(`  ✅ [${imported}] ${parsed.artist} - ${parsed.title} | ${ext} $${price} | ${parsed.bpm||'?'}BPM ${parsed.key||'?'}`);
      }
    } catch (err: any) {
      console.error(`  ❌ ${f.name}: ${err.message}`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  Genre: ${GENRE}`);
  console.log(`  Total files: ${audioFiles.length}`);
  console.log(`  Imported: ${imported}`);
  console.log(`  Skipped (dup): ${skippedDup}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
