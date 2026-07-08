import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, Mail, Shield, Save, Loader2, 
  LogOut, ChevronRight, UserCircle, BarChart3,
  ShoppingBag, Download, CheckCircle, Clock,
  Music, HardDrive, CreditCard, Search, ArrowDown, Play
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { apiUrl } from '../lib/apiBase';
import '../styles/profile.css';

interface OrderItem {
  id: string;
  price_at_purchase: number;
  track: {
    id: string;
    title: string;
    artist: string;
    version: string;
    artwork_url: string;
    audio_url: string;
  } | null;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  payment_method: string;
  promptpay_ref: string | null;
  created_at: string;
  items: OrderItem[];
}

const Profile = () => {
  const { user, signOut, isAdmin, isProducer, updateProfileName } = useAuth();
  const { showNotification } = useNotifications();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'downloads' | 'info' | 'orders'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState(() => user?.display_name || '');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [purchasedTracks, setPurchasedTracks] = useState<any[]>([]);
  const [purchasedLoading, setPurchasedLoading] = useState(false);
  const [downloadSearch, setDownloadSearch] = useState('');
  const email = user?.email || '';

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchDashboard = async () => {
      setPurchasedLoading(true);
      try {
        const [ordersRes, purchasesRes] = await Promise.all([
          fetch(apiUrl('/api/orders')),
          fetch(apiUrl('/api/orders/purchased')),
        ]);
        if (ordersRes.ok) setOrders(await ordersRes.json());
        if (purchasesRes.ok) setPurchasedTracks(await purchasesRes.json());
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setPurchasedLoading(false);
      }
    };
    if (activeTab === 'dashboard' || activeTab === 'downloads') fetchDashboard();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'orders') {
      const fetchOrders = async () => {
        setOrdersLoading(true);
        try {
          const res = await fetch(apiUrl('/api/orders'));
          if (res.ok) setOrders(await res.json());
        } catch (err) {
          console.error('Error fetching orders:', err);
        } finally {
          setOrdersLoading(false);
        }
      };
      fetchOrders();
    }
  }, [activeTab]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await updateProfileName(displayName);
    setLoading(false);
    if (error) {
      showNotification(error || 'Failed to update profile', 'error');
    } else {
      showNotification('Profile updated successfully!', 'success');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const paidOrders = orders.filter(o => o.status === 'paid');
  const totalDownloads = purchasedTracks.length;
  const totalSpent = paidOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);

  if (!user) return null;

  return (
    <div className="profile-container animate-fade-in">
      <div className="profile-header">
        <div className="profile-avatar">
          <UserCircle size={80} />
        </div>
        <div className="profile-header-info">
          <h1>{user.display_name || 'User'}</h1>
          <p>{email}</p>
          {isAdmin && <span className="admin-badge" style={{ background: 'rgba(234,179,8,0.15)', color: '#eab308', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px' }}>ADMIN</span>}
          {isProducer && <span className="admin-badge" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px' }}>PRODUCER</span>}
        </div>
      </div>

      <div className="profile-grid">
        <aside className="profile-nav">
          <button 
            className={`profile-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <BarChart3 size={18} />
            <span>Dashboard</span>
          </button>

          <button 
            className={`profile-nav-item ${activeTab === 'downloads' ? 'active' : ''}`}
            onClick={() => setActiveTab('downloads')}
          >
            <Download size={18} />
            <span>My Downloads</span>
          </button>

          <button 
            className={`profile-nav-item ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <User size={18} />
            <span>Personal Info</span>
          </button>
          
          <button 
            className={`profile-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <ShoppingBag size={18} />
            <span>Order History</span>
          </button>
          
          {isProducer && (
            <button className="profile-nav-item" onClick={() => navigate('/producer')}>
              <BarChart3 size={18} />
              <span>Producer Studio</span>
              <ChevronRight size={14} className="nav-arrow" />
            </button>
          )}
          {isAdmin && (
            <button className="profile-nav-item" onClick={() => navigate('/admin')}>
              <Shield size={18} />
              <span>Admin Dashboard</span>
              <ChevronRight size={14} className="nav-arrow" />
            </button>
          )}
          
          <div className="nav-divider" />
          
          <button className="profile-nav-item logout-item" onClick={handleSignOut}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </aside>

        <main className="profile-content">
          {/* ============ DASHBOARD TAB ============ */}
          {activeTab === 'dashboard' && (
            <section className="profile-section">
              <div className="dashboard-stats">
                <div className="stat-card">
                  <div className="stat-icon stat-icon-tracks">
                    <Music size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{totalDownloads}</span>
                    <span className="stat-label">Purchased Tracks</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon stat-icon-downloads">
                    <Download size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{totalDownloads}</span>
                    <span className="stat-label">Available Downloads</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon stat-icon-spent">
                    <CreditCard size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">${totalSpent.toFixed(2)}</span>
                    <span className="stat-label">Total Spent</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon stat-icon-account">
                    <HardDrive size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">
                      {isAdmin ? 'Admin' : isProducer ? 'Producer' : 'Member'}
                    </span>
                    <span className="stat-label">Account Type</span>
                  </div>
                </div>
              </div>

              <h2>My Downloads</h2>
              {purchasedLoading ? (
                <div className="profile-loading-spinner" style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                  <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent-color)' }} />
                </div>
              ) : purchasedTracks.length === 0 ? (
                <div className="dashboard-empty">
                  <Music size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                  <p>No purchased tracks yet.</p>
                  <button onClick={() => navigate('/browse')} className="save-btn" style={{ width: 'auto', display: 'inline-flex', marginTop: '0.5rem' }}>
                    Browse Catalog
                  </button>
                </div>
              ) : (
                <div className="dashboard-tracks">
                  {purchasedTracks.map((track: any) => (
                    <div key={track.id} className="dashboard-track-item">
                      <img
                        src={track.artwork_url || track.artwork || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=80&h=80&fit=crop'}
                        alt={track.title}
                        className="dashboard-track-art"
                      />
                      <div className="dashboard-track-info">
                        <div className="dashboard-track-title">{track.title}</div>
                        <div className="dashboard-track-artist">{track.artist}</div>
                      </div>
                      <div className="dashboard-track-meta">
                        <span className="dashboard-track-bpm">{track.bpm} BPM</span>
                        <span className="dashboard-track-key">{track.key}</span>
                      </div>
                      <button
                        className="dashboard-dl-btn"
                        onClick={async () => {
                          try {
                            const res = await fetch(apiUrl(`/api/downloads/${track.id}`));
                            if (!res.ok) throw new Error('Download failed');
                            const blob = await res.blob();
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${track.title}.mp3`;
                            a.click();
                            URL.revokeObjectURL(url);
                          } catch (err: any) {
                            showNotification(err.message || 'Download failed', 'error');
                          }
                        }}
                      >
                        <Download size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
          {/* ============ MY DOWNLOADS TAB ============ */}
          {activeTab === 'downloads' && (
            <section className="profile-section downloads-section">
              <div className="downloads-header">
                <div>
                  <h2>User <span style={{ color: 'var(--accent-color)' }}>Downloads</span> Manager</h2>
                  <p className="downloads-subtitle">Manage and access your purchased high-fidelity masters.</p>
                </div>
                <button className="bulk-dl-btn" onClick={() => {
                  purchasedTracks.forEach(async (track: any) => {
                    try {
                      const res = await fetch(apiUrl(`/api/downloads/${track.id}`));
                      if (!res.ok) return;
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${track.title}.mp3`;
                      a.click();
                      URL.revokeObjectURL(url);
                    } catch {}
                  });
                }}>
                  <ArrowDown size={16} />
                  Bulk Download
                </button>
              </div>

              <div className="downloads-search">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  className="downloads-search-input"
                  placeholder="Filter my collection..."
                  value={downloadSearch}
                  onChange={(e) => setDownloadSearch(e.target.value)}
                />
              </div>

              {purchasedLoading ? (
                <div className="profile-loading-spinner" style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                  <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent-color)' }} />
                </div>
              ) : purchasedTracks.length === 0 ? (
                <div className="dashboard-empty">
                  <Music size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                  <p>No purchased tracks yet.</p>
                  <button onClick={() => navigate('/browse')} className="save-btn" style={{ width: 'auto', display: 'inline-flex', marginTop: '0.5rem' }}>
                    Browse Catalog
                  </button>
                </div>
              ) : (
                <div className="downloads-table-wrap">
                  <table className="downloads-table">
                    <thead>
                      <tr>
                        <th>Track Name</th>
                        <th>Artist</th>
                        <th>BPM</th>
                        <th>Key</th>
                        <th className="col-action">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchasedTracks
                        .filter((track: any) => {
                          if (!downloadSearch) return true;
                          const q = downloadSearch.toLowerCase();
                          return track.title?.toLowerCase().includes(q) ||
                                 track.artist?.toLowerCase().includes(q);
                        })
                        .map((track: any) => (
                        <tr key={track.id} className="downloads-track-row">
                          <td>
                            <div className="downloads-track-cell">
                              <div className="downloads-track-art-wrap">
                                <img
                                  src={track.artwork_url || track.artwork || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=80&h=80&fit=crop'}
                                  alt={track.title}
                                  className="downloads-track-art"
                                />
                                <div className="downloads-track-play">
                                  <Play size={16} />
                                </div>
                              </div>
                              <span className="downloads-track-title">{track.title}</span>
                            </div>
                          </td>
                          <td className="downloads-artist">{track.artist}</td>
                          <td><span className="downloads-bpm">{track.bpm}</span></td>
                          <td><span className="downloads-key">{track.key}</span></td>
                          <td className="col-action">
                            <button
                              className="downloads-dl-btn"
                              onClick={async () => {
                                try {
                                  const res = await fetch(apiUrl(`/api/downloads/${track.id}`));
                                  if (!res.ok) throw new Error('Download failed');
                                  const blob = await res.blob();
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `${track.title}.mp3`;
                                  a.click();
                                  URL.revokeObjectURL(url);
                                } catch (err: any) {
                                  showNotification(err.message || 'Download failed', 'error');
                                }
                              }}
                            >
                              <Download size={14} />
                              Download
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="downloads-stats">
                <div className="downloads-stat-card">
                  <div className="dstat-label">Total Downloaded</div>
                  <div className="dstat-value">{purchasedTracks.length}</div>
                </div>
                <div className="downloads-stat-card">
                  <div className="dstat-label">Storage Used</div>
                  <div className="dstat-value">{(purchasedTracks.length * 8.5).toFixed(1)} <span className="dstat-unit">MB</span></div>
                </div>
                <div className="downloads-stat-card">
                  <div className="dstat-label">License Tier</div>
                  <div className="dstat-value">PRO</div>
                </div>
              </div>
            </section>
          )}

          {/* ============ PERSONAL INFO TAB ============ */}
          {activeTab === 'info' && (
            <section className="profile-section">
              <h2>Update Profile</h2>
              <form onSubmit={handleUpdateProfile} className="profile-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <div className="input-wrapper">
                    <User size={16} />
                    <input 
                      type="text" 
                      value={displayName} 
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <div className="input-wrapper disabled">
                    <Mail size={16} />
                    <input 
                      type="email" 
                      value={email} 
                      readOnly
                      disabled
                    />
                  </div>
                  <p className="input-hint">Email cannot be changed directly.</p>
                </div>

                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  <span>Save Changes</span>
                </button>
              </form>

              <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color, #333)', paddingTop: '1.5rem' }}>
                <h2>Account Role</h2>
                <div style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '1rem', background: 'var(--card-bg, #1e1e1e)', borderRadius: '8px',
                  marginTop: '1rem', flexWrap: 'wrap', gap: '1rem'
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                      {isAdmin ? 'Administrator' : isProducer ? 'Producer / Label' : 'Member'}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {isAdmin
                        ? 'Full access to all features, user management, and site configuration.'
                        : isProducer
                          ? 'Upload and manage your own tracks. Access the Producer Studio.'
                          : 'Browse, purchase, and download tracks. Upgrade to Producer to upload music.'}
                    </div>
                  </div>
                  {!isProducer && !isAdmin && (
                    <Link to="/auth?signup=producer" style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '8px 16px', background: '#3b82f6', color: 'white',
                      borderRadius: '8px', fontWeight: 'bold', fontSize: '13px',
                      textDecoration: 'none', whiteSpace: 'nowrap'
                    }}>
                      <BarChart3 size={16} /> Upgrade to Producer
                    </Link>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ============ ORDER HISTORY TAB ============ */}
          {activeTab === 'orders' && (
            <section className="profile-section">
              <h2>My Order History</h2>
              
              {ordersLoading ? (
                <div className="profile-loading-spinner" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem' }}>
                  <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent-color)', marginBottom: '0.5rem' }} />
                  <span>Loading purchase history...</span>
                </div>
              ) : orders.length === 0 ? (
                <div className="profile-empty-orders" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <ShoppingBag size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p>You haven't placed any orders yet.</p>
                  <button 
                    onClick={() => navigate('/browse')}
                    className="save-btn"
                    style={{ marginTop: '1rem', width: 'auto', display: 'inline-flex' }}
                  >
                    Browse Music Catalog
                  </button>
                </div>
              ) : (
                <div className="orders-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {orders.map((order) => (
                    <div 
                      key={order.id} 
                      className="order-card"
                      style={{ 
                        border: '1px solid var(--border-color, #333)', 
                        borderRadius: '8px', 
                        padding: '1.25rem',
                        background: 'var(--card-bg, #1e1e1e)' 
                      }}
                    >
                      <div 
                        className="order-card-header"
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          borderBottom: '1px solid var(--border-color, #333)',
                          paddingBottom: '0.75rem',
                          marginBottom: '0.75rem',
                          flexWrap: 'wrap',
                          gap: '0.5rem'
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '15px' }}>Order #{order.id.substring(0, 8).toUpperCase()}</strong>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {new Date(order.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontWeight: 'bold' }}>${Number(order.total_amount).toFixed(2)}</span>
                          <span 
                            className={`status-badge ${order.status}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              textTransform: 'uppercase',
                              backgroundColor: order.status === 'paid' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                              color: order.status === 'paid' ? '#4ade80' : '#fbbf24'
                            }}
                          >
                            {order.status === 'paid' ? <CheckCircle size={12} /> : <Clock size={12} />}
                            {order.status}
                          </span>
                        </div>
                      </div>

                      <div className="order-items-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {order.items.map((item) => (
                          <div 
                            key={item.id} 
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center' 
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <img 
                                src={item.track?.artwork_url || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=80&h=80&fit=crop'} 
                                alt={item.track?.title || 'Track'} 
                                style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }}
                              />
                              <div>
                                <div style={{ fontWeight: '500', fontSize: '14px' }}>
                                  {item.track?.title || 'Unknown Track'}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                  {item.track?.artist || 'Unknown Artist'} {item.track?.version && `(${item.track.version})`}
                                </div>
                              </div>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                ${Number(item.price_at_purchase).toFixed(2)}
                              </span>
                              {order.status === 'paid' && item.track?.audio_url && (
                                <a 
                                  href={`/api/downloads/${item.track.id}`}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--accent-color)',
                                    color: 'white',
                                    transition: 'all 0.2s'
                                  }}
                                  title="Download MP3"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    fetch(apiUrl(`/api/downloads/${item.track!.id}`)).then(res => {
                                      if (!res.ok) throw new Error('Download failed');
                                      return res.blob();
                                    }).then(blob => {
                                      const url = URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = `${item.track!.title}.mp3`;
                                      a.click();
                                      URL.revokeObjectURL(url);
                                    }).catch(err => {
                                      console.error('Download error:', err);
                                    });
                                  }}
                                >
                                  <Download size={15} />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default Profile;
