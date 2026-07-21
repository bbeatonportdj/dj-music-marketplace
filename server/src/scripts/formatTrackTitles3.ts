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

function formatTrackTitle(title: string, artist: string): string {
  // If title already has " - " and artist is in it, just clean it up
  if (title.includes(' - ')) {
    // Check if artist is already in the title
    const parts = title.split(' - ');
    const lastPart = parts[parts.length - 1].trim();
    
    // If the last part matches the artist, the format is already correct
    if (artist && lastPart.toLowerCase().includes(artist.toLowerCase().substring(0, 10))) {
      return title; // Already formatted
    }
  }
  
  // Clean up title
  let cleanTitle = title.replace(/\s+/g, ' ').trim();
  cleanTitle = cleanTitle.replace(/[-–]\s*$/, '').trim();
  
  // Remove version info from title if present
  cleanTitle = cleanTitle.replace(/\s*\((?:Original|Extended|Club|Radio|Edit|Mix|VIP|Remix|Mashup|Bootleg|Flip)[^)]*\)\s*$/i, '').trim();
  
  // Format: Title - Artist
  if (artist && artist !== 'Unknown Artist') {
    return `${cleanTitle} - ${artist}`;
  }
  return cleanTitle;
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

  for (const track of tracks || []) {
    const newTitle = formatTrackTitle(track.title || '', track.artist || '');

    // Only update if format changed
    if (newTitle !== track.title) {
      const { error: updateError } = await supabase
        .from('tracks')
        .update({ title: newTitle })
        .eq('id', track.id);

      if (updateError) {
        console.error(`❌ Error updating track ${track.id}:`, updateError.message);
      } else {
        updated++;
        if (updated % 100 === 0) {
          console.log(`  ✅ Updated ${updated} tracks...`);
        }
      }
    } else {
      skipped++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  Total tracks: ${tracks?.length || 0}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Already formatted: ${skipped}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
