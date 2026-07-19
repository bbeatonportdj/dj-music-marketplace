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
  
  // Check what genres exist with "Baile" or "Funk"
  const [genres] = await sequelize.query(`SELECT DISTINCT genre FROM tracks WHERE genre ILIKE '%baile%' OR genre ILIKE '%funk%' OR genre ILIKE '%favela%'`);
  console.log('Matching genres:', (genres as any[]).map(g => g.genre));

  // Update by gdrive_file_id from import
  const [res] = await sequelize.query(`UPDATE tracks SET price = 0 WHERE genre = 'Baile Funk/Favela Bass'`);
  console.log(`Updated ${(res as any).rowCount} tracks`);

  // Also try with exact match
  const [res2] = await sequelize.query(`UPDATE tracks SET price = 0 WHERE genre LIKE '%Baile%'`);
  console.log(`Updated ${res2.rowCount} tracks with LIKE`);

  // Show all genre counts
  const [all] = await sequelize.query(`SELECT genre, COUNT(*) as count FROM tracks GROUP BY genre ORDER BY count DESC`);
  console.log('\nAll genres:');
  for (const g of all as any[]) {
    console.log(`  ${g.genre}: ${g.count}`);
  }

  await sequelize.close();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
