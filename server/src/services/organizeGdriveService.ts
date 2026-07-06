/**
 * Google Drive Folder Organizer by Genre
 *
 * Scans a Drive folder → detects genre from filename → creates subfolders → moves files.
 *
 * 📦 npm install googleapis   (already installed)
 *
 * Genre is determined by:
 *   1. Artist-to-genre mapping (e.g. Nicki Minaj → Hip Hop)
 *   2. Filename keyword mapping (e.g. "Twerk" → Twerk / Bass)
 *   3. Language / origin clues (e.g. Korean artist → K-Pop)
 *   4. Fallback: "Uncategorized"
 */

import { listFiles, listFolders, createFolder, moveFile } from './googleDriveService.js';

// ── Types ───────────────────────────────────────────────────

export interface OrganizeResult {
  total:        number;
  moved:        number;
  skipped:      number;
  errors:       number;
  byGenre:      Record<string, number>;
  errorDetails: string[];
}

// ── Artist → Genre Mapping ──────────────────────────────────

const ARTIST_GENRE: Record<string, string> = {
  // Hip Hop / Rap
  'lil nas x':           'Hip Hop',
  'lil pump':            'Hip Hop',
  'lil baby':            'Hip Hop',
  'lil jon':             'Hip Hop',
  'megan thee stallion': 'Hip Hop',
  'nicki minaj':         'Hip Hop',
  'kendrick lamar':      'Hip Hop',
  'gunna':               'Hip Hop',
  'nelly':               'Hip Hop',
  'trey songz':          'R&B',
  'mary j. blige':       'R&B',
  'beyonce':             'Pop',
  'rihanna':             'Pop',
  'frank ocean':         'R&B',
  'migos':               'Hip Hop',
  '2 chainz':            'Hip Hop',
  'bo b':                'Hip Hop',
  'tinashe':             'Pop',
  'tyla':                'Afrobeats',
  'rema':                'Afrobeats',
  'paul russell':        'Pop',
  'pharrell williams':   'Pop',
  'sabrina carpenter':   'Pop',
  'daft punk':           'Electronic',
  'farruko':             'Latin',
  'major lazer':         'Electronic',

  // Korean / K-Pop
  'blackpink':           'K-Pop',
  'jung kook':           'K-Pop',
  'jungen kook':         'K-Pop',
  'twice':               'K-Pop',
  'seventeen':           'K-Pop',
  'wonder girls':        'K-Pop',
  'dynamicduo':          'K-Hip Hop',
  'sistar':              'K-Pop',
  'ma boy':              'K-Pop',

  // EDM / Electronic
  'icona pop':           'Electronic',
  'adam port':           'House',
  'disco lines':         'House',
  'makj':                'Electronic',
  'cesar castilla':      'Electronic',
  'guy arthur':          'Electronic / Remix',
  'the weeknd':          'Pop',
  'far east movement':   'Electronic',

  // Latin
  'las ketchup':         'Latin',
  'bad bunny':           'Latin',
  'shakira':             'Latin',

  // Thai
  'thaitanium':          'Thai / Hip Hop',
  'flip':                'Thai',
  'iga':                 'World',

  // Other / Classic
  'mims':                'Hip Hop',
  'lmfao':               'Electronic',
};

// ── Keyword → Genre Mapping (checked after artist) ─────────

const KEYWORD_GENRE: [RegExp, string][] = [
  // EDM / Dance
  [/bass drop/i,             'Electronic'],
  [/remix/i,                 'Electronic / Remix'],
  [/house remix/i,           'House'],
  [/twerk/i,                 'Twerk / Bass'],
  [/slam intro/i,            'Electronic'],
  [/flip/i,                  'Electronic / Remix'],
  [/extended/i,              'Hip Hop'],

  // Genre labels in filenames
  [/christmas edit/i,        'Holiday'],
  [/acapella/i,              'Pop'],
  [/intro.*dirty/i,          'Hip Hop'],
  [/intro.*clean/i,          'Pop'],

  // Latin
  [/latin/i,                 'Latin'],
  [/reggaeton/i,             'Latin'],
  [/dembow/i,                'Latin'],
  [/salsa/i,                 'Latin'],
  [/afrobeat/i,              'Afrobeats'],
  [/afrognawa/i,             'World'],

  // K-Pop
  [/korean/i,                'K-Pop'],
  [/k-pop/i,                 'K-Pop'],

  // Throwback / Old School
  [/old school/i,            'Throwback'],
  [/throwback/i,             'Throwback'],
  [/classic/i,               'Throwback'],
  [/90s/i,                   'Throwback'],
  [/2000s/i,                 'Throwback'],
];

// ── Helper: Extract artist name from filename ───────────────

