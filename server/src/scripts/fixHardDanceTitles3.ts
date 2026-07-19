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
  const [tracks] = await sequelize.query(`SELECT id, title FROM tracks WHERE genre = 'Hard Dance' AND title ~ ' - \\d{1,2}[AB] - \\d{2,3}'`);
  console.log(`Found ${(tracks as any[]).length} titles with trailing key/bpm\n`);

  for (const t of tracks as any[]) {
    const stripped = t.title.replace(/\s*-\s*\d{1,2}[AB]\s*-\s*\d{2,3}\s*$/, '').trim();
    await sequelize.query(`UPDATE tracks SET title = :title WHERE id = :id`, {
      replacements: { title: stripped, id: t.id },
    });
    console.log(`  ✏️ "${t.title}" → "${stripped}"`);
  }
  await sequelize.close();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
