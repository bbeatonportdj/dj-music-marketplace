import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Search } from 'lucide-react';
import { fetchTracks, prefetchArtwork } from '../lib/api';
import { directDownload } from '../lib/download';
import type { Track } from '../lib/api';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import SEO from '../components/SEO';

const GENRES = [
  { name: 'All', label: 'All Genres' },
  { name: 'House', label: 'House' },
  { name: 'Tech House', label: 'Tech House' },
  { name: 'Techno', label: 'Techno' },
  { name: 'Drum & Bass', label: 'Drum & Bass' },
  { name: 'Hip Hop', label: 'Hip Hop' },
  { name: 'Latin', label: 'Latin' },
  { name: 'K-Pop', label: 'K-Pop' },
  { name: 'Pop', label: 'Pop' },
  { name: 'Baile Funk', label: 'Baile Funk' },
  { name: 'Psy Trance', label: 'Psy Trance' },
  { name: 'Big Room', label: 'Big Room' },
];

function Home() {
  const navigate = useNavigate();
  const { currentTrack, isPlaying, playTrack, preloadTrack } = useAudio();
  const { user } = useAuth();
  const { showNotification } = useNotifications();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'latest' | 'popular'>('latest');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredTracks = tracks.filter(track => {
    const matchesGenre = selectedGenre === 'All' || track.genre?.toLowerCase() === selectedGenre.toLowerCase();
    const matchesSearch = !searchQuery || 
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGenre && matchesSearch;
  });

  const latestTracks = [...filteredTracks]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 30);

  const popularTracks = [...filteredTracks]
    .sort((a, b) => (b.plays || 0) - (a.plays || 0))
    .slice(0, 30);

  const displayTracks = activeTab === 'latest' ? latestTracks : popularTracks;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-8 h-8 border-2 border-[#e5e5e5] border-t-[#111] rounded-full animate-spin" />
        <p className="text-[12px] text-[#999] font-mono uppercase tracking-widest">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Premium DJ Edit Packs & Music"
        description="High-quality DJ edits, remixes & original productions. Download in 320kbps MP3 / WAV."
        image="https://djmusicmarketplace.fun/og-image.png"
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-[#f5f5f5] to-white overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-6 py-16 lg:py-24 flex flex-col lg:flex-row items-center gap-8">
          {/* Text */}
          <div className="flex-1 z-10">
            <h1 className="text-4xl lg:text-5xl font-extrabold text-[#111] mb-4 tracking-tight leading-[1.1] uppercase">
              Elevate Your Set With Premium Edits & Music.
            </h1>
            <p className="text-[#666] text-base lg:text-lg max-w-md leading-relaxed mb-6">
              Explore the latest {selectedGenre === 'All' ? 'genres' : selectedGenre} crate.
            </p>
            <div className="flex gap-2">
              <button 
                className="px-5 py-2.5 bg-[#111] text-white text-[13px] font-semibold rounded-md hover:bg-[#333] transition-colors"
                onClick={() => navigate('/browse')}
              >
                Browse All
              </button>
              <button 
                className="px-5 py-2.5 border border-[#e5e5e5] text-[#111] text-[13px] font-semibold rounded-md hover:bg-[#f5f5f5] transition-colors"
                onClick={() => navigate('/new-releases')}
              >
                New Releases
              </button>
            </div>
          </div>
          
          {/* Turntable Image */}
          <div className="flex-1 flex justify-center lg:justify-end">
            <div className="relative w-[320px] h-[240px] lg:w-[420px] lg:h-[320px]">
              <img 
                src="https://images.unsplash.com/photo-1571327073757-71d13c24de30?w=800&q=80" 
                alt="DJ Turntable" 
                className="w-full h-full object-cover rounded-lg shadow-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-xl font-extrabold text-[#111] uppercase tracking-tight">Trending Tracks</h2>
          
          {/* Tabs */}
          <div className="flex gap-1 bg-[#f5f5f5] p-1 rounded-md">
            <button
              className={`px-4 py-1.5 rounded text-[12px] font-semibold uppercase tracking-wide transition-all ${
                activeTab === 'latest'
                  ? 'bg-white text-[#111] shadow-sm'
                  : 'text-[#666] hover:text-[#111]'
              }`}
              onClick={() => setActiveTab('latest')}
            >
              Latest
            </button>
            <button
              className={`px-4 py-1.5 rounded text-[12px] font-semibold uppercase tracking-wide transition-all ${
                activeTab === 'popular'
                  ? 'bg-white text-[#111] shadow-sm'
                  : 'text-[#666] hover:text-[#111]'
              }`}
              onClick={() => setActiveTab('popular')}
            >
              Popular
            </button>
          </div>
        </div>

        {/* Search + Genre Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
            <input
              type="text"
              placeholder="Search tracks, artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f5f5f5] border border-[#e5e5e5] rounded-md pl-9 pr-4 py-2 text-[13px] text-[#111] placeholder-[#999] focus:outline-none focus:border-[#ccc] transition-colors"
            />
          </div>

          {/* Genre Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {GENRES.map(genre => (
              <button
                key={genre.name}
                className={`px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all ${
                  selectedGenre === genre.name
                    ? 'bg-[#111] text-white'
                    : 'bg-[#f5f5f5] text-[#666] hover:bg-[#eee] hover:text-[#111]'
                }`}
                onClick={() => setSelectedGenre(genre.name)}
              >
                {genre.label}
              </button>
            ))}
          </div>
        </div>

        {/* Track Table */}
        <div className="bg-white rounded-lg overflow-hidden border border-[#e5e5e5]">
          {/* Table Header */}
          <div className="hidden lg:grid grid-cols-[2fr_1.5fr_80px_80px_100px] gap-4 px-4 py-3 border-b border-[#e5e5e5] bg-[#fafafa]">
            <span className="text-[11px] font-semibold text-[#999] uppercase tracking-wider">Track Title</span>
            <span className="text-[11px] font-semibold text-[#999] uppercase tracking-wider">Artist</span>
            <span className="text-[11px] font-semibold text-[#999] uppercase tracking-wider text-right">BPM</span>
            <span className="text-[11px] font-semibold text-[#999] uppercase tracking-wider text-right">Key</span>
            <span className="text-[11px] font-semibold text-[#999] uppercase tracking-wider text-right">Price</span>
          </div>

          {/* Track Rows */}
          {displayTracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Search size={32} className="text-[#ccc]" />
              <p className="text-[14px] text-[#666]">No tracks found</p>
              <button 
                className="text-[13px] text-[#111] font-semibold hover:underline"
                onClick={() => { setSearchQuery(''); setSelectedGenre('All'); }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            displayTracks.map((track) => (
              <div
                key={track.id}
                className={`grid grid-cols-[1fr] lg:grid-cols-[2fr_1.5fr_80px_80px_100px] gap-2 lg:gap-4 items-center px-4 py-3 border-b border-[#f0f0f0] last:border-b-0 cursor-pointer transition-all hover:bg-[#f8f8f8] ${
                  currentTrack?.id === track.id ? 'bg-[#f5f5f5]' : ''
                }`}
                onClick={() => navigate(`/track/${track.id}`)}
                onMouseEnter={() => preloadTrack({
                  id: track.id,
                  title: track.title,
                  artist: track.artist,
                  preview_url: track.preview_url,
                })}
              >
                {/* Track Info (Mobile) */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Play Button */}
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f5f5f5] text-[#111] hover:bg-[#111] hover:text-white transition-all flex-shrink-0"
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
                      <div className="w-3 h-3 border-2 border-[#111] border-t-transparent rounded-full animate-spin" />
                    ) : currentTrack?.id === track.id && isPlaying ? (
                      <Pause size={12} fill="currentColor" />
                    ) : (
                      <Play size={12} fill="currentColor" />
                    )}
                  </button>
                  
                  {/* Track Title */}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[13px] text-[#111] truncate">{track.title}</p>
                    <p className="text-[12px] text-[#666] truncate lg:hidden">{track.artist}</p>
                  </div>
                </div>

                {/* Artist (Desktop) */}
                <span className="hidden lg:block text-[13px] text-[#666] truncate">{track.artist}</span>

                {/* BPM (Desktop) */}
                <span className="hidden lg:block text-[13px] text-[#111] text-right font-mono">{track.bpm}</span>

                {/* Key (Desktop) */}
                <span className="hidden lg:block text-[13px] text-[#666] text-right font-mono">{track.key}</span>

                {/* Price */}
                <div className="flex justify-end">
                  {track.price === 0 ? (
                    <span className="px-2 py-0.5 bg-[#f0fdf4] text-[#16a34a] text-[11px] font-semibold rounded">FREE</span>
                  ) : (
                    <span className="text-[13px] font-semibold text-[#111]">${track.price.toFixed(2)}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* View All */}
        {displayTracks.length >= 20 && (
          <div className="flex justify-center mt-8">
            <button
              className="px-6 py-2.5 border border-[#e5e5e5] text-[#111] text-[13px] font-semibold rounded-md hover:bg-[#f5f5f5] transition-colors"
              onClick={() => navigate('/new-releases')}
            >
              View All Tracks
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
