import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const FOLDER_ID = '1OkcgSGqrgaPtNU6p6wqoInFNKCfTow0V';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const raw = process.env.GOOGLE_DRIVE_CREDENTIALS!;
const auth = new google.auth.GoogleAuth({ credentials: JSON.parse(raw), scopes: ['https://www.googleapis.com/auth/drive.readonly'] });
const drive = google.drive({ version: 'v3', auth });

// Genre classification rules
const KPOP_ARTISTS = [
  'BLACKPINK', 'NEWJEANS', 'New Jeans', 'BTS', 'SEVENTEEN', 'LE SSERAFIM', 'BABYMONSTER',
  'TWICE', '(G)I-DLE', 'IVE', 'aespa', 'Stray Kids', 'ATEEZ', 'NCT', 'EXO', 'Red Velvet',
  'ITZY', 'TXT', 'ENHYPEN', 'P1Harmony', 'Kep1er', 'STAYC', 'fromis_9', 'OH MY GIRL',
  'MONSTA X', 'GOT7', 'BTOB', 'iKON', 'WINNER', 'DAY6', 'THE BOYZ', 'VERIVERY',
  'CIX', 'ONEUS', 'ONF', 'WEEKLY', 'Weeekly', 'PURPLE KISS', 'LIGHTSUM', 'CLASS:y',
  'NMIXX', 'ILLIT', 'RIIZE', 'ZB1', 'BOYNEXTDOOR', 'TWS', 'PLAVE', 'KISS OF LIFE',
  'UNIS', 'MEOVV', 'izna', 'BEDROOM', 'BADVILLAIN', 'NEXZ', 'ME:I', 'XG',
  'JENNIE', 'LISA', 'ROSÉ', 'JIMIN', 'JUNG KOOK', 'V', 'SUGA', 'RM', 'J-HOPE',
  'G-DRAGON', 'PSY', 'TAEYEON', 'YOOA', 'CHUNG HA', 'SUNMI', 'HYOLYN', 'Ailee',
  'Wonder Girls', '2PM', '2NE1', 'Super Junior', 'SHINee', 'BIGBANG',
  'Zico', 'Crush', 'Dean', 'Loco', 'Simon Dominic', 'Coogie', 'Code Kunst',
  '사이먼 도미닉', '로꼬', '우원재', '쿠기', 'Dynamicduo',
  'Dizzy Dizzo', 'JEON SOMI', 'SOMI', 'YUJU', 'Chungha',
  'H1-KEY', 'VIVIZ', 'CSR', 'FIFTY FIFTY', 'tripleS',
  'LE SSERAFIM', 'ILLIT', 'MEOVV', 'BADVILLAIN', 'NEXZ', 'ME:I', 'XG',
];

const HIPHOP_ARTISTS = [
  'Drake', 'Kendrick Lamar', 'Cardi B', 'Nicki Minaj', 'Megan Thee Stallion', 'Travis Scott',
  'Post Malone', 'Lil Uzi Vert', 'Lil Baby', 'Lil Durk', 'Future', 'Young Thug',
  'Gunna', 'Lil Nas X', 'Jack Harlow', 'Doja Cat', 'Lizzo', 'SZA', 'Kehlani',
  'Snoop Dogg', 'Eminem', 'Jay-Z', 'Kanye West', '2Pac', 'Notorious B.I.G.',
  'Ludacris', 'Missy Elliott', 'Nelly', 'Fat Joe', 'Diddy', '50 Cent',
  'Ice Cube', 'Soulja Boy', 'Tyga', 'French Montana', 'Wiz Khalifa', 'Big Sean',
  'Meek Mill', '21 Savage', 'Lil Yachty', 'Offset', 'Quavo', 'Takeoff',
  'Roddy Ricch', 'DaBaby', 'Lil Tjay', 'Polo G', 'Pop Smoke', 'Juice WRLD',
  'XXX Tentacion', 'Lil Peep', 'Mac Miller', 'Kid Cudi', 'A$AP Ferg', 'A$AP Rocky',
  'Pusha T', 'Freddie Gibbs', 'Danny Brown', 'Run The Jewels', 'Logic',
  'G-Eazy', 'Machine Gun Kelly', 'Yelawolf', 'Tech N9ne', 'E-40',
  'Tory Lanez', 'PartyNextDoor', 'Drake', 'Big Boss Vette', 'Saucy Santana',
  'Rico Nasty', 'Coi Leray', 'Flo Milli', 'Mulatto', 'Saweetie', 'City Girls',
  'Latto', 'GloRilla', 'Sexyy Red', 'JT', 'Busta Rhymes', 'Fatman Scoop',
  'Lil Pump', 'Smokepurpp', 'Lil Yachty', 'Kodak Black', '21 Savage',
  'Tommy Richman', 'Kendrick Lamar', 'SZA', 'Luther', 'tv off', 'Not Like Us',
  'NEVA PLAY', 'FE!N', 'HUMBLE', 'DNA', 'HUMANKIND',
];

