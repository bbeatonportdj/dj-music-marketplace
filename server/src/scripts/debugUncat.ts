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
  const [rows] = await sequelize.query(`SELECT id, title, artist FROM tracks WHERE genre = 'Uncategorized'`);
  for (const r of rows as any[]) {
    console.log(`ID: ${r.id}`);
    console.log(`Title: [${r.title}]`);
    console.log(`Artist: [${r.artist}]`);
    console.log(`---`);
  }
  await sequelize.close();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
