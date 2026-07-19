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

const BAD_URL = 'https://lh3.googleusercontent.com/d/1TxDDOcRpx_9QwYKr6ioxYhedxBCXliZC';

async function main() {
  await sequelize.authenticate();
  const [remaining] = await sequelize.query(`SELECT COUNT(*) as count FROM tracks WHERE artwork_url = :url`, { replacements: { url: BAD_URL } });
  const [total] = await sequelize.query(`SELECT COUNT(*) as count FROM tracks`);
  const [good] = await sequelize.query(`SELECT COUNT(*) as count FROM tracks WHERE artwork_url LIKE 'data:image%'`);
  console.log(`Remaining bad artwork: ${(remaining as any[])[0].count}`);
  console.log(`Total tracks: ${(total as any[])[0].count}`);
  console.log(`Good data URLs: ${(good as any[])[0].count}`);
  await sequelize.close();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
