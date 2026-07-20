import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, ShoppingCart, ShoppingBag, Disc, Heart,
  User, LogOut, LayoutDashboard, Upload, BarChart3, ChevronDown, Menu, X, Sun, Moon
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const { cart } = useCart();
  const { language, setLanguage, t } = useLanguage();
  const { favorites } = useFavorites();
  const { user, isAdmin, isProducer, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const userInitial = user?.email?.charAt(0).toUpperCase() ?? '?';
  const userDisplayName = user?.display_name || user?.email || '';

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-border-gray">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-16 h-[70px] flex justify-between items-center">
          {/* Left: Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3">
              <Disc size={28} className="text-electric-red" />
              <span className="font-display text-lg font-extrabold tracking-tighter text-on-surface uppercase">BEAT VAULT</span>
            </Link>
            
            {/* Desktop Nav Links */}
            <div className="hidden lg:flex gap-6">
              <Link to="/browse" className="text-muted-text hover:text-on-surface transition-colors font-body text-sm font-medium">
                {t('nav.browse')}
              </Link>
              <Link to="/search" className="text-muted-text hover:text-on-surface transition-colors font-body text-sm font-medium">
                Search
              </Link>
              <Link to="/new-releases" className="text-muted-text hover:text-on-surface transition-colors font-body text-sm font-medium">
                New Releases
              </Link>
              <Link to="/singles" className="text-muted-text hover:text-on-surface transition-colors font-body text-sm font-medium">
                {t('nav.singles')}
              </Link>
            </div>
          </div>

          {/* Center: Search */}
          <div className="hidden md:block flex-1 max-w-md mx-8">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text" />
              <input 
                type="text" 
                placeholder={t('nav.search')}
                className="w-full bg-surface-container-lowest border border-border-gray pl-10 pr-4 py-2 rounded-lg text-sm text-on-surface focus:border-electric-red outline-none transition-all"
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            {/* Language Toggle */}
            <button
              className="hidden lg:flex px-2 py-1 text-xs font-bold rounded border border-border-gray text-muted-text hover:text-on-surface hover:border-on-surface transition-colors"
              onClick={() => setLanguage(language === 'en' ? 'th' : 'en')}
            >
              {language === 'en' ? 'TH' : 'EN'}
            </button>

            {/* Theme Toggle */}
            <button
              className="hidden lg:flex p-2 text-muted-text hover:text-on-surface transition-colors"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Favorites */}
            <Link to="/favorites" className="hidden lg:flex relative p-2 text-muted-text hover:text-electric-red transition-colors">
              <Heart size={22} fill={favorites.length > 0 ? '#FF3B30' : 'none'} color={favorites.length > 0 ? '#FF3B30' : 'currentColor'} />
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-electric-red text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {favorites.length}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link to="/cart" className="relative p-2 text-muted-text hover:text-electric-red transition-colors">
              <ShoppingCart size={22} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-electric-red text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </Link>

            {/* Auth Section */}
            {loading ? (
              <div className="hidden lg:block w-20 h-8 rounded-full bg-surface-container-high animate-pulse" />
            ) : user ? (
              <div className="hidden lg:block relative" ref={dropdownRef}>
                <button
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-surface-container-high transition-colors"
                  onClick={() => setDropdownOpen(prev => !prev)}
                >
                  <div className="w-8 h-8 rounded-full bg-electric-red flex items-center justify-center text-white font-bold text-sm">
                    {userInitial}
                  </div>
                  <ChevronDown size={14} className={`text-muted-text transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-surface-container border border-border-gray rounded-lg shadow-xl overflow-hidden">
                    <div className="p-4 border-b border-border-gray">
                      <div className="font-bold text-on-surface">{userDisplayName.split('@')[0]}</div>
                      <div className="text-sm text-muted-text truncate">{user.email}</div>
                      {isAdmin && (
                        <span className="inline-block mt-2 px-2 py-1 bg-electric-red/20 text-electric-red text-xs font-bold rounded">
                          Admin
                        </span>
                      )}
                    </div>
                    
                    <div className="py-2">
                      <Link to="/profile" className="flex items-center gap-3 px-4 py-2 text-sm text-muted-text hover:text-on-surface hover:bg-surface-container-high transition-colors" onClick={() => setDropdownOpen(false)}>
                        <User size={16} /> Profile
                      </Link>
                      <Link to="/downloads" className="flex items-center gap-3 px-4 py-2 text-sm text-muted-text hover:text-on-surface hover:bg-surface-container-high transition-colors" onClick={() => setDropdownOpen(false)}>
                        <ShoppingBag size={16} /> Downloads
                      </Link>
                      <Link to="/orders" className="flex items-center gap-3 px-4 py-2 text-sm text-muted-text hover:text-on-surface hover:bg-surface-container-high transition-colors" onClick={() => setDropdownOpen(false)}>
                        <ShoppingBag size={16} /> Orders
                      </Link>
                      <Link to="/favorites" className="flex items-center gap-3 px-4 py-2 text-sm text-muted-text hover:text-on-surface hover:bg-surface-container-high transition-colors" onClick={() => setDropdownOpen(false)}>
                        <Heart size={16} /> Favorites
                      </Link>
                      <Link to="/cart" className="flex items-center gap-3 px-4 py-2 text-sm text-muted-text hover:text-on-surface hover:bg-surface-container-high transition-colors" onClick={() => setDropdownOpen(false)}>
                        <ShoppingCart size={16} /> Cart
                        {cart.length > 0 && (
                          <span className="ml-auto bg-electric-red text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{cart.length}</span>
                        )}
                      </Link>
                    </div>

                    {(isProducer || isAdmin) && (
                      <>
                        <div className="border-t border-border-gray py-2">
                          {isProducer && (
                            <Link to="/producer" className="flex items-center gap-3 px-4 py-2 text-sm text-muted-text hover:text-on-surface hover:bg-surface-container-high transition-colors" onClick={() => setDropdownOpen(false)}>
                              <BarChart3 size={16} /> Producer Studio
                            </Link>
                          )}
                          {isAdmin && (
                            <>
                              <Link to="/admin" className="flex items-center gap-3 px-4 py-2 text-sm text-electric-red hover:bg-surface-container-high transition-colors" onClick={() => setDropdownOpen(false)}>
                                <LayoutDashboard size={16} /> Admin Dashboard
                              </Link>
                              <Link to="/admin?tab=upload" className="flex items-center gap-3 px-4 py-2 text-sm text-electric-red hover:bg-surface-container-high transition-colors" onClick={() => setDropdownOpen(false)}>
                                <Upload size={16} /> Upload Track
                              </Link>
                            </>
                          )}
                        </div>
                      </>
                    )}

                    <div className="border-t border-border-gray py-2">
                      <button className="flex items-center gap-3 px-4 py-2 text-sm text-muted-text hover:text-electric-red hover:bg-surface-container-high transition-colors w-full" onClick={handleSignOut}>
                        <LogOut size={16} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-2">
                <Link to="/register" className="px-4 py-2 text-sm font-medium text-muted-text hover:text-on-surface transition-colors">
                  Sign Up
                </Link>
                <Link to="/auth" className="flex items-center gap-2 px-4 py-2 bg-electric-red text-white text-sm font-bold rounded-lg hover:brightness-110 transition-all">
                  <User size={15} /> Sign In
                </Link>
              </div>
            )}

            {/* Hamburger (Mobile) */}
            <button className="lg:hidden p-2 text-muted-text hover:text-on-surface" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-80 bg-surface-container border-l border-border-gray" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border-gray">
              <span className="font-bold text-on-surface">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-muted-text hover:text-on-surface">
                <X size={24} />
              </button>
            </div>
            
            <nav className="p-4">
              <button
                className="block py-3 text-muted-text hover:text-on-surface transition-colors border-b border-border-gray text-left w-full"
                onClick={() => setLanguage(language === 'en' ? 'th' : 'en')}
              >
                {language === 'en' ? '🌐 ไทย' : '🌐 English'}
              </button>
              <Link to="/browse" className="block py-3 text-muted-text hover:text-on-surface transition-colors border-b border-border-gray" onClick={() => setMobileMenuOpen(false)}>
                {t('nav.browse')}
              </Link>
              <Link to="/new-releases" className="block py-3 text-muted-text hover:text-on-surface transition-colors border-b border-border-gray" onClick={() => setMobileMenuOpen(false)}>
                New Releases
              </Link>
              <Link to="/singles" className="block py-3 text-muted-text hover:text-on-surface transition-colors border-b border-border-gray" onClick={() => setMobileMenuOpen(false)}>
                {t('nav.singles')}
              </Link>
              <Link to="/favorites" className="block py-3 text-muted-text hover:text-on-surface transition-colors border-b border-border-gray" onClick={() => setMobileMenuOpen(false)}>
                Favorites ({favorites.length})
              </Link>

              <div className="mt-6 pt-6 border-t border-border-gray">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-electric-red flex items-center justify-center text-white font-bold">
                        {userInitial}
                      </div>
                      <div>
                        <div className="font-bold text-on-surface">{userDisplayName.split('@')[0]}</div>
                        <div className="text-sm text-muted-text truncate">{user.email}</div>
                      </div>
                    </div>
                    <Link to="/downloads" className="block py-2 text-muted-text hover:text-on-surface" onClick={() => setMobileMenuOpen(false)}>Downloads</Link>
                    <Link to="/orders" className="block py-2 text-muted-text hover:text-on-surface" onClick={() => setMobileMenuOpen(false)}>Orders</Link>
                    {isAdmin && (
                      <Link to="/admin" className="block py-2 text-electric-red" onClick={() => setMobileMenuOpen(false)}>Admin Dashboard</Link>
                    )}
                    <button className="mt-4 w-full py-2 text-sm text-muted-text hover:text-electric-red transition-colors" onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}>
                      Sign Out
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link to="/auth" className="py-3 text-center bg-electric-red text-white font-bold rounded-lg" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                    <Link to="/register" className="py-3 text-center border border-border-gray text-muted-text rounded-lg" onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
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
