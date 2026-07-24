import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, ShoppingCart, ShoppingBag, Heart,
  User, LogOut, LayoutDashboard, Upload, ChevronDown, Menu, X
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { cart } = useCart();
  const { language, setLanguage } = useLanguage();
  const { favorites } = useFavorites();
  const { user, isAdmin, loading, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await signOut();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const userInitial = user?.email?.charAt(0).toUpperCase() ?? '?';
  const userDisplayName = user?.display_name || user?.email || '';

  return (
    <>
      {/* Promo Banner */}
      <div className="bg-[#FC4239] text-white text-center py-2 px-4 text-[13px] font-semibold">
        🎧 New DJs get the first month for $7.99 (regular: $24.99) with code START2026
      </div>

      {/* Header */}
      <header 
        className="sticky top-0 z-50 w-full border-b border-white/[0.08]"
        style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(14px) saturate(140%)' }}
      >
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 h-[60px] flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="DJ Marketplace" className="h-8 w-auto" />
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-7">
            <Link to="/browse" className="text-[14px] font-medium text-white/70 hover:text-white transition-colors">
              Library
            </Link>
            <Link to="/new-releases" className="text-[14px] font-medium text-white/70 hover:text-white transition-colors">
              New Releases
            </Link>
            <Link to="/search" className="text-[14px] font-medium text-white/70 hover:text-white transition-colors">
              Genres
            </Link>
            <Link to="/faq" className="text-[14px] font-medium text-white/70 hover:text-white transition-colors">
              FAQ
            </Link>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <form onSubmit={handleSearch} className="hidden sm:flex items-center">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-[160px] bg-white/5 border border-white/10 rounded-lg pl-3 pr-9 py-2 text-[13px] text-white placeholder-white/40 focus:outline-none focus:border-[#FC4239]/50 transition-colors"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                  <Search size={14} />
                </button>
              </div>
            </form>

            {/* Auth */}
            {loading ? (
              <div className="w-[80px] h-[36px] rounded-lg bg-white/5 animate-pulse" />
            ) : user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                  onClick={() => setDropdownOpen(prev => !prev)}
                >
                  <div className="w-7 h-7 rounded-full bg-[#FC4239] flex items-center justify-center text-white font-semibold text-[11px]">
                    {userInitial}
                  </div>
                  <ChevronDown size={14} className={`text-white/40 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl overflow-hidden" style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="p-3 border-b border-white/[0.06]">
                      <div className="font-semibold text-[13px] text-white">{userDisplayName.split('@')[0]}</div>
                      <div className="text-[12px] text-white/45 truncate">{user.email}</div>
                      {isAdmin && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-[#FC4239]/15 text-[#FC4239] text-[10px] font-bold rounded-full border border-[#FC4239]/40">
                          Admin
                        </span>
                      )}
                    </div>
                    
                    <div className="py-1">
                      <Link to="/profile" className="flex items-center gap-2 px-3 py-2 text-[13px] text-white/70 hover:text-white hover:bg-white/5 transition-colors" onClick={() => setDropdownOpen(false)}>
                        <User size={14} /> Profile
                      </Link>
                      <Link to="/downloads" className="flex items-center gap-2 px-3 py-2 text-[13px] text-white/70 hover:text-white hover:bg-white/5 transition-colors" onClick={() => setDropdownOpen(false)}>
                        <ShoppingBag size={14} /> Downloads
                      </Link>
                      <Link to="/favorites" className="flex items-center gap-2 px-3 py-2 text-[13px] text-white/70 hover:text-white hover:bg-white/5 transition-colors" onClick={() => setDropdownOpen(false)}>
                        <Heart size={14} /> Favorites
                      </Link>
                      <Link to="/cart" className="flex items-center gap-2 px-3 py-2 text-[13px] text-white/70 hover:text-white hover:bg-white/5 transition-colors" onClick={() => setDropdownOpen(false)}>
                        <ShoppingCart size={14} /> Crate
                        {cart.length > 0 && (
                          <span className="ml-auto bg-[#FC4239] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{cart.length}</span>
                        )}
                      </Link>
                    </div>

                    {isAdmin && (
                      <div className="border-t border-white/[0.06] py-1">
                        <Link to="/admin" className="flex items-center gap-2 px-3 py-2 text-[13px] text-[#FC4239] font-medium hover:bg-white/5 transition-colors" onClick={() => setDropdownOpen(false)}>
                          <LayoutDashboard size={14} /> Admin Dashboard
                        </Link>
                        <Link to="/admin?tab=upload" className="flex items-center gap-2 px-3 py-2 text-[13px] text-[#FC4239] font-medium hover:bg-white/5 transition-colors" onClick={() => setDropdownOpen(false)}>
                          <Upload size={14} /> Upload Track
                        </Link>
                      </div>
                    )}

                    <div className="border-t border-white/[0.06] py-1">
                      <button className="flex items-center gap-2 px-3 py-2 text-[13px] text-white/70 hover:text-[#FC4239] hover:bg-white/5 transition-colors w-full" onClick={handleSignOut}>
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth" className="px-4 py-2 text-[13px] font-medium text-white/70 hover:text-white transition-colors">
                  Login
                </Link>
                <Link to="/auth" className="px-5 py-2 bg-[#FC4239] text-white text-[13px] font-bold rounded-lg hover:bg-[#e03a32] transition-colors">
                  Start Free
                </Link>
              </div>
            )}

            {/* Mobile Menu */}
            <button className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-white/85 hover:bg-white/5" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-black/70" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-[82vw] max-w-[340px] bg-[#0A0A0A] border-l border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
              <span className="font-bold text-[14px] text-white">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} className="w-10 h-10 rounded-lg text-white/85 hover:bg-white/5 flex items-center justify-center">
                <X size={20} />
              </button>
            </div>
            
            <nav className="p-4">
              <button
                className="block w-full text-left py-3 px-4 rounded-lg text-[16px] font-semibold text-white/85 hover:bg-white/5 transition-colors border-b border-white/[0.06]"
                onClick={() => setLanguage(language === 'en' ? 'th' : 'en')}
              >
                {language === 'en' ? '🌐 ไทย' : '🌐 English'}
              </button>
              <Link to="/browse" className="block py-3 px-4 rounded-lg text-[16px] font-semibold text-white/85 hover:bg-white/5 transition-colors border-b border-white/[0.06]" onClick={() => setMobileMenuOpen(false)}>
                Library
              </Link>
              <Link to="/new-releases" className="block py-3 px-4 rounded-lg text-[16px] font-semibold text-white/85 hover:bg-white/5 transition-colors border-b border-white/[0.06]" onClick={() => setMobileMenuOpen(false)}>
                New Releases
              </Link>
              <Link to="/search" className="block py-3 px-4 rounded-lg text-[16px] font-semibold text-white/85 hover:bg-white/5 transition-colors border-b border-white/[0.06]" onClick={() => setMobileMenuOpen(false)}>
                Genres
              </Link>
              <Link to="/favorites" className="block py-3 px-4 rounded-lg text-[16px] font-semibold text-white/85 hover:bg-white/5 transition-colors border-b border-white/[0.06]" onClick={() => setMobileMenuOpen(false)}>
                Favorites ({favorites.length})
              </Link>

              <div className="mt-6 pt-6 border-t border-white/10">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 mb-4 px-4">
                      <div className="w-9 h-9 rounded-full bg-[#FC4239] flex items-center justify-center text-white font-semibold text-[12px]">
                        {userInitial}
                      </div>
                      <div>
                        <div className="font-semibold text-[13px] text-white">{userDisplayName.split('@')[0]}</div>
                        <div className="text-[12px] text-white/45 truncate">{user.email}</div>
                      </div>
                    </div>
                    <Link to="/downloads" className="block py-2 px-4 text-[14px] text-white/70 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Downloads</Link>
                    {isAdmin && (
                      <Link to="/admin" className="block py-2 px-4 text-[14px] text-[#FC4239] font-medium" onClick={() => setMobileMenuOpen(false)}>Admin Dashboard</Link>
                    )}
                    <button className="mt-4 w-full py-2.5 text-[14px] text-white/70 hover:text-[#FC4239] transition-colors" onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}>
                      Sign Out
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 px-4">
                    <Link to="/auth" className="py-3 text-center bg-[#FC4239] text-white font-bold rounded-lg text-[14px]" onClick={() => setMobileMenuOpen(false)}>Start Free</Link>
                    <Link to="/auth" className="py-3 text-center border border-white/10 text-white/70 rounded-lg text-[14px]" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
