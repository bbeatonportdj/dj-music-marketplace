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
import '../styles/new-releases.css';

const BPM_RANGES = [
  { label: 'All BPM', min: 0, max: 999 },
  { label: '< 90 BPM', min: 0, max: 89 },
  { label: '90 - 110 BPM', min: 90, max: 110 },
  { label: '110 - 130 BPM', min: 111, max: 130 },
  { label: '> 130 BPM', min: 131, max: 999 }
];

const GENRES = [
  'Afro House',
  'Baile Funk/Favela Bass',
  'Bass House',
  'Bounce',
  'Club House',
  'Deep House',
  'Drum & Bass',
  'Dubstep',
  'Dutch House',
  'Electro House',
  'Exclusive',
  'Free Download',
  'Future',
  'Hard Dance',
  'Hard Techno',
  'Hip Hop',
  'House',
  'K-Pop',
  'Latin',
  'Pop',
  'Progressive House',
  'Promo',
  'Remix',
  'Tech House',
  'Techno',
  'Top 40',
  'Trance'
];

const NewReleases = () => {
  const navigate = useNavigate();
  const { currentTrack, isPlaying, playTrack } = useAudio();
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

  const CAMELOT_KEYS = [
    '1A', '2A', '3A', '4A', '5A', '6A', '7A', '8A', '9A', '10A', '11A', '12A',
    '1B', '2B', '3B', '4B', '5B', '6B', '7B', '8B', '9B', '10B', '11B', '12B'
  ];

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
    <div className="nr-layout animate-fade-in">
      <main className="nr-main">
        <header className="nr-header">
          <div className="nr-header-left">
            <button className="sidebar-toggle" onClick={() => setShowSidebar(!showSidebar)} aria-label={showSidebar ? 'Hide filters' : 'Show filters'}>
              <SlidersHorizontal size={20} />
              <span>{showSidebar ? 'Hide Filters' : 'Filters'}</span>
              {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
            </button>
            <h1>LATEST RELEASES</h1>
          </div>
          <div className="nr-header-right">
            <div className="sort-dropdown" onClick={() => setShowSortMenu(!showSortMenu)}>
              <span>Sort: <strong>{sortBy === 'newest' ? 'Newest' : sortBy === 'bpm' ? 'BPM' : sortBy === 'title' ? 'Title' : 'Rank'}</strong></span>
              <ChevronDown size={14} />
              {showSortMenu && (
                <div className="sort-menu">
                  {(['newest', 'bpm', 'title', 'rank'] as const).map(opt => (
                    <button key={opt} className={`sort-option ${sortBy === opt ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); setSortBy(opt); setShowSortMenu(false); }}>
                      {opt === 'newest' ? 'Newest' : opt === 'bpm' ? 'BPM' : opt === 'title' ? 'Title' : 'Rank'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {loading ? (
          <div className="loading-state">
            <Loader2 size={40} className="animate-spin" />
            <p>Loading tracks...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <AlertTriangle size={40} style={{ opacity: 0.4, marginBottom: '12px' }} />
            <p>{error}</p>
            <button className="nr-clear-filters" onClick={loadTracks} style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <RotateCcw size={14} /> Retry
            </button>
          </div>
        ) : Object.keys(groupedTracks).length === 0 ? (
          <div className="empty-state">
            <Music size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <p>No tracks matching your filters.</p>
          </div>
        ) : (
          Object.entries(groupedTracks).map(([genre, genreTracks]) => (
            <div key={genre} className="nr-genre-section">
              <h2 className="nr-genre-title">{genre.toUpperCase()} <span className="nr-genre-count">{genreTracks.length}</span></h2>
              <div className="nr-track-list">
                {genreTracks.map((track, idx) => {
                  const isCurrentPlaying = currentTrack?.id === track.id && isPlaying;
                  const is_free = track.price === 0;
                  const isExpanded = expandedTrack === track.id;
                  const num = String(idx + 1).padStart(2, '0');

                  return (
                    <div key={track.id} className={`nr-track-row ${isCurrentPlaying ? 'playing' : ''}`}>
                      <div className="nr-row-left">
                        <span className="nr-row-num">{num}</span>
                        <button className="nr-row-play" onClick={() => handlePlay(track)}>
                          {isCurrentPlaying ? <Pause size={14} fill="white" /> : <Play size={14} fill="white" />}
                        </button>
                        <div className="nr-row-info" onClick={() => handlePlay(track)}>
                          <div className="nr-row-title">
                            <span className="nr-row-artist">{track.artist}</span> - <span className="nr-row-track">{track.title}</span>
                          </div>
                          <div className="nr-row-meta">
                            <span>{track.genre}</span>
                            {track.bpm > 0 && <><span className="nr-meta-dot">·</span><span>{track.bpm} bpm</span></>}
                            {track.key && <><span className="nr-meta-dot">·</span><span>{track.key}</span></>}
                          </div>
                        </div>
                      </div>
                      <div className="nr-row-right">
                        <div className="nr-row-tags">
                          {track.version && <span className={`nr-v-tag nr-v-${track.versionType}`}>{track.version}</span>}
                        </div>
                        <div className="nr-row-actions">
                          {is_free ? (
                            <button className="nr-dl-btn" onClick={() => handleFreeDownload(track)} disabled={downloadingId === track.id}>
                              {downloadingId === track.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                            </button>
                          ) : (
                            <button 
                              className={`nr-dl-btn nr-paid ${isInCart(track.id) ? 'added' : ''}`}
                              onClick={() => addToCart({ id: track.id, title: track.title, price: track.price ?? 0, artwork: track.artwork, artist: track.artist })}
                            >
                              {isInCart(track.id) ? <span>✓</span> : <span>${track.price}</span>}
                            </button>
                          )}
                          <button className="nr-row-expand" onClick={() => setExpandedTrack(isExpanded ? null : track.id)}>
                            <ChevronRight size={16} className={isExpanded ? 'expanded' : ''} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </main>

      <div className={`nr-sidebar-overlay ${showSidebar ? 'active' : ''}`} onClick={() => setShowSidebar(false)} />

      <aside className={`nr-sidebar ${showSidebar ? 'active' : ''}`}>
        <div className="nr-sidebar-header">
          <h3>FILTERS</h3>
          <button className="nr-sidebar-close" onClick={() => setShowSidebar(false)}>
            <X size={18} />
          </button>
        </div>
        
        <div className="nr-filter-section">
          <div className="nr-search-box">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search tracks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search tracks by title or artist"
            />
          </div>
        </div>

        <div className="nr-filter-section">
          <h4>Genre</h4>
          <ul className="nr-filter-list">
            <li 
              className={`nr-filter-item ${selectedGenre === 'All Genres' ? 'active' : ''}`}
              onClick={() => setSelectedGenre('All Genres')}
            >
              <div className="nr-filter-checkbox">
                {selectedGenre === 'All Genres' && <span />}
              </div>
              All Genres
            </li>
            {GENRES.map(genre => (
              <li 
                key={genre} 
                className={`nr-filter-item ${selectedGenre === genre ? 'active' : ''}`}
                onClick={() => setSelectedGenre(genre)}
              >
                <div className="nr-filter-checkbox">
                  {selectedGenre === genre && <span />}
                </div>
                {genre}
              </li>
            ))}
          </ul>
        </div>

        <div className="nr-filter-section">
          <h4>BPM Range</h4>
          <div className="bpm-presets">
            {BPM_RANGES.map(range => (
              <button
                key={range.label}
                className={`bpm-preset-btn ${selectedBpm === range.label ? 'active' : ''}`}
                onClick={() => setSelectedBpm(range.label)}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        <div className="nr-filter-section">
          <h4>Version Type</h4>
          <div className="nr-version-grid">
            {['All Versions', 'clean', 'dirty', 'intro', 'acapella', 'instrumental', 'extended', 'radio', 'club', 'deep'].map(v => (
              <button
                key={v}
                className={`nr-vt-chip ${selectedVersion === v ? 'active' : ''}`}
                onClick={() => setSelectedVersion(v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="nr-filter-section">
          <h4>Camelot Key</h4>
          <div className="nr-key-grid">
            {CAMELOT_KEYS.map(key => (
              <button
                key={key}
                className={`nr-key-chip ${selectedKeys.includes(key) ? 'active' : ''}`}
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
          <button className="nr-clear-filters" onClick={() => {
            setSelectedGenre('All Genres');
            setSelectedBpm('All BPM');
            setSelectedVersion('All Versions');
            setSelectedKeys([]);
            setSearchQuery('');
          }}>
            Clear All Filters
          </button>
        )}
      </aside>
    </div>
  );
};

export default NewReleases;
