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

  // Count by genre
  const [genres] = await sequelize.query(`
    SELECT genre, COUNT(*) as count, 
           ROUND(AVG(price)::numeric, 2) as avg_price,
           MIN(price) as min_price, MAX(price) as max_price
    FROM tracks 
    GROUP BY genre 
    ORDER BY count DESC
  `);

  console.log('📊 Tracks by Genre:\n');
  console.log('Genre'.padEnd(25) + 'Count'.padStart(6) + '  Price'.padStart(10));
  console.log('-'.repeat(45));
  
  let total = 0;
  for (const g of genres as any[]) {
    console.log(`${g.genre.padEnd(25)}${String(g.count).padStart(6)}  $${g.min_price}-$${g.max_price}`);
    total += parseInt(g.count);
  }
  console.log('-'.repeat(45));
  console.log(`${'TOTAL'.padEnd(25)}${String(total).padStart(6)}`);

  // Check for tracks with missing/empty genre
  const [empty] = await sequelize.query(`
    SELECT COUNT(*) as count FROM tracks WHERE genre IS NULL OR genre = '' OR genre = 'Unknown'
  `);
  if ((empty as any[])[0].count > 0) {
    console.log(`\n⚠️  ${(empty as any[])[0].count} tracks with missing/empty genre`);
  }

  // Check for inconsistent genre names (e.g., "house" vs "House")
  const [inconsistent] = await sequelize.query(`
    SELECT DISTINCT genre FROM tracks WHERE genre IS NOT NULL AND genre != '' ORDER BY genre
  `);
  console.log(`\n📋 All unique genre values (${(inconsistent as any[]).length}):`);
  for (const g of inconsistent as any[]) {
    console.log(`  - "${g.genre}"`);
  }

  await sequelize.close();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
