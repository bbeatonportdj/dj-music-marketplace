import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Sequelize } from 'sequelize';

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

export interface HealthReport {
  timestamp: string;
  totalTracks: number;
  genres: Array<{ genre: string; count: number }>;
  issues: Issue[];
  score: number;
}

export interface Issue {
  severity: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
  count: number;
}

export async function runHealthCheck(): Promise<HealthReport> {
  const db = createDb();
  await db.authenticate();

  const [total] = await db.query(`SELECT COUNT(*)::int as count FROM tracks`);
  const totalTracks = (total as any[])[0].count;

  const [genres] = await db.query(`SELECT genre, COUNT(*)::int as count FROM tracks GROUP BY genre ORDER BY count DESC`);

  const issues: Issue[] = [];

  const [noArtwork] = await db.query(`SELECT COUNT(*)::int as count FROM tracks WHERE artwork_url IS NULL OR artwork_url = '' OR LENGTH(artwork_url) < 100`);
  const noArtworkCount = (noArtwork as any[])[0].count;
  if (noArtworkCount > 0) {
    issues.push({ severity: 'warning', category: 'artwork', message: `${noArtworkCount} tracks have no artwork`, count: noArtworkCount });
  }

  const [uncategorized] = await db.query(`SELECT COUNT(*)::int as count FROM tracks WHERE genre = 'Uncategorized'`);
  const uncatCount = (uncategorized as any[])[0].count;
  if (uncatCount > 0) {
    issues.push({ severity: 'warning', category: 'genre', message: `${uncatCount} tracks are Uncategorized`, count: uncatCount });
  }

  const [dupes] = await db.query(`
    SELECT COUNT(*)::int as count FROM (
      SELECT LOWER(title), LOWER(artist) FROM tracks GROUP BY LOWER(title), LOWER(artist) HAVING COUNT(*) > 1
    ) sub
  `);
  const dupeCount = (dupes as any[])[0].count;
  if (dupeCount > 0) {
    issues.push({ severity: 'critical', category: 'duplicates', message: `${dupeCount} duplicate track groups`, count: dupeCount });
  }

  const [noGdrive] = await db.query(`SELECT COUNT(*)::int as count FROM tracks WHERE gdrive_file_id IS NULL OR gdrive_file_id = ''`);
  const noGdriveCount = (noGdrive as any[])[0].count;
  if (noGdriveCount > 0) {
    issues.push({ severity: 'info', category: 'gdrive', message: `${noGdriveCount} tracks have no gdrive_file_id`, count: noGdriveCount });
  }

  const [freeTracks] = await db.query(`SELECT COUNT(*)::int as count FROM tracks WHERE price = 0`);
  const freeCount = (freeTracks as any[])[0].count;
  issues.push({ severity: 'info', category: 'pricing', message: `${freeCount} free tracks (${((freeCount/totalTracks)*100).toFixed(1)}%)`, count: freeCount });

  const [badArtwork] = await db.query(`SELECT COUNT(*)::int as count FROM tracks WHERE artwork_url LIKE '%unsplash%' OR artwork_url = 'https://lh3.googleusercontent.com/d/1TxDDOcRpx_9QwYKr6ioxYhedxBCXliZC'`);
  const badArtworkCount = (badArtwork as any[])[0].count;
  if (badArtworkCount > 0) {
    issues.push({ severity: 'critical', category: 'artwork', message: `${badArtworkCount} tracks have placeholder/duplicate artwork`, count: badArtworkCount });
  }

  let score = 100;
  for (const issue of issues) {
    if (issue.severity === 'critical') score -= Math.min(20, issue.count);
    else if (issue.severity === 'warning') score -= Math.min(10, issue.count);
  }
  score = Math.max(0, score);

  await db.close();

  return {
    timestamp: new Date().toISOString(),
    totalTracks,
    genres: genres as any[],
    issues,
    score,
  };
}

export async function getQuickStats(): Promise<void> {
  const db = createDb();
  await db.authenticate();

  const [total] = await db.query(`SELECT COUNT(*)::int as count FROM tracks`);
  const [genres] = await db.query(`SELECT genre, COUNT(*)::int as count FROM tracks GROUP BY genre ORDER BY count DESC`);
  const [noArtwork] = await db.query(`SELECT COUNT(*)::int as count FROM tracks WHERE artwork_url IS NULL OR artwork_url = '' OR LENGTH(artwork_url) < 100`);

  console.log('\n📊 System Stats:');
  console.log(`  Total tracks: ${(total as any[])[0].count}`);
  console.log(`  Missing artwork: ${(noArtwork as any[])[0].count}`);
  console.log('\n  Genre Distribution:');
  for (const g of genres as any[]) {
    console.log(`    ${(g.genre || '(empty)').padEnd(25)} ${String(g.count).padStart(5)}`);
  }

  await db.close();
}
