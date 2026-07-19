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

  const fixes: [string, string][] = [
    ['Hard Dance', 'R3SPAWN'],
    ['Hard Dance', 'Kyros'],
    ['House', 'CALL ME AT 303'],
    ['Remix', 'Yukon'],
    ['Hip Hop', 'XTRADOPE'],
    ['House', 'DEEP FEAR'],
    ['House', 'Ar move'],
    ['Other', 'THIS IS FOR'],
    ['Hip Hop', '藏进心口'],
    ['Hard Dance', 'RVN x Move'],
    ['House', 'Party Rock Liar'],
    ['House', 'Jamaican'],
    ['Hip Hop', '大展鸿图'],
    ['House', 'IN THIS BIH'],
    ['House', 'Dimension Vs Shadows'],
  ];

  for (const [genre, keyword] of fixes) {
    const [res] = await sequelize.query(
      `UPDATE tracks SET genre = :genre WHERE genre = 'Uncategorized' AND title ILIKE :kw`,
      { replacements: { genre, kw: `%${keyword}%` } }
    );
    const count = (res as any).rowCount || 0;
    if (count === 0) {
      // Try on full text
      const [res2] = await sequelize.query(
        `UPDATE tracks SET genre = :genre WHERE genre = 'Uncategorized' AND (title || ' ' || artist) ILIKE :kw`,
        { replacements: { genre, kw: `%${keyword}%` } }
      );
      console.log(`✅ [${genre}] "${keyword}" (${(res2 as any).rowCount || 0})`);
    } else {
      console.log(`✅ [${genre}] "${keyword}" (${count})`);
    }
  }

  // Show remaining
  const [remaining] = await sequelize.query(`SELECT id, title, artist FROM tracks WHERE genre = 'Uncategorized'`);
  if ((remaining as any[]).length > 0) {
    console.log(`\n❓ Still Uncategorized (${(remaining as any[]).length}):`);
    for (const t of remaining as any[]) {
      console.log(`  - ${t.artist} | ${t.title}`);
    }
  }

  // Final
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
