import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Play, Pause, Check, Search, SlidersHorizontal, 
  ChevronDown, Heart, Download, Loader2, Flame, 
  TrendingUp, Zap
} from 'lucide-react';
import { fetchTracks } from '../lib/api';
import type { Track } from '../lib/api';
import { useAudio } from '../context/AudioContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import '../styles/singles.css';

const GENRES = [
  'Afro House',
  'Baile Funk/Favela Bass',
  'Bass House',
  'Bounce',
  'Club House',
  'Deep House',
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

const Singles = () => {
  const { currentTrack, isPlaying, playTrack } = useAudio();
  const { addToCart, isInCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [showSidebar, setShowSidebar] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All Genres');
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

  const filteredSingles = tracks.filter(track => {
    const matchesSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         track.artist.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === 'All Genres' || track.genre === selectedGenre;
    return matchesSearch && matchesGenre;
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
      <div className="energy-meter">
        {[1, 2, 3, 4, 5].map((i) => (
          <Flame 
            key={i} 
            size={10} 
            className={i <= level ? 'active' : ''} 
            fill={i <= level ? 'currentColor' : 'none'}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="singles-layout animate-fade-in">
      <aside className={`singles-sidebar ${showSidebar ? 'active' : ''}`}>
        <div className="sidebar-header">
          <h3>Arsenal Filters</h3>
          <button className="sidebar-close" onClick={() => setShowSidebar(false)}>✕</button>
        </div>
        
        <div className="filter-group">
          <label>Intel Search</label>
          <div className="search-box">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search tracks or edits..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-group">
          <label>Genres Pool</label>
          <ul className="filter-list">
            <li 
              className={selectedGenre === 'All Genres' ? 'active' : ''}
              onClick={() => setSelectedGenre('All Genres')}
            >
              All Library
            </li>
            {GENRES.map(genre => (
              <li 
                key={genre} 
                className={selectedGenre === genre ? 'active' : ''}
                onClick={() => setSelectedGenre(genre)}
              >
                {genre}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="singles-main">
        <header className="singles-header">
          <div className="header-left">
            <button className="sidebar-toggle" onClick={() => setShowSidebar(!showSidebar)}>
              <SlidersHorizontal size={20} />
              <span>{showSidebar ? 'Hide Intel' : 'Tactical Filters'}</span>
            </button>
            <h1 className="singles-title">MISSION ARSENAL</h1>
          </div>
          
          <div className="header-right">
            <div className="sort-dropdown">
              <TrendingUp size={16} />
              <span>Sort: <strong>AI Intel Rank</strong></span>
              <ChevronDown size={16} />
            </div>
          </div>
        </header>

        {loading ? (
          <div className="loading-state">
            <Loader2 size={40} className="animate-spin" />
            <p>Scanning the vault...</p>
          </div>
        ) : Object.keys(groupedTracks).length === 0 ? (
          <div className="empty-state">
            <p>No tracks found in the arsenal.</p>
          </div>
        ) : (
          Object.entries(groupedTracks).map(([genre, genreTracks]) => (
            <div key={genre} className="genre-section">
              <h2 className="genre-section-title">{genre.toUpperCase()} POOL</h2>
              <div className="singles-table-container arsenal-table">
                <table className="singles-table">
                  <thead>
                    <tr>
                      <th className="col-play"></th>
                      <th className="col-info">Track / Edit Detail</th>
                      <th className="col-rank">RANK</th>
                      <th className="col-bpm">BPM</th>
                      <th className="col-key">KEY</th>
                      <th className="col-energy">ENERGY</th>
                      <th className="col-waveform">PREVIEW</th>
                      <th className="col-action">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {genreTracks.map((track) => {
                      const is_free = track.price === 0;
                      const isCurrentPlaying = currentTrack?.id === track.id && isPlaying;
                      
                      return (
                      <tr key={track.id} className={`track-row-arsenal ${isCurrentPlaying ? 'playing' : ''}`}>
                        <td className="col-play">
                          <div className="play-cell-arsenal">
                            <img src={track.artwork} alt="" className="track-img-arsenal" />
                            <button className="play-btn-arsenal" onClick={() => handlePlay(track)}>
                              {isCurrentPlaying ? <Pause size={14} fill="white" /> : <Play size={14} fill="white" />}
                            </button>
                          </div>
                        </td>
                        <td className="col-info">
                          <div className="track-info-arsenal">
                            <div className="track-title-row">
                              <Link to={`/track/${track.id}`} className="track-link-arsenal">
                                <span className="track-title-text">{track.title}</span>
                              </Link>
                              <div className="status-badges">
                                {track.isNew && <span className="status-badge-new">NEW</span>}
                                {track.isHot && <span className="status-badge-hot">HOT</span>}
                              </div>
                              <div className="version-tags-row">
                                <span className={`v-tag-arsenal v-${track.versionType}`}>
                                  {track.version}
                                </span>
                                {track.versionDetail && (
                                  <span className="v-detail-tag">{track.versionDetail}</span>
                                )}
                              </div>
                            </div>
                            <span className="track-artist-text">{track.artist}</span>
                          </div>
                        </td>
                        <td className="col-rank">
                          <div className="rank-intel">
                            <Zap size={12} className="zap-icon" />
                            <span>{track.rank || 99}</span>
                          </div>
                        </td>
                        <td className="col-bpm">
                          <span className="badge-arsenal">{track.bpm}</span>
                        </td>
                        <td className="col-key">
                          <span className="badge-arsenal key-badge">{track.key}</span>
                        </td>
                        <td className="col-energy">
                          {renderEnergy(track.energy)}
                        </td>
                        <td className="col-waveform">
                          <div className="mini-waveform-container">
                            <div className="waveform-bar" style={{ height: '40%', opacity: 0.3 }}></div>
                            <div className="waveform-bar" style={{ height: '70%', opacity: 0.4 }}></div>
                            <div className="waveform-bar" style={{ height: '50%', opacity: 0.3 }}></div>
                            <div className="waveform-bar" style={{ height: '90%', opacity: 0.6 }}></div>
                            <div className="waveform-bar" style={{ height: '60%', opacity: 0.4 }}></div>
                            <div className="waveform-bar" style={{ height: '40%', opacity: 0.3 }}></div>
                          </div>
                        </td>
                        <td className="col-action">
                          <div className="action-cell-arsenal">
                            <button 
                              className={`fav-btn-arsenal ${isFavorite(track.id) ? 'active' : ''}`}
                              onClick={() => toggleFavorite(track)}
                            >
                              <Heart size={16} fill={isFavorite(track.id) ? "var(--accent-color)" : "none"} color={isFavorite(track.id) ? "var(--accent-color)" : "currentColor"} />
                            </button>
                            <button 
                              className={`cart-btn-arsenal ${isInCart(track.id) ? 'added' : ''}`}
                              onClick={() => addToCart({ id: track.id, title: track.title, price: track.price ?? 0, artwork: track.artwork, artist: track.artist })}
                            >
                              {isInCart(track.id) ? <Check size={14} /> : (is_free ? <Download size={14} /> : <span>${track.price}</span>)}
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
    </div>
  );
};

export default Singles;
