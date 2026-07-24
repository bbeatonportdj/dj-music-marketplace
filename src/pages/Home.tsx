import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Search, ChevronDown, Download, Zap, Tag, Star, Clock, Check, Headphones, Globe, Shield, PlayCircle } from 'lucide-react';
import { fetchTracks, prefetchArtwork } from '../lib/api';
import { directDownload } from '../lib/download';
import type { Track } from '../lib/api';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import SEO from '../components/SEO';

const GENRE_TABS = ['All', 'House', 'Tech House', 'Techno', 'Drum & Bass', 'Hip Hop', 'Latin', 'K-Pop', 'Pop'];

const TESTIMONIALS = [
  {
    name: 'DJ Snake',
    role: 'International Touring DJ',
    avatar: '🐍',
    text: 'This platform changed how I build my sets. The AI rankings are spot on — I find bangers I never would have digged for.',
    rating: 5,
  },
  {
    name: 'DJ Khaled',
    role: 'Grammy Nominated Producer',
    avatar: '🏆',
    text: 'Another one... another banger from DJ Marketplace. The quality is unmatched. Every track is hit material.',
    rating: 5,
  },
  {
    name: 'DJ Premier',
    role: 'Legendary Hip-Hop DJ',
    avatar: '👑',
    text: 'Finally a platform that respects the craft. Pre-tagged BPM and key saves me hours before every gig.',
    rating: 5,
  },
];

const PRICING_PLANS = [
  {
    name: 'DJcity',
    price: '$19/mo',
    features: ['500 downloads/mo', 'Basic tagging', 'Limited genres', 'No AI ranking'],
    highlight: false,
  },
  {
    name: 'DJ Marketplace',
    price: '$24/mo',
    features: ['Unlimited downloads', 'AI-ranked tracks', 'All 48+ genres', 'Pre-tagged BPM/Key', 'Exclusive edits', 'Priority support'],
    highlight: true,
    badge: 'BEST VALUE',
  },
  {
    name: 'BPM Supreme',
    price: '$29/mo',
    features: ['Unlimited downloads', 'Basic tagging', 'Limited exclusives', 'No AI ranking'],
    highlight: false,
  },
];

const LIVE_ACTIVITIES = [
  { city: 'Tokyo', country: 'JP', action: 'downloaded 15 Tech House tracks', time: '2 min ago' },
  { city: 'Los Angeles', country: 'US', action: 'joined DJ Marketplace', time: '5 min ago' },
  { city: 'Berlin', country: 'DE', action: 'downloaded 8 Techno edits', time: '8 min ago' },
  { city: 'Bangkok', country: 'TH', action: 'created an account', time: '12 min ago' },
  { city: 'London', country: 'UK', action: 'downloaded 22 Drum & Bass tracks', time: '15 min ago' },
  { city: 'São Paulo', country: 'BR', action: 'downloaded 10 Latin remixes', time: '18 min ago' },
];