const POP_ARTISTS = [
  'Taylor Swift', 'Bruno Mars', 'Katy Perry', 'Justin Bieber', 'Ariana Grande',
  'Ed Sheeran', 'Adele', 'Sam Smith', 'Dua Lipa', 'The Weeknd', 'Beyonce',
  'Rihanna', 'Lady Gaga', 'Madonna', 'Britney Spears', 'Christina Aguilera',
  'Shakira', 'Jennifer Lopez', 'Ciara', 'Chris Brown', 'Usher', 'Jason Derulo',
  'Maroon 5', 'One Direction', 'Fifth Harmony', 'Little Mix', 'The Pussycat Dolls',
  'Selena Gomez', 'Miley Cyrus', 'Demi Lovato', 'Victoria Justice', 'Dove Cameron',
  'Olivia Rodrigo', 'Doja Cat', 'Dua Lipa', 'Billie Eilish', 'Halsey',
  'Lorde', 'Sia', 'P!nk', 'Kelly Clarkson', 'Carrie Underwood',
  'Coldplay', 'Imagine Dragons', 'OneRepublic', 'Maroon 5', 'Train',
  'Daft Punk', 'Calvin Harris', 'David Guetta', 'Marshmello', 'Skrillex',
  'Avicii', 'The Chainsmokers', 'Zedd', 'Diplo', 'Major Lazer',
  'Ellie Goulding', 'Lorde', 'Sia', 'P!nk', 'Kelly Clarkson',
  'Moves Like Jagger', 'Just the Way You Are', 'Payphone', 'Fire Burning',
  'One More Night', 'I Knew You Were Trouble', 'Cupido', 'Me Love',
  'CLOSER', 'One More Time', 'Barbie Girl', 'Pretty Girls',
  'Everybody', 'Crazy In Love', 'Single Ladies', 'Halo', 'Umbrella',
  'Love Story', 'Blank Space', 'Shake It Off', 'Anti-Hero', 'Cruel Summer',
  'Super Bass', 'Starships', 'Anaconda', 'Pound The Alarm', 'Turn Me On',
  'Birthday', 'Level Up', 'Good Days', 'Kiss Me More',
  'Justin Bieber', 'Justin Timberlake', 'Bruno Mars', 'Ed Sheeran',
  'ROSÉ', 'APT', 'Lady Gaga', 'Abracadabra',
  'Carly Rae Jepsen', 'Fitz and the Tantrums', 'Fitz', 'Dnce',
];

const LATIN_ARTISTS = [
  'Daddy Yankee', 'Shakira', 'J Balvin', 'Karol G', 'Bad Bunny', 'Ozuna',
  'Maluma', 'Ricky Martin', 'Enrique Iglesias', 'Pitbull', 'Marc Anthony',
  'Don Omar', 'Wisin Y Yandel', 'Luis Fonsi', 'Daddy Yankee',
  'Nicky Jam', 'Anuel AA', 'Jhayco', 'Rauw Alejandro', 'Myke Towers',
  'Farruko', 'Lunay', 'Sech', 'Mau y Ricky', 'CNCO',
  'Gloria Estefan', 'Celia Cruz', 'Tito El Bambino', 'Hector El Father',
  'El Alfa', 'Nfasis', 'Tokischa', 'Young Miko', 'Mora', 'Sky Rompiendo',
  'Bomba Estéreo', 'Systema Solar', 'Will Smith', 'La Ketchup',
  'Asereje', 'Danza Kuduro', 'Gasolina', 'Livin La Vida Loca',
  'On The Floor', 'Conga', 'Bailando', 'Despacito',
  'Don Miguelo', 'Y Que Fue', 'Ricky Martin', 'Bonito',
  'Pitbull', 'El Mismo Sol', 'Baila Baila Baila', 'Mi Gente',
  'Reggaeton', 'Reggaetones', 'TROPICAL', 'Tropical',
  'MC Zaac', 'Anitta', 'Desce Pro Play', 'PA PA PA',
];

