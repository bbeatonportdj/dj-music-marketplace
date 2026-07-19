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

  // Update recent House imports (last 30 min) to Tech House
  const [res] = await sequelize.query(`
    UPDATE tracks SET genre = 'Tech House' 
    WHERE genre = 'House' 
    AND created_at > NOW() - INTERVAL '30 minutes'
  `);
  console.log(`✅ Updated ${(res as any).rowCount || 0} tracks to Tech House`);

  // Verify
  const [check] = await sequelize.query(`SELECT genre, COUNT(*) as count FROM tracks WHERE genre = 'Tech House' GROUP BY genre`);
  console.log(`\nTech House tracks: ${(check as any[]).length > 0 ? (check as any[])[0].count : 0}`);

  await sequelize.close();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
