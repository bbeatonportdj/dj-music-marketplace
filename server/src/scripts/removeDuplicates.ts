import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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
  console.log('✅ Connected');

  const [dupes] = await sequelize.query(`
    SELECT LOWER(title) as title, LOWER(artist) as artist, 
           COUNT(*)::int as cnt,
           array_agg(id ORDER BY created_at DESC) as ids,
           array_agg(artwork_url ORDER BY created_at DESC) as artworks,
           array_agg(gdrive_file_id ORDER BY created_at DESC) as gfids,
           array_agg(price ORDER BY created_at DESC) as prices
    FROM tracks 
    GROUP BY LOWER(title), LOWER(artist) 
    HAVING COUNT(*) > 1
    ORDER BY cnt DESC
  `);

  console.log(`Found ${dupes.length} duplicate groups\n`);

  let totalDeleted = 0;
  let totalKept = 0;

  for (const d of dupes) {
    const ids: string[] = d.ids;
    const artworks: string[] = d.artworks;
    const prices: number[] = d.prices;

    // Find the best one to keep: prefer one with proper artwork
    let keepIdx = 0;
    for (let i = 0; i < ids.length; i++) {
      const art = artworks[i] || '';
      if (!art.includes('unsplash')) {
        keepIdx = i;
        break;
      }
    }

    // Delete all except the kept one
    const toDelete = ids.filter((_, i) => i !== keepIdx);
    const keptId = ids[keepIdx];

    for (const delId of toDelete) {
      await sequelize.query(`UPDATE user_purchases SET track_id = :keep WHERE track_id = :del`, { replacements: { keep: keptId, del: delId } });
      await sequelize.query(`UPDATE order_items SET track_id = :keep WHERE track_id = :del`, { replacements: { keep: keptId, del: delId } });
      await sequelize.query(`DELETE FROM tracks WHERE id = :id`, { replacements: { id: delId } });
      totalDeleted++;
    }
    // Clean up any orphaned rows
    await sequelize.query(`DELETE FROM user_purchases WHERE track_id NOT IN (SELECT id FROM tracks)`);
    await sequelize.query(`DELETE FROM order_items WHERE track_id NOT IN (SELECT id FROM tracks)`);
    totalKept++;
  }

  // Verify
  const [result] = await sequelize.query(`SELECT COUNT(*)::int as cnt FROM tracks`);
  console.log(`\n📊 Result: Kept ${totalKept}, Deleted ${totalDeleted}`);
  console.log(`Total tracks remaining: ${(result as any[])[0].cnt}`);

  await sequelize.close();
}

main().catch(err => {
  console.error('❌', err);
  process.exit(1);
});