const BAILE_FUNK_KEYWORDS = [
  'Baile Funk', 'baile', 'Baile', 'Funk', 'funk', 'Funk Carioca',
  'Afro', 'Afrobeat', 'Afro House', 'Amapiano', 'Gqom',
  'Bounce', 'Twerk', 'Twerking', 'Booty', 'Favela',
  'Bonde', 'Brunao', 'Vidrado', 'Voltei', 'Caralho',
  'Pisadinha', 'Eletrofunk', 'Mandela', 'Paredão',
  'FAIZ', 'FAIZ EDIT', 'DJ Guuga', 'Atoladinha', 'Coolie Riddim',
  'GWENCHANA', 'Baile Funk', 'FUNK', 'Funk Remix',
];

const KPOP_KEYWORDS = [
  'Kpop', 'K-pop', 'K Pop', 'BTS', 'BLACKPINK', 'NewJeans',
  'TWICE', 'EXO', 'NCT', 'SEVENTEEN', 'Stray Kids', 'ATEEZ',
  'Aespa', 'IVE', 'LE SSERAFIM', 'BABYMONSTER', 'NMIXX', 'ILLIT',
  'Korean', 'KOREAN', 'K-POP',
];

function classifyFile(name: string): string {
  const lower = name.toLowerCase();

  // Check K-pop
  for (const kw of KPOP_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) return 'K-pop';
  }
  for (const artist of KPOP_ARTISTS) {
    if (lower.includes(artist.toLowerCase())) return 'K-pop';
  }

  // Check Baile Funk (before Hip-hop, as some overlap)
  for (const kw of BAILE_FUNK_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) return 'Baile Funk';
  }

  // Check Latin
  for (const artist of LATIN_ARTISTS) {
    if (lower.includes(artist.toLowerCase())) return 'Latin';
  }
  if (lower.includes('reggaeton') || lower.includes('reggaetones')) return 'Latin';
  if (lower.includes('tropical') || lower.includes('cumbia') || lower.includes('bachata')) return 'Latin';

  // Check Hip-hop
  for (const artist of HIPHOP_ARTISTS) {
    if (lower.includes(artist.toLowerCase())) return 'Hip-hop';
  }
  // Hip-hop keywords
  if (/\b(remix|edit|mashup|bootleg|intro|dirty|clean|short edit|wordplay|segue|transition|a cappella|acapella)\b/i.test(name)) {
    // Check for trap/hip-hop BPM range
    const bpmMatch = name.match(/(\d{2,3})\s*$/);
    if (bpmMatch) {
      const bpm = parseInt(bpmMatch[1]);
      if (bpm >= 70 && bpm <= 100) return 'Hip-hop';
    }
  }

  // Check Pop
  for (const artist of POP_ARTISTS) {
    if (lower.includes(artist.toLowerCase())) return 'Pop';
  }
  if (/\b(pop|dance|club|party|hit|chart|top 40|billboard)\b/i.test(name)) return 'Pop';

  // Default: EDM/Mashup
  if (/\b(edit|mashup|remix|bootleg|vip)\b/i.test(lower)) return 'EDM/Mashup';

  return 'Pop'; // Default
}

function parseFilename(name: string) {
  const base = name.replace(/\.(mp3|flac|wav|aac|ogg|m4a|aif|aiff)$/i, '').trim();
  let clean = base;
  const keyBpm = clean.match(/\b([A-B]\d{1,2})\s*-\s*(\d{2,3})\s*$/i);
  let key = '';
  let bpm = 0;
  if (keyBpm) { key = keyBpm[1]; bpm = parseInt(keyBpm[2]); clean = clean.replace(/\s*-\s*[A-B]\d{1,2}\s*-\s*\d{2,3}\s*$/i, '').trim(); }
  const bpmOnly = clean.match(/\s+(\d{2,3})\s*$/);
  if (bpmOnly && !bpm) { bpm = parseInt(bpmOnly[1]); clean = clean.replace(/\s+\d{2,3}\s*$/, '').trim(); }

  clean = clean.replace(/^\d+\.\s*/, '').trim();
  const parts = clean.split(/\s*[-–]\s*/);
  if (parts.length >= 2) {
    return { artist: parts[0].trim(), title: parts.slice(1).join(' - ').trim(), key, bpm };
  }
  return { artist: 'Various Artists', title: clean, key, bpm };
}

