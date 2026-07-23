import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Music, Download, Loader2, Search, Filter, ChevronDown, Clock, TrendingUp } from 'lucide-react';
import { fetchTracks, fetchArtwork, prefetchArtwork } from '../lib/api';
import { directDownload } from '../lib/download';
import type { Track } from '../lib/api';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import SEO from '../components/SEO';

const GENRES = [
  { name: 'All', icon: '🎵' },
  { name: 'Techno', icon: '🎛️' },
  { name: 'House', icon: '🏠' },
  { name: 'Trance', icon: '🌀' },
  { name: 'Drum & Bass', icon: '🔊' },
  { name: 'Hip Hop', icon: '🎤' },
  { name: 'Latin', icon: '💃' },
  { name: 'K-pop', icon: '🇰🇷' },
  { name: 'Pop', icon: '🎤' },
  { name: 'Baile Funk', icon: '🇧🇷' },
  { name: 'Psy Trance', icon: '🌀' },
  { name: 'Big Room', icon: '🏟️' },
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
  const [artworkMap, setArtworkMap] = useState<Record<string, string>>({});
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
      data.slice(0, 16).forEach(async track => {
        const url = await fetchArtwork(track.id);
        if (url) setArtworkMap(prev => ({ ...prev, [track.id]: url }));
      });
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
    .slice(0, 20);

  const popularTracks = [...filteredTracks]
    .sort((a, b) => (b.plays || 0) - (a.plays || 0))
    .slice(0, 20);

  const displayTracks = activeTab === 'latest' ? latestTracks : popularTracks;

  const totalTracks = tracks.length;
  const genres = new Set(tracks.map(t => t.genre).filter(Boolean));
  const freeTracks = tracks.filter(t => t.price === 0).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-border-gray border-t-electric-red rounded-full animate-spin" />
        </div>
        <p className="text-xs text-muted-text font-mono uppercase tracking-widest">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <SEO
        title="Premium DJ Edit Packs & Music"
        description="High-quality DJ edits, remixes & original productions. Download in 320kbps MP3 / WAV."
        image="https://djmusicmarketplace.fun/og-image.png"
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-[#0a0a0a] to-[#111] py-16 border-b border-border-gray">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-16">
          <div className="max-w-3xl mb-12">
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-4 tracking-tight leading-tight">
              <span className="text-electric-red">BEAT</span> VAULT
            </h1>
            <p className="text-muted-text text-lg max-w-xl leading-relaxed">
              {totalTracks.toLocaleString()}+ high-quality DJ edits, remixes & original productions. 
              Download in 320kbps MP3 / WAV — ready for your next set.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-8 text-sm">
            <div className="flex items-center gap-2">
              <Music size={16} className="text-electric-red" />
              <span className="text-white font-mono font-bold">{totalTracks.toLocaleString()}</span>
              <span className="text-muted-text">Tracks</span>
            </div>
            <div className="flex items-center gap-2">
              <Download size={16} className="text-success-green" />
              <span className="text-white font-mono font-bold">{freeTracks}</span>
              <span className="text-muted-text">Free</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-electric-red" />
              <span className="text-white font-mono font-bold">{genres.size}</span>
              <span className="text-muted-text">Genres</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-16 py-8">
        {/* Search & Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text" />
            <input
              type="text"
              placeholder="Search tracks, artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-low border border-border-gray rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder-muted-text focus:outline-none focus:border-electric-red/50 transition-colors"
            />
          </div>

          {/* Genre Filter */}
          <div className="relative">
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="appearance-none bg-surface-container-low border border-border-gray rounded-lg px-4 py-3 pr-10 text-sm text-white focus:outline-none focus:border-electric-red/50 transition-colors cursor-pointer"
            >
              {GENRES.map(genre => (
                <option key={genre.name} value={genre.name}>
                  {genre.icon} {genre.name}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text pointer-events-none" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'latest'
                ? 'bg-electric-red text-white'
                : 'bg-surface-container-low text-muted-text hover:text-white border border-border-gray'
            }`}
            onClick={() => setActiveTab('latest')}
          >
            <Clock size={12} /> Latest
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'popular'
                ? 'bg-electric-red text-white'
                : 'bg-surface-container-low text-muted-text hover:text-white border border-border-gray'
            }`}
            onClick={() => setActiveTab('popular')}
          >
            <TrendingUp size={12} /> Popular
          </button>
        </div>

        {/* Track List */}
        <div className="bg-surface-container-low rounded-xl overflow-hidden border border-border-gray">
          {/* Table Header */}
          <div className="hidden lg:grid grid-cols-[2fr_1fr_80px_80px_100px_60px] gap-4 px-5 py-3 bg-surface-container-lowest border-b border-border-gray">
            <span className="font-mono text-[10px] text-muted-text uppercase tracking-widest">Track</span>
            <span className="font-mono text-[10px] text-muted-text uppercase tracking-widest">Genre</span>
            <span className="font-mono text-[10px] text-muted-text uppercase tracking-widest">BPM</span>
            <span className="font-mono text-[10px] text-muted-text uppercase tracking-widest">Key</span>
            <span className="font-mono text-[10px] text-muted-text uppercase tracking-widest">Price</span>
            <span />
          </div>

          {/* Track Rows */}
          {displayTracks.map((track, idx) => (
            <div
              key={track.id}
              className={`grid grid-cols-[2fr_1fr_80px_80px_100px_60px] gap-4 items-center px-5 py-3.5 border-b border-border-gray/50 last:border-b-0 cursor-pointer transition-all group hover:bg-surface-container-high/50 ${
                currentTrack?.id === track.id ? 'bg-electric-red/5 border-l-2 border-l-electric-red' : ''
              }`}
              onClick={() => navigate(`/track/${track.id}`)}
              onMouseEnter={() => preloadTrack({
                id: track.id,
                title: track.title,
                artist: track.artist,
                preview_url: track.preview_url,
              })}
            >
              {/* Track Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-11 h-11 rounded-lg bg-surface-container-high bg-cover bg-center flex-shrink-0 flex items-center justify-center overflow-hidden"
                  style={{ backgroundImage: `url(${artworkMap[track.id] || track.artwork || ''})` }}
                >
                  {currentTrack?.id === track.id && isPlaying ? (
                    <div className="play-bars">
                      <span /><span /><span />
                    </div>
                  ) : (
                    <Play size={12} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-white truncate">{track.title}</p>
                  <p className="text-xs text-muted-text truncate">{track.artist}</p>
                </div>
              </div>

              {/* Genre */}
              <span className="hidden lg:block">
                <span className="pill-badge pill-badge-gray text-[10px]">{track.genre}</span>
              </span>

              {/* BPM */}
              <span className="font-mono text-sm text-white hidden lg:block">{track.bpm}</span>

              {/* Key */}
              <span className="font-mono text-sm text-muted-text hidden lg:block">{track.key}</span>

              {/* Price */}
              <span className={`font-mono text-sm font-bold ${track.price === 0 ? 'text-success-green' : 'text-white'}`}>
                {track.price === 0 ? (
                  <span className="pill-badge pill-badge-green">FREE</span>
                ) : `$${track.price.toFixed(2)}`}
              </span>

              {/* Action Button */}
              <button
                className="w-9 h-9 rounded-full bg-surface-container-high border border-border-gray flex items-center justify-center text-muted-text hover:bg-electric-red hover:text-white hover:border-electric-red transition-all group-hover:opacity-100 opacity-60"
                onClick={e => {
                  e.stopPropagation();
                  if (track.price === 0) {
                    handleFreeDownload(track);
                  } else {
                    playTrack(track);
                  }
                }}
              >
                {track.price === 0 ? (
                  downloadingId === track.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />
                ) : (
                  currentTrack?.id === track.id && isPlaying ? <Pause size={14} /> : <Play size={14} />
                )}
              </button>
            </div>
          ))}
        </div>

        {/* View All */}
        {displayTracks.length >= 20 && (
          <div className="flex justify-center mt-8">
            <button
              className="bg-electric-red text-white px-6 py-3 rounded-lg font-mono text-xs font-bold uppercase tracking-wider hover:bg-electric-red/90 transition-colors"
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
