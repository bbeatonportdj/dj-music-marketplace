import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Sequelize } from 'sequelize';
import { GENRE_NORMALIZATION, classifyGenre } from '../engine/genre-classifier.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

function createDb(): Sequelize {
  let dbUrl = process.env.DATABASE_URL || '';
  dbUrl = dbUrl.replace(/\?sslmode=[^&]*/, '').replace(/&sslmode=[^&]*/, '');
  return new Sequelize(dbUrl, {
    dialect: 'postgres',
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    logging: false,
  });
}

export async function normalizeGenres(): Promise<number> {
  const db = createDb();
  await db.authenticate();
  console.log('🔧 Normalizing genres...');
  let totalFixed = 0;

  for (const [from, to] of Object.entries(GENRE_NORMALIZATION)) {
    const [res] = await db.query(`UPDATE tracks SET genre = :to WHERE genre = :from`, {
      replacements: { from, to },
    });
    const count = (res as any).rowCount || 0;
    if (count > 0) {
      console.log(`  ✏️ "${from}" → "${to}" (${count} tracks)`);
      totalFixed += count;
    }
  }

  const [emptyRes] = await db.query(`UPDATE tracks SET genre = 'Uncategorized' WHERE genre IS NULL OR genre = ''`);
  console.log(`  ✏️ Empty/null → "Uncategorized" (${(emptyRes as any).rowCount || 0} tracks)`);

  await db.close();
  return totalFixed;
}

export async function classifyAllUncategorized(): Promise<number> {
  const db = createDb();
  await db.authenticate();
  console.log('🏷️ Classifying Uncategorized tracks...');

  const [tracks] = await db.query(`SELECT id, title, artist FROM tracks WHERE genre = 'Uncategorized'`);
  console.log(`  Found ${(tracks as any[]).length} Uncategorized tracks`);

  let fixed = 0;
  for (const t of tracks as any[]) {
    const genre = classifyGenre(t.title, t.artist);
    if (genre !== 'Uncategorized') {
      await db.query(`UPDATE tracks SET genre = :genre WHERE id = :id`, {
        replacements: { genre, id: t.id },
      });
      console.log(`  ✏️ [${genre}] ${t.artist} - ${t.title}`);
      fixed++;
    }
  }

  console.log(`  Reclassified: ${fixed}/${(tracks as any[]).length}`);
  await db.close();
  return fixed;
}

export async function removeDuplicates(): Promise<{ kept: number; deleted: number }> {
  const db = createDb();
  await db.authenticate();
  console.log('🔍 Removing duplicate tracks...');

  const [dupes] = await db.query(`
    SELECT LOWER(title) as title, LOWER(artist) as artist,
           COUNT(*)::int as cnt,
           array_agg(id ORDER BY created_at DESC) as ids,
           array_agg(artwork_url ORDER BY created_at DESC) as artworks
    FROM tracks
    GROUP BY LOWER(title), LOWER(artist)
    HAVING COUNT(*) > 1
    ORDER BY cnt DESC
  `);

  console.log(`  Found ${(dupes as any[]).length} duplicate groups`);

  let totalDeleted = 0;
  let totalKept = 0;

  for (const d of dupes) {
    const ids: string[] = d.ids;
    const artworks: string[] = d.artworks;

    let keepIdx = 0;
    for (let i = 0; i < ids.length; i++) {
      const art = artworks[i] || '';
      if (!art.includes('unsplash') && art.length > 100) {
        keepIdx = i;
        break;
      }
    }

    const toDelete = ids.filter((_, i) => i !== keepIdx);
    const keptId = ids[keepIdx];

    for (const delId of toDelete) {
      await db.query(`UPDATE user_purchases SET track_id = :keep WHERE track_id = :del`, { replacements: { keep: keptId, del: delId } });
      await db.query(`UPDATE order_items SET track_id = :keep WHERE track_id = :del`, { replacements: { keep: keptId, del: delId } });
      await db.query(`DELETE FROM tracks WHERE id = :id`, { replacements: { id: delId } });
      totalDeleted++;
    }

    await db.query(`DELETE FROM user_purchases WHERE track_id NOT IN (SELECT id FROM tracks)`);
    await db.query(`DELETE FROM order_items WHERE track_id NOT IN (SELECT id FROM tracks)`);
    totalKept++;
  }

  console.log(`  Kept: ${totalKept}, Deleted: ${totalDeleted}`);
  await db.close();
  return { kept: totalKept, deleted: totalDeleted };
}
