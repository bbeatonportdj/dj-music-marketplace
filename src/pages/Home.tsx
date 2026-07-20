import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Music, Zap, TrendingUp, Award, Clock, ChevronRight, Download, Loader2 } from 'lucide-react';
import { fetchTracks, fetchArtwork, prefetchArtwork } from '../lib/api';
import { directDownload } from '../lib/download';
import type { Track } from '../lib/api';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const GENRE_CRATES = [
  { name: 'Techno', icon: '🎛️', color: '#ff453a' },
  { name: 'House', icon: '🏠', color: '#ffcc00' },
  { name: 'Drum & Bass', icon: '🔊', color: '#32d74b' },
  { name: 'Trance', icon: '🌀', color: '#5e5ce6' },
  { name: 'Hardstyle', icon: '🔥', color: '#ff9f0a' },
  { name: 'Dubstep', icon: '💥', color: '#bf5af2' },
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

  const latestTracks = [...tracks]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 8);

  const popularTracks = [...tracks]
    .sort((a, b) => (b.plays || 0) - (a.plays || 0))
    .slice(0, 8);

  const displayTracks = activeTab === 'latest' ? latestTracks : popularTracks;

  const totalTracks = tracks.length;
  const genres = new Set(tracks.map(t => t.genre).filter(Boolean));
  const paidTracks = tracks.filter(t => t.price > 0).length;
  const freeTracks = tracks.filter(t => t.price === 0).length;

  const stats = [
    { label: 'Total Tracks', value: totalTracks.toLocaleString(), icon: <Music size={20} />, color: '#ff453a' },
    { label: 'Genres', value: genres.size.toString(), icon: <Zap size={20} />, color: '#ffcc00' },
    { label: 'Premium', value: paidTracks.toString(), icon: <Award size={20} />, color: '#32d74b' },
    { label: 'Free Downloads', value: freeTracks.toString(), icon: <TrendingUp size={20} />, color: '#5e5ce6' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-text">
        <div className="w-8 h-8 border-2 border-border-gray border-t-electric-red rounded-full animate-spin" />
        <p className="text-sm uppercase tracking-widest font-mono">Loading arsenal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-16 py-8">
        {/* Hero Section */}
        <section className="mb-16">
          <div className="mb-8">
            <h1 className="font-display text-[72px] leading-[1.1] tracking-[-0.04em] font-extrabold uppercase text-on-surface mb-4">
              <span className="text-electric-red">BEAT</span> VAULT
            </h1>
            <p className="font-mono text-xs font-bold tracking-widest uppercase text-muted-text">
              PREMIUM DJ EDITS & MUSIC
            </p>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map(stat => (
              <div key={stat.label} className="bg-surface-gray border border-border-gray p-5 flex items-center gap-4 hover:border-electric-red transition-all">
                <div style={{ color: stat.color }}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold text-on-surface">{stat.value}</p>
                  <p className="text-xs text-muted-text font-mono uppercase tracking-wider">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Genre Crates */}
        <section className="mb-16">
          <div className="flex justify-between items-end mb-8">
            <h2 className="font-display text-3xl font-bold uppercase text-on-surface">GENRE CRATES</h2>
            <button 
              className="flex items-center gap-1 text-electric-red font-mono text-xs font-bold uppercase tracking-wider hover:brightness-125 transition-all"
              onClick={() => navigate('/new-releases')}
            >
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {GENRE_CRATES.map(crate => {
              const count = tracks.filter(t => t.genre.toLowerCase() === crate.name.toLowerCase()).length;
              if (count === 0) return null;
              return (
                <div
                  key={crate.name}
                  className="bg-surface-gray border border-border-gray p-4 cursor-pointer hover:border-electric-red transition-all group"
                  onClick={() => navigate(`/new-releases?genre=${encodeURIComponent(crate.name)}`)}
                >
                  <span className="text-3xl mb-3 block">{crate.icon}</span>
                  <h3 className="font-bold text-on-surface group-hover:text-electric-red transition-colors">{crate.name}</h3>
                  <p className="text-sm text-muted-text font-mono">{count} tracks</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Tracks Table */}
        <section className="mb-16">
          <div className="flex justify-between items-end mb-8">
            <h2 className="font-display text-3xl font-bold uppercase text-on-surface">TRACKS</h2>
            <div className="flex gap-2">
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded font-mono text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'latest' 
                    ? 'bg-electric-red text-white' 
                    : 'bg-surface-gray text-muted-text hover:text-on-surface border border-border-gray'
                }`}
                onClick={() => setActiveTab('latest')}
              >
                <Clock size={14} /> Latest
              </button>
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded font-mono text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'popular' 
                    ? 'bg-electric-red text-white' 
                    : 'bg-surface-gray text-muted-text hover:text-on-surface border border-border-gray'
                }`}
                onClick={() => setActiveTab('popular')}
              >
                <TrendingUp size={14} /> Popular
              </button>
            </div>
          </div>

          {/* Table Header */}
          <div className="hidden lg:grid grid-cols-[2fr_1fr_80px_80px_100px_60px] gap-4 px-4 py-3 border-b border-border-gray">
            <span className="font-mono text-xs text-muted-text uppercase tracking-wider">Track</span>
            <span className="font-mono text-xs text-muted-text uppercase tracking-wider">Genre</span>
            <span className="font-mono text-xs text-muted-text uppercase tracking-wider">BPM</span>
            <span className="font-mono text-xs text-muted-text uppercase tracking-wider">Key</span>
            <span className="font-mono text-xs text-muted-text uppercase tracking-wider">Price</span>
            <span />
          </div>

          {/* Track Rows */}
          {displayTracks.map(track => (
            <div
              key={track.id}
              className={`grid grid-cols-[2fr_1fr_80px_80px_100px_60px] gap-4 items-center px-4 py-3 border-b border-border-gray hover:bg-surface-gray cursor-pointer transition-all ${
                currentTrack?.id === track.id ? 'bg-surface-gray border-l-2 border-l-electric-red' : ''
              }`}
              onClick={() => navigate(`/track/${track.id}`)}
              onMouseEnter={() => preloadTrack({
                id: track.id,
                title: track.title,
                artist: track.artist,
                preview_url: track.preview_url,
              })}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded bg-surface-container-high bg-cover bg-center flex-shrink-0 flex items-center justify-center"
                  style={{ backgroundImage: `url(${artworkMap[track.id] || track.artwork || ''})` }}
                >
                  {currentTrack?.id === track.id && isPlaying ? (
                    <div className="flex gap-0.5">
                      <span className="w-0.5 h-3 bg-electric-red animate-pulse" />
                      <span className="w-0.5 h-4 bg-electric-red animate-pulse" style={{ animationDelay: '0.15s' }} />
                      <span className="w-0.5 h-2 bg-electric-red animate-pulse" style={{ animationDelay: '0.3s' }} />
                    </div>
                  ) : (
                    <Play size={14} className="text-muted-text opacity-0 group-hover:opacity-100" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-on-surface truncate">{track.title}</p>
                  <p className="text-sm text-muted-text truncate">{track.artist}</p>
                </div>
              </div>
              <span className="font-mono text-sm text-muted-text">{track.genre}</span>
              <span className="font-mono text-sm text-on-surface">{track.bpm}</span>
              <span className="font-mono text-sm text-on-surface">{track.key}</span>
              <span className={`font-mono text-sm font-bold ${track.price === 0 ? 'text-success-green' : 'text-on-surface'}`}>
                {track.price === 0 ? 'FREE' : `$${track.price.toFixed(2)}`}
              </span>
              <button
                className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-muted-text hover:bg-electric-red hover:text-white transition-all"
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
                  downloadingId === track.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />
                ) : (
                  currentTrack?.id === track.id && isPlaying ? <Pause size={16} /> : <Play size={16} />
                )}
              </button>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

export default Home;
