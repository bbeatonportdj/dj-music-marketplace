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
  const [res] = await sequelize.query(`UPDATE tracks SET price = 0 WHERE genre = 'Baile Funk/Favela Bass'`);
  console.log(`✅ Updated ${(res as any).rowCount || 0} Baile Funk tracks to FREE`);
  await sequelize.close();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
