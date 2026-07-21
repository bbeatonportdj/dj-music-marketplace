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

function normalizeStr(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

function fixDuplicatedArtist(title: string, artist: string): string {
  if (!artist || artist === 'Unknown Artist') return title;
  
  const parts = title.split(' - ');
  if (parts.length < 2) return title;
  
  const lastPart = parts[parts.length - 1].trim();
  const normLast = normalizeStr(lastPart);
  const normArtist = normalizeStr(artist);
  
  // Check if last part matches artist
  if (normLast === normArtist) {
    return parts.slice(0, -1).join(' - ');
  }
  
  // Check if last part is contained in artist or vice versa
  if (normArtist.includes(normLast) || normLast.includes(normArtist)) {
    return parts.slice(0, -1).join(' - ');
  }
  
  return title;
}

async function main() {
  console.log('✅ Connected to Supabase\n');

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

  for (const track of tracks || []) {
    const fixedTitle = fixDuplicatedArtist(track.title || '', track.artist || '');

    if (fixedTitle !== track.title) {
      const { error: updateError } = await supabase
        .from('tracks')
        .update({ title: fixedTitle })
        .eq('id', track.id);

      if (updateError) {
        console.error(`❌ Error updating track ${track.id}:`, updateError.message);
      } else {
        updated++;
        console.log(`  ✅ Fixed: "${track.title}" → "${fixedTitle}"`);
      }
    }
  }

  console.log(`\n📊 Fixed ${updated} tracks with duplicated artist names`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
