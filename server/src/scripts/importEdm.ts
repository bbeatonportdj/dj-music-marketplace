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

const FOLDER_ID = '1ySzKRyobcezCCFRGv1xoWimMmvpy4rqk';
const GENRE = 'EDM';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const raw = process.env.GOOGLE_DRIVE_CREDENTIALS!;
const auth = new google.auth.GoogleAuth({ credentials: JSON.parse(raw), scopes: ['https://www.googleapis.com/auth/drive.readonly'] });
const drive = google.drive({ version: 'v3', auth });

function parseFilename(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const base = name.replace(/\.\w+$/, '').trim();

  // Pattern: "BPM - Key - Title [Version].ext"
  // e.g. "155 - Em - Slave To The Rave AJ Edit.2 - Jimmy Clash.mp3"
  // e.g. "150 - Fm - Booty Bounce vs Let's Get Fcked Up [Bounce].wav"
  const parts = base.split(/\s*-\s*/);

  let bpm = 0;
  let key = '';
  let title = base;
  let artist = 'Various Artists';
  let version = '';
  let versionType = 'clean';

  // First part is BPM
  if (parts.length >= 3) {
    const bpmVal = parseInt(parts[0]);
    if (!isNaN(bpmVal) && bpmVal > 0 && bpmVal < 300) {
      bpm = bpmVal;
      key = parts[1].trim();
      const rest = parts.slice(2).join(' - ').trim();

      // Extract version from brackets
      const versionMatch = rest.match(/\[(Intro(?:\s+(?:Clean|Dirty))?|Clean|Dirty|Extended|Instrumental|Acapella|Edit|VIP|Remix|Bootleg|Mashup|Bounce|Baile Funk|Afro House|Techno|Guaracha|Vina House)\]/i);
      if (versionMatch) {
        version = versionMatch[1];
        versionType = version.toLowerCase().includes('dirty') ? 'dirty' : 'clean';
      }

      // Try to split artist - title from the rest
      // Pattern: "Title AJ Edit.2 - Artist" or "Title - Artist"
      const cleanRest = rest.replace(/\s*\[[^\]]*\]\s*/g, ' ').replace(/\s*\.\d+\s*/g, ' ').trim();

      // Check for "AJ Edit", "AJ.REMIX", etc.
      const ajMatch = cleanRest.match(/(.+?)\s*(?:AJ\s*(?:Edit|REMIX|Remix))\s*[-–]\s*(.+)/i);
      if (ajMatch) {
        title = ajMatch[1].trim();
        artist = ajMatch[2].trim();
        version = version || 'AJ Edit';
      } else {
        // Split on last " - " or " x " or " Vs "
        const dashSplit = cleanRest.split(/\s*[-–]\s*/);
        if (dashSplit.length >= 2) {
          // Check if last part looks like an artist name
          const lastPart = dashSplit[dashSplit.length - 1].trim();
          const firstParts = dashSplit.slice(0, -1).join(' - ').trim();
          if (lastPart.length < 50 && !/^\d/.test(lastPart)) {
            title = firstParts;
            artist = lastPart;
          } else {
            title = cleanRest;
          }
        } else {
          title = cleanRest;
        }
      }
    } else {
      // No BPM at start, treat whole thing as title
      title = base;
    }
  }

  return { artist, title, version, versionType, key, bpm, ext };
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
      if (f.mimeType?.includes('audio')) all.push(f);
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

  // Get existing gdrive_file_ids and title|artist pairs
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
    if (existingIds.has(f.id)) {
      skippedDup++;
      continue;
    }

    const parsed = parseFilename(f.name);
    const isWav = f.name.toLowerCase().endsWith('.wav') || f.name.toLowerCase().endsWith('.aif') || f.name.toLowerCase().endsWith('.aiff');
    const price = isWav ? 0.90 : 0.00;

    // Title+artist dedup
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
        price,
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
  console.log(`  Total files: ${files.length}`);
  console.log(`  Imported: ${imported}`);
  console.log(`  Skipped (Drive dup): ${skippedDup}`);
  console.log(`  Skipped (title dup): ${skippedTitle}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
