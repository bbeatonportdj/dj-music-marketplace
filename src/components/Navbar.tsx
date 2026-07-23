import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, ShoppingCart, ShoppingBag, Heart,
  User, LogOut, LayoutDashboard, Upload, ChevronDown, Menu, X, Sun, Moon
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { cart } = useCart();
  const { language, setLanguage } = useLanguage();
  const { favorites } = useFavorites();
  const { user, isAdmin, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto px-6 h-[64px] flex items-center justify-between">
          {/* Left: Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-[16px] font-extrabold tracking-tight text-black uppercase">DJ MARKETPLACE</span>
          </Link>
          
          {/* Center: Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/browse" className="text-[13px] font-medium text-gray-500 hover:text-black transition-colors uppercase tracking-wide">
              Browse
            </Link>
            <Link to="/new-releases" className="text-[13px] font-medium text-gray-500 hover:text-black transition-colors uppercase tracking-wide">
              New Releases
            </Link>
            <Link to="/search" className="text-[13px] font-medium text-gray-500 hover:text-black transition-colors uppercase tracking-wide">
              Genres
            </Link>
          </div>

          {/* Right: Search + Auth */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <form onSubmit={handleSearch} className="hidden sm:flex items-center">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-[180px] bg-gray-100 border border-gray-200 rounded-md pl-3 pr-9 py-2 text-[13px] text-black placeholder-gray-400 focus:outline-none focus:border-gray-300 transition-colors"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black">
                  <Search size={15} />
                </button>
              </div>
            </form>

            {/* Sign In */}
            {loading ? (
              <div className="w-[80px] h-[36px] rounded-md bg-gray-100 animate-pulse" />
            ) : user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors"
                  onClick={() => setDropdownOpen(prev => !prev)}
                >
                  <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center text-white font-semibold text-[11px]">
                    {userInitial}
                  </div>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-100 rounded-lg shadow-lg overflow-hidden">
                    <div className="p-3 border-b border-gray-100">
                      <div className="font-semibold text-[13px] text-black">{userDisplayName.split('@')[0]}</div>
                      <div className="text-[12px] text-gray-500 truncate">{user.email}</div>
                      {isAdmin && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded">
                          Admin
                        </span>
                      )}
                    </div>
                    
                    <div className="py-1">
                      <Link to="/profile" className="flex items-center gap-2 px-3 py-2 text-[13px] text-gray-500 hover:text-black hover:bg-gray-50 transition-colors" onClick={() => setDropdownOpen(false)}>
                        <User size={14} /> Profile
                      </Link>
                      <Link to="/downloads" className="flex items-center gap-2 px-3 py-2 text-[13px] text-gray-500 hover:text-black hover:bg-gray-50 transition-colors" onClick={() => setDropdownOpen(false)}>
                        <ShoppingBag size={14} /> Downloads
                      </Link>
                      <Link to="/favorites" className="flex items-center gap-2 px-3 py-2 text-[13px] text-gray-500 hover:text-black hover:bg-gray-50 transition-colors" onClick={() => setDropdownOpen(false)}>
                        <Heart size={14} /> Favorites
                      </Link>
                      <Link to="/cart" className="flex items-center gap-2 px-3 py-2 text-[13px] text-gray-500 hover:text-black hover:bg-gray-50 transition-colors" onClick={() => setDropdownOpen(false)}>
                        <ShoppingCart size={14} /> Crate
                        {cart.length > 0 && (
                          <span className="ml-auto bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{cart.length}</span>
                        )}
                      </Link>
                    </div>

                    {isAdmin && (
                      <div className="border-t border-gray-100 py-1">
                        <Link to="/admin" className="flex items-center gap-2 px-3 py-2 text-[13px] text-blue-600 font-medium hover:bg-gray-50 transition-colors" onClick={() => setDropdownOpen(false)}>
                          <LayoutDashboard size={14} /> Admin Dashboard
                        </Link>
                        <Link to="/admin?tab=upload" className="flex items-center gap-2 px-3 py-2 text-[13px] text-blue-600 font-medium hover:bg-gray-50 transition-colors" onClick={() => setDropdownOpen(false)}>
                          <Upload size={14} /> Upload Track
                        </Link>
                      </div>
                    )}

                    <div className="border-t border-gray-100 py-1">
                      <button className="flex items-center gap-2 px-3 py-2 text-[13px] text-gray-500 hover:text-red-600 hover:bg-gray-50 transition-colors w-full" onClick={handleSignOut}>
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/auth" className="flex items-center gap-2 px-5 py-2 bg-black text-white text-[13px] font-semibold rounded-md hover:bg-gray-800 transition-colors">
                SIGN IN
              </Link>
            )}

            {/* Theme Toggle */}
            <button
              className="hidden lg:flex p-2 text-gray-400 hover:text-black transition-colors"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Hamburger (Mobile) */}
            <button className="md:hidden p-2 text-gray-400 hover:text-black" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-black/40" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-72 bg-white border-l border-gray-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <span className="font-bold text-[14px] text-black">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-gray-400 hover:text-black">
                <X size={20} />
              </button>
            </div>
            
            <nav className="p-4">
              <button
                className="block py-2.5 text-[13px] text-gray-500 hover:text-black transition-colors border-b border-gray-100 text-left w-full"
                onClick={() => setLanguage(language === 'en' ? 'th' : 'en')}
              >
                {language === 'en' ? '🌐 ไทย' : '🌐 English'}
              </button>
              <Link to="/browse" className="block py-2.5 text-[13px] text-gray-500 hover:text-black transition-colors border-b border-gray-100" onClick={() => setMobileMenuOpen(false)}>
                Browse
              </Link>
              <Link to="/new-releases" className="block py-2.5 text-[13px] text-gray-500 hover:text-black transition-colors border-b border-gray-100" onClick={() => setMobileMenuOpen(false)}>
                New Releases
              </Link>
              <Link to="/search" className="block py-2.5 text-[13px] text-gray-500 hover:text-black transition-colors border-b border-gray-100" onClick={() => setMobileMenuOpen(false)}>
                Genres
              </Link>
              <Link to="/favorites" className="block py-2.5 text-[13px] text-gray-500 hover:text-black transition-colors border-b border-gray-100" onClick={() => setMobileMenuOpen(false)}>
                Favorites ({favorites.length})
              </Link>

              <div className="mt-6 pt-6 border-t border-gray-200">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center text-white font-semibold text-[12px]">
                        {userInitial}
                      </div>
                      <div>
                        <div className="font-semibold text-[13px] text-black">{userDisplayName.split('@')[0]}</div>
                        <div className="text-[12px] text-gray-500 truncate">{user.email}</div>
                      </div>
                    </div>
                    <Link to="/downloads" className="block py-2 text-[13px] text-gray-500 hover:text-black" onClick={() => setMobileMenuOpen(false)}>Downloads</Link>
                    {isAdmin && (
                      <Link to="/admin" className="block py-2 text-[13px] text-blue-600 font-medium" onClick={() => setMobileMenuOpen(false)}>Admin Dashboard</Link>
                    )}
                    <button className="mt-4 w-full py-2 text-[13px] text-gray-500 hover:text-red-600 transition-colors" onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}>
                      Sign Out
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link to="/auth" className="py-2.5 text-center bg-black text-white font-semibold rounded-md text-[13px]" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                    <Link to="/register" className="py-2.5 text-center border border-gray-200 text-gray-500 rounded-md text-[13px]" onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
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
