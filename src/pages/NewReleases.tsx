import { useState, useEffect, useMemo } from 'react';
import {
  Play, Pause, Search, SlidersHorizontal, X,
  Music, Loader2, ChevronDown, ChevronRight, AlertTriangle, RotateCcw,
  Download
} from 'lucide-react';
import { fetchTracks } from '../lib/api';
import { directDownload } from '../lib/download';
import type { Track } from '../lib/api';
import { useAudio } from '../context/AudioContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

const BPM_RANGES = [
  { label: 'All BPM', min: 0, max: 999 },
  { label: '< 90 BPM', min: 0, max: 89 },
  { label: '90 - 110 BPM', min: 90, max: 110 },
  { label: '110 - 130 BPM', min: 111, max: 130 },
  { label: '> 130 BPM', min: 131, max: 999 }
];

const GENRES = [
  'Afro House', 'Baile Funk/Favela Bass', 'Bass House', 'Big Room', 'Bounce',
  'Drum & Bass', 'EDM', 'Hard Dance', 'Hip Hop', 'House', 'K-Pop', 'Latin',
  'Other', 'Psy Trance', 'Tech House', 'Techno', 'TikTok Dance', 'Top 40',
];

const CAMELOT_KEYS = [
  '1A', '2A', '3A', '4A', '5A', '6A', '7A', '8A', '9A', '10A', '11A', '12A',
  '1B', '2B', '3B', '4B', '5B', '6B', '7B', '8B', '9B', '10B', '11B', '12B'
];

