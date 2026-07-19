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
  const [genres] = await sequelize.query(`SELECT DISTINCT genre, LENGTH(genre) as len FROM tracks ORDER BY genre`);
  for (const g of genres as any[]) {
    console.log(`"${g.genre}" (len=${g.len})`);
  }
  await sequelize.close();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
