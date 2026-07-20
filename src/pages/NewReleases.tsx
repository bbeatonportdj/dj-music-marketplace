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
    <div className="flex min-h-[80vh]">
      {/* Main Content */}
      <main className="flex-1 p-4 lg:px-16">
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden flex items-center gap-2 px-3 py-2 bg-surface-gray border border-border-gray rounded-lg text-muted-text"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <SlidersHorizontal size={18} />
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 bg-electric-red text-white text-xs font-bold rounded-full flex items-center justify-center">{activeFilterCount}</span>
              )}
            </button>
            <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-on-surface">LATEST RELEASES</h1>
          </div>
          <div className="relative">
            <button 
              className="flex items-center gap-2 px-3 py-2 bg-surface-gray border border-border-gray rounded-lg text-muted-text"
              onClick={() => setShowSortMenu(!showSortMenu)}
            >
              <span className="text-sm">Sort: <strong className="text-on-surface">{sortBy === 'newest' ? 'Newest' : sortBy === 'bpm' ? 'BPM' : sortBy === 'title' ? 'Title' : 'Rank'}</strong></span>
              <ChevronDown size={14} />
            </button>
            {showSortMenu && (
              <div className="absolute right-0 top-full mt-2 w-32 bg-surface-container border border-border-gray rounded-lg shadow-xl overflow-hidden z-50">
                {(['newest', 'bpm', 'title', 'rank'] as const).map(opt => (
                  <button 
                    key={opt} 
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${sortBy === opt ? 'bg-electric-red text-white' : 'text-muted-text hover:text-on-surface hover:bg-surface-container-high'}`}
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
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-text">
            <Loader2 size={40} className="animate-spin text-electric-red" />
            <p className="font-mono text-sm uppercase tracking-wider">Loading tracks...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-text">
            <AlertTriangle size={40} className="text-electric-red opacity-40" />
            <p>{error}</p>
            <button 
              className="flex items-center gap-2 px-4 py-2 bg-electric-red text-white rounded-lg text-sm font-bold"
              onClick={loadTracks}
            >
              <RotateCcw size={14} /> Retry
            </button>
          </div>
        ) : Object.keys(groupedTracks).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-text">
            <Music size={48} className="opacity-20" />
            <p>No tracks matching your filters.</p>
          </div>
        ) : (
          Object.entries(groupedTracks).map(([genre, genreTracks]) => (
            <div key={genre} className="mb-8">
              <h2 className="font-display text-lg font-bold text-on-surface mb-4 uppercase tracking-wider">
                {genre} <span className="text-muted-text font-mono text-sm ml-2">{genreTracks.length}</span>
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
                      className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${isCurrentPlaying ? 'bg-surface-container' : 'hover:bg-surface-container-high'}`}
                      onMouseEnter={() => preloadTrack({
                        id: track.id,
                        title: track.title,
                        artist: track.artist,
                        preview_url: track.preview_url,
                      })}
                    >
                      <span className="font-mono text-xs text-border-gray w-6">{num}</span>
                      <button 
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-gray text-muted-text hover:text-electric-red transition-colors"
                        onClick={() => handlePlay(track)}
                      >
                        {isCurrentPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                      </button>
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handlePlay(track)}>
                        <div className="font-bold text-on-surface truncate">
                          <span className="text-muted-text">{track.artist}</span> - <span>{track.title}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-text">
                          <span>{track.genre}</span>
                          {track.bpm > 0 && <><span className="text-border-gray">·</span><span>{track.bpm} bpm</span></>}
                          {track.key && <><span className="text-border-gray">·</span><span>{track.key}</span></>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {track.version && (
                          <span className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                            track.versionType === 'original' ? 'bg-electric-red/20 text-electric-red' :
                            track.versionType === 'extended' ? 'bg-success-green/20 text-success-green' :
                            'bg-surface-bright/20 text-muted-text'
                          }`}>
                            {track.version}
                          </span>
                        )}
                        {is_free ? (
                          <button 
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-electric-red text-white red-glow"
                            onClick={() => handleFreeDownload(track)} 
                            disabled={downloadingId === track.id}
                          >
                            {downloadingId === track.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                          </button>
                        ) : (
                          <button 
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                              isInCart(track.id) 
                                ? 'bg-success-green text-white' 
                                : 'bg-surface-gray border border-border-gray text-on-surface hover:border-electric-red'
                            }`}
                            onClick={() => addToCart({ id: track.id, title: track.title, price: track.price ?? 0, artwork: track.artwork, artist: track.artist })}
                          >
                            {isInCart(track.id) ? '✓' : `$${track.price}`}
                          </button>
                        )}
                        <button 
                          className="p-1 text-muted-text hover:text-on-surface transition-colors"
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
      <aside className={`w-[280px] bg-surface-gray border-l border-border-gray p-4 hidden lg:block ${showSidebar ? '' : 'hidden'}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-display font-bold text-on-surface">FILTERS</h3>
          <button 
            className="p-1 text-muted-text hover:text-on-surface transition-colors"
            onClick={() => setShowSidebar(false)}
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="mb-6">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text" />
            <input 
              type="text" 
              placeholder="Search tracks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface-container border border-border-gray rounded-lg text-sm text-on-surface placeholder:text-border-gray focus:outline-none focus:border-electric-red transition-colors"
            />
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-xs font-mono text-muted-text uppercase tracking-wider mb-3">Genre</h4>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            <button 
              className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${selectedGenre === 'All Genres' ? 'bg-electric-red text-white' : 'text-muted-text hover:text-on-surface hover:bg-surface-container-high'}`}
              onClick={() => setSelectedGenre('All Genres')}
            >
              All Genres
            </button>
            {GENRES.map(genre => (
              <button 
                key={genre}
                className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${selectedGenre === genre ? 'bg-electric-red text-white' : 'text-muted-text hover:text-on-surface hover:bg-surface-container-high'}`}
                onClick={() => setSelectedGenre(genre)}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-xs font-mono text-muted-text uppercase tracking-wider mb-3">BPM Range</h4>
          <div className="space-y-1">
            {BPM_RANGES.map(range => (
              <button
                key={range.label}
                className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${selectedBpm === range.label ? 'bg-electric-red text-white' : 'text-muted-text hover:text-on-surface hover:bg-surface-container-high'}`}
                onClick={() => setSelectedBpm(range.label)}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-xs font-mono text-muted-text uppercase tracking-wider mb-3">Version Type</h4>
          <div className="flex flex-wrap gap-1">
            {['All Versions', 'clean', 'dirty', 'intro', 'acapella', 'instrumental', 'extended', 'radio', 'club', 'deep'].map(v => (
              <button
                key={v}
                className={`px-2 py-1 text-xs font-mono rounded transition-colors ${selectedVersion === v ? 'bg-electric-red text-white' : 'bg-surface-container text-muted-text hover:text-on-surface'}`}
                onClick={() => setSelectedVersion(v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-xs font-mono text-muted-text uppercase tracking-wider mb-3">Camelot Key</h4>
          <div className="grid grid-cols-6 gap-1">
            {CAMELOT_KEYS.map(key => (
              <button
                key={key}
                className={`px-1 py-1 text-xs font-mono rounded transition-colors ${selectedKeys.includes(key) ? 'bg-electric-red text-white' : 'bg-surface-container text-muted-text hover:text-on-surface'}`}
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
            className="w-full py-2 text-sm text-electric-red hover:underline"
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