async function getAllFiles(folderId: string): Promise<any[]> {
  const all = [];
  let pageToken: string | undefined;
  do {
    const res: any = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, size, mimeType, modifiedTime), nextPageToken',
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

const PRICES: Record<string, number> = {
  'K-pop': 0.50,
  'Hip-hop': 0.60,
  'Pop': 0.50,
  'Latin': 0.50,
  'Baile Funk': 0.50,
  'EDM/Mashup': 0.50,
};

async function main() {
  console.log('✅ Connected to Supabase\n');

  // Get existing tracks for dedup
  const { data: existingTracks } = await supabase.from('tracks').select('gdrive_file_id, title, artist');
  const existingIds = new Set<string>((existingTracks || []).map(t => t.gdrive_file_id).filter(Boolean));
  const existingPairs = new Set<string>((existingTracks || []).map(t =>
    `${(t.title||'').toLowerCase().replace(/[^a-z0-9]/g, '')}|${(t.artist||'').toLowerCase().replace(/[^a-z0-9]/g, '')}`
  ));
  console.log(`Existing tracks: ${existingTracks?.length || 0}\n`);

  console.log('📂 Scanning folder...');
  const allFiles = await getAllFiles(FOLDER_ID);
  const audioFiles = allFiles.filter(f => /\.(mp3|wav|aif|aiff)$/i.test(f.name));

  // Classify
  const classified: Record<string, any[]> = {};
  for (const f of audioFiles) {
    const genre = classifyFile(f.name);
    if (!classified[genre]) classified[genre] = [];
    classified[genre].push(f);
  }

  console.log(`\n📊 Genre breakdown:`);
  for (const [genre, files] of Object.entries(classified).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${genre}: ${files.length} files`);
  }

  // Import by genre
  const stats: Record<string, { imported: number; skipped: number; errors: number }> = {};

  for (const [genre, files] of Object.entries(classified)) {
    console.log(`\n🎵 Importing ${genre} (${files.length} files)...`);
    stats[genre] = { imported: 0, skipped: 0, errors: 0 };
    const price = PRICES[genre] || 0.50;

    for (const f of files) {
      if (existingIds.has(f.id)) { stats[genre].skipped++; continue; }

      const parsed = parseFilename(f.name);
      const pairKey = `${parsed.title.toLowerCase().replace(/[^a-z0-9]/g, '')}|${parsed.artist.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      if (existingPairs.has(pairKey)) {
        stats[genre].skipped++;
        continue;
      }

      try {
        const { error } = await supabase.from('tracks').insert({
          title: parsed.title,
          artist: parsed.artist,
          version: '',
          version_type: 'clean',
          duration: '0:00',
          bpm: parsed.bpm,
          key: parsed.key,
          genre: genre,
          price: price,
          gdrive_file_id: f.id,
          artwork_url: '',
          is_new: true,
          is_hot: false,
        });

        if (error) {
          stats[genre].errors++;
        } else {
          stats[genre].imported++;
          existingPairs.add(pairKey);
          existingIds.add(f.id);
        }
      } catch (err: any) {
        stats[genre].errors++;
      }
    }
  }

  console.log('\n\n📊 Final Summary:');
  console.log('=' .repeat(50));
  let totalImported = 0, totalSkipped = 0, totalErrors = 0;
  for (const [genre, s] of Object.entries(stats)) {
    console.log(`  ${genre.padEnd(15)} | Imported: ${String(s.imported).padStart(3)} | Skipped: ${String(s.skipped).padStart(3)} | Errors: ${s.errors}`);
    totalImported += s.imported;
    totalSkipped += s.skipped;
    totalErrors += s.errors;
  }
  console.log('='.repeat(50));
  console.log(`  ${'TOTAL'.padEnd(15)} | Imported: ${String(totalImported).padStart(3)} | Skipped: ${String(totalSkipped).padStart(3)} | Errors: ${totalErrors}`);
  console.log(`\n  Total audio files: ${audioFiles.length}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
