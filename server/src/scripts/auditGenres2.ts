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

  // 1. Merge "house" → "House"
  const [houseRes] = await sequelize.query(`UPDATE tracks SET genre = 'House' WHERE genre = 'house'`);
  console.log(`✅ Merged "house" → "House"`);

  // 2. Check Uncategorized tracks
  const [uncat] = await sequelize.query(`SELECT id, title, artist, genre FROM tracks WHERE genre = 'Uncategorized' ORDER BY created_at DESC`);
  console.log(`\n📋 Uncategorized tracks (${(uncat as any[]).length}):`);
  for (const t of uncat as any[]) {
    console.log(`  - ${t.artist} - ${t.title}`);
  }

  // 3. Check all genres again
  const [genres] = await sequelize.query(`
    SELECT genre, COUNT(*) as count FROM tracks GROUP BY genre ORDER BY count DESC
  `);
  console.log(`\n📊 Updated genre distribution:`);
  let total = 0;
  for (const g of genres as any[]) {
    const count = parseInt(g.count);
    total += count;
    console.log(`  ${(g.genre || '(empty)').padEnd(25)} ${count}`);
  }
  console.log(`  ${'─'.repeat(35)}`);
  console.log(`  ${'TOTAL'.padEnd(25)} ${total}`);

  await sequelize.close();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
