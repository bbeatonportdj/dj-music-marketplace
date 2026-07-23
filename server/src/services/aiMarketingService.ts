import { Track } from '../models/index.js';

export interface GeneratedPost {
  platform: 'facebook' | 'tiktok' | 'instagram';
  campaignType: string;
  headline: string;
  caption: string;
  hashtags: string[];
  cta: string;
  recommendedTime: string;
  suggestedTrack?: {
    title: string;
    artist: string;
    bpm: number;
    genre: string;
    key: string;
  };
}

export class AIMarketingService {
  /**
   * Generates marketing content for a specific day or genre
   */
  static async generateSocialPost(params: {
    platform?: 'facebook' | 'tiktok' | 'instagram';
    campaignType?: string;
    genre?: string;
    trackId?: string;
  }): Promise<GeneratedPost> {
    const { platform = 'facebook', campaignType = 'Free Track', genre, trackId } = params;

    // Fetch sample track from database
    let selectedTrack: any = null;
    if (trackId) {
      selectedTrack = await Track.findByPk(trackId);
    } else if (genre) {
      selectedTrack = await Track.findOne({ where: { genre } });
    }

    if (!selectedTrack) {
      selectedTrack = await Track.findOne({ order: [['createdAt', 'DESC']] });
    }

    const trackInfo = selectedTrack
      ? {
          title: selectedTrack.title,
          artist: selectedTrack.artist,
          bpm: selectedTrack.bpm,
          genre: selectedTrack.genre,
          key: selectedTrack.key,
        }
      : {
          title: 'Espresso',
          artist: 'Sabrina Carpenter',
          bpm: 120,
          genre: 'House',
          key: '8A',
        };

    const hashtags = [
      '#BeatVault',
      '#DJEdit',
      '#DJMusic',
      `#${trackInfo.genre.replace(/\s+/g, '')}DJ`,
      '#DJLife',
      '#ThaiDJ',
      '#EDMThailand',
    ];

    if (platform === 'tiktok') {
      return {
        platform: 'tiktok',
        campaignType,
        headline: `🎧 ${campaignType}: ${trackInfo.genre} Spotlight (${trackInfo.bpm} BPM)`,
        caption: `🔥 DJ Edit Drop!\n\nTrack: ${trackInfo.artist} - ${trackInfo.title}\nBPM: ${trackInfo.bpm} | Key: ${trackInfo.key}\n\nดาวน์โหลดไฟล์ 320kbps MP3 / WAV พร้อมเล่นคืนนี้ได้แล้วที่ DJ Music Marketplace!\n\n👉 ลิงก์ดาวน์โหลดอยู่ในโปรไฟล์`,
        hashtags,
        cta: 'ดาวน์โหลดเลยที่โปรไฟล์',
        recommendedTime: '18:00 - 21:00 น.',
        suggestedTrack: trackInfo,
      };
    }

    if (platform === 'instagram') {
      return {
        platform: 'instagram',
        campaignType,
        headline: `✨ NEW RELEASE: ${trackInfo.artist} - ${trackInfo.title}`,
        caption: `🎧 ${trackInfo.genre} Essential for your weekend set!\n\n📌 BPM: ${trackInfo.bpm}\n📌 Key: ${trackInfo.key} (Camelot Wheel)\n📌 Quality: Clean / Dirty / Intro Edits Available\n\nดาวน์โหลดเพลงคุณภาพสูงสำหรับ DJ ได้แล้ววันนี้!`,
        hashtags,
        cta: 'Link in Bio for Free Downloads',
        recommendedTime: '12:00 - 14:00 น.',
        suggestedTrack: trackInfo,
      };
    }

    // Default Facebook
    return {
      platform: 'facebook',
      campaignType,
      headline: `🎧 BEAT VAULT PRESET: ${campaignType}!`,
      caption: `🔥 แจกฟรี / อัปเดตเพลงใหม่สำหรับ DJ!\n\n🎵 ${trackInfo.artist} - ${trackInfo.title}\n🎛️ BPM: ${trackInfo.bpm} | Key: ${trackInfo.key} | Genre: ${trackInfo.genre}\n\nมิกซ์เนียน จังหวะเข้าสเกล 100% พร้อมใช้งานเปิดผับ/อีเวนต์คืนนี้ สมาชิกโหลดฟรี!`,
      hashtags,
      cta: 'คลิกดาวน์โหลดทันทีที่ https://djmusicmarketplace.fun/',
      recommendedTime: '19:00 - 20:30 น.',
      suggestedTrack: trackInfo,
    };
  }

  /**
   * Returns a 7-day marketing schedule with ready-to-post content
   */
  static async getWeeklyMarketingPlan() {
    const genres = ['House', 'Techno', 'Hip Hop', 'Pop', 'Latin'];
    const days = [
      { day: 'จันทร์', platform: 'facebook', type: 'Welcome / Brand Post' },
      { day: 'อังคาร', platform: 'facebook', type: 'Free Track Drop' },
      { day: 'พุธ', platform: 'tiktok', type: 'Genre Spotlight' },
      { day: 'พฤหัสบดี', platform: 'facebook', type: 'DJ Mixing Tip & BPM Match' },
      { day: 'ศุกร์', platform: 'tiktok', type: 'New Pack Release' },
      { day: 'เสาร์', platform: 'instagram', type: 'Track Waveform Showcase' },
      { day: 'อาทิตย์', platform: 'facebook', type: 'Community Poll & Recap' },
    ];

    const schedule = [];
    for (let i = 0; i < days.length; i++) {
      const item = days[i];
      const post = await this.generateSocialPost({
        platform: item.platform as any,
        campaignType: item.type,
        genre: genres[i % genres.length],
      });
      schedule.push({
        dayOfWeek: item.day,
        ...post,
      });
    }

    return schedule;
  }
}
