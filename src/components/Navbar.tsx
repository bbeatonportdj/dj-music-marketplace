import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, ShoppingCart, ShoppingBag, Disc, Heart,
  User, LogOut, LayoutDashboard, Upload, BarChart3, ChevronDown, Menu, X
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import '../styles/navbar.css';
import '../styles/navbar-dropdown.css';

const Navbar = () => {
  const { cart } = useCart();
  const { t } = useLanguage();
  const { favorites } = useFavorites();
  const { user, isAdmin, isProducer, loading, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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
      <nav className="navbar">
        <div className="nav-left">
          <Link to="/" className="logo">
            <Disc size={32} className="logo-icon" />
            <span>DJ Music Marketplace</span>
          </Link>
        </div>

        <div className="nav-center">
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder={t('nav.search')} />
          </div>
        </div>

        <div className="nav-right">
          <Link to="/browse" className="nav-link desktop-only">{t('nav.browse')}</Link>
          <Link to="/new-releases" className="nav-link desktop-only">New Releases</Link>
          <Link to="/singles" className="nav-link desktop-only">{t('nav.singles')}</Link>

          <Link to="/favorites" className="nav-icon-link desktop-only" title="Favorites">
            <Heart
              size={22}
              fill={favorites.length > 0 ? 'var(--accent-color)' : 'none'}
              color={favorites.length > 0 ? 'var(--accent-color)' : 'currentColor'}
            />
            {favorites.length > 0 && <span className="cart-badge">{favorites.length}</span>}
          </Link>

          <Link to="/cart" className="nav-icon-link cart-btn">
            <ShoppingCart size={22} />
            {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
          </Link>

          {/* Auth Section */}
          {loading ? (
            <div className="desktop-only" style={{ width: 80, height: 32, borderRadius: 20, background: '#222', opacity: 0.5 }} />
          ) : user ? (
            <div className="nav-user-wrapper desktop-only" ref={dropdownRef}>
              <button
                className="nav-user-btn"
                onClick={() => setDropdownOpen(prev => !prev)}
              >
                <div className="user-avatar">{userInitial}</div>
                <ChevronDown size={14} style={{ color: 'var(--text-muted)', transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'none' }} />
              </button>

              {dropdownOpen && (
                <div className="nav-dropdown">
                  <div className="dropdown-header">
                    <div className="dropdown-name">{userDisplayName.split('@')[0]}</div>
                    <div className="dropdown-email">{user.email}</div>
                    {isAdmin && (
                      <div className="admin-badge">
                        ⚡ Admin
                      </div>
                    )}
                  </div>

                  <Link
                    to="/profile"
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User size={16} />
                    Profile
                  </Link>

                  <Link
                    to="/downloads"
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <ShoppingBag size={16} />
                    Downloads
                  </Link>

                  <Link
                    to="/orders"
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <ShoppingBag size={16} />
                    Orders
                  </Link>

                  <Link
                    to="/favorites"
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Heart size={16} />
                    Favorites
                  </Link>

                  <Link
                    to="/cart"
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <ShoppingCart size={16} />
                    Cart
                    {cart.length > 0 && (
                      <span style={{ marginLeft: 'auto', background: 'var(--accent-color)', color: '#000', borderRadius: '10px', padding: '1px 8px', fontSize: '11px', fontWeight: 700 }}>
                        {cart.length}
                      </span>
                    )}
                  </Link>

                  {(isProducer || isAdmin) && (
                    <>
                      <div className="dropdown-divider" />
                      {isProducer && (
                        <Link
                          to="/producer"
                          className="dropdown-item producer-item"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <BarChart3 size={16} />
                          Producer Studio
                        </Link>
                      )}
                      {isAdmin && (
                        <>
                          <Link
                            to="/admin"
                            className="dropdown-item admin-item"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <LayoutDashboard size={16} />
                            Admin Dashboard
                          </Link>
                          <Link
                            to="/admin?tab=upload"
                            className="dropdown-item admin-item"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <Upload size={16} />
                            Upload Track
                          </Link>
                        </>
                      )}
                    </>
                  )}

                  <div className="dropdown-divider" />
                  <button className="dropdown-item signout-item" onClick={handleSignOut}>
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link to="/register" className="nav-signup-btn">Sign Up</Link>
              <Link to="/auth" className="nav-signin-btn">
                <User size={15} />
                Sign In
              </Link>
            </div>
          )}

          {/* Hamburger Menu (Mobile Only) */}
          <button className="hamburger-btn" onClick={() => setMobileMenuOpen(true)}>
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <span className="drawer-title">Main Menu</span>
              <button className="drawer-close-btn" onClick={() => setMobileMenuOpen(false)}>
                <X size={24} />
              </button>
            </div>
            
            <nav className="drawer-nav">
              <Link to="/browse" className="drawer-link" onClick={() => setMobileMenuOpen(false)}>
                {t('nav.browse')}
              </Link>
              <Link to="/new-releases" className="drawer-link" onClick={() => setMobileMenuOpen(false)}>
                New Releases
              </Link>
              <Link to="/singles" className="drawer-link" onClick={() => setMobileMenuOpen(false)}>
                {t('nav.singles')}
              </Link>
              <Link to="/favorites" className="drawer-link" onClick={() => setMobileMenuOpen(false)}>
                Favorites ({favorites.length})
              </Link>

              <div className="drawer-divider" />

              {user ? (
                <div className="drawer-user-info">
                  <div className="user-profile-row">
                    <div className="user-avatar">{userInitial}</div>
                    <div className="user-details">
                      <div className="user-name">{userDisplayName.split('@')[0]}</div>
                      <div className="user-email">{user.email}</div>
                    </div>
                  </div>
                  <Link to="/downloads" className="drawer-admin-link" onClick={() => setMobileMenuOpen(false)} style={{ color: 'white', marginTop: '10px' }}>
                    <ShoppingBag size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} /> Downloads
                  </Link>
                  <Link to="/orders" className="drawer-admin-link" onClick={() => setMobileMenuOpen(false)} style={{ color: 'white', marginTop: '10px' }}>
                    <ShoppingBag size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} /> Orders
                  </Link>
                  {isProducer && (
                    <Link to="/producer" className="drawer-admin-link" onClick={() => setMobileMenuOpen(false)}>
                      Producer Studio
                    </Link>
                  )}
                  {isAdmin && (
                    <Link to="/admin" className="drawer-admin-link" onClick={() => setMobileMenuOpen(false)}>
                      ⚡ Admin Dashboard
                    </Link>
                  )}
                  <button className="drawer-signout-btn" onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}>
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="drawer-auth-links">
                  <Link to="/register" className="drawer-signin-btn" onClick={() => setMobileMenuOpen(false)}>
                    <User size={16} />
                    Sign Up
                  </Link>
                  <Link to="/auth" className="drawer-signin-btn" onClick={() => setMobileMenuOpen(false)}>
                    <User size={16} />
                    Sign In
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