const NewReleases = () => {
  const navigate = useNavigate();
  const { currentTrack, isPlaying, playTrack, preloadTrack } = useAudio();
  const { addToCart, isInCart } = useCart();
  const { user } = useAuth();
  const { showNotification } = useNotifications();

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All Genres');
  const [selectedBpm, setSelectedBpm] = useState('All BPM');
  const [selectedVersion, setSelectedVersion] = useState('All Versions');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'bpm' | 'title' | 'rank'>('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null);

  const loadTracks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTracks();
      setTracks(data);
    } catch {
      setError('Failed to load tracks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTracks(); }, []);

  useEffect(() => {
    if (!showSortMenu) return;
    const handleClick = () => setShowSortMenu(false);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [showSortMenu]);

  const handlePlay = (track: Track) => {
    playTrack({
      id: track.id,
      title: track.title,
      artist: track.artist,
      preview_url: track.preview_url,
      artwork: track.artwork
    });
  };

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

  const filteredTracks = tracks.filter(track => {
    const matchesSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          track.artist.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === 'All Genres' || track.genre === selectedGenre;
    const bpmRange = BPM_RANGES.find(r => r.label === selectedBpm);
    const matchesBpm = bpmRange ? (track.bpm >= bpmRange.min && track.bpm <= bpmRange.max) : true;
    const matchesVersion = selectedVersion === 'All Versions' ||
                           track.versionType.toLowerCase() === selectedVersion.toLowerCase() ||
                           track.version.toLowerCase().includes(selectedVersion.toLowerCase());
    const matchesKey = selectedKeys.length === 0 || selectedKeys.includes(track.key);
    return matchesSearch && matchesGenre && matchesBpm && matchesVersion && matchesKey;
  });

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedGenre !== 'All Genres') count++;
    if (selectedBpm !== 'All BPM') count++;
    if (selectedVersion !== 'All Versions') count++;
    if (selectedKeys.length > 0) count++;
    if (searchQuery) count++;
    return count;
  }, [selectedGenre, selectedBpm, selectedVersion, selectedKeys, searchQuery]);

  const groupedTracks = useMemo(() => {
    const groups: Record<string, Track[]> = {};
    filteredTracks.forEach(track => {
      if (!groups[track.genre]) groups[track.genre] = [];
      groups[track.genre].push(track);
    });
    const sorted = Object.keys(groups).sort().reduce((acc, genre) => {
      acc[genre] = groups[genre];
      return acc;
    }, {} as Record<string, Track[]>);

    Object.keys(sorted).forEach(genre => {
      sorted[genre].sort((a, b) => {
        switch (sortBy) {
          case 'bpm': return a.bpm - b.bpm;
          case 'title': return a.title.localeCompare(b.title);
          case 'rank': return (a.rank ?? 99) - (b.rank ?? 99);
          default: return 0;
        }
      });
    });
    return sorted;
  }, [filteredTracks, sortBy]);

  return (
    <div className="flex min-h-[80vh] bg-[#0A0A0A]">
      {/* Main Content */}
      <main className="flex-1 p-4 lg:px-16">
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden flex items-center gap-2 px-3 py-2 bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg text-white/60"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <SlidersHorizontal size={18} />
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 bg-[#FC4239] text-white text-xs font-bold rounded-full flex items-center justify-center">{activeFilterCount}</span>
              )}
            </button>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#FC4239] mb-1">Latest</p>
              <h1 className="font-black text-white text-[24px] lg:text-[32px] tracking-[-0.03em]">NEW RELEASES</h1>
            </div>
          </div>
          <div className="relative">
            <button
              className="flex items-center gap-2 px-3 py-2 bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg text-white/60"
              onClick={() => setShowSortMenu(!showSortMenu)}
            >
              <span className="text-sm">Sort: <strong className="text-white">{sortBy === 'newest' ? 'Newest' : sortBy === 'bpm' ? 'BPM' : sortBy === 'title' ? 'Title' : 'Rank'}</strong></span>
              <ChevronDown size={14} />
            </button>
            {showSortMenu && (
              <div className="absolute right-0 top-full mt-2 w-32 bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg shadow-xl overflow-hidden z-50">
                {(['newest', 'bpm', 'title', 'rank'] as const).map(opt => (
                  <button
                    key={opt}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${sortBy === opt ? 'bg-[#FC4239] text-white' : 'text-white/60 hover:text-white hover:bg-[#2A2A2A]'}`}
                    onClick={(e) => { e.stopPropagation(); setSortBy(opt); setShowSortMenu(false); }}
                  >
                    {opt === 'newest' ? 'Newest' : opt === 'bpm' ? 'BPM' : opt === 'title' ? 'Title' : 'Rank'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-white/45">
            <Loader2 size={40} className="animate-spin text-[#FC4239]" />
            <p className="font-mono text-sm uppercase tracking-wider">Loading tracks...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-white/45">
            <AlertTriangle size={40} className="text-[#FC4239] opacity-40" />
            <p>{error}</p>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-[#FC4239] text-white rounded-lg text-sm font-bold"
              onClick={loadTracks}
            >
              <RotateCcw size={14} /> Retry
            </button>
          </div>
        ) : Object.keys(groupedTracks).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-white/45">
            <Music size={48} className="opacity-20" />
            <p>No tracks matching your filters.</p>
          </div>
        ) : (
          Object.entries(groupedTracks).map(([genre, genreTracks]) => (
            <div key={genre} className="mb-8">
              <h2 className="font-black text-white text-[18px] mb-4 uppercase tracking-[0.05em]">
                {genre} <span className="text-white/40 font-mono text-sm ml-2">{genreTracks.length}</span>
              </h2>
              <div className="space-y-1">
                {genreTracks.map((track, idx) => {
                  const isCurrentPlaying = currentTrack?.id === track.id && isPlaying;
                  const is_free = track.price === 0;
                  const isExpanded = expandedTrack === track.id;
                  const num = String(idx + 1).padStart(2, '0');

                  return (
                    <div
                      key={track.id}
                      className={`track-row flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${
                        isCurrentPlaying ? 'bg-[#FC4239]/5 border-l-2 border-[#FC4239]' : 'hover:bg-[#1C1C1C]'
                      }`}
                      onMouseEnter={() => preloadTrack({
                        id: track.id,
                        title: track.title,
                        artist: track.artist,
                        preview_url: track.preview_url,
                      })}
                    >
                      <span className="font-mono font-black text-xs text-[#666] w-6">{num}</span>
                      <button
                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ${
                          isCurrentPlaying
                            ? 'bg-[#00C853] text-white'
                            : 'bg-[#1C1C1C] border border-[#2A2A2A] text-white/60 hover:border-[#FC4239] hover:text-[#FC4239]'
                        }`}
                        onClick={() => handlePlay(track)}
                      >
                        {isCurrentPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                      </button>
                      <div className="flex-1 min-w-0 cursor-pointer group" onClick={() => handlePlay(track)}>
                        <div className="font-bold text-white truncate group-hover:text-[#FC4239] transition-colors">
                          <span className="text-white/60">{track.artist}</span> - <span>{track.title}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/45 font-mono">
                          <span>{track.genre}</span>
                          {track.bpm > 0 && <><span className="text-white/25">·</span><span>{track.bpm} bpm</span></>}
                          {track.key && <><span className="text-white/25">·</span><span>{track.key}</span></>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {track.version && (
                          <span className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                            track.versionType === 'original' ? 'bg-[#FC4239]/15 text-[#FC4239] border border-[#FC4239]/30' :
                            track.versionType === 'extended' ? 'bg-[#00C853]/15 text-[#00C853] border border-[#00C853]/30' :
                            'bg-white/5 text-white/60 border border-white/10'
                          }`}>
                            {track.version}
                          </span>
                        )}
                        {is_free ? (
                          <button
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#00C853] text-white hover:shadow-[0_4px_15px_rgba(0,200,83,0.3)] transition-all"
                            onClick={() => handleFreeDownload(track)}
                            disabled={downloadingId === track.id}
                          >
                            {downloadingId === track.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                          </button>
                        ) : (
                          <button
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                              isInCart(track.id)
                                ? 'bg-[#00C853] text-white'
                                : 'bg-[#1C1C1C] border border-[#2A2A2A] text-white hover:border-[#FC4239] hover:bg-[#FC4239]/10'
                            }`}
                            onClick={() => addToCart({ id: track.id, title: track.title, price: track.price ?? 0, artwork: track.artwork, artist: track.artist })}
                          >
                            {isInCart(track.id) ? '✓' : `$${track.price}`}
                          </button>
                        )}
                        <button
                          className="p-1 text-white/40 hover:text-white transition-colors"
                          onClick={() => setExpandedTrack(isExpanded ? null : track.id)}
                        >
                          <ChevronRight size={16} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </main>

      {/* Sidebar */}
      <aside className={`w-[280px] bg-[#0F0F0F] border-l border-[#1A1A1A] p-4 hidden lg:block ${showSidebar ? '' : 'hidden'}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black text-white text-[14px] uppercase tracking-[0.1em]">FILTERS</h3>
          <button
            className="p-1 text-white/40 hover:text-white transition-colors"
            onClick={() => setShowSidebar(false)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search tracks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#FC4239]/50 transition-colors"
            />
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-xs font-mono text-white/45 uppercase tracking-wider mb-3">Genre</h4>
          <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-hide">
            <button
              className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${selectedGenre === 'All Genres' ? 'bg-[#FC4239] text-white' : 'text-white/60 hover:text-white hover:bg-[#1C1C1C]'}`}
              onClick={() => setSelectedGenre('All Genres')}
            >
              All Genres
            </button>
            {GENRES.map(genre => (
              <button
                key={genre}
                className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${selectedGenre === genre ? 'bg-[#FC4239] text-white' : 'text-white/60 hover:text-white hover:bg-[#1C1C1C]'}`}
                onClick={() => setSelectedGenre(genre)}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-xs font-mono text-white/45 uppercase tracking-wider mb-3">BPM Range</h4>
          <div className="space-y-1">
            {BPM_RANGES.map(range => (
              <button
                key={range.label}
                className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${selectedBpm === range.label ? 'bg-[#FC4239] text-white' : 'text-white/60 hover:text-white hover:bg-[#1C1C1C]'}`}
                onClick={() => setSelectedBpm(range.label)}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-xs font-mono text-white/45 uppercase tracking-wider mb-3">Version Type</h4>
          <div className="flex flex-wrap gap-1">
            {['All Versions', 'clean', 'dirty', 'intro', 'acapella', 'instrumental', 'extended', 'radio', 'club', 'deep'].map(v => (
              <button
                key={v}
                className={`px-2 py-1 text-xs font-mono rounded transition-colors ${selectedVersion === v ? 'bg-[#FC4239] text-white' : 'bg-[#1C1C1C] text-white/60 hover:text-white'}`}
                onClick={() => setSelectedVersion(v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-xs font-mono text-white/45 uppercase tracking-wider mb-3">Camelot Key</h4>
          <div className="grid grid-cols-6 gap-1">
            {CAMELOT_KEYS.map(key => (
              <button
                key={key}
                className={`px-1 py-1 text-xs font-mono rounded transition-colors ${selectedKeys.includes(key) ? 'bg-[#FC4239] text-white' : 'bg-[#1C1C1C] text-white/60 hover:text-white'}`}
                onClick={() => {
                  setSelectedKeys(prev =>
                    prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
                  );
                }}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        {(selectedGenre !== 'All Genres' || selectedBpm !== 'All BPM' || selectedVersion !== 'All Versions' || selectedKeys.length > 0 || searchQuery) && (
          <button
            className="w-full py-2 text-sm text-[#FC4239] hover:underline"
            onClick={() => {
              setSelectedGenre('All Genres');
              setSelectedBpm('All BPM');
              setSelectedVersion('All Versions');
              setSelectedKeys([]);
              setSearchQuery('');
            }}
          >
            Clear All Filters
          </button>
        )}
      </aside>
    </div>
  );
};

export default NewReleases;
