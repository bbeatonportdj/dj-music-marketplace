import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Play, Pause, Check, Search, SlidersHorizontal, 
  ChevronDown, Heart, Download, Loader2, Flame, 
  TrendingUp, Zap
} from 'lucide-react';
import { fetchTracks } from '../lib/api';
import { directDownload } from '../lib/download';
import type { Track } from '../lib/api';
import { useAudio } from '../context/AudioContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

const GENRES = [
  'Afro House',
  'Baile Funk/Favela Bass',
  'Bass House',
  'Big Room',
  'Bounce',
  'Drum & Bass',
  'EDM',
  'Hard Dance',
  'Hip Hop',
  'House',
  'K-Pop',
  'Latin',
  'Other',
  'Psy Trance',
  'Tech House',
  'Techno',
  'TikTok Dance',
  'Top 40',
];

const CAMELOT_KEYS = [
  '1A', '2A', '3A', '4A', '5A', '6A', '7A', '8A', '9A', '10A', '11A', '12A',
  '1B', '2B', '3B', '4B', '5B', '6B', '7B', '8B', '9B', '10B', '11B', '12B'
];

const ENERGY_LEVELS = [
  { label: 'Low', value: 'low', min: 1, max: 2 },
  { label: 'Mid', value: 'mid', min: 3, max: 3 },
  { label: 'High', value: 'high', min: 4, max: 5 },
];

const VERSION_TYPES = ['clean', 'dirty', 'intro', 'acapella', 'instrumental', 'extended', 'radio', 'club', 'deep'];

