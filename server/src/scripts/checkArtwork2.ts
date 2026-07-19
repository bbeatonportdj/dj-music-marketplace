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

  // Check HTTP artwork URLs
  const [httpUrls] = await sequelize.query(`
    SELECT artwork_url FROM tracks 
    WHERE artwork_url LIKE 'http%' 
    LIMIT 10
  `);
  console.log('📋 HTTP artwork URLs (sample):');
  for (const u of httpUrls as any[]) {
    console.log(`  ${u.artwork_url.substring(0, 120)}`);
  }

  // Check data URL sizes
  const [dataUrls] = await sequelize.query(`
    SELECT title, LENGTH(artwork_url) as url_len
    FROM tracks 
    WHERE artwork_url LIKE 'data:image%'
    ORDER BY LENGTH(artwork_url) DESC
    LIMIT 5
  `);
  console.log('\n📋 Data URL sizes (largest):');
  for (const d of dataUrls as any[]) {
    console.log(`  ${d.title}: ${(d.url_len / 1024).toFixed(0)}KB`);
  }

  // Check the broken ones - maybe the ones without artwork
  const [empty] = await sequelize.query(`
    SELECT title, artist, artwork_url FROM tracks 
    WHERE artwork_url IS NULL OR artwork_url = ''
    LIMIT 10
  `);
  console.log('\n📋 Tracks WITHOUT artwork:');
  for (const e of empty as any[]) {
    console.log(`  ${e.artist} - ${e.title} [artwork: "${e.artwork_url}"]`);
  }

  await sequelize.close();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
