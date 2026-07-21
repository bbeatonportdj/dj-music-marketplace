import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Play, Pause, ShoppingCart, Check, Flame, X, SlidersHorizontal, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchTracks } from '../lib/api';
import type { Track } from '../lib/api';
import { useAudio } from '../context/AudioContext';
import { useCart } from '../context/CartContext';

const CAMELOT_KEYS = [
  '1A', '2A', '3A', '4A', '5A', '6A', '7A', '8A', '9A', '10A', '11A', '12A',
  '1B', '2B', '3B', '4B', '5B', '6B', '7B', '8B', '9B', '10B', '11B', '12B',
];

const ENERGY_LEVELS = [
  { label: 'Chill', value: 'chill', min: 1, max: 2 },
  { label: 'Medium', value: 'medium', min: 3, max: 3 },
  { label: 'High Energy', value: 'high', min: 4, max: 5 },
];

// Group genres for better UX - create logical categories
const genreGroups = {
  en: [
    {
      name: 'Electronic Lovers',
      color: 'bg-blue-900/20 border-blue-500/30',
      genres: ['House', 'Tech House', 'Big Room', 'Techno', 'EDM', 'Progressive House']
    },
    {
      name: 'Dance & EDM',
      color: 'bg-purple-900/20 border-purple-500/30',
      genres: ['Bass House', 'Drum & Bass', 'Bounce', 'Hard Dance']
    },
    {
      name: 'International',
      color: 'bg-orange-900/20 border-orange-500/30',
      genres: ['Latin', 'Hip Hop', 'K-Pop', 'Afro House', 'Baile Funk/Favela Bass']
    },
    {
      name: 'Melodic & Indie',
      color: 'bg-green-900/20 border-green-500/30',
      genres: ['Psy Trance', 'Top 40', 'TikTok Dance', 'Other']
    },
  ],
  th: [
    {
      name: 'อิเล็คทรอนิคเซอร์', // Electronic
      color: 'bg-blue-900/20 border-blue-500/30',
      genres: ['เฮ้าส์', 'เทค เฮ้าส์', 'บิ้ก Room', 'เทคโนโลยีโนว', 'เอดั่มมิคชั่น', 'Progressive House']
    },
    {
      name: 'แดนซ์ดั่ีม & เอดั่มิคชั่น', // Dance & EDM
      color: 'bg-purple-900/20 border-purple-500/30',
      genres: ['เบสส์ เฮ้าส์', 'แดรม & แบส', 'บ� bounceเซ่อร์', 'ฮาร์ดแดนซ์']
    },
    {
      name: 'อินเตอร์เนชั่นอล', // International
      color: 'bg-orange-900/20 border-orange-500/30',
      genres: ['เลิตตรอลส์', 'ฮิปฮ็อพ', 'เคพีเอป', 'อะเฟรอ เฮ้าส์', 'เบลฟั้นเฟวาล่าเบส']
    },
    {
      name: 'เมลดิคแอนด์อินดี้', // Melodic & Indie
      color: 'bg-green-900/20 border-green-500/30',
      genres: ['ไซ ตร้านเชอ', 'ท็อปโฟร์ตี้', 'ทิคทร็อกเต้นแดนซ์', 'อื่น ๆ']
    },
  ]
};

