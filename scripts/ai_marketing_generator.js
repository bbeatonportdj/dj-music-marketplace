import fs from 'fs';
import path from 'path';

const schedule = [
  { day: 'วันจันทร์', platform: 'Facebook & TikTok', type: 'Welcome & Weekly Pack Preview', genre: 'House' },
  { day: 'วันอังคาร', platform: 'Facebook', type: 'Free Track Download Drop', genre: 'Techno' },
  { day: 'วันพุธ', platform: 'TikTok Video Script', type: 'Genre Spotlight & BPM Guide (124-128 BPM)', genre: 'Tech House' },
  { day: 'วันพฤหัสบดี', platform: 'Facebook', type: 'DJ Pro Tip: Harmonic Mixing & Camelot Keys', genre: 'Hip Hop' },
  { day: 'วันศุกร์', platform: 'Facebook & TikTok', type: 'NEW PACK RELEASE: Weekend Festival Edits', genre: 'EDM / Mainstage' },
  { day: 'วันเสาร์', platform: 'Instagram', type: 'Waveform & Visual Showcase', genre: 'Trance' },
  { day: 'วันอาทิตย์', platform: 'Facebook', type: 'Community Poll & Top Downloads Recap', genre: 'Open Format' },
];

function generateContent() {
  console.log('🤖 AI Marketing Content Generator Running...\n');

  const generatedPosts = schedule.map((item) => {
    const hashtags = `#BeatVault #DJEdit #${item.genre.replace(/[\s\/]+/g, '')} #DJLife #ThaiDJ #EDMThailand`;
    
    return {
      day: item.day,
      platform: item.platform,
      campaign: item.type,
      genre: item.genre,
      headline: `🎧 [${item.platform}] ${item.type}`,
      caption: `🔥 DJ Edit Update (${item.genre})\n\nไฟล์คุณภาพสูง 320kbps MP3 / WAV โหลดไปเปิดมิกซ์คืนนี้ได้ทันที!\n\n📌 แนวเพลง: ${item.genre}\n📌 สำหรับ: DJ, Club & Event Mix\n📌 ดาวน์โหลด: https://djmusicmarketplace.fun/\n\n${hashtags}`,
      cta: '👉 เข้าเว็บไซต์เพื่อดาวน์โหลดไฟล์เต็มได้เลย!',
      recommendedTime: '19:00 - 20:30 น.'
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

  return generatedPosts;
}

generateContent();