function Home() {
  const navigate = useNavigate();
  const { currentTrack, isPlaying, playTrack, preloadTrack } = useAudio();
  const { user } = useAuth();
  const { showNotification } = useNotifications();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activityIndex, setActivityIndex] = useState(0);
  const [downloadCount, setDownloadCount] = useState(1247);
  const activityRef = useRef<HTMLDivElement>(null);

  const handleFreeDownload = async (track: Track) => {
    if (!user) {
      showNotification('Please sign in to download', 'error');
      navigate('/auth');
      return;
    }
    setDownloadingId(track.id);
    try {
      await directDownload(track.id, track.title);
      showNotification(`Downloading "${track.title}"`, 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      showNotification(message, 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    fetchTracks().then(data => {
      setTracks(data);
      setLoading(false);
      prefetchArtwork(data.map(t => t.id));
    });
  }, []);

  // Live activity rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setActivityIndex(prev => (prev + 1) % LIVE_ACTIVITIES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Download counter animation
  useEffect(() => {
    const interval = setInterval(() => {
      setDownloadCount(prev => prev + Math.floor(Math.random() * 3));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredTracks = tracks.filter(track => {
    const matchesGenre = selectedGenre === 'All' || track.genre?.toLowerCase() === selectedGenre.toLowerCase();
    const matchesSearch = !searchQuery ||
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGenre && matchesSearch;
  }).slice(0, 30);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-[#0A0A0A]">
        <div className="w-10 h-10 border-2 border-white/10 border-t-[#FC4239] rounded-full animate-spin" />
        <p className="text-[12px] text-white/45 font-mono uppercase tracking-[0.15em] animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <SEO
        title="Premium DJ Edit Packs & Music"
        description="High-quality DJ edits, remixes & original productions. Download in 320kbps MP3 / WAV."
        image="https://djmusicmarketplace.fun/og-image.png"
      />

      {/* Hero */}
      <section className="relative w-full overflow-hidden bg-[#0A0A0A]" style={{ minHeight: '640px', height: '100dvh' }}>
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FC4239]/8 rounded-full blur-[150px] animate-pulse" />
          <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-[#FF8800]/5 rounded-full blur-[100px] animate-pulse delay-100" />
          <div className="absolute bottom-1/3 right-1/4 w-[250px] h-[250px] bg-[#00B0FF]/5 rounded-full blur-[100px] animate-pulse delay-200" />
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-4">
          {/* Logo */}
          <div className="mb-8 animate-scale-in">
            <img
              src="/logo.png"
              alt="DJ Marketplace"
              className="w-[140px] sm:w-[180px] h-auto drop-shadow-[0_10px_40px_rgba(252,66,57,0.25)]"
            />
          </div>

          {/* Headline */}
          <h1
            className="text-center font-black tracking-[-0.04em] leading-[1.05] mb-6 animate-fade-in-up"
            style={{
              fontSize: 'clamp(2.25rem, 6vw, 5.25rem)',
              backgroundImage: 'linear-gradient(135deg, #FFFFFF 0%, #FF8B7E 30%, #FC4239 60%, #FFFFFF 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 2px 20px rgba(0,0,0,0.6))',
              animation: 'fadeInUp 0.8s ease-out forwards, shimmer 4s linear infinite'
            }}
          >
            Your Next Hit<br />Is Here.
          </h1>

          {/* Subtitle */}
          <p className="text-white/85 text-base sm:text-lg text-center max-w-xl mb-8 animate-fade-in-up delay-200" style={{ opacity: 0, animationFillMode: 'forwards' }}>
            100K+ exclusive edits, remixes & bangers. AI-ranked by what's crushing dancefloors. Pre-tagged BPM & key. Ready for Serato, Rekordbox & Traktor.
          </p>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-8 animate-fade-in-up delay-250" style={{ opacity: 0, animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-2 text-white/70">
              <Headphones size={16} className="text-[#FC4239]" />
              <span className="text-[13px] font-semibold">37,000+ DJs</span>
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <Globe size={16} className="text-[#FC4239]" />
              <span className="text-[13px] font-semibold">120+ Countries</span>
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <Star size={16} className="text-[#FC4239]" fill="#FC4239" />
              <span className="text-[13px] font-semibold">4.9★ Rating</span>
            </div>
          </div>

          {/* CTA */}
          <button
            className="px-8 py-3.5 bg-gradient-to-r from-[#FC4239] to-[#e03a32] text-white text-[14px] font-bold rounded-xl hover:from-[#e03a32] hover:to-[#d03329] transition-all duration-300 shadow-[0_4px_20px_rgba(252,66,57,0.3)] hover:shadow-[0_8px_30px_rgba(252,66,57,0.4)] hover:-translate-y-0.5 btn-press animate-fade-in-up delay-300"
            style={{ opacity: 0, animationFillMode: 'forwards' }}
            onClick={() => navigate('/auth')}
          >
            Start Free - No Card Required
          </button>
          <p className="text-white/40 text-[12px] mt-3 animate-fade-in-up delay-350" style={{ opacity: 0, animationFillMode: 'forwards' }}>7-day free trial • Cancel anytime</p>
        </div>

        {/* Bottom Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-[200px] bg-gradient-to-t from-[#0A0A0A] to-transparent z-20" />
      </section>

      {/* Live Activity Banner */}
      <section className="bg-[#0A0A0A] py-4 border-y border-white/[0.06] overflow-hidden">
        <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#00C853] animate-pulse" />
          <div ref={activityRef} className="relative h-6 overflow-hidden">
            {LIVE_ACTIVITIES.map((activity, i) => (
              <div
                key={i}
                className={`absolute inset-0 flex items-center justify-center gap-2 transition-all duration-500 ${
                  i === activityIndex ? 'opacity-100 translate-y-0' : i < activityIndex ? '-translate-y-full opacity-0' : 'translate-y-full opacity-0'
                }`}
              >
                <span className="text-white/60 text-[13px]">
                  <span className="font-bold text-white">{activity.city}</span>, {activity.country} {activity.action}
                </span>
                <span className="text-white/35 text-[12px] font-mono">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof - Testimonials */}
      <section className="bg-[#0A0A0A] py-16 sm:py-20">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in-up">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#FC4239] mb-3">Trusted by pros</p>
            <h2 className="font-black text-white text-[28px] sm:text-[36px] lg:text-[44px] leading-[1.05] tracking-[-0.03em]">
              What DJs Are Saying
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {TESTIMONIALS.map((testimonial, i) => (
              <article
                key={i}
                className="card-glow glass rounded-2xl p-6 sm:p-8 hover-lift"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, j) => (
                    <Star key={j} size={16} className="text-[#FFB800]" fill="#FFB800" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-white/80 text-[15px] leading-relaxed mb-6 italic">"{testimonial.text}"</p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1C1C1C] flex items-center justify-center text-[18px]">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-white text-[14px]">{testimonial.name}</p>
                    <p className="text-white/45 text-[12px]">{testimonial.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(252,66,57,0.35) 35%, rgba(252,66,57,0.55) 50%, rgba(252,66,57,0.35) 65%, transparent)', opacity: 0.18 }} />

      {/* Library Section */}
      <section id="library" className="bg-[#0A0A0A] py-12 sm:py-16">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="mb-8 animate-fade-in-up">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#FC4239] mb-3">The library</p>
            <h2 className="font-black text-white text-[28px] sm:text-[36px] lg:text-[44px] leading-[1.05] tracking-[-0.03em]">
              Live. Loaded.<br />Lethal.
            </h2>
            <p className="text-white/65 text-[15px] mt-3">Browse like you're on a CDJ. Real tracks, real tempo, real key.</p>
          </div>

          {/* Genre Tabs */}
          <div className="flex gap-0 overflow-x-auto pb-1 mb-6 border-b border-[#1A1A1A] scrollbar-hide">
            {GENRE_TABS.map(genre => (
              <button
                key={genre}
                className={`tab-underline relative px-4 sm:px-5 py-3 text-[10px] sm:text-[11px] uppercase tracking-[0.16em] font-bold whitespace-nowrap transition-colors duration-200 ${
                  selectedGenre === genre
                    ? 'text-white active'
                    : 'text-white/45 hover:text-white/85'
                }`}
                onClick={() => setSelectedGenre(genre)}
              >
                {genre}
              </button>
            ))}
          </div>

          {/* CDJ Container */}
          <div className="rounded-xl p-1 glass animate-scale-in delay-100" style={{ opacity: 0, animationFillMode: 'forwards' }}>
            <div className="rounded-[10px] overflow-hidden bg-[#0a0a0a]">
              {/* CDJ Header */}
              <div className="h-9 bg-[#0F0F0F] border-b border-[#2A2A2A] flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00C853] cdj-play-active" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#888]">DECK A</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#888]">BPM 128</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#888]">KEY 11A</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#888]">TIME 00:00</span>
                </div>
              </div>

              {/* Search */}
              <div className="p-4 border-b border-[#1A1A1A]">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search tracks, artists..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl pl-9 pr-4 py-2.5 text-[13px] text-white placeholder-white/40 focus:outline-none focus:border-[#FC4239]/50 focus:bg-[#1f1f1f] transition-all duration-300"
                  />
                </div>
              </div>

              {/* Track List */}
              <div className="max-h-[500px] overflow-y-auto scrollbar-hide">
                {filteredTracks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <p className="text-[14px] text-white/45">No tracks found</p>
                    <button
                      className="text-[13px] text-[#FC4239] font-semibold hover:underline btn-press"
                      onClick={() => { setSearchQuery(''); setSelectedGenre('All'); }}
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  filteredTracks.map((track, idx) => (
                    <div
                      key={track.id}
                      className={`track-row group grid grid-cols-[28px_36px_1fr_auto] sm:grid-cols-[36px_36px_1fr_auto_auto_18px] gap-3 sm:gap-4 items-center px-4 py-3 border-b border-[#1A1A1A] last:border-b-0 cursor-pointer ${
                        currentTrack?.id === track.id ? 'bg-[#FC4239]/5 border-l-[#FC4239]' : ''
                      }`}
                      style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
                      onClick={() => navigate(`/track/${track.id}`)}
                      onMouseEnter={() => preloadTrack({
                        id: track.id,
                        title: track.title,
                        artist: track.artist,
                        preview_url: track.preview_url,
                      })}
                    >
                      {/* Number */}
                      <span className="font-mono font-black text-[13px] tabular-nums text-[#666] text-center">
                        {String(idx + 1).padStart(2, '0')}
                      </span>

                      {/* Play Button */}
                      <button
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                          currentTrack?.id === track.id && isPlaying
                            ? 'bg-[#00C853] border border-[#00C853] cdj-play-active'
                            : 'border-[1.5px] border-[#444] hover:border-[#FC4239] hover:bg-[#FC4239]/10'
                        }`}
                        onClick={e => {
                          e.stopPropagation();
                          if (track.price === 0) {
                            handleFreeDownload(track);
                          } else {
                            playTrack(track);
                          }
                        }}
                      >
                        {downloadingId === track.id ? (
                          <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : currentTrack?.id === track.id && isPlaying ? (
                          <Pause size={10} fill="white" className="text-white" />
                        ) : (
                          <Play size={10} fill="white" className="text-white ml-0.5" />
                        )}
                      </button>

                      {/* Track Info */}
                      <div className="min-w-0">
                        <p className="text-white font-bold text-[13px] sm:text-sm truncate group-hover:text-[#FC4239] transition-colors duration-200">{track.title}</p>
                        <div className="flex items-center gap-1.5 text-white/45 font-mono text-[10px] sm:text-[11px]">
                          <span>{track.genre}</span>
                          <span className="text-white/25">·</span>
                          <span>{track.bpm}</span>
                          <span className="text-white/25">·</span>
                          <span>{track.key}</span>
                        </div>
                      </div>

                      {/* Tags (Desktop) */}
                      <div className="hidden sm:flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-[#FC4239]/15 text-[#FC4239] text-[9px] font-mono uppercase rounded-md border border-[#FC4239]/30">Intro Clean</span>
                        <span className="px-1.5 py-0.5 border border-[#FF8800]/50 text-[#FF8800] text-[9px] font-mono uppercase rounded-md bg-[#FF8800]/10">Clean</span>
                      </div>

                      {/* Price */}
                      <div className="flex items-center">
                        {track.price === 0 ? (
                          <span className="px-2 py-0.5 bg-[#00C853]/15 text-[#00C853] text-[10px] font-semibold rounded-lg border border-[#00C853]/30">FREE</span>
                        ) : (
                          <button className="px-3 py-1 bg-white/5 border border-white/10 text-white text-[11px] font-semibold rounded-lg hover:bg-[#FC4239] hover:border-[#FC4239] transition-all duration-200 btn-press">
                            ${track.price.toFixed(2)}
                          </button>
                        )}
                      </div>

                      {/* Expand Arrow */}
                      <ChevronDown size={14} className="text-white/25 hidden sm:block group-hover:text-white/50 transition-colors duration-200" />
                    </div>
                  ))
                )}
              </div>

              {/* CDJ Transport Bar */}
              <div className="h-14 bg-[#0F0F0F] border-t border-[#1A1A1A] flex items-center justify-between px-4">
                <div className="flex items-center gap-4 text-white/55">
                  <button className="hover:text-white transition-colors duration-200 btn-press">⏮</button>
                  <button className="w-8 h-8 rounded-full bg-[#FC4239]/10 border border-[#FC4239]/30 flex items-center justify-center hover:bg-[#FC4239]/20 transition-all duration-200 btn-press">
                    <Play size={14} fill="#FC4239" className="text-[#FC4239] ml-0.5" />
                  </button>
                  <button className="hover:text-white transition-colors duration-200 btn-press">⏭</button>
                </div>
                <div className="flex-1 mx-4 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="w-1/3 h-full bg-gradient-to-r from-[#FC4239] to-[#FF8B7E] rounded-full transition-all duration-300" />
                </div>
                <div className="flex items-center gap-3 text-white/55">
                  <button className="hover:text-white transition-colors duration-200 btn-press">🔀</button>
                  <button className="hover:text-white transition-colors duration-200 btn-press">🔁</button>
                  <button className="hover:text-white transition-colors duration-200 btn-press">🔊</button>
                </div>
              </div>
            </div>
          </div>

          {filteredTracks.length >= 20 && (
            <div className="flex justify-center mt-8">
              <button
                className="px-6 py-2.5 border border-white/10 text-white text-[13px] font-semibold rounded-xl hover:bg-white/5 hover:border-white/20 transition-all duration-300 btn-press"
                onClick={() => navigate('/browse')}
              >
                View All Tracks
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Section Divider */}
      <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(252,66,57,0.35) 35%, rgba(252,66,57,0.55) 50%, rgba(252,66,57,0.35) 65%, transparent)', opacity: 0.18 }} />

      {/* Features */}
      <section id="arsenal" className="bg-[#0A0A0A] py-16 sm:py-20">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 animate-fade-in-up">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#FC4239] mb-3">Loadout</p>
            <h2 className="font-black text-white text-[34px] sm:text-[44px] lg:text-[52px] leading-[1.05] tracking-[-0.03em]">
              Built for the floor.<br />Tuned for the set.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {[
              { icon: Download, tag: 'PLAY', title: 'Unlimited firepower', desc: 'Download as many tracks as your sets demand. No caps, no credits, no nonsense. 320kbps MP3, every file.', color: '#00C853' },
              { icon: Zap, tag: 'CUE', title: 'AI-ranked intel', desc: 'Our AI ranks every track by what is actually crushing dancefloors right now. Skip the digging. Find the hits.', color: '#FF8800' },
              { icon: Tag, tag: 'HOT CUE', title: 'Mission-ready metadata', desc: 'BPM, key, energy, cue points, pre-tagged on every track. Drop into Serato, Rekordbox or Traktor. Zero prep.', color: '#00B0FF' }
            ].map((feature, i) => (
              <article
                key={i}
                className="card-glow glass rounded-2xl p-6 sm:p-8 hover-lift"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                {/* Top Accent Line */}
                <div className="absolute top-0 left-6 right-6 h-px" style={{ background: `linear-gradient(90deg, transparent 0%, ${feature.color} 50%, transparent 100%)` }} />

                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{ background: `${feature.color}1A`, color: feature.color, boxShadow: `inset 0 0 0 1px ${feature.color}33` }}
                  >
                    <feature.icon size={22} />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: feature.color }}>{feature.tag}</span>
                </div>

                <h3 className="font-extrabold text-white text-[22px] sm:text-[24px] leading-tight tracking-[-0.02em] uppercase mb-3">{feature.title}</h3>
                <p className="text-[15px] leading-relaxed text-white/70">{feature.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(252,66,57,0.35) 35%, rgba(252,66,57,0.55) 50%, rgba(252,66,57,0.35) 65%, transparent)', opacity: 0.18 }} />

      {/* Pricing Comparison */}
      <section className="bg-[#0A0A0A] py-16 sm:py-20">
        <div className="max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in-up">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#FC4239] mb-3">Pricing</p>
            <h2 className="font-black text-white text-[28px] sm:text-[36px] lg:text-[44px] leading-[1.05] tracking-[-0.03em]">
              Compare Plans
            </h2>
            <p className="text-white/65 text-[15px] mt-3">See why 37,000+ DJs chose DJ Marketplace</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PRICING_PLANS.map((plan, i) => (
              <div
                key={i}
                className={`rounded-2xl p-6 sm:p-8 relative ${
                  plan.highlight
                    ? 'bg-gradient-to-b from-[#FC4239]/10 to-transparent border-2 border-[#FC4239]/50'
                    : 'glass'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#FC4239] text-white text-[10px] font-mono uppercase tracking-[0.15em] rounded-full">
                    {plan.badge}
                  </div>
                )}
                <h3 className="font-extrabold text-white text-[18px] uppercase mb-2">{plan.name}</h3>
                <div className="font-black text-[32px] sm:text-[36px] text-white mb-6">{plan.price}</div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2.5">
                      <Check size={16} className={plan.highlight ? 'text-[#00C853] mt-0.5' : 'text-white/40 mt-0.5'} />
                      <span className="text-white/75 text-[14px]">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-3 rounded-xl font-bold text-[14px] transition-all duration-300 btn-press ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-[#FC4239] to-[#e03a32] text-white shadow-[0_4px_20px_rgba(252,66,57,0.3)] hover:shadow-[0_8px_30px_rgba(252,66,57,0.4)]'
                      : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                  }`}
                  onClick={() => navigate('/auth')}
                >
                  {plan.highlight ? 'Start Free Trial' : 'Learn More'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(252,66,57,0.35) 35%, rgba(252,66,57,0.55) 50%, rgba(252,66,57,0.35) 65%, transparent)', opacity: 0.18 }} />

      {/* Genre Section */}
      <section className="bg-[#0A0A0A] py-16 sm:py-20 relative">
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 0), linear-gradient(180deg, rgba(255,255,255,0.04) 1px, transparent 0)', backgroundSize: '64px 64px' }} />

        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-12 animate-fade-in-up">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#FC4239] mb-3">Latest drops</p>
            <h2 className="font-black text-white text-[34px] sm:text-[44px] lg:text-[52px] leading-[1.05] tracking-[-0.03em]">
              Sorted by genre.
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { name: 'House', color: '#00C853', count: '2,500+', emoji: '🎧' },
              { name: 'Techno', color: '#00B0FF', count: '1,800+', emoji: '🔧' },
              { name: 'Drum & Bass', color: '#A855F7', count: '1,200+', emoji: '🥁' },
              { name: 'Hip Hop', color: '#FF8800', count: '3,000+', emoji: '🎤' },
              { name: 'Latin', color: '#EC4899', count: '2,000+', emoji: '💃' },
              { name: 'EDM', color: '#14B8A6', count: '1,500+', emoji: '⚡' },
              { name: 'K-Pop', color: '#FFB800', count: '800+', emoji: '🇰🇷' },
              { name: 'Pop', color: '#F97316', count: '1,200+', emoji: '🎵' }
            ].map((genre, i) => (
              <button
                key={i}
                className="genre-card glass rounded-2xl p-4 text-left group"
                style={{ animationDelay: `${i * 50}ms` }}
                onClick={() => { setSelectedGenre(genre.name); navigate('/browse'); }}
              >
                <div
                  className="w-12 h-12 rounded-xl mb-3 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                  style={{ background: `${genre.color}1A`, color: genre.color }}
                >
                  <span className="text-[22px]">{genre.emoji}</span>
                </div>
                <h3 className="font-extrabold text-white text-[12px] sm:text-[13px] uppercase tracking-[0.05em]">{genre.name}</h3>
                <p className="font-mono text-[10px] text-white/45 mt-1">{genre.count} tracks</p>
                <div className="mt-3 h-1 w-full rounded-full overflow-hidden bg-white/5">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.random() * 40 + 60}%`, background: genre.color }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(252,66,57,0.35) 35%, rgba(252,66,57,0.55) 50%, rgba(252,66,57,0.35) 65%, transparent)', opacity: 0.18 }} />

      {/* Compatible With */}
      <section className="bg-[#0A0A0A] py-10 border-b border-white/[0.06]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center font-mono text-[11px] uppercase tracking-[0.18em] text-white/45 mb-6">Compatible with</p>
          <div className="flex flex-wrap justify-center gap-8 lg:gap-12">
            {['Serato DJ', 'Rekordbox', 'Traktor Pro', 'Virtual DJ', 'djay Pro', 'Engine DJ'].map((sw, i) => (
              <span key={i} className="text-[14px] sm:text-[16px] font-extrabold uppercase tracking-[0.05em] text-[#888] opacity-50 hover:text-white hover:opacity-100 transition-all duration-300 cursor-default">{sw}</span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-[#0A0A0A] py-16 sm:py-20 relative">
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 0), linear-gradient(180deg, rgba(255,255,255,0.04) 1px, transparent 0)', backgroundSize: '64px 64px' }} />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-12 animate-fade-in-up">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#FC4239] mb-3">FAQ</p>
            <h2 className="font-black text-white text-[28px] sm:text-[36px] lg:text-[44px] leading-[1.05] tracking-[-0.03em]">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {[
              { q: 'What is DJ Marketplace?', a: 'A premium DJ music platform built for working open format DJs. 100,000+ exclusive edits, remixes and original bangers in 320kbps MP3, AI-ranked for popularity, energy and key, ready to drop into Serato, Rekordbox or Traktor.' },
              { q: 'What music does DJ Marketplace cover?', a: 'Everything a working open-format DJ needs — House, Tech House, Techno, Drum & Bass, Hip Hop, Latin, K-Pop, Pop, and more. 48+ genres and subgenres, updated daily.' },
              { q: 'Is the music high quality?', a: 'Absolutely. Every track is a 320kbps HQ MP3, tagged with accurate tempo, key, cue points, and version type. Clean, dirty, instrumental, and acapella versions — plus exclusive DJ edits and remixes verified daily.' },
              { q: 'Will it work with Serato, Rekordbox and Traktor?', a: 'Yes. Every track is pre-tagged with BPM, key, and cue points. Just drag and drop into your preferred DJ software.' },
              { q: 'Are downloads unlimited?', a: 'Yes. Download as many tracks as your sets demand. No caps, no credits, no nonsense.' },
              { q: 'What if I don\'t like it?', a: 'Refund within 30 days, no questions asked. Email support@djmarketplace.fun and our team replies within one business day.' }
            ].map((faq, i) => (
              <div key={i} className="glass rounded-2xl overflow-hidden card-glow">
                <button
                  className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-5 text-left hover:bg-white/[0.03] transition-colors duration-200"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-bold text-base sm:text-lg text-white">{faq.q}</span>
                  <div className={`grid place-items-center w-8 h-8 rounded-full bg-[#FC4239]/15 text-[#FC4239] flex-shrink-0 transition-all duration-300 ${openFaq === i ? 'rotate-180 bg-[#FC4239]/25' : ''}`}>
                    <ChevronDown size={16} />
                  </div>
                </button>
                <div className={`accordion-content overflow-hidden ${openFaq === i ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-5 sm:px-6 pb-5 text-white/75 leading-relaxed text-[15px]">{faq.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(252,66,57,0.35) 35%, rgba(252,66,57,0.55) 50%, rgba(252,66,57,0.35) 65%, transparent)', opacity: 0.18 }} />

      {/* CTA */}
      <section className="bg-[#0A0A0A] py-16 sm:py-20">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-black text-white text-[28px] sm:text-[36px] lg:text-[44px] leading-[1.05] tracking-[-0.03em] mb-4 animate-fade-in-up">
            Never Drop A Dead Track Again.
          </h2>
          <p className="text-white/65 text-[15px] mb-6 max-w-md mx-auto animate-fade-in-up delay-100" style={{ opacity: 0, animationFillMode: 'forwards' }}>
            37,000+ DJs already using DJ Marketplace. Your next banger is waiting.
          </p>

          {/* Download Counter */}
          <div className="flex items-center justify-center gap-2 mb-8 animate-fade-in-up delay-150" style={{ opacity: 0, animationFillMode: 'forwards' }}>
            <div className="w-2 h-2 rounded-full bg-[#00C853] animate-pulse" />
            <span className="text-white/60 text-[13px] font-mono">
              <span className="font-bold text-white">{downloadCount.toLocaleString()}</span> tracks downloaded today
            </span>
          </div>

          <button
            className="px-10 py-4 bg-gradient-to-r from-[#FC4239] to-[#e03a32] text-white text-[15px] font-bold rounded-xl hover:from-[#e03a32] hover:to-[#d03329] transition-all duration-300 shadow-[0_4px_20px_rgba(252,66,57,0.3)] hover:shadow-[0_8px_30px_rgba(252,66,57,0.4)] hover:-translate-y-0.5 btn-press animate-fade-in-up delay-200"
            style={{ opacity: 0, animationFillMode: 'forwards' }}
            onClick={() => navigate('/auth')}
          >
            Start Free - No Card Required
          </button>

          {/* 4-Step Process */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-16 max-w-4xl mx-auto">
            {[
              { step: '01', text: 'Create your account' },
              { step: '02', text: 'Browse the library' },
              { step: '03', text: 'Download tracks' },
              { step: '04', text: 'Drop them tonight' }
            ].map((item, i) => (
              <div key={i} className="glass rounded-2xl p-6 text-left hover-lift" style={{ animationDelay: `${i * 100}ms` }}>
                <span className="font-mono font-black text-[#FC4239] text-[44px] sm:text-[48px] leading-none">{item.step}</span>
                <p className="text-white/75 text-[14px] mt-2">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
