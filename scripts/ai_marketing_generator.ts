/**
 * AI Marketing Content Automation Script
 * Usage: npx tsx scripts/ai_marketing_generator.ts
 */

import fs from 'fs';
import path from 'path';

interface PostTemplate {
  day: string;
  platform: string;
  type: string;
  genre: string;
}

const schedule: PostTemplate[] = [
  { day: 'Monday', platform: 'Facebook & TikTok', type: 'Welcome & Weekly Pack Preview', genre: 'House' },
  { day: 'Tuesday', platform: 'Facebook', type: 'Free Track Download Drop', genre: 'Techno' },
  { day: 'Wednesday', platform: 'TikTok', type: 'Genre Spotlight & BPM Guide (124-128 BPM)', genre: 'Tech House' },
  { day: 'Thursday', platform: 'Facebook', type: 'DJ Pro Tip: Harmonic Mixing & Camelot Keys', genre: 'Hip Hop' },
  { day: 'Friday', platform: 'Facebook & TikTok', type: 'NEW PACK RELEASE: Weekend Festival Edits', genre: 'EDM / Mainstage' },
  { day: 'Saturday', platform: 'Instagram', type: 'Waveform & Visual Showcase', genre: 'Trance' },
  { day: 'Sunday', platform: 'Facebook', type: 'Community Poll & Top Downloads Recap', genre: 'Open Format' },
];

function generateContent() {
  console.log('🤖 AI Marketing Content Generator Running...\n');

  const generatedPosts = schedule.map((item) => {
    const hashtags = `#BeatVault #DJEdit #${item.genre.replace(/\s+/g, '')} #DJLife #ThaiDJ #EDMThailand`;
    
    return {
      day: item.day,
      platform: item.platform,
      campaign: item.type,
      genre: item.genre,
      headline: `🎧 [${item.platform.toUpperCase()}] ${item.type}`,
      caption: `🔥 DJ Edit Update (${item.genre})\n\nเพลงคุณภาพสูง 320kbps MP3 / WAV โหลดไปเปิดมิกซ์คืนนี้ได้ทันที!\n\n📌 แนวเพลง: ${item.genre}\n📌 สำหรับ: DJ, Club & Event Mix\n📌 ดาวน์โหลด: https://djmusicmarketplace.fun/\n\n${hashtags}`,
      cta: '👉 เข้าเว็บไซต์เพื่อดาวน์โหลดไฟล์เต็มได้เลย!',
    };
  });

  const outputDir = path.resolve(process.cwd(), 'dist_marketing');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `marketing_posts_${new Date().toISOString().split('T')[0]}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(generatedPosts, null, 2), 'utf-8');

  console.log(`✅ Successfully generated ${generatedPosts.length} marketing campaign posts!`);
  console.log(`📂 Output saved to: ${outputPath}\n`);

  generatedPosts.slice(0, 2).forEach((p, idx) => {
    console.log(`--- POST SAMPLE ${idx + 1} (${p.day}) ---`);
    console.log(p.headline);
    console.log(p.caption);
    console.log('\n');
  });
}

generateContent();
