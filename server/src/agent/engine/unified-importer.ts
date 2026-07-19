import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Sequelize, DataTypes } from 'sequelize';
import { ImportPreset } from '../config/import-presets.js';
import { parseFilename } from './filename-parser.js';
import { extractArtwork, getAllFiles } from './artwork-extractor.js';
import { classifyGenre } from './genre-classifier.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

let dbUrl = process.env.DATABASE_URL || '';
dbUrl = dbUrl.replace(/\?sslmode=[^&]*/, '').replace(/&sslmode=[^&]*/, '');
const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  logging: false,
});

const Track = sequelize.define('Track', {
  id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title:        { type: DataTypes.STRING, allowNull: false },
  artist:       { type: DataTypes.STRING, allowNull: false },
  version:      { type: DataTypes.STRING, defaultValue: '' },
  version_type: { type: DataTypes.STRING, defaultValue: 'clean' },
  duration:     { type: DataTypes.STRING, defaultValue: '0:00' },
  bpm:          { type: DataTypes.INTEGER, defaultValue: 0 },
  key:          { type: DataTypes.STRING, defaultValue: '' },
  genre:        { type: DataTypes.STRING, defaultValue: 'Uncategorized' },
  price:        { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
  audio_url:    { type: DataTypes.STRING, defaultValue: '' },
  gdrive_file_id: { type: DataTypes.STRING, defaultValue: '' },
  artwork_url:  { type: DataTypes.STRING, defaultValue: '' },
  is_new:       { type: DataTypes.BOOLEAN, defaultValue: false },
  is_hot:       { type: DataTypes.BOOLEAN, defaultValue: false },
  created_at:   { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'tracks', timestamps: false, freezeTableName: true });

export interface ImportResult {
  preset: string;
  totalFiles: number;
  imported: number;
  skipped: number;
  failed: number;
  errors: string[];
}

export async function runImport(preset: ImportPreset): Promise<ImportResult> {
  await sequelize.authenticate();
  console.log(`\n🚀 Starting import: ${preset.name}`);
  console.log(`   Genre: ${preset.genre} | Price: $${preset.price} | Folder: ${preset.folderId}`);

  const [existing] = await sequelize.query(`SELECT gdrive_file_id, LOWER(title) as title, LOWER(artist) as artist FROM tracks`);
  const existingGdriveIds = new Set<string>((existing as any[]).map(t => t.gdrive_file_id).filter(Boolean));
  const existingTitleArtist = new Set<string>((existing as any[]).map(t => `${t.title}|${t.artist}`));

  console.log('📂 Scanning Drive folder...');
  const files = await getAllFiles(preset.folderId, preset.recursive);
  console.log(`Found ${files.length} audio files`);

  const result: ImportResult = {
    preset: preset.name,
    totalFiles: files.length,
    imported: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  for (const f of files) {
    if (existingGdriveIds.has(f.id)) {
      result.skipped++;
      continue;
    }

    const parsed = parseFilename(f.name, preset.parseStrategy);

    const taKey = `${parsed.title.toLowerCase()}|${parsed.artist.toLowerCase()}`;
    if (existingTitleArtist.has(taKey)) {
      result.skipped++;
      continue;
    }

    let price = preset.price;
    if (preset.wavPrice !== undefined && preset.mp3Price !== undefined) {
      const ext = f.name.split('.').pop()?.toLowerCase();
      price = (ext === 'wav' || ext === 'aif' || ext === 'aiff') ? preset.wavPrice : preset.mp3Price;
    }

    const genre = preset.genre === 'Uncategorized'
      ? classifyGenre(parsed.title, parsed.artist)
      : preset.genre;

    try {
      const track = await Track.create({
        title: parsed.title,
        artist: parsed.artist,
        version: parsed.version,
        version_type: parsed.versionType,
        duration: '0:00',
        bpm: parsed.bpm,
        key: parsed.key,
        genre,
        price,
        gdrive_file_id: f.id,
        artwork_url: '',
        is_new: true,
        is_hot: false,
      });

      if (preset.extractArtwork) {
        const artwork = await extractArtwork(f.id);
        if (artwork) {
          await sequelize.query(`UPDATE tracks SET artwork_url = :url WHERE id = :id`, {
            replacements: { url: artwork, id: track.id },
          });
        }
      }

      existingGdriveIds.add(f.id);
      existingTitleArtist.add(taKey);
      result.imported++;

      if (result.imported % 10 === 0) console.log(`  📦 ${result.imported} imported...`);
    } catch (err: any) {
      result.failed++;
      result.errors.push(`${f.name}: ${err.message}`);
      console.error(`  ❌ ${f.name}: ${err.message}`);
    }
  }

  console.log(`\n📊 Import Summary:`);
  console.log(`  Total: ${result.totalFiles}`);
  console.log(`  Imported: ${result.imported}`);
  console.log(`  Skipped: ${result.skipped}`);
  console.log(`  Failed: ${result.failed}`);

  await sequelize.close();
  return result;
}

export async function getTrackStats(): Promise<any> {
  await sequelize.authenticate();

  const [total] = await sequelize.query(`SELECT COUNT(*)::int as count FROM tracks`);
  const [genres] = await sequelize.query(`SELECT genre, COUNT(*)::int as count FROM tracks GROUP BY genre ORDER BY count DESC`);
  const [noArtwork] = await sequelize.query(`SELECT COUNT(*)::int as count FROM tracks WHERE artwork_url IS NULL OR artwork_url = ''`);
  const [uncategorized] = await sequelize.query(`SELECT COUNT(*)::int as count FROM tracks WHERE genre = 'Uncategorized'`);

  await sequelize.close();

  return {
    total: (total as any[])[0].count,
    genres: genres as any[],
    noArtwork: (noArtwork as any[])[0].count,
    uncategorized: (uncategorized as any[])[0].count,
  };
}