const AdvancedSearch = () => {
  const { currentTrack, isPlaying, playTrack } = useAudio();
  const { addToCart, isInCart } = useCart();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All Genres');
  const [bpmMin, setBpmMin] = useState(0);
  const [bpmMax, setBpmMax] = useState(200);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [selectedEnergy, setSelectedEnergy] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'relevance' | 'newest' | 'bpm' | 'title'>('relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Electronic Lovers': true,
    'Dance & EDM': true,
    'International': true,
    'Melodic & Indie': false,
  });

  useEffect(() => {
    const loadTracks = async () => {
      setLoading(true);
      const data = await fetchTracks();
      setTracks(data);
      setLoading(false);
    };
    loadTracks();
  }, []);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const selectGenreFromGroup = (genre: string) => {
    setSelectedGenre(genre === selectedGenre ? 'All Genres' : genre);
  };

  const filteredTracks = useMemo(() => {
    let result = tracks.filter(track => {
      const matchesSearch = !searchQuery ||
        track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.genre?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = selectedGenre === 'All Genres' || track.genre === selectedGenre;
      const matchesBpm = track.bpm >= bpmMin && track.bpm <= bpmMax;
      const matchesKey = selectedKeys.length === 0 || selectedKeys.includes(track.key);
      const matchesEnergy = !selectedEnergy || (() => {
        const level = ENERGY_LEVELS.find(e => e.value === selectedEnergy);
        if (!level) return true;
        return (track.energy ?? 3) >= level.min && (track.energy ?? 3) <= level.max;
      })();
      return matchesSearch && matchesGenre && matchesBpm && matchesKey && matchesEnergy;
    });

    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        break;
      case 'bpm':
        result.sort((a, b) => a.bpm - b.bpm);
        break;
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }

    return result;
  }, [tracks, searchQuery, selectedGenre, bpmMin, bpmMax, selectedKeys, selectedEnergy, sortBy]);

  const getGenreCountInGroup = (genres: string[]) => {
    return filteredTracks.filter(track => genres.includes(track.genre || '')).length;
  };

  const activeFilterCount = [
    selectedGenre !== 'All Genres',
    bpmMin > 0 || bpmMax < 200,
    selectedKeys.length > 0,
    !!selectedEnergy,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedGenre('All Genres');
    setBpmMin(0);
    setBpmMax(200);
    setSelectedKeys([]);
    setSelectedEnergy(null);
    setSearchQuery('');
  };

  const toggleKey = (key: string) => {
    setSelectedKeys(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handlePlay = (track: Track) => {
    playTrack({
      id: track.id,
      title: track.title,
      artist: track.artist,
      preview_url: track.preview_url,
      artwork: track.artwork
    });
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 lg:px-16 py-8">
      <Link to="/" className="inline-flex items-center gap-2 text-muted-text hover:text-electric-red transition-colors mb-6">
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className={`lg:w-[320px] flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="sticky top-24 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-on-surface flex items-center gap-2">
                <SlidersHorizontal size={18} /> Filters
                {activeFilterCount > 0 && (
                  <span className="px-2 py-0.5 bg-electric-red text-white text-xs font-bold rounded-full">{activeFilterCount}</span>
                )}
              </h2>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-xs text-muted-text hover:text-electric-red">Clear all</button>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, artist, or genre..."
                className="w-full pl-10 pr-10 py-3 bg-surface-gray border border-border-gray rounded-lg text-on-surface placeholder:text-border-gray focus:outline-none focus:border-electric-red transition-colors"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text hover:text-on-surface">
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Genre Accordion */}
            <div className="space-y-3">
              <label className="block text-xs font-mono text-muted-text uppercase tracking-wider mb-2">Genres</label>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedGenre('All Genres')}
                  className={`w-full p-3 rounded-lg text-sm font-medium transition-all ${selectedGenre === 'All Genres'
                    ? 'bg-electric-red text-white'
                    : 'bg-surface-gray border border-border-gray text-muted-text hover:border-electric-red hover:bg-surface-gray/80'
                  }`}
                >
                  All Genres ({tracks.length})
                </button>
                {Object.entries(genreGroups.en).map(([groupName, group]) => {
                  const isExpanded = expandedGroups[groupName];
                  const genreCount = getGenreCountInGroup(group.genres);
                  const activeInGroup = group.genres.includes(selectedGenre);

                  return (
                    <div key={groupName} className="border border-border-gray rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleGroup(groupName)}
                        className={`w-full p-3 flex items-center justify-between transition-colors ${activeInGroup
                          ? 'bg-electric-red/10 text-electric-red border-b border-electric-red/20'
                          : 'bg-surface-gray text-muted-text hover:bg-surface-gray/80'
                        }`}
                      >
                        <span className="font-medium">{groupName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 bg-surface-container-high rounded-full">
                            {genreCount}
                          </span>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="p-2 space-y-1 bg-surface-gray/50">
                          {group.genres.map(genre => {
                            const isSelected = selectedGenre === genre;
                            return (
                              <button
                                key={genre}
                                onClick={() => selectGenreFromGroup(genre)}
                                className={`w-full p-2 rounded-lg text-sm transition-all text-left ${isSelected
                                  ? 'bg-electric-red text-white font-bold'
                                  : 'text-muted-text hover:bg-surface-container-high hover:text-on-surface'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span>{genre}</span>
                                  <span className="text-xs opacity-70">
                                    {getGenreCountInGroup([genre])}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BPM Range */}
            <div>
              <label className="block text-xs font-mono text-muted-text uppercase tracking-wider mb-2">
                BPM Range: {bpmMin} - {bpmMax}
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  max={200}
                  value={bpmMin}
                  onChange={(e) => setBpmMin(Number(e.target.value))}
                  className="w-1/2 px-3 py-2 bg-surface-gray border border-border-gray rounded-lg text-on-surface text-sm focus:outline-none focus:border-electric-red"
                />
                <input
                  type="number"
                  min={0}
                  max={200}
                  value={bpmMax}
                  onChange={(e) => setBpmMax(Number(e.target.value))}
                  className="w-1/2 px-3 py-2 bg-surface-gray border border-border-gray rounded-lg text-on-surface text-sm focus:outline-none focus:border-electric-red"
                />
              </div>
            </div>

            {/* Key */}
            <div>
              <label className="block text-xs font-mono text-muted-text uppercase tracking-wider mb-2">Key</label>
              <div className="grid grid-cols-5 gap-1">
                {CAMELOT_KEYS.map(key => (
                  <button
                    key={key}
                    onClick={() => toggleKey(key)}
                    className={`px-2 py-1.5 rounded text-xs font-mono font-bold transition-colors ${selectedKeys.includes(key)
                      ? 'bg-electric-red text-white'
                      : 'bg-surface-gray border border-border-gray text-muted-text hover:border-electric-red'
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>

            {/* Energy */}
            <div>
              <label className="block text-xs font-mono text-muted-text uppercase tracking-wider mb-2">Energy</label>
              <div className="flex gap-2">
                {ENERGY_LEVELS.map(level => (
                  <button
                    key={level.value}
                    onClick={() => setSelectedEnergy(selectedEnergy === level.value ? null : level.value)}
                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${selectedEnergy === level.value
                      ? 'bg-electric-red text-white'
                      : 'bg-surface-gray border border-border-gray text-muted-text hover:border-electric-red'
                    }`}
                  >
                    <Flame size={12} /> {level.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Results */}
        <main className="flex-1 min-w-0">
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center gap-2 px-4 py-3 bg-surface-gray border border-border-gray rounded-lg text-muted-text"
            >
              <SlidersHorizontal size={18} />
              {activeFilterCount > 0 && (
                <span className="px-1.5 py-0.5 bg-electric-red text-white text-xs font-bold rounded-full">{activeFilterCount}</span>
              )}
            </button>
          </div>

          {/* Sort + Count */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-text">
              {filteredTracks.length.toLocaleString()} tracks found
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-1.5 bg-surface-gray border border-border-gray rounded-lg text-sm text-on-surface focus:outline-none focus:border-electric-red"
            >
              <option value="relevance">Relevance</option>
              <option value="newest">Newest</option>
              <option value="bpm">BPM</option>
              <option value="title">Title</option>
            </select>
          </div>

          {/* Track List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-border-gray border-t-electric-red rounded-full animate-spin" />
            </div>
          ) : filteredTracks.length === 0 ? (
            <div className="flex flex-col items-center py-20 gap-4 text-muted-text">
              <Search size={48} className="opacity-30" />
              <p className="font-display text-lg font-bold text-on-surface">No tracks found</p>
              <p>Try adjusting your filters or search query.</p>
              <button onClick={clearFilters} className="text-electric-red text-sm font-bold hover:underline">Clear all filters</button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTracks.map(track => {
                const isCurrentPlaying = currentTrack?.id === track.id && isPlaying;
                const isFree = !track.price || track.price === 0;
                return (
                  <div
                    key={track.id}
                    className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${isCurrentPlaying ? 'bg-electric-red/10 border border-electric-red/30' : 'bg-surface-gray border border-border-gray hover:border-border-gray/80'
                    }`}
                  >
                    {/* Play Button */}
                    <button
                      onClick={() => handlePlay(track)}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-gray border border-border-gray hover:bg-electric-red hover:text-white hover:border-electric-red transition-all flex-shrink-0"
                    >
                      {isCurrentPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                    </button>

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <Link to={`/track/${track.id}`} className="font-bold text-on-surface hover:text-electric-red transition-colors truncate block">
                        {track.title}
                      </Link>
                      <div className="text-sm text-muted-text truncate">{track.artist}</div>
                    </div>

                    {/* Meta */}
                    <div className="hidden sm:flex items-center gap-3 text-xs text-muted-text font-mono">
                      <span>{track.bpm} BPM</span>
                      <span>{track.key}</span>
                      <span className="px-2 py-0.5 bg-surface-container-high rounded">{track.genre}</span>
                    </div>

                    {/* Price + Cart */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-mono font-bold text-on-surface text-sm">
                        {isFree ? 'FREE' : `$${track.price?.toFixed(2)}`}
                      </span>
                      {!isFree && (
                        <button
                          onClick={() => addToCart({ id: track.id, title: track.title, price: track.price ?? 0, artwork: track.artwork, artist: track.artist })}
                          className={`p-2 rounded-lg transition-colors ${isInCart(track.id)
                            ? 'bg-success-green/10 text-success-green'
                            : 'bg-surface-gray border border-border-gray text-muted-text hover:text-electric-red hover:border-electric-red'
                          }`}
                        >
                          {isInCart(track.id) ? <Check size={14} /> : <ShoppingCart size={14} />}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdvancedSearch;