const Singles = () => {
  const navigate = useNavigate();
  const { currentTrack, isPlaying, playTrack, preloadTrack } = useAudio();
  const { addToCart, isInCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { user } = useAuth();
  const { showNotification } = useNotifications();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All Genres');
  const [bpmMin, setBpmMin] = useState(0);
  const [bpmMax, setBpmMax] = useState(200);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [selectedEnergy, setSelectedEnergy] = useState<string | null>(null);
  const [selectedVersionType, setSelectedVersionType] = useState<string | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTracks = async () => {
      setLoading(true);
      const data = await fetchTracks();
      setTracks(data);
      setLoading(false);
    };
    loadTracks();
  }, []);

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

  const filteredSingles = tracks.filter(track => {
    const matchesSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         track.artist.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === 'All Genres' || track.genre === selectedGenre;
    const matchesBpm = track.bpm >= bpmMin && track.bpm <= bpmMax;
    const matchesKey = selectedKeys.length === 0 || selectedKeys.includes(track.key);
    const matchesEnergy = !selectedEnergy || (() => {
      const level = ENERGY_LEVELS.find(e => e.value === selectedEnergy);
      if (!level) return true;
      return (track.energy ?? 3) >= level.min && (track.energy ?? 3) <= level.max;
    })();
    const matchesVersionType = !selectedVersionType || track.versionType === selectedVersionType;
    return matchesSearch && matchesGenre && matchesBpm && matchesKey && matchesEnergy && matchesVersionType;
  });

  const groupedTracks = useMemo(() => {
    const groups: Record<string, Track[]> = {};
    filteredSingles.forEach(track => {
      if (!groups[track.genre]) {
        groups[track.genre] = [];
      }
      groups[track.genre].push(track);
    });
    return Object.keys(groups).sort().reduce((acc, genre) => {
      acc[genre] = groups[genre];
      return acc;
    }, {} as Record<string, Track[]>);
  }, [filteredSingles]);

  const renderEnergy = (level: number = 3) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Flame 
            key={i} 
            size={10} 
            className={i <= level ? 'text-electric-red' : 'text-border-gray'} 
            fill={i <= level ? 'currentColor' : 'none'}
          />
        ))}
      </div>
    );
  };

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
              <span className="text-sm">Filters</span>
            </button>
            <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-on-surface">MISSION ARSENAL</h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-surface-gray border border-border-gray rounded-lg text-muted-text">
            <TrendingUp size={16} />
            <span className="text-sm">Sort: <strong className="text-on-surface">AI Intel Rank</strong></span>
            <ChevronDown size={16} />
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-text">
            <Loader2 size={40} className="animate-spin text-electric-red" />
            <p className="font-mono text-sm uppercase tracking-wider">Scanning the vault...</p>
          </div>
        ) : Object.keys(groupedTracks).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-text">
            <p>No tracks found in the arsenal.</p>
          </div>
        ) : (
          Object.entries(groupedTracks).map(([genre, genreTracks]) => (
            <div key={genre} className="mb-8">
              <h2 className="font-display text-lg font-bold text-on-surface mb-4 uppercase tracking-wider">{genre} Pool</h2>
              <div className="overflow-x-auto bg-surface-gray border border-border-gray rounded-xl">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-gray">
                      <th className="text-left py-3 px-4 font-mono text-xs text-muted-text uppercase tracking-wider w-12"></th>
                      <th className="text-left py-3 px-4 font-mono text-xs text-muted-text uppercase tracking-wider">Track</th>
                      <th className="text-left py-3 px-4 font-mono text-xs text-muted-text uppercase tracking-wider hidden md:table-cell">BPM</th>
                      <th className="text-left py-3 px-4 font-mono text-xs text-muted-text uppercase tracking-wider hidden md:table-cell">KEY</th>
                      <th className="text-left py-3 px-4 font-mono text-xs text-muted-text uppercase tracking-wider hidden lg:table-cell">ENERGY</th>
                      <th className="text-right py-3 px-4 font-mono text-xs text-muted-text uppercase tracking-wider w-32">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {genreTracks.map((track) => {
                      const is_free = track.price === 0;
                      const isCurrentPlaying = currentTrack?.id === track.id && isPlaying;
                      
                      return (
                      <tr 
                        key={track.id} 
                        className={`border-b border-border-gray last:border-b-0 hover:bg-surface-container-high transition-colors ${isCurrentPlaying ? 'bg-surface-container' : ''}`}
                        onMouseEnter={() => preloadTrack({
                          id: track.id,
                          title: track.title,
                          artist: track.artist,
                          preview_url: track.preview_url,
                        })}
                      >
                        <td className="py-3 px-4">
                          <div className="relative">
                            <img src={track.artwork} alt="" className="w-10 h-10 rounded object-cover" />
                            <button 
                              className="absolute inset-0 flex items-center justify-center bg-black/40 rounded opacity-0 hover:opacity-100 transition-opacity"
                              onClick={() => handlePlay(track)}
                            >
                              {isCurrentPlaying ? <Pause size={12} fill="white" className="text-white" /> : <Play size={12} fill="white" className="text-white" />}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Link to={`/track/${track.id}`} className="hover:text-electric-red transition-colors">
                            <div className="font-bold text-on-surface">{track.title}</div>
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-text">{track.artist}</span>
                            {track.isNew && <span className="px-1.5 py-0.5 bg-electric-red text-white text-[10px] font-mono font-bold rounded">NEW</span>}
                            {track.isHot && <span className="px-1.5 py-0.5 bg-orange-500 text-white text-[10px] font-mono font-bold rounded">HOT</span>}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <span className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${
                              track.versionType === 'original' ? 'bg-electric-red/20 text-electric-red' :
                              track.versionType === 'extended' ? 'bg-success-green/20 text-success-green' :
                              'bg-surface-bright/20 text-muted-text'
                            }`}>
                              {track.version}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <span className="font-mono text-sm text-on-surface">{track.bpm}</span>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <span className="font-mono text-sm text-on-surface">{track.key}</span>
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell">
                          {renderEnergy(track.energy)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              className={`p-2 rounded-lg transition-colors ${
                                isFavorite(track.id) 
                                  ? 'text-electric-red bg-electric-red/10' 
                                  : 'text-muted-text hover:text-electric-red hover:bg-electric-red/10'
                              }`}
                              onClick={() => toggleFavorite(track)}
                            >
                              <Heart size={16} fill={isFavorite(track.id) ? "#FF3B30" : "none"} />
                            </button>
                            <button 
                              className={`px-3 py-1.5 rounded-lg text-sm font-mono font-bold transition-all ${
                                is_free 
                                  ? 'bg-electric-red text-white red-glow hover:brightness-110' 
                                  : isInCart(track.id) 
                                    ? 'bg-success-green text-white' 
                                    : 'bg-surface-container border border-border-gray text-on-surface hover:border-electric-red'
                              }`}
                              onClick={() => is_free ? handleFreeDownload(track) : addToCart({ id: track.id, title: track.title, price: track.price ?? 0, artwork: track.artwork, artist: track.artist })}
                              disabled={downloadingId === track.id}
                            >
                              {downloadingId === track.id ? <Loader2 size={14} className="animate-spin" /> : isInCart(track.id) ? <Check size={14} /> : (is_free ? <Download size={14} /> : <span>${track.price}</span>)}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </main>

      {/* Sidebar */}
      <aside className={`w-[280px] bg-surface-gray border-l border-border-gray p-4 hidden lg:block ${showSidebar ? '' : 'hidden'}`}>
        <div className="mb-6">
          <h3 className="font-display font-bold text-on-surface mb-4">Arsenal Filters</h3>
          
          <div className="mb-4">
            <label className="block text-xs font-mono text-muted-text uppercase tracking-wider mb-2">Search</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text" />
              <input 
                type="text" 
                placeholder="Search tracks or edits..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-surface-container border border-border-gray rounded-lg text-sm text-on-surface placeholder:text-border-gray focus:outline-none focus:border-electric-red transition-colors"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-mono text-muted-text uppercase tracking-wider mb-2">Genres</label>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              <button 
                className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${selectedGenre === 'All Genres' ? 'bg-electric-red text-white' : 'text-muted-text hover:text-on-surface hover:bg-surface-container-high'}`}
                onClick={() => setSelectedGenre('All Genres')}
              >
                All Library
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

          <div className="mb-4">
            <label className="block text-xs font-mono text-muted-text uppercase tracking-wider mb-2">Version Type</label>
            <div className="flex flex-wrap gap-1">
              {VERSION_TYPES.map(vt => (
                <button
                  key={vt}
                  className={`px-2 py-1 text-xs font-mono rounded transition-colors ${selectedVersionType === vt ? 'bg-electric-red text-white' : 'bg-surface-container text-muted-text hover:text-on-surface'}`}
                  onClick={() => setSelectedVersionType(selectedVersionType === vt ? null : vt)}
                >
                  {vt}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-mono text-muted-text uppercase tracking-wider mb-2">BPM Range</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="w-16 px-2 py-1.5 bg-surface-container border border-border-gray rounded text-sm text-on-surface text-center focus:outline-none focus:border-electric-red"
                min={0}
                max={200}
                placeholder="Min"
                value={bpmMin || ''}
                onChange={(e) => setBpmMin(Number(e.target.value) || 0)}
              />
              <span className="text-muted-text">—</span>
              <input
                type="number"
                className="w-16 px-2 py-1.5 bg-surface-container border border-border-gray rounded text-sm text-on-surface text-center focus:outline-none focus:border-electric-red"
                min={0}
                max={200}
                placeholder="Max"
                value={bpmMax || ''}
                onChange={(e) => setBpmMax(Number(e.target.value) || 200)}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-mono text-muted-text uppercase tracking-wider mb-2">Camelot Key</label>
            <div className="grid grid-cols-6 gap-1">
              {CAMELOT_KEYS.map(key => (
                <button
                  key={key}
                  className={`px-1 py-1 text-xs font-mono rounded transition-colors ${selectedKeys.includes(key) ? 'bg-electric-red text-white' : 'bg-surface-container text-muted-text hover:text-on-surface'}`}
                  onClick={() => {
                    setSelectedKeys(prev =>
                      prev.includes(key)
                        ? prev.filter(k => k !== key)
                        : [...prev, key]
                    );
                  }}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-mono text-muted-text uppercase tracking-wider mb-2">Energy Level</label>
            <div className="flex gap-2">
              {ENERGY_LEVELS.map(level => (
                <button
                  key={level.value}
                  className={`flex-1 py-1.5 text-xs font-mono rounded transition-colors ${selectedEnergy === level.value ? 'bg-electric-red text-white' : 'bg-surface-container text-muted-text hover:text-on-surface'}`}
                  onClick={() => setSelectedEnergy(selectedEnergy === level.value ? null : level.value)}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          {(bpmMin > 0 || bpmMax < 200 || selectedKeys.length > 0 || selectedEnergy || selectedVersionType) && (
            <button 
              className="w-full py-2 text-sm text-electric-red hover:underline"
              onClick={() => {
                setBpmMin(0);
                setBpmMax(200);
                setSelectedKeys([]);
                setSelectedEnergy(null);
                setSelectedVersionType(null);
                setSelectedGenre('All Genres');
                setSearchQuery('');
              }}
            >
              Clear All Filters
            </button>
          )}
        </div>
      </aside>
    </div>
  );
};

export default Singles;
