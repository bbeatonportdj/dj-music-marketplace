import { useState, useEffect, useMemo } from 'react';
import { 
  Play, Pause, Search, Heart, Check, SlidersHorizontal, X,
  Music, Loader2, Flame, Zap, TrendingUp, Award, Download, ChevronDown
} from 'lucide-react';
import { fetchTracks } from '../lib/api';
import type { Track } from '../lib/api';
import { useAudio } from '../context/AudioContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
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
  const { currentTrack, isPlaying, playTrack } = useAudio();
  const { addToCart, isInCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All Genres');
  const [selectedBpm, setSelectedBpm] = useState('All BPM');
  const [selectedVersion, setSelectedVersion] = useState('All Versions');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [selectedEnergy, setSelectedEnergy] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

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

  const ENERGY_LEVELS = [
    { label: 'Low', value: 'low', min: 1, max: 2 },
    { label: 'Mid', value: 'mid', min: 3, max: 3 },
    { label: 'High', value: 'high', min: 4, max: 5 },
  ];

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
    const matchesEnergy = !selectedEnergy || (() => {
      const level = ENERGY_LEVELS.find(e => e.value === selectedEnergy);
      if (!level) return true;
      return (track.energy ?? 3) >= level.min && (track.energy ?? 3) <= level.max;
    })();
    
    return matchesSearch && matchesGenre && matchesBpm && matchesVersion && matchesKey && matchesEnergy;
  });

  const groupedTracks = useMemo(() => {
    const groups: Record<string, Track[]> = {};
    filteredTracks.forEach(track => {
      if (!groups[track.genre]) {
        groups[track.genre] = [];
      }
      groups[track.genre].push(track);
    });
    return Object.keys(groups).sort().reduce((acc, genre) => {
      acc[genre] = groups[genre];
      return acc;
    }, {} as Record<string, Track[]>);
  }, [filteredTracks]);

  const renderEnergy = (level: number = 3) => {
    return (
      <div className="energy-meter-arsenal">
        {[1, 2, 3, 4, 5].map((i) => (
          <Flame key={i} size={10} className={i <= level ? 'active' : ''} fill={i <= level ? 'currentColor' : 'none'} />
        ))}
      </div>
    );
  };

  return (
    <div className="nr-layout animate-fade-in">
      {/* Sidebar */}

      <main className="nr-main">
        <header className="nr-header">
          <div className="nr-header-left">
            <button className="sidebar-toggle" onClick={() => setShowSidebar(!showSidebar)}>
              <SlidersHorizontal size={20} />
              <span>{showSidebar ? 'Hide Intel' : 'Intel Filters'}</span>
            </button>
            <h1>LATEST DROPS</h1>
            <p>Scanning global dancefloors for mission-critical edits.</p>
          </div>
          <div className="nr-header-right">
             <div className="sort-dropdown">
              <TrendingUp size={16} />
              <span>Sort: <strong>Newest Drops</strong></span>
              <ChevronDown size={16} />
            </div>
          </div>
        </header>

        {loading ? (
          <div className="loading-state">
            <Loader2 size={40} className="animate-spin" />
            <p>Accessing latest intel...</p>
          </div>
        ) : Object.keys(groupedTracks).length === 0 ? (
          <div className="empty-state">
            <Music size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <p>No new releases matching your criteria.</p>
          </div>
        ) : (
          Object.entries(groupedTracks).map(([genre, genreTracks]) => (
            <div key={genre} className="nr-genre-section">
              <h2 className="nr-genre-title">{genre.toUpperCase()} MISSION</h2>
              <div className="nr-table-container arsenal-table">
                <table className="nr-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}></th>
                      <th>TRACK / EDIT DETAIL</th>
                      <th className="col-rank">RANK</th>
                      <th className="col-bpm">BPM</th>
                      <th className="col-key">KEY</th>
                      <th className="col-energy">ENERGY</th>
                      <th style={{ textAlign: 'right' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {genreTracks.map(track => {
                      const isCurrentPlaying = currentTrack?.id === track.id && isPlaying;
                      const is_free = track.price === 0;
                      
                      return (
                        <tr key={track.id} className={`nr-track-row-arsenal ${isCurrentPlaying ? 'playing' : ''}`}>
                          <td onClick={() => handlePlay(track)} style={{ cursor: 'pointer' }}>
                            <div className="nr-play-cell-arsenal">
                              <img src={track.artwork} alt={track.title} />
                              <button className="nr-play-btn-arsenal" onClick={(e) => { e.stopPropagation(); handlePlay(track); }}>
                                {isCurrentPlaying ? <Pause size={14} fill="white" /> : <Play size={14} fill="white" />}
                              </button>
                            </div>
                          </td>
                          <td onClick={() => handlePlay(track)} style={{ cursor: 'pointer' }}>
                            <div className="nr-track-info-arsenal">
                              <div className="nr-track-title-row">
                                <span className="nr-title-text">{track.title}</span>
                                {track.isExclusive && <Award size={12} className="exclusive-icon" />}
                                <div className="nr-tags-row">
                                  <span className={`nr-v-tag nr-v-${track.versionType}`}>
                                    {track.version}
                                  </span>
                                  {track.versionDetail && (
                                    <span className="nr-v-detail">{track.versionDetail}</span>
                                  )}
                                </div>
                              </div>
                              <div className="nr-artist-text">{track.artist}</div>
                            </div>
                          </td>
                          <td className="col-rank">
                            <div className="rank-intel">
                              <Zap size={12} className="zap-icon" />
                              <span>{track.rank || 99}</span>
                            </div>
                          </td>
                          <td className="col-bpm"><span className="nr-badge-arsenal">{track.bpm}</span></td>
                          <td className="col-key"><span className="nr-badge-arsenal key-badge">{track.key}</span></td>
                          <td className="col-energy">
                            {renderEnergy(track.energy)}
                          </td>
                          <td>
                            <div className="nr-action-cell-arsenal" onClick={(e) => e.stopPropagation()}>
                              <button 
                                className="nr-icon-btn-arsenal"
                                onClick={() => toggleFavorite(track)}
                              >
                                <Heart size={16} fill={isFavorite(track.id) ? "var(--accent-color)" : "none"} color={isFavorite(track.id) ? "var(--accent-color)" : "currentColor"} />
                              </button>
                              <button 
                                className={`nr-add-btn-arsenal ${isInCart(track.id) ? 'added' : ''}`}
                                onClick={() => addToCart({ id: track.id, title: track.title, price: track.price ?? 0, artwork: track.artwork, artist: track.artist })}
                              >
                                {isInCart(track.id) ? <Check size={14} /> : (is_free ? <Download size={14} /> : <span>${track.price}</span>)}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </main>

      <div className={`nr-sidebar-overlay ${showSidebar ? 'active' : ''}`} onClick={() => setShowSidebar(false)} />

      <aside className={`nr-sidebar ${showSidebar ? 'active' : ''}`}>
        <div className="nr-sidebar-header">
          <h3>INTEL FILTERS</h3>
          <button className="nr-sidebar-close" onClick={() => setShowSidebar(false)}>
            <X size={18} />
          </button>
        </div>
        
        <div className="nr-filter-section">
          <div className="nr-search-box">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search edits..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="nr-filter-section">
          <h4>Genre Pool</h4>
          <ul className="nr-filter-list">
            <li 
              className={`nr-filter-item ${selectedGenre === 'All Genres' ? 'active' : ''}`}
              onClick={() => setSelectedGenre('All Genres')}
            >
              <div className="nr-filter-checkbox">
                {selectedGenre === 'All Genres' && <Check size={12} />}
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
                  {selectedGenre === genre && <Check size={12} />}
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

        <div className="nr-filter-section">
          <h4>Energy Level</h4>
          <div className="nr-energy-group">
            {ENERGY_LEVELS.map(level => (
              <button
                key={level.value}
                className={`nr-energy-btn ${selectedEnergy === level.value ? 'active' : ''}`}
                onClick={() => setSelectedEnergy(selectedEnergy === level.value ? null : level.value)}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        {(selectedBpm !== 'All BPM' || selectedVersion !== 'All Versions' || selectedKeys.length > 0 || selectedEnergy) && (
          <button className="nr-clear-filters" onClick={() => {
            setSelectedGenre('All Genres');
            setSelectedBpm('All BPM');
            setSelectedVersion('All Versions');
            setSelectedKeys([]);
            setSelectedEnergy(null);
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
