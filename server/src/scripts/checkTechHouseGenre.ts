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

  // Check Tech House in DB
  const [th] = await sequelize.query(`SELECT COUNT(*) as count FROM tracks WHERE genre = 'Tech House'`);
  console.log(`Tech House tracks: ${(th as any[])[0].count}`);

  // Check what genre the new import got
  const [recent] = await sequelize.query(`
    SELECT genre, COUNT(*) as count FROM tracks 
    WHERE created_at > NOW() - INTERVAL '10 minutes'
    GROUP BY genre ORDER BY count DESC
  `);
  console.log(`\nRecent imports (last 10 min):`);
  for (const r of recent as any[]) {
    console.log(`  ${r.genre}: ${r.count}`);
  }

  // Check if 'House' contains Tech House tracks (FISHER, Marlon Hoffstadt, etc)
  const [house] = await sequelize.query(`
    SELECT title, artist, genre FROM tracks 
    WHERE artist ILIKE '%FISHER%' OR artist ILIKE '%Marlon Hoffstadt%' OR artist ILIKE '%Martin Ikin%'
    LIMIT 10
  `);
  console.log(`\nSample tracks with known Tech House artists:`);
  for (const h of house as any[]) {
    console.log(`  [${h.genre}] ${h.artist} - ${h.title}`);
  }

  await sequelize.close();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
