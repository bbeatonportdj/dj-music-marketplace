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

  // Merge similar small genres
  const merges: [string, string][] = [
    ['Dance & EDM', 'EDM'],
    ['Remix', 'EDM'],
    ['Mashup', 'EDM'],
    ['Trance', 'Psy Trance'],
  ];
  for (const [from, to] of merges) {
    const [res] = await sequelize.query(`UPDATE tracks SET genre = :to WHERE genre = :from`, { replacements: { from, to } });
    console.log(`✅ "${from}" → "${to}" (${(res as any).rowCount})`);
  }

  // Final
  const [result] = await sequelize.query(`SELECT genre, COUNT(*) as count FROM tracks GROUP BY genre ORDER BY count DESC`);
  console.log(`\n📊 Final Genre Distribution:\n`);
  let total = 0;
  for (const g of result as any[]) {
    total += parseInt(g.count);
    console.log(`  ${g.genre.padEnd(20)} ${String(g.count).padStart(5)}`);
  }
  console.log(`  ${'─'.repeat(28)} ${String(total).padStart(5)}`);

  await sequelize.close();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
