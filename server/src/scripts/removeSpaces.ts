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

async function main() {
  console.log('✅ Connected to Supabase\n');

  const { data: tracks, error } = await supabase
    .from('tracks')
    .select('id, title')
    .order('id');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`📊 Found ${tracks?.length || 0} tracks\n`);

  let updated = 0;

  for (const track of tracks || []) {
    const oldTitle = track.title || '';
    
    // Replace " - " with "-"
    let newTitle = oldTitle.replace(/\s+-\s+/g, '-');
    
    // Also fix patterns like "Title-Artist (Remix โดย: Artist)"
    // Keep "Remix โดย:" format as is

    if (newTitle !== oldTitle) {
      const { error: updateError } = await supabase
        .from('tracks')
        .update({ title: newTitle })
        .eq('id', track.id);

      if (!updateError) {
        updated++;
      }
    }
  }

  console.log(`📊 Updated ${updated} tracks (removed spaces around "-")`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
