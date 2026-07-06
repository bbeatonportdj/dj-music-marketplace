/**
 * Generate SQL INSERT statements from Drive filenames
 *
 * Run:  npx tsx server/src/scripts/generateTrackSql.ts
 * Output: inserts all parsed tracks into SQL file at project root
 *
 * The filenames were fetched from:
 *   https://drive.google.com/drive/folders/1mCazOsvAhViKaAc1md_IEgk7NNDX5-rl
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Raw filenames from Drive folder ─────────────────────────
const FILENAMES: string[] = [
  '12. Rudimental ft Foy Vance - Never Let You Go (175) - C#m - 89.mp3',
  'Andre Nickatina - Jelly (Intro - Clean) - F#m - 97.mp3',
  'Andrew Rayel feat. Jonny Rose - Daylight (Original Mix) - Am - 128.mp3',
  'Andrey Exx, Diva Vocal, Troitski - Rock DJ (Saccao & West.K Remix)  - Em - 122.mp3',
  'Andrey Exx, Diva Vocal, Troitski - Rock DJ (Saccao & West.K Remix) [www.MARVIN-VIBEZ.to] - Em - 122.mp3',
  'Angelika Vee, Spencer Tarring - Fall Down feat. Angelika Vee (Original Mix) [Revealed Recordings] - D# - 128.mp3',
  'Another You (Headhunterz Remix) - F#m - 128.mp3',
  'Apollo _ Dj Freefall Edit - F#m.mp3',
  'Arno Cost & Norman Doray feat. Mike Taylor - Rising Love (Original Mix) - F#m - 126.mp3',
  'Art Brothers vs Quintino & MOTi -  Dynamite [www.MARVIN-VIBEZ.to] - C#m - 128.mp3',
  'Aston Merrygold - Get Stupid (Chris Lake Remix) - Dm - 125.mp3',
  'Auburn - All About Him.mp3',
  'Avicii - Waiting For Love - Carnage & Headhunterz Remix.mp3',
  'Avicii - Waiting For Love - Sam Feldt Remix - F#m - 126.mp3',
  'Ayjay - Rave (Original)Emaj - Fm.mp3',
  'Back That Azz Up (Audiorokk Get\'em outta Twerk Aca Edit) - Dm - 100.mp3',
  'Banks - Beggin For Thread (SALVA Remix) [djmebbe.com].mp3',
  'Ben Gold - Im In A State Of Trance (Asot 750 Anthem) (Radio Edit) [mp3clan.com].mp3',
  'Ben Gold Feat. The Glass Child - Fall With Me (Original Mix) [mp3clan.com].mp3',
  'Beyonce - Partition - Electric Bodega Remix - Fm or Cm - 99.mp3',
  'Beyonce ft Jay Z - Crazy In Love (Club Killers Remix) CK Final - A# - 99.mp3',
  'Beyonce ft.Jay-Z-Drunk in love(Diplo remix)(djGraff ext mix)  - Fm - 140.mp3',
  'BIG SEAN - IDFWU (STARJACK HYPE RE-DRUM ) cln - D#m - 100.mp3',
  'BITCH IM MADONNA (WEDDING CRASHERZ HYPE SUM UP) [DIRTY] - D#m - 150.mp3',
  'Black Eyed Peas - Yesterday (Dj Jay Intro) (Dirty) - Cm - 106.mp3',
  'BLACKPINK - How You Like That(AJ Remix).mp3',
  'Born In The USA (Audiorokk Melbourne Bootleg) - Fm - 128.mp3',
  'Cali (Tunnelmental Experimental Assembly Remix) - Bm - 128.mp3',
  'Calling Arcadia (JonahJordan Edit) - F#m - 128.mp3',
  'Calvin Harris ft Tinashe - 5 AM (DJ FmSteff 2015 Totalmix) - C#m - 144.mp3',
  'Carnage feat. Timmy Trumpet & KSHMR - Toca - Dm - 128.mp3',
  'Charlie Puth X Wiz Khalifa - See You Again (Adam Foster Remix) [www.MARVIN-VIBEZ.to] - A# - 109.mp3',
  'CHRIS BROWN - FINE CHINA (STARJACK HYPE PARTY STARTER) cln - D#m - 104.mp3',
  'Chris Brown ft. Akon - Came to do  - D# or Gm - 98.mp3',
  'Chris Brown ft. Akon - Came to do [www.MARVIN-VIBEZ.to] - D# or Gm - 98.mp3',
  'Chris Brown ft. Tyga - Ayo  - F# - 98.mp3',
  'Chris Brown ft. Tyga - Ayo [www.MARVIN-VIBEZ.to] - F# - 98.mp3',
  'Chris Lake, Chris Lorenzo - Piano Hand (Original Mix) [Ultra] - Fm - 126.mp3',
  'Chris Lawrence - Withdrawal (Intro) - A#m - 94.mp3',
  'Classic Man - Jidenna (ft Kendrick Lamar) - STR8CUT-1.0 - (DTY - 94 BPM - A6-G MIN) - (INT SNG OUT) - Gm - 94.mp3',
  'Classified - Higher (DJ REG Extended) - D - 92.mp3',
  'Club Killers - Cancun X (Original Mix) Clean - Dm - 125.mp3',
  'Cm - 98 - 18. DJ Snake & AlunaGeorge - You Know You Like It.mp3',
  'Copy Club - The Sun, The Moon, The Stars (Embody Remix) - G#m - 121.mp3',
  'Cris Cab ft Pharrell - Liar Liar - Dm - 107.mp3',
  'Cro - Bad Chick (DJ REG Extended) - F# - 102.mp3',
  'Crown City Rockers - B-boy (Clean) - Bm - 89.mp3',
  'Cupid x Cali Swag District - Cupid Shuffle - Teach Me How To Dougie (Segue - Trans 72-85 - Dirty)  - Gm or Dm - 88.mp3',
  'D Train - Keep Giving Me Love (Short Edit) - Dm - 123.mp3',
  'D.R.A.M. x DJ Casper - Cha Cha (Deville Cha Cha Slide Party Break) Clean 4A 67 - Fm - 135.mp3',
];

// ── Parse filename ──────────────────────────────────────────

interface ParsedTrack {
  title: string;
  artist: string;
  version: string;
  version_type: string;
  key: string;
  bpm: number;
  genre: string;
}

function parseFilename(name: string): ParsedTrack {
  const cleanName = name.replace(/\.(mp3|wav|m4a|flac)$/i, '').trim();

  // Heuristic genre detection from artist/keywords
  function detectGenre(title: string, artist: string): string {
    const t = `${title} ${artist}`.toLowerCase();
    if (/blackpink|k-pop|korean|kpop/i.test(t)) return 'K-Pop';
    if (/house|edm|remix|electronic|trance/i.test(t)) return 'Electronic';
    if (/hip hop|rap|trap|dirty/i.test(t)) return 'Hip Hop';
    if (/latin|reggaeton|dembow/i.test(t)) return 'Latin';
    if (/r&b|rnb|soul/i.test(t)) return 'R&B';
    if (/pop/i.test(t)) return 'Pop';
    if (/twerk|bass/i.test(t)) return 'Twerk / Bass';
    return getGenreFromArtist(artist);
  }

  function getGenreFromArtist(artist: string): string {
    const a = artist.toLowerCase();
    if (/blackpink|seventeen|twice|bts|jung.*kook/i.test(a)) return 'K-Pop';
    if (/rudimental|calvin harris|avicii|carnage|headhunterz|ben gold|chris lake|arno cost|andrew rayel|angelika vee|andrey exx|art brothers|aston merrygold|ayjay|born in the usa|cali|club killers|copy club|cro/i.test(a)) return 'Electronic';
    if (/beyonce|chris brown|big sean|black eyed peas|nicki minaj|jidenna|kendrick|andre nickatina|dram|classic man|cupid/i.test(a)) return 'Hip Hop';
    if (/andre nickatina|dram/i.test(a)) return 'Hip Hop';
    if (/bobby brown|d train/i.test(a)) return 'R&B';
    return 'Top 40';
  }

  // Pattern: "Key - Number. Artist - Title"  (e.g. "Cm - 98 - 18. DJ Snake & AlunaGeorge - You Know You Like It")
  const keyNumberMatch = cleanName.match(/^([A-G][#b]?m?)\s*-\s*\d+\s*[-.].*?([A-Za-z].+?)\s*-\s*(.+)/);
  if (keyNumberMatch) {
    return {
      artist: keyNumberMatch[2].trim(),
      title: keyNumberMatch[3].trim(),
      version: '',
      version_type: 'clean',
      key: keyNumberMatch[1].trim(),
      bpm: 0,
      genre: detectGenre(keyNumberMatch[3].trim(), keyNumberMatch[2].trim()),
    };
  }

  // Pattern: "Artist - Title - Key - BPM" (most common)
  // Split by " - " and try to parse
  const parts = cleanName.split(' - ').map(s => s.trim()).filter(Boolean);

  // Check if last part is a number (BPM)
  const lastBpm = parts.length >= 2 ? parseInt(parts[parts.length - 1]) : NaN;
  const hasBpm = !isNaN(lastBpm) && lastBpm > 0 && lastBpm < 300;

  // Check if second-to-last is a key
  const keyIndex = hasBpm ? parts.length - 2 : parts.length - 1;
  const possibleKey = keyIndex >= 1 ? parts[keyIndex] : '';
  const isKey = /^[A-G][#b]?(m|maj|dim|aug)?$|^[A-G][#b]?\s+or\s+[A-G][#b]?m?$|^[0-9]+[AB]$/i.test(possibleKey);

  let artist: string;
  let title: string;
  let version = '';

  if (isKey && parts.length >= 3) {
    // Artist - Title - Key - BPM or Artist - Title - Version - Key - BPM
    const keyBpmLen = hasBpm ? 2 : 1;
    const mainParts = parts.slice(0, parts.length - keyBpmLen).filter(p => p !== possibleKey);

    if (mainParts.length >= 2) {
      artist = mainParts[0];
      title = mainParts[1];
      version = mainParts.slice(2).join(' / ');
    } else {
      artist = mainParts[0] || 'Unknown';
      title = cleanName;
    }
  } else if (parts.length >= 2) {
    artist = parts[0];
    title = parts.slice(1).join(' - ');
    if (hasBpm) title = title.replace(new RegExp(` - ${lastBpm}$`), '');
    version = '';
  } else {
    // Fallback: try splitting by " - " or " – " (em dash)
    const emDashParts = cleanName.split(/[–—]/).map(s => s.trim()).filter(Boolean);
    if (emDashParts.length >= 2) {
      artist = emDashParts[0];
      title = emDashParts.slice(1).join(' - ');
    } else {
      artist = 'Unknown Artist';
      title = cleanName;
    }
  }

  // Clean up version from parentheticals and brackets
  version = version.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim();

  const versionType = /dirty/i.test(cleanName) ? 'dirty' : 'clean';
  const key = possibleKey && isKey ? possibleKey : '';
  const bpm = hasBpm ? lastBpm : 0;
  const genre = detectGenre(title, artist);

  return { artist, title, version, version_type: versionType, key, bpm, genre };
}

// ── Convert to SQL ──────────────────────────────────────────

function toSql(tracks: ParsedTrack[]): string {
  const lines: string[] = [
    '-- Generated by generateTrackSql.ts',
    '-- Source: Google Drive folder 1mCazOsvAhViKaAc1md_IEgk7NNDX5-rl',
    '-- Run this in Supabase SQL Editor\n',
  ];

  for (const t of tracks) {
    const safeTitle  = t.title.replace(/'/g, "''");
    const safeArtist = t.artist.replace(/'/g, "''");
    const safeVersion = t.version.replace(/'/g, "''");

    lines.push(`INSERT INTO tracks (title, artist, version, version_type, key, bpm, genre, price, artwork_url, is_new, is_hot, created_at, updated_at)
VALUES (
  '${safeTitle}',
  '${safeArtist}',
  '${safeVersion}',
  '${t.version_type}',
  '${t.key}',
  ${t.bpm},
  '${t.genre}',
  1.99,
  'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&h=600&fit=crop',
  true,
  false,
  NOW(),
  NOW()
);\n`);
  }

  return lines.join('\n');
}

// ── Run ──────────────────────────────────────────────────────

const tracks = FILENAMES.map((f, i) => {
  const parsed = parseFilename(f);
  console.log(`  [${i + 1}/${FILENAMES.length}] ${parsed.artist} - ${parsed.title} [${parsed.genre}] ${parsed.bpm ? parsed.bpm+'bpm' : ''} ${parsed.key ? parsed.key : ''}`);
  return parsed;
});

const sql = toSql(tracks);
const outPath = path.resolve(__dirname, '../../../drive2_tracks.sql');
fs.writeFileSync(outPath, sql);

// Also report
const genreCounts: Record<string, number> = {};
for (const t of tracks) {
  genreCounts[t.genre] = (genreCounts[t.genre] || 0) + 1;
}

console.log('\n' + '='.repeat(50));
console.log('📊 Summary');
console.log('='.repeat(50));
console.log(`  Total tracks : ${tracks.length}`);
console.log(`  Output file  : ${outPath}`);
console.log('');
console.log('  Genres:');
for (const [g, c] of Object.entries(genreCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`    ${g.padEnd(15)} ${c}`);
}
