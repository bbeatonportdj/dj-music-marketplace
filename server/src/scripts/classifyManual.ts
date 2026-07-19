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

// Manual genre assignment for remaining tracks by artist/title keywords
const manualGenres: Array<{ match: RegExp; genre: string }> = [
  // Hard Dance / EDM
  { match: /\b(blast|round da top|dangerous|mekkanikka|fuzzy plush|n-r-g|darren styles|dougal)\b/i, genre: 'Hard Dance' },
  { match: /\b(blatte|party crasher|area one|storm|shake it|kosmic|killa|kirk|dream man)\b/i, genre: 'Hard Dance' },
  { match: /\b(mr\.?\s*black|ben nicky|falcon|struggle|navras|t78|don paolo)\b/i, genre: 'Hard Dance' },
  { match: /\b(omiki|vegas|wana|ter kora|crazy in love|hu|no tinder|galvh)\b/i, genre: 'Hard Dance' },
  { match: /\b(vertical mode|domination|gaudium|santiago luna|maywell|don't be afraid|deep dip)\b/i, genre: 'House' },
  { match: /\b(prty trax|callum mccreath|soundboy)\b/i, genre: 'House' },
  { match: /\b(lusso|joy kitikonti|creeds|push it|rocking with the best)\b/i, genre: 'House' },
  { match: /\b(nemo|felix jaehn|the code)\b/i, genre: 'Top 40' },
  { match: /\b(car cardio|danny ores|robbe|beauz|extended mix)\b/i, genre: 'House' },
  { match: /\b(azura|dance live control)\b/i, genre: 'House' },
  { match: /\b(follow me|nobody listens to techno)\b/i, genre: 'Techno' },
  { match: /\b(3am|taylor torrence|kyra mastro|move to the beat)\b/i, genre: 'House' },
  { match: /\b(get down|armin hermann|nightsub)\b/i, genre: 'House' },
  { match: /\b(hunther|hhunter|round da top)\b/i, genre: 'Hard Dance' },
  { match: /\b(scythe|oksy|satisfy)\b/i, genre: 'Techno' },
  { match: /\b(stanepimp|graciano|latineox)\b/i, genre: 'Latin' },
  { match: /\b(mrgnstrn|body)\b/i, genre: 'Techno' },
  { match: /\b(chase|uni|vex|original mix)\b/i, genre: 'Techno' },
  { match: /\b(boldness|dnf|matt dybal)\b/i, genre: 'House' },
  { match: /\b(help myself|david nimmo|extended)\b/i, genre: 'House' },
  { match: /\b(galactic harmony|felinae|morelia|steppa)\b/i, genre: 'House' },
  { match: /\b(acid groove|innervoix|saaba)\b/i, genre: 'Techno' },
  { match: /\b(slime dunk|noise mafia)\b/i, genre: 'Hard Dance' },
  { match: /\b(young boss|bolo flip)\b/i, genre: 'Hip Hop' },
  { match: /\b(racks on racks|lil pump)\b/i, genre: 'Hip Hop' },
  { match: /\b(hiphop music|hip hop)\b/i, genre: 'Hip Hop' },
  { match: /\b(藏进心口|揽佬|大展鸿图|刘夫阳)\b/i, genre: 'Hip Hop' },
  { match: /\b(派对|丁同|jtong|woof)\b/i, genre: 'Hip Hop' },
  { match: /\b(yummy|justin bieber|soda pop|new jeans|hype boy|blackpink|pink venom)\b/i, genre: 'Top 40' },
  { match: /\b(ayy macarena|tyga|faiz edit)\b/i, genre: 'Hip Hop' },
  { match: /\b(bubble butt|major lazer|twerk|deville)\b/i, genre: 'Hip Hop' },
  { match: /\b(on the floor|pitbull|ave remix)\b/i, genre: 'Dance & EDM' },
  { match: /\b(raga|starships|love story|victory lap|noair)\b/i, genre: 'Remix' },
  { match: /\b(dau tam|carry you|demike|dlw)\b/i, genre: 'Hip Hop' },
  { match: /\b(magic city|jermaine dupri|sean paul|bunna)\b/i, genre: 'Hip Hop' },
  { match: /\b(ballin|return of the mack|mark morrison|dj grant)\b/i, genre: 'Hip Hop' },
  { match: /\b(rush rush|wasback|wukong)\b/i, genre: 'EDM' },
  { match: /\b(xtradop)\b/i, genre: 'EDM' },
  { match: /\b(love six|bring em out)\b/i, genre: 'Hip Hop' },
  { match: /\b(goose)\b/i, genre: 'House' },
  { match: /\b(put ur fking|htet g|edmpacks)\b/i, genre: 'EDM' },
  { match: /\b(cub|calvin harris|fahjah|hard dance flip)\b/i, genre: 'Hard Dance' },
  { match: /\b(further up|yan in|outro urbano)\b/i, genre: 'Latin' },
  { match: /\b(uh huh)\b/i, genre: 'Hip Hop' },
  { match: /\b(cd is dead)\b/i, genre: 'Other' },
  { match: /\b(kesha|tik tok 2025|starjack|afro tribal)\b/i, genre: 'TikTok Dance' },
  { match: /\b(pitbull|static|ben el)\b/i, genre: 'Latin' },
  { match: /\b(racks|racks on racks)\b/i, genre: 'Hip Hop' },
  { match: /\b(666|amokk|회사원)\b/i, genre: 'Techno' },
  { match: /\b(cream|krazy|dj kuba|neitan|pitbull|lil jon)\b/i, genre: 'House' },
];

async function main() {
  await sequelize.authenticate();
  const [tracks] = await sequelize.query(`SELECT id, title, artist FROM tracks WHERE genre = 'Uncategorized'`);
  console.log(`📋 ${tracks.length} remaining Uncategorized tracks\n`);

  let fixed = 0;
  for (const t of tracks as any[]) {
    let matched = false;
    for (const rule of manualGenres) {
      if (rule.match.test(`${t.title} ${t.artist}`)) {
        await sequelize.query(`UPDATE tracks SET genre = :genre WHERE id = :id`, {
          replacements: { genre: rule.genre, id: t.id },
        });
        console.log(`  ✏️ [${rule.genre}] ${t.artist} - ${t.title}`);
        fixed++;
        matched = true;
        break;
      }
    }
    if (!matched) {
      console.log(`  ❓ ${t.artist} - ${t.title}`);
    }
  }

  console.log(`\n📊 Reclassified: ${fixed}/${tracks.length}`);

  // Final
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
