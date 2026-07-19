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

function guessGenre(title: string, artist: string): string {
  const t = `${title} ${artist}`.toLowerCase();
  
  // Hard Dance / Hardstyle keywords
  if (/\b(hardstyle|hard dance|hardcore|hard techno|rawstyle|euphoric|reverse bass|jumpstyle|bounce|raw|fcuk|uzed|sogma)\b/i.test(t)) return 'Hard Dance';
  if (/\b(timmy trumpet|da tweekaz|w&w|showtek|blast|headhunterz|noise controllers|brennan heart|atmozfears|maxx power|rebelion|warface|angerfist)\b/i.test(t)) return 'Hard Dance';
  
  // Psy Trance
  if (/\b(psy trance|psytrance|goa|full-on|progressive psy|acid|trance dub)\b/i.test(t)) return 'Psy Trance';
  
  // Trance
  if (/\b(trance|uplifting|progressive trance|vocal trance|epic trance)\b/i.test(t)) return 'Trance';
  
  // Big Room
  if (/\b(big room|bigroom|mainstage|festival|EDM banger)\b/i.test(t)) return 'Big Room';
  
  // Bass House
  if (/\b(bass house|bass|uk bass|grime|bassline)\b/i.test(t)) return 'Bass House';
  
  // Drum & Bass
  if (/\b(drum.?n.?bass|dnb|drum and bass|jungle|liquid dnb)\b/i.test(t)) return 'Drum & Bass';
  
  // Afro House
  if (/\b(afro house|afro tech|amapiano|afrobeat)\b/i.test(t)) return 'Afro House';
  
  // House
  if (/\b(house|deep house|tech house|progressive house|electro house|future house|slap house|afro house|tropical house)\b/i.test(t)) return 'House';
  
  // Techno
  if (/\b(techno|melbourne|acid techno|dub techno|minimal techno|peak time|driving)\b/i.test(t)) return 'Techno';
  
  // Hip Hop
  if (/\b(hip hop|rap|trap|drill|cloud rap|phonk|memphis)\b/i.test(t)) return 'Hip Hop';
  
  // K-Pop
  if (/\b(k-?pop|kpop|korean)\b/i.test(t)) return 'K-Pop';
  
  // Top 40
  if (/\b(top 40|pop|dance pop|electropop)\b/i.test(t)) return 'Top 40';
  
  // EDM
  if (/\b(edm|electronic|dance|festival|club)\b/i.test(t)) return 'EDM';
  
  // Latin
  if (/\b(reggaeton|latin|bachata|salsa|cumbia|guaracha)\b/i.test(t)) return 'Latin';
  
  return 'Uncategorized';
}

async function main() {
  await sequelize.authenticate();
  const [tracks] = await sequelize.query(`SELECT id, title, artist FROM tracks WHERE genre = 'Uncategorized'`);
  console.log(`📋 ${tracks.length} Uncategorized tracks\n`);

  let fixed = 0;
  for (const t of tracks as any[]) {
    const genre = guessGenre(t.title, t.artist);
    if (genre !== 'Uncategorized') {
      await sequelize.query(`UPDATE tracks SET genre = :genre WHERE id = :id`, {
        replacements: { genre, id: t.id },
      });
      console.log(`  ✏️ [${genre}] ${t.artist} - ${t.title}`);
      fixed++;
    } else {
      console.log(`  ❓ ${t.artist} - ${t.title}`);
    }
  }

  console.log(`\n📊 Reclassified: ${fixed}/${tracks.length}`);

  // Final distribution
  const [genres] = await sequelize.query(`SELECT genre, COUNT(*) as count FROM tracks GROUP BY genre ORDER BY count DESC`);
  console.log(`\n📊 Final Distribution:`);
  let total = 0;
  for (const g of genres as any[]) {
    total += parseInt(g.count);
    console.log(`  ${g.genre.padEnd(20)} ${String(g.count).padStart(5)}`);
  }
  console.log(`  ${'─'.repeat(28)} ${String(total).padStart(5)}`);

  await sequelize.close();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
