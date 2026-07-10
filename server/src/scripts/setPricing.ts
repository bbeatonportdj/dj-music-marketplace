import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const PAID_COUNT = 200;
const PRICE = 1.50;

// Strip sslmode from DATABASE_URL to avoid conflict with dialectOptions
const rawUrl = process.env.DATABASE_URL || '';
const cleanUrl = rawUrl.replace(/\?sslmode=require/, '').replace(/&sslmode=require/, '');

const sequelize = new Sequelize(cleanUrl, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: false,
});

async function setPricing() {
  await sequelize.authenticate();
  console.log('✅ Connected to database');

  const all = await sequelize.query(
    `SELECT id, title, price FROM "tracks" ORDER BY id`,
    { type: 'SELECT' }
  );
  console.log(`📊 Total tracks: ${(all as any[]).length}`);

  const shuffled = [...(all as any[])].sort(() => Math.random() - 0.5);
  const paid = shuffled.slice(0, PAID_COUNT);
  const free = shuffled.slice(PAID_COUNT);

  const paidIds = paid.map(t => t.id);
  const freeIds = free.map(t => t.id);

  await sequelize.query(
    `UPDATE "tracks" SET price = ${PRICE} WHERE id IN (:ids)`,
    { replacements: { ids: paidIds } }
  );
  console.log(`💰 Set ${paid.length} tracks to $${PRICE.toFixed(2)}`);

  await sequelize.query(
    `UPDATE "tracks" SET price = 0 WHERE id IN (:ids)`,
    { replacements: { ids: freeIds } }
  );
  console.log(`🆓 Set ${free.length} tracks to $0.00 (FREE)`);

  const verify = await sequelize.query(
    `SELECT id, price FROM "tracks" ORDER BY id`,
    { type: 'SELECT' }
  );
  const paidCount = (verify as any[]).filter((t: any) => Number(t.price) > 0).length;
  const freeCount = (verify as any[]).filter((t: any) => Number(t.price) === 0).length;
  console.log(`✅ Verification — Paid: ${paidCount}, Free: ${freeCount}`);

  await sequelize.close();
}

setPricing().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
