import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, ShoppingCart, Check, ChevronDown, Loader2, Sparkles } from 'lucide-react';
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
      case 'popular':   return (b.plays || 0) - (a.plays || 0);
      case 'price-low': return a.price - b.price;
      case 'price-high':return b.price - a.price;
      case 'newest':
      default:          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    }
  });

  const getSortLabel = (value: string) => {
    switch (value) {
      case 'popular':    return 'Most Popular';
      case 'price-low':  return 'Price: Low to High';
      case 'price-high': return 'Price: High to Low';
      case 'newest': default: return 'Newest First';
    }
  };

  return (
    <div className="min-h-screen animate-fade-in">

      {/* ── HERO ────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ minHeight: 380 }}>
        {/* Background image with overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?q=80&w=2070&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/85 to-surface/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />

        {/* Red glow accent */}
        <div className="absolute -top-20 left-0 w-[500px] h-[400px] bg-electric-red/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-[1440px] mx-auto px-4 lg:px-16 flex items-center" style={{ minHeight: 380 }}>
          <div className="max-w-2xl py-16">
            <span className="section-label mb-4 block">New Collection</span>
            <h1 className="font-display font-extrabold uppercase text-on-surface mb-5 leading-[0.95]"
                style={{ fontSize: 'clamp(48px, 7vw, 88px)', letterSpacing: '-0.04em' }}>
              The Edit<br />
              <span className="gradient-text">Vault</span>
            </h1>
            <p className="text-muted-text text-base mb-8 max-w-lg leading-relaxed">
              Premium curated packs for the modern DJ. Exclusive transitions, acapellas, and high-energy club edits.
            </p>
            <div className="flex gap-3">
              <button
                className="btn-primary"
                onClick={() => document.getElementById('packs-grid')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Sparkles size={16} /> Explore Catalog
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── PACKS GRID ─────────────────────────── */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-16 py-10">
        <header className="flex justify-between items-center mb-8">
          <div>
            <span className="section-label mb-2 block">All Packs</span>
            <h2 className="font-display text-2xl font-bold uppercase text-on-surface">
              Featured Packs
              <span className="ml-3 text-sm font-mono text-muted-text font-normal">
                ({sortedPacks.length})
              </span>
            </h2>
          </div>

          {/* Sort Dropdown */}
          <div className="relative" ref={sortDropdownRef}>
            <button
              className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-lowest border border-border-gray rounded-lg text-sm text-muted-text hover:border-electric-red/40 hover:text-on-surface transition-all"
              onClick={() => setShowSortDropdown(!showSortDropdown)}
            >
              <span>Sort: <strong className="text-on-surface">{getSortLabel(sortBy)}</strong></span>
              <ChevronDown size={14} className={`transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showSortDropdown && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-surface-container border border-border-gray rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in">
                {['newest', 'popular', 'price-low', 'price-high'].map((option) => (
                  <button
                    key={option}
                    className={`block w-full text-left px-4 py-3 text-sm transition-colors ${
                      sortBy === option
                        ? 'bg-electric-red/10 text-electric-red font-bold'
                        : 'text-muted-text hover:text-on-surface hover:bg-surface-container-high'
                    }`}
                    onClick={() => { setSortBy(option); setShowSortDropdown(false); }}
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
            <Loader2 size={36} className="animate-spin text-electric-red" />
            <p className="font-mono text-xs uppercase tracking-widest">Accessing the vault...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5" id="packs-grid">
            {sortedPacks.length === 0 ? (
              <div className="col-span-full text-center py-32 text-muted-text">
                <p className="font-mono text-sm">No packs found.</p>
              </div>
            ) : (
              sortedPacks.map((pack, idx) => (
                <div
                  key={pack.id}
                  className="premium-card animate-fade-up"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                  onMouseEnter={() => preloadTrack({
                    id: pack.id,
                    title: pack.title,
                    artist: pack.editor,
                    preview_url: pack.preview_url,
                  })}
                >
                  {/* Artwork */}
                  <div className="relative aspect-square overflow-hidden rounded-t-xl">
                    <Link to={`/pack/${pack.id}`}>
                      <img
                        src={pack.artwork}
                        alt={pack.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </Link>

                    {/* Badges */}
                    {pack.is_free && (
                      <div className="absolute top-3 left-3 pill-badge pill-badge-green">
                        FREE
                      </div>
                    )}

                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-all duration-300">
                      <button
                        className="w-16 h-16 bg-electric-red rounded-full flex items-center justify-center text-white transform scale-90 hover:scale-100 transition-transform shadow-xl shadow-red-500/40"
                        onClick={(e) => handlePlay(e, pack)}
                      >
                        {currentTrack?.id === pack.id && isPlaying
                          ? <Pause fill="currentColor" size={24} />
                          : <Play fill="currentColor" size={24} style={{ transform: 'translateX(2px)' }} />
                        }
                      </button>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-mono text-[10px] text-electric-red uppercase tracking-widest font-bold">{pack.genre}</span>
                      <span className="font-mono text-[10px] text-muted-text">{pack.tracks_count} Tracks</span>
                    </div>
                    <Link to={`/pack/${pack.id}`}>
                      <h3 className="font-bold text-on-surface truncate hover:text-electric-red transition-colors mb-1 text-sm uppercase tracking-wide">{pack.title}</h3>
                    </Link>
                    <p className="text-xs text-muted-text mb-4 truncate">{pack.editor}</p>

                    <div className="flex justify-between items-center pt-3 border-t border-border-gray/50">
                      <span className={`font-mono text-base font-bold ${pack.price === 0 ? 'text-success-green' : 'text-on-surface'}`}>
                        {pack.price === 0 ? 'FREE' : `$${pack.price.toFixed(2)}`}
                      </span>
                      <button
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                          isInCart(pack.id)
                            ? 'bg-success-green text-white'
                            : 'bg-surface-container-high text-muted-text hover:bg-electric-red hover:text-white'
                        }`}
                        onClick={() => addToCart(pack as unknown as Parameters<typeof addToCart>[0])}
                        disabled={isInCart(pack.id)}
                      >
                        {isInCart(pack.id) ? <Check size={16} /> : <ShoppingCart size={16} />}
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
