import React, { useState } from 'react';
import { Sparkles, Copy, Check, Share2, Calendar, RefreshCw } from 'lucide-react';

interface MarketingPost {
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

export const AiMarketingTab: React.FC = () => {
  const [platform, setPlatform] = useState<'facebook' | 'tiktok' | 'instagram'>('facebook');
  const [campaignType, setCampaignType] = useState('Free Track Drop');
  const [genre, setGenre] = useState('House');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [post, setPost] = useState<MarketingPost>({
    platform: 'facebook',
    campaignType: 'Free Track Drop',
    headline: '🎧 BEAT VAULT PRESET: Free Track Drop!',
    caption: '🔥 แจกฟรี / อัปเดตเพลงใหม่สำหรับ DJ!\n\n🎵 Sabrina Carpenter - Espresso (UGEEZY Intro Edit)\n🎛️ BPM: 120 | Key: 8A | Genre: House\n\nมิกซ์เนียน จังหวะเข้าสเกล 100% พร้อมใช้งานเปิดผับ/อีเวนต์คืนนี้ สมาชิกโหลดฟรี!',
    hashtags: ['#BeatVault', '#DJEdit', '#HouseDJ', '#DJLife', '#ThaiDJ', '#EDMThailand'],
    cta: 'คลิกดาวน์โหลดทันทีที่ https://djmusicmarketplace.fun/',
    recommendedTime: '19:00 - 20:30 น.',
    suggestedTrack: {
      title: 'Espresso',
      artist: 'Sabrina Carpenter',
      bpm: 120,
      genre: 'House',
      key: '8A',
    },
  });

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/marketing/generate?platform=${platform}&campaignType=${encodeURIComponent(campaignType)}&genre=${genre}`);
      if (res.ok) {
        const data = await res.json();
        if (data.post) {
          setPost(data.post);
        }
      }
    } catch (err) {
      console.error('Error generating AI post:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const fullText = `${post.headline}\n\n${post.caption}\n\n${post.cta}\n\n${post.hashtags.join(' ')}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-red-950/40 via-neutral-900 to-black border border-red-500/20 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              AI Automated Marketing Assistant
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30 rounded-full">
                Auto-Pilot
              </span>
            </h2>
            <p className="text-sm text-neutral-400">
              สร้าง คอนเทนต์การตลาดสำหรับ Facebook, TikTok, Instagram อัตโนมัติด้วย AI
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-medium rounded-xl transition shadow-lg shadow-red-900/30 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'กำลังสร้างคอนเทนต์...' : 'สร้างคอนเทนต์ด้วย AI'}
        </button>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl">
          <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
            โซเชียลมีเดีย แพลตฟอร์ม
          </label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as any)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
          >
            <option value="facebook">Facebook Page</option>
            <option value="tiktok">TikTok Video Script</option>
            <option value="instagram">Instagram Post / Story</option>
          </select>
        </div>

        <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl">
          <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
            แคมเปญการตลาด
          </label>
          <select
            value={campaignType}
            onChange={(e) => setCampaignType(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
          >
            <option value="Free Track Drop">Free Track Drop (แจกฟรี)</option>
            <option value="Genre Spotlight">Genre Spotlight (แนะนำแนวเพลง)</option>
            <option value="New Release Pack">New Release Pack (แพ็คเกจใหม่)</option>
            <option value="DJ Mixing Tip">DJ Mixing Tip & BPM Guide</option>
          </select>
        </div>

        <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl">
          <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
            แนวเพลง (Genre)
          </label>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
          >
            <option value="House">House</option>
            <option value="Techno">Techno</option>
            <option value="Hip Hop">Hip Hop</option>
            <option value="Pop">Pop / Top 40</option>
            <option value="Latin">Latin / Reggaeton</option>
          </select>
        </div>
      </div>

      {/* Post Preview Box */}
      <div className="p-6 bg-neutral-900/80 border border-neutral-800 rounded-2xl relative space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="capitalize px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold rounded-full">
              {post.platform}
            </span>
            <span className="text-xs text-neutral-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> เวลาแนะนำสำหรับโพสต์: {post.recommendedTime}
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-400" />
                คัดลอกแล้ว!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                คัดลอกข้อความ
              </>
            )}
          </button>
        </div>

        {/* Post Content */}
        <div className="space-y-3 font-mono text-sm bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-neutral-200 whitespace-pre-line leading-relaxed">
          <p className="font-bold text-red-400 text-base">{post.headline}</p>
          <p className="text-neutral-300">{post.caption}</p>
          <p className="text-blue-400 underline font-sans text-xs">{post.cta}</p>
          <div className="pt-2 flex flex-wrap gap-1 text-xs text-neutral-400">
            {post.hashtags.map((h, i) => (
              <span key={i} className="text-red-400/80">
                {h}
              </span>
            ))}
          </div>
        </div>

        {/* Suggested Track Badge */}
        {post.suggestedTrack && (
          <div className="flex items-center justify-between p-3 bg-neutral-950/60 border border-neutral-800 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-red-400" />
              <span className="text-neutral-400">เพลงแนะนำในโพสต์:</span>
              <span className="font-semibold text-white">
                {post.suggestedTrack.artist} - {post.suggestedTrack.title}
              </span>
            </div>
            <div className="flex gap-3 text-neutral-400">
              <span>BPM: <strong className="text-white">{post.suggestedTrack.bpm}</strong></span>
              <span>Key: <strong className="text-white">{post.suggestedTrack.key}</strong></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
