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

async function main() {
  await sequelize.authenticate();
  const fixes: [string, string, string][] = [
    ['Hard Dance', 'R3SPAWN', '026'],
    ['Hard Dance', 'Kyros', '025'],
    ['House', 'JO KX', 'CALL ME AT 303'],
    ['Remix', 'Yukon', 'Ballads Edit'],
    ['Hip Hop', 'XTRADOPE', 'XTRADOPE'],
    ['House', 'GABRY PONTE', 'DEEP FEAR'],
    ['House', 'Solaire', 'Ar move'],
    ['Other', 'THIS IS FOR', 'THIS IS FOR'],
    ['Hip Hop', 'bbeatonportdj', '藏进心口'],
    ['Hard Dance', 'Tiesto', 'RVN x Move'],
    ['House', 'KDH', 'Party Rock Liar'],
    ['House', 'Hugel', 'Jamaican'],
    ['Hip Hop', '揽佬', '大展鸿图'],
    ['House', 'CHRIS LORENZO', 'IN THIS BIH'],
    ['House', 'Kyros', 'Dimension'],
  ];

  for (const [genre, artist, title] of fixes) {
    const [res] = await sequelize.query(
      `UPDATE tracks SET genre = :genre WHERE genre = 'Uncategorized' AND (artist ILIKE :artist OR title ILIKE :title)`,
      { replacements: { genre, artist: `%${artist}%`, title: `%${title}%` } }
    );
    const count = (res as any).rowCount || 0;
    console.log(`✅ [${genre}] ${artist} - ${title} (${count})`);
  }

  // Final count
  const [result] = await sequelize.query(`SELECT genre, COUNT(*) as count FROM tracks GROUP BY genre ORDER BY count DESC`);
  console.log(`\n📊 Final:`);
  let total = 0;
  for (const g of result as any[]) {
    total += parseInt(g.count);
    console.log(`  ${g.genre.padEnd(20)} ${String(g.count).padStart(5)}`);
  }
  console.log(`  ${'─'.repeat(28)} ${String(total).padStart(5)}`);

  await sequelize.close();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
