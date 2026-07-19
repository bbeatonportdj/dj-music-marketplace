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

// Normalize genre names
const genreMap: Record<string, string> = {
  // Case normalization
  'house': 'House',
  'hip hop': 'Hip Hop',
  'techno': 'Techno',
  'mashup': 'Mashup',
  'remix': 'Remix',
  
  // Merge into Hard Dance
  'Hardstyle': 'Hard Dance',
  'Hard Techno': 'Hard Dance',
  'Hard House': 'Hard Dance',
  'Hard Dance / Hardcore': 'Hard Dance',
  'Hyper Techno': 'Hard Dance',
  'BOUNCE': 'Hard Dance',
  'Bounce': 'Hard Dance',
  
  // Merge into Big Room
  'Big Room': 'Big Room',
  'Bigroom Techno': 'Big Room',
  'Big Room Techno': 'Big Room',
  'Mainstage': 'Big Room',
  'Mainstage EDM': 'Big Room',
  
  // Merge into Psy Trance
  'Psy Trance': 'Psy Trance',
  'PsyTrance': 'Psy Trance',
  'trance / Psy-trance': 'Psy Trance',
  'Trance / Psy-Trance': 'Psy Trance',
  'Trance Dub': 'Psy Trance',
  
  // Trance stays
  'Trance': 'Trance',
  
  // Merge into House
  'Progressive House': 'House',
  'Electro House': 'House',
  'Tech House': 'House',
  'Melodic House / Techno': 'House',
  'Pop Dance Remix / House': 'House',
  
  // Merge into EDM
  'Electronic': 'EDM',
  'Dance & EDM': 'EDM',
  'Future Rave': 'EDM',
  'Pop Dance Mashup / Electro House': 'EDM',
  
  // Other cleanups
  'MASHUP': 'Mashup',
  'Free Download': 'Other',
  'Music': 'Other',
  '240 SOUND': 'Other',
  'guaracha': 'Latin',
};

async function main() {
  await sequelize.authenticate();
  let totalFixed = 0;

  // 1. Apply genre normalization map
  for (const [from, to] of Object.entries(genreMap)) {
    const [res] = await sequelize.query(`UPDATE tracks SET genre = :to WHERE genre = :from`, {
      replacements: { from, to },
    });
    const count = (res as any).rowCount || 0;
    if (count > 0) {
      console.log(`  ✏️ "${from}" → "${to}" (${count} tracks)`);
      totalFixed += count;
    }
  }

  // 2. Handle empty/null genre
  const [emptyRes] = await sequelize.query(`UPDATE tracks SET genre = 'Uncategorized' WHERE genre IS NULL OR genre = ''`);
  console.log(`  ✏️ Empty/null → "Uncategorized" (${(emptyRes as any).rowCount || 0} tracks)`);

  // 3. Show final distribution
  const [genres] = await sequelize.query(`
    SELECT genre, COUNT(*) as count FROM tracks GROUP BY genre ORDER BY count DESC
  `);
  console.log(`\n📊 Final Genre Distribution:\n`);
  let total = 0;
  for (const g of genres as any[]) {
    const count = parseInt(g.count);
    total += count;
    console.log(`  ${(g.genre || '(empty)').padEnd(25)} ${String(count).padStart(5)}`);
  }
  console.log(`  ${'─'.repeat(33)}`);
  console.log(`  ${'TOTAL'.padEnd(25)} ${String(total).padStart(5)}`);
  console.log(`\n✅ Normalized ${totalFixed} tracks`);

  await sequelize.close();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
