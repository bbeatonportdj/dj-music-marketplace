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

  // Check artwork status
  const [stats] = await sequelize.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN artwork_url IS NULL OR artwork_url = '' THEN 1 END) as empty,
      COUNT(CASE WHEN artwork_url LIKE 'data:image%' THEN 1 END) as dataurl,
      COUNT(CASE WHEN artwork_url LIKE 'http%' THEN 1 END) as http,
      COUNT(CASE WHEN artwork_url NOT LIKE 'data:image%' AND artwork_url NOT LIKE 'http%' AND artwork_url != '' AND artwork_url IS NOT NULL THEN 1 END) as other
    FROM tracks
  `);
  console.log('📊 Artwork Stats:');
  console.log(JSON.stringify(stats, null, 2));

  // Check a sample of artwork_url values
  const [samples] = await sequelize.query(`
    SELECT title, artist, LEFT(artwork_url, 80) as artwork_preview 
    FROM tracks 
    WHERE artwork_url IS NOT NULL AND artwork_url != '' 
    ORDER BY created_at DESC 
    LIMIT 5
  `);
  console.log('\n📋 Sample artwork URLs:');
  for (const s of samples as any[]) {
    console.log(`  ${s.artist} - ${s.title}`);
    console.log(`    ${s.artwork_preview}`);
  }

  // Check total size of artwork data
  const [sizeCheck] = await sequelize.query(`
    SELECT pg_size_pretty(pg_database_size(current_database())) as db_size
  `);
  console.log(`\n💾 DB Size: ${(sizeCheck as any[])[0]?.db_size}`);

  await sequelize.close();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
