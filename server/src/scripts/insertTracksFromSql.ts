import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://fbwqgbsalqgcrfxhoure.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZid3FnYnNhbHFnY3JmeGhvdXJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODQyNjI1MSwiZXhwIjoyMDk0MDAyMjUxfQ.8Wy0kmOOwTuv9cFOiBJoSfIx7HqxviKfW5ZGeAoGwKk';
const supabase = createClient(supabaseUrl, supabaseKey);

function parseValuesRow(row: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuote = false;
  let i = 0;
  while (i < row.length) {
    const ch = row[i];
    if (ch === "'") {
      if (row[i + 1] === "'") { current += "'"; i += 2; continue; }
      inQuote = !inQuote; i++; continue;
    }
    if (ch === ',' && !inQuote) { fields.push(current.trim()); current = ''; i++; continue; }
    current += ch;
    i++;
  }
  if (current.trim()) fields.push(current.trim());
  return fields;
}

async function main() {
  const sqlPath = path.resolve(__dirname, '../../../drive2_tracks.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const rows: string[] = [];
  const regex = /VALUES\s*\(([\s\S]*?)\);/g;
  let match;
  while ((match = regex.exec(sql)) !== null) {
    rows.push(match[1].trim());
  }

  console.log(`Found ${rows.length} tracks to insert...\n`);

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const fields = parseValuesRow(rows[i]);

    const title       = fields[0]?.replace(/^'|'$/g, '') || 'Unknown';
    const artist      = fields[1]?.replace(/^'|'$/g, '') || 'Unknown';
    const version     = fields[2]?.replace(/^'|'$/g, '') || '';
    const versionType = fields[3]?.replace(/^'|'$/g, '') || 'clean';
    const key         = fields[4]?.replace(/^'|'$/g, '') || '';
    const bpm         = parseInt(fields[5]) || 0;
    const genre       = fields[6]?.replace(/^'|'$/g, '') || 'Top 40';
    const price       = parseFloat(fields[7]) || 1.99;
    const artworkUrl  = fields[8]?.replace(/^'|'$/g, '') || '';
    const isNew       = fields[9] === 'true';
    const isHot       = fields[10] === 'false';

    process.stdout.write(`[${i + 1}/${rows.length}] ${artist} - ${title} ... `);

    const { data: existing } = await supabase
      .from('tracks')
      .select('id')
      .eq('title', title)
      .eq('artist', artist)
      .maybeSingle();

    if (existing) {
      console.log(`⏭️ already exists (${existing.id.slice(0, 8)})`);
      skipped++;
      continue;
    }

    const { data, error } = await supabase
      .from('tracks')
      .insert({
        title, artist, version: version || '',
        version_type: versionType, key, bpm, genre,
        price, artwork_url: artworkUrl,
        is_new: isNew, is_hot: isHot,
      })
      .select('id');

    if (error) {
      console.log(`❌ ${error.message}`);
      failed++;
    } else {
      console.log(`✅ ${data![0].id.slice(0, 8)}`);
      success++;
    }
  }

  console.log(`\n📊 Result: ${success} added, ${skipped} skipped, ${failed} failed`);
}

main().catch(err => { console.error(err); process.exit(1); });
