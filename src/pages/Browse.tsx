import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, ShoppingCart, Check, ChevronDown, Loader2 } from 'lucide-react';
import { fetchPacks } from '../lib/api';
import type { Pack } from '../lib/api';
import { useAudio } from '../context/AudioContext';
import { useCart } from '../context/CartContext';

const Browse = () => {
  const { currentTrack, isPlaying, playTrack, preloadTrack } = useAudio();
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
    <div className="min-h-screen animate-fade-in">
      {/* Hero Section */}
      <section className="relative h-[400px] flex items-center overflow-hidden bg-surface-gray">
        <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/80 to-transparent z-10" />
        <div className="relative z-20 px-4 lg:px-16 max-w-4xl">
          <span className="font-mono text-xs font-bold tracking-widest uppercase text-electric-red mb-4 block">NEW COLLECTION</span>
          <h1 className="font-display text-5xl lg:text-7xl font-extrabold uppercase text-on-surface mb-4">THE EDIT VAULT</h1>
          <p className="text-muted-text text-lg mb-8 max-w-2xl">
            Premium curated packs for the modern DJ. Exclusive transitions, acapellas, and high-energy club edits.
          </p>
          <button 
            className="bg-electric-red text-white px-8 py-4 rounded-lg font-bold uppercase tracking-wider red-glow hover:brightness-110 active:scale-95 transition-all"
            onClick={() => document.getElementById('packs-grid')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Explore Catalog
          </button>
        </div>
      </section>

      <div className="max-w-[1440px] mx-auto px-4 lg:px-16 py-12">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <h2 className="font-display text-3xl font-bold uppercase text-on-surface">Featured Packs</h2>
          
          <div className="relative" ref={sortDropdownRef}>
            <button 
              className="flex items-center gap-2 px-4 py-2 bg-surface-gray border border-border-gray rounded text-sm text-muted-text hover:text-on-surface transition-colors"
              onClick={() => setShowSortDropdown(!showSortDropdown)}
            >
              <span>Sort by: <strong className="text-on-surface">{getSortLabel(sortBy)}</strong></span>
              <ChevronDown size={16} />
            </button>
            
            {showSortDropdown && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-surface-container border border-border-gray rounded-lg shadow-xl overflow-hidden z-50">
                {['newest', 'popular', 'price-low', 'price-high'].map((option) => (
                  <button
                    key={option}
                    className={`block w-full text-left px-4 py-3 text-sm transition-colors ${
                      sortBy === option 
                        ? 'bg-electric-red/10 text-electric-red font-bold' 
                        : 'text-muted-text hover:text-on-surface hover:bg-surface-container-high'
                    }`}
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
        </header>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-muted-text">
            <Loader2 size={40} className="animate-spin text-electric-red" />
            <p className="font-mono text-sm uppercase tracking-wider">Accessing the vault...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6" id="packs-grid">
            {sortedPacks.length === 0 ? (
              <div className="col-span-full text-center py-32 text-muted-text">
                <p>No packs found.</p>
              </div>
            ) : (
              sortedPacks.map((pack) => (
                <div 
                  key={pack.id} 
                  className="bg-surface-gray border border-border-gray rounded-lg p-4 hover:border-electric-red transition-all group"
                  onMouseEnter={() => preloadTrack({
                    id: pack.id,
                    title: pack.title,
                    artist: pack.editor,
                    preview_url: pack.preview_url,
                  })}
                >
                  {/* Artwork */}
                  <div className="relative aspect-square mb-4 rounded overflow-hidden">
                    <Link to={`/pack/${pack.id}`}>
                      <img 
                        src={pack.artwork} 
                        alt={pack.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    </Link>
                    {pack.is_free && (
                      <div className="absolute top-2 right-2 bg-success-green text-black px-2 py-1 rounded text-xs font-bold">
                        FREE
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <button 
                        className="w-16 h-16 bg-electric-red rounded-full flex items-center justify-center text-white red-glow transform translate-y-4 group-hover:translate-y-0 transition-transform"
                        onClick={(e) => handlePlay(e, pack)}
                      >
                        {currentTrack?.id === pack.id && isPlaying ? 
                          <Pause fill="currentColor" size={28} /> : 
                          <Play fill="currentColor" size={28} />
                        }
                      </button>
                    </div>
                  </div>
                  
                  {/* Details */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-mono text-xs text-electric-red uppercase tracking-wider">{pack.genre}</span>
                      <span className="font-mono text-xs text-muted-text">{pack.tracks_count} Tracks</span>
                    </div>
                    <Link to={`/pack/${pack.id}`}>
                      <h3 className="font-bold text-on-surface truncate hover:text-electric-red transition-colors">{pack.title}</h3>
                    </Link>
                    <p className="text-sm text-muted-text mb-4">{pack.editor}</p>
                    
                    <div className="flex justify-between items-center">
                      <span className={`font-mono text-lg font-bold ${pack.price === 0 ? 'text-success-green' : 'text-on-surface'}`}>
                        {pack.price === 0 ? "FREE" : `$${pack.price.toFixed(2)}`}
                      </span>
                      <button 
                        className={`w-10 h-10 rounded flex items-center justify-center transition-all ${
                          isInCart(pack.id) 
                            ? 'bg-success-green text-white' 
                            : 'bg-surface-container-high text-muted-text hover:bg-electric-red hover:text-white'
                        }`}
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
      </div>
    </div>
  );
};

export default Browse;
