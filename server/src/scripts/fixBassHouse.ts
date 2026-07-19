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
  const [deleted] = await sequelize.query(`DELETE FROM tracks WHERE genre = 'Bass House' AND (artist LIKE '._%' OR title LIKE '._%') RETURNING id`);
  console.log('Deleted', deleted.length, 'macOS metadata tracks');

  const [tracks] = await sequelize.query(`SELECT title, artist, bpm, key, price FROM tracks WHERE genre = 'Bass House' ORDER BY title`);
  console.log('\nFinal Bass House tracks:');
  for (const t of tracks as any[]) console.log(`  $${t.price} | ${t.bpm}BPM | ${t.key} | ${t.artist} - ${t.title}`);

  await sequelize.close();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