function extractArtist(filename: string): string {
  // Patterns like:
  //   "Artist - Title.mp3"
  //   "##. Artist - Title.mp3"
  //   "## - Key - Artist - Title.mp3"
  //   "## - Key - Title.mp3"

  let name = filename
    .replace(/\.(mp3|wav|m4a|flac)$/i, '')
    .replace(/^[\d\s.-]+/, '')          // leading number / dash
    .replace(/^[A-G]#?m?\s*-\s*/, '')   // remove leading key like "90 - Am - "
    .replace(/^[A-G]#?m?\s*/, '')       // or "90 - B - "
    .trim();

  // If name contains " - " separator, take the part before it (artist)
  const sepIndex = name.search(/\s+[-–]\s+/);
  if (sepIndex > 0) {
    // Also filter out leading "90 - Am - " style where first part is key
    const parts = name.split(/\s+[-–]\s+/);
    const firstPart = parts[0].trim();
    // Skip if first part looks like a key (short, matches key pattern)
    if (!/^[A-G]#?m?$/.test(firstPart) && !/^\d+$/.test(firstPart)) {
      return firstPart;
    }
    return parts[1]?.trim() || firstPart;
  }

  // If there's "Ft." or "Feat.", the part before it is the artist
  const ftIndex = name.search(/\s+(ft\.|feat\.|featuring)\s+/i);
  if (ftIndex > 0) {
    return name.slice(0, ftIndex).trim();
  }

  return name;
}

// ── Helper: Detect genre from artist + filename ─────────────

function detectGenre(filename: string): string {
  const lower = filename.toLowerCase();
  const artist = extractArtist(filename).toLowerCase();

  // 1. Check exact artist match
  for (const [key, genre] of Object.entries(ARTIST_GENRE)) {
    if (artist.includes(key) || lower.includes(key)) {
      return genre;
    }
  }

  // 2. Check keyword patterns
  for (const [pattern, genre] of KEYWORD_GENRE) {
    if (pattern.test(lower)) {
      return genre;
    }
  }

  // 3. Heuristic: BPM ranges
  const bpmMatch = lower.match(/(\d{2,3})\s*$|[-–]\s*(\d{2,3})\s*$/);
  if (bpmMatch) {
    const bpm = parseInt(bpmMatch[1] || bpmMatch[2], 10);
    if (bpm >= 120 && bpm <= 140) return 'Electronic';
    if (bpm >= 140 && bpm <= 180) return 'Drum & Bass';
    if (bpm >= 70 && bpm <= 100)  return 'Hip Hop';
  }

  // 4. Filename contains BPM in the pattern " - BPM" at the end
  if (/-\s*\d{2,3}\s*$/.test(lower)) return 'Electronic';

  return 'Uncategorized';
}

// ── Main Organize Function ──────────────────────────────────

/**
 * Organize all audio files in a Drive folder into genre-based subfolders.
 *
 * @param folderId    Google Drive folder ID to organize
 * @param dryRun      If true, only log what would be done (no actual moves)
 * @returns           Result summary with counts per genre
 */
export async function organizeByGenre(
  folderId: string,
  dryRun: boolean = false,
): Promise<OrganizeResult> {
  const result: OrganizeResult = {
    total: 0,
    moved: 0,
    skipped: 0,
    errors: 0,
    byGenre: {},
    errorDetails: [],
  };

  // Step 1: List all files in the root folder
  const files = await listFiles(folderId);
  result.total = files.length;

  if (files.length === 0) {
    console.log('📂 No files found in the specified folder.');
    return result;
  }

  console.log(`📂 Found ${files.length} file(s) to organize.`);

  // Step 2: Categorize each file by genre
  const fileGenreMap: Map<string, string> = new Map();
  for (const file of files) {
    const genre = detectGenre(file.name);
    fileGenreMap.set(file.id, genre);
    result.byGenre[genre] = (result.byGenre[genre] || 0) + 1;
    console.log(`  ${file.name} → ${genre}`);
  }

  if (dryRun) {
    console.log('\n🔍 DRY RUN — No files were moved.');
    return result;
  }

  // Step 3: Ensure genre subfolders exist
  const genreFolders: Record<string, string> = {};
  for (const genre of Object.keys(result.byGenre)) {
    const folder = await createFolder(folderId, genre);
    genreFolders[genre] = folder.id;
    console.log(`📁 Genre folder ready: ${genre}`);
  }

  // Step 4: Move files into their genre folder
  for (const file of files) {
    const genre = fileGenreMap.get(file.id)!;
    const targetFolderId = genreFolders[genre];

    try {
      await moveFile(file.id, targetFolderId);
      result.moved++;
      console.log(`  ✅ Moved: ${file.name} → ${genre}/`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors++;
      result.errorDetails.push(`${file.name}: ${msg}`);
      console.error(`  ❌ Error moving ${file.name}: ${msg}`);
    }
  }

  console.log(`\n✅ Done! Moved ${result.moved} file(s) into ${Object.keys(genreFolders).length} genre folder(s).`);
  return result;
}
