import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Remix patterns to detect
const REMIX_PATTERNS = [
  /\(([^)]*?remix[^)]*?)\)/i,
  /\(([^)]*?mashup[^)]*?)\)/i,
  /\(([^)]*?edit[^)]*?)\)/i,
  /\(([^)]*?bootleg[^)]*?)\)/i,
  /\(([^)]*?flip[^)]*?)\)/i,
  /\(([^)]*?vip[^)]*?)\)/i,
  /\(([^)]*?extended[^)]*?)\)/i,
  /\(([^)]*?club mix[^)]*?)\)/i,
  /\(([^)]*?radio edit[^)]*?)\)/i,
];

function extractRemixInfo(title: string): { cleanTitle: string; remixArtist: string } {
  let cleanTitle = title;
  let remixArtist = '';

  // Try to find remix pattern
  for (const pattern of REMIX_PATTERNS) {
    const match = cleanTitle.match(pattern);
    if (match) {
      const remixStr = match[1];
      
      // Extract artist from remix string
      // Common patterns: "Artist Remix", "Artist's Remix", "Remix by Artist"
      const artistPatterns = [
        /^(.+?)\s*(?:remix|mashup|edit|bootleg|flip|vip|extended|club mix|radio edit)$/i,
        /^(.+?)'?s?\s*(?:remix|mashup|edit|bootleg|flip|vip|extended|club mix|radio edit)$/i,
      ];

      for (const artistPattern of artistPatterns) {
        const artistMatch = remixStr.match(artistPattern);
        if (artistMatch) {
          remixArtist = artistMatch[1].trim();
          break;
        }
      }

      // Remove the remix part from title
      cleanTitle = cleanTitle.replace(pattern, '').trim();
      break;
    }
  }

  // Clean up title
  cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();
  cleanTitle = cleanTitle.replace(/[-–]\s*$/, '').trim();

  return { cleanTitle, remixArtist };
}

function formatTrackTitle(title: string, artist: string, remixArtist: string): string {
  if (remixArtist) {
    return `${title} - ${artist} (Remix โดย: ${remixArtist})`;
  }
  return `${title} - ${artist}`;
}

async function main() {
  console.log('✅ Connected to Supabase\n');

  // Get all tracks
  const { data: tracks, error } = await supabase
    .from('tracks')
    .select('id, title, artist')
    .order('id');

  if (error) {
    console.error('Error fetching tracks:', error);
    return;
  }

  console.log(`📊 Found ${tracks?.length || 0} tracks\n`);

  let updated = 0;
  let skipped = 0;
  const updates: { id: number; newTitle: string }[] = [];

  for (const track of tracks || []) {
    const { cleanTitle, remixArtist } = extractRemixInfo(track.title || '');
    const newTitle = formatTrackTitle(cleanTitle, track.artist || '', remixArtist);

    // Only update if format changed
    if (newTitle !== track.title) {
      updates.push({ id: track.id, newTitle });
    } else {
      skipped++;
    }
  }

  console.log(`📝 Tracks to update: ${updates.length}`);
  console.log(`⏭️  Tracks already formatted: ${skipped}\n`);

  // Update tracks
  for (const update of updates) {
    const { error: updateError } = await supabase
      .from('tracks')
      .update({ title: update.newTitle })
      .eq('id', update.id);

    if (updateError) {
      console.error(`❌ Error updating track ${update.id}:`, updateError.message);
    } else {
      updated++;
      if (updated % 50 === 0) {
        console.log(`  ✅ Updated ${updated} tracks...`);
      }
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  Total tracks: ${tracks?.length || 0}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Already formatted: ${skipped}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
