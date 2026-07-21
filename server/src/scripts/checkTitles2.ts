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

const { data } = await supabase.from('tracks').select('id, title, artist').limit(20);
console.log('ตัวอย่างผลลัพธ์:');
data?.forEach((t, i) => console.log(`  ${i+1}. title: "${t.title}" | artist: "${t.artist}"`));
