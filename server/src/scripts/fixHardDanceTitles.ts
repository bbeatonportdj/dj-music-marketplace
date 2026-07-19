import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Sequelize } from 'sequelize';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

let dbUrl = process.env.DATABASE_URL || '';
dbUrl = dbUrl.replace(/\?sslmode=[^&]*/, '').replace(/&sslmode=[^&]*/, '');
const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  logging: false,
});

const manualFixes: Record<string, { title: string; artist: string }> = {
  'O': { artist: 'O-Zone', title: 'Dragostea din tei (Tatsunoshin Festival Mix)' },
  'Deorro & Makj x D': { artist: 'Deorro & Makj x D-Block & S-te-Fan x Maddix', title: 'Open Ready Sesame (BONKA Mashup)' },
  'Tjr': { artist: 'TJR', title: 'We Wanna Keep On Dancing (SATOSHI Mashup)' },
  'GONZI': { artist: 'GONZI', title: 'FEET WORK, BODY WORK' },
};

async function main() {
  await sequelize.authenticate();
  const [tracks] = await sequelize.query(`SELECT id, title, artist FROM tracks WHERE genre = 'Hard Dance' ORDER BY created_at DESC`);
  let fixed = 0;

  for (const t of tracks as any[]) {
    let newTitle = t.title;
    let newArtist = t.artist;
    let changed = false;

    // Manual fixes
    if (manualFixes[t.artist]) {
      newArtist = manualFixes[t.artist].artist;
      newTitle = manualFixes[t.artist].title;
      changed = true;
    }

    // Strip trailing " - XA - 155" or " - XA - 80" etc
    const stripped = newTitle.replace(/\s*-\s*[A-B]\d{1,2}\s*-\s*\d{2,3}\s*$/, '').trim();
    if (stripped !== newTitle) {
      newTitle = stripped;
      changed = true;
    }

    if (changed) {
      await sequelize.query(`UPDATE tracks SET title = :title, artist = :artist WHERE id = :id`, {
        replacements: { title: newTitle, artist: newArtist, id: t.id },
      });
      console.log(`  ✏️ [${t.artist}] → [${newArtist}]  "${t.title}" → "${newTitle}"`);
      fixed++;
    }
  }

  console.log(`\n📊 Fixed: ${fixed} titles`);
  await sequelize.close();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
