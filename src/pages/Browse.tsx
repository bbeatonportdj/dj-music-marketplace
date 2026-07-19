import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, ShoppingCart, Check, ChevronDown, Loader2 } from 'lucide-react';
import { fetchPacks } from '../lib/api';
import type { Pack } from '../lib/api';
import { useAudio } from '../context/AudioContext';
import { useCart } from '../context/CartContext';

import '../styles/browse.css';

const Browse = () => {
  const { currentTrack, isPlaying, playTrack } = useAudio();
  const { addToCart, isInCart } = useCart();
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadPacks = async () => {
      setLoading(true);
      const data = await fetchPacks();
      setPacks(data);
      setLoading(false);
    };
    loadPacks();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePlay = (e: React.MouseEvent, pack: Pack) => {
    e.preventDefault();
    playTrack({
      id: pack.id,
      title: pack.title,
      artist: pack.editor,
      preview_url: pack.preview_url,
      artwork: pack.artwork
    });
  };

  const sortedPacks = [...packs].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return (b.plays || 0) - (a.plays || 0);
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'newest':
      default:
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    }
  });

  const getSortLabel = (value: string) => {
    switch (value) {
      case 'popular': return 'Popular';
      case 'price-low': return 'Price: Low to High';
      case 'price-high': return 'Price: High to Low';
      case 'newest':
      default: return 'Newest';
    }
  };

  return (
    <div className="browse-layout animate-fade-in">
      <main className="browse-main">
        <section className="browse-hero-premium">
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <span className="hero-badge">NEW COLLECTION</span>
            <h1>THE EDIT VAULT</h1>
            <p>Premium curated packs for the modern DJ. Exclusive transitions, acapellas, and high-energy club edits.</p>
            <div className="hero-actions">
              <button className="hero-btn-primary" onClick={() => document.getElementById('packs-grid')?.scrollIntoView({ behavior: 'smooth' })}>
                Explore Catalog
              </button>
            </div>
          </div>
        </section>


        <header className="browse-header">
          <div className="header-left">
            <h2 className="browse-subtitle">Featured Packs</h2>
          </div>
          
          <div className="header-right">
            <div className="sort-dropdown-container" ref={sortDropdownRef}>
              <button 
                className="sort-dropdown-toggle"
                onClick={() => setShowSortDropdown(!showSortDropdown)}
              >
                <span>Sort by: <strong>{getSortLabel(sortBy)}</strong></span>
                <ChevronDown size={16} />
              </button>
              
              {showSortDropdown && (
                <div className="sort-dropdown-menu">
                  {['newest', 'popular', 'price-low', 'price-high'].map((option) => (
                    <button
                      key={option}
                      className={`sort-option ${sortBy === option ? 'active' : ''}`}
                      onClick={() => {
                        setSortBy(option);
                        setShowSortDropdown(false);
                      }}
                    >
                      {getSortLabel(option)}
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
            <p>Accessing the vault...</p>
          </div>
        ) : (
          <div className="packs-grid" id="packs-grid">
            {sortedPacks.length === 0 ? (
              <div className="empty-state">
                <p>No packs found.</p>
              </div>
            ) : (
              sortedPacks.map((pack) => (
                <div key={pack.id} className="pack-card-premium">
                  <div className="pack-artwork-wrapper">
                    <Link to={`/pack/${pack.id}`}>
                      <img src={pack.artwork} alt={pack.title} className="pack-artwork-img" />
                    </Link>
                    {pack.is_free && <div className="pack-free-tag">FREE</div>}
                    <div className="pack-artwork-overlay">
                      <button 
                        className="pack-play-btn" 
                        onClick={(e) => handlePlay(e, pack)}
                      >
                        {currentTrack?.id === pack.id && isPlaying ? 
                          <Pause fill="currentColor" size={28} /> : 
                          <Play fill="currentColor" size={28} />
                        }
                      </button>
                    </div>
                  </div>
                  
                  <div className="pack-details-premium">
                    <div className="pack-meta-top">
                      <span className="pack-genre-badge">{pack.genre}</span>
                      <span className="pack-count">{pack.tracks_count} Tracks</span>
                    </div>
                    <Link to={`/pack/${pack.id}`}>
                      <h3 className="pack-title-text">{pack.title}</h3>
                    </Link>
                    <p className="pack-editor-text">{pack.editor}</p>
                    
                    <div className="pack-footer-premium">
                      <div className="pack-price">
                        {pack.price === 0 ? "FREE" : `$${pack.price.toFixed(2)}`}
                      </div>
                      <button 
                        className={`pack-add-btn ${isInCart(pack.id) ? 'added' : ''}`}
                        onClick={() => addToCart(pack as unknown as Parameters<typeof addToCart>[0])}
                        disabled={isInCart(pack.id)}
                      >
                        {isInCart(pack.id) ? <Check size={18} /> : <ShoppingCart size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Browse;
