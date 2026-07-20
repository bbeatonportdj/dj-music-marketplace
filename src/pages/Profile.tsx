import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, Mail, Shield, Save, Loader2, 
  LogOut, ChevronRight, UserCircle, BarChart3,
  ShoppingBag, Download, CheckCircle, Clock,
  Music, HardDrive, CreditCard, Search, ArrowDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { apiUrl } from '../lib/apiBase';

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
    if (!user) navigate('/auth');
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

  const tabs = [
    { id: 'dashboard' as const, icon: BarChart3, label: 'Dashboard' },
    { id: 'downloads' as const, icon: Download, label: 'My Downloads' },
    { id: 'info' as const, icon: User, label: 'Personal Info' },
    { id: 'orders' as const, icon: ShoppingBag, label: 'Order History' },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-16 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-20 h-20 rounded-full bg-surface-gray border border-border-gray flex items-center justify-center">
          <UserCircle size={48} className="text-muted-text" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-extrabold text-on-surface">{user.display_name || 'User'}</h1>
          <p className="text-muted-text text-sm">{email}</p>
          <div className="flex gap-2 mt-2">
            {isAdmin && <span className="px-2 py-0.5 bg-yellow-500/15 text-yellow-500 text-[11px] font-mono font-bold rounded-full uppercase tracking-wider">Admin</span>}
            {isProducer && <span className="px-2 py-0.5 bg-blue-500/15 text-blue-500 text-[11px] font-mono font-bold rounded-full uppercase tracking-wider">Producer</span>}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Nav */}
        <aside className="w-full lg:w-[240px] flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button 
                key={tab.id}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-electric-red text-white' 
                    : 'text-muted-text hover:text-on-surface hover:bg-surface-gray'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
              </button>
            ))}
            {isProducer && (
              <button 
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-muted-text hover:text-on-surface hover:bg-surface-gray transition-colors"
                onClick={() => navigate('/producer')}
              >
                <BarChart3 size={18} />
                <span>Producer Studio</span>
                <ChevronRight size={14} className="ml-auto" />
              </button>
            )}
            {isAdmin && (
              <button 
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-muted-text hover:text-on-surface hover:bg-surface-gray transition-colors"
                onClick={() => navigate('/admin')}
              >
                <Shield size={18} />
                <span>Admin Dashboard</span>
                <ChevronRight size={14} className="ml-auto" />
              </button>
            )}
            <div className="border-t border-border-gray my-2" />
            <button 
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-muted-text hover:text-electric-red hover:bg-electric-red/10 transition-colors"
              onClick={handleSignOut}
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <section>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { icon: Music, label: 'Purchased Tracks', value: totalDownloads, color: 'text-electric-red' },
                  { icon: Download, label: 'Available Downloads', value: totalDownloads, color: 'text-success-green' },
                  { icon: CreditCard, label: 'Total Spent', value: `$${totalSpent.toFixed(2)}`, color: 'text-blue-500' },
                  { icon: HardDrive, label: 'Account Type', value: isAdmin ? 'Admin' : isProducer ? 'Producer' : 'Member', color: 'text-yellow-500' },
                ].map((stat, i) => (
                  <div key={i} className="bg-surface-gray border border-border-gray rounded-xl p-4">
                    <stat.icon size={24} className={`${stat.color} mb-3`} />
                    <div className="font-mono text-xl font-bold text-on-surface">{stat.value}</div>
                    <div className="font-mono text-xs text-muted-text uppercase tracking-wider mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>

              <h2 className="font-display text-xl font-bold text-on-surface mb-4">My Downloads</h2>
              {purchasedLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin text-electric-red" size={32} />
                </div>
              ) : purchasedTracks.length === 0 ? (
                <div className="py-12 text-center text-muted-text">
                  <Music size={40} className="mx-auto mb-4 opacity-30" />
                  <p>No purchased tracks yet.</p>
                  <button 
                    onClick={() => navigate('/browse')} 
                    className="mt-4 px-4 py-2 bg-electric-red text-white rounded-lg text-sm font-bold"
                  >
                    Browse Catalog
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {purchasedTracks.map((track: any) => (
                    <div key={track.id} className="flex items-center gap-4 p-3 bg-surface-gray border border-border-gray rounded-xl">
                      <img
                        src={track.artwork_url || track.artwork || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=80&h=80&fit=crop'}
                        alt={track.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-on-surface truncate">{track.title}</div>
                        <div className="text-sm text-muted-text">{track.artist}</div>
                      </div>
                      <div className="hidden sm:flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-text">{track.bpm} BPM</span>
                        <span className="font-mono text-xs text-muted-text">{track.key}</span>
                      </div>
                      <button
                        className="p-2 bg-electric-red text-white rounded-lg red-glow"
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

          {/* Downloads Tab */}
          {activeTab === 'downloads' && (
            <section>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="font-display text-xl font-bold text-on-surface">User <span className="text-electric-red">Downloads</span> Manager</h2>
                  <p className="text-sm text-muted-text mt-1">Manage and access your purchased high-fidelity masters.</p>
                </div>
                <button 
                  className="flex items-center gap-2 px-4 py-2 bg-surface-gray border border-border-gray rounded-lg text-sm text-muted-text hover:text-on-surface transition-colors"
                  onClick={() => {
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
                  }}
                >
                  <ArrowDown size={16} /> Bulk Download
                </button>
              </div>

              <div className="relative mb-6">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text" />
                <input
                  type="text"
                  placeholder="Filter my collection..."
                  value={downloadSearch}
                  onChange={(e) => setDownloadSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-surface-gray border border-border-gray rounded-lg text-sm text-on-surface placeholder:text-border-gray focus:outline-none focus:border-electric-red transition-colors"
                />
              </div>

              {purchasedLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin text-electric-red" size={32} />
                </div>
              ) : purchasedTracks.length === 0 ? (
                <div className="py-12 text-center text-muted-text">
                  <Music size={48} className="mx-auto mb-4 opacity-30" />
                  <p>No purchased tracks yet.</p>
                  <button 
                    onClick={() => navigate('/browse')} 
                    className="mt-4 px-4 py-2 bg-electric-red text-white rounded-lg text-sm font-bold"
                  >
                    Browse Catalog
                  </button>
                </div>
              ) : (
                <div className="bg-surface-gray border border-border-gray rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border-gray">
                        <th className="text-left py-3 px-4 font-mono text-xs text-muted-text uppercase tracking-wider">Track Name</th>
                        <th className="text-left py-3 px-4 font-mono text-xs text-muted-text uppercase tracking-wider hidden md:table-cell">Artist</th>
                        <th className="text-left py-3 px-4 font-mono text-xs text-muted-text uppercase tracking-wider hidden md:table-cell">BPM</th>
                        <th className="text-left py-3 px-4 font-mono text-xs text-muted-text uppercase tracking-wider hidden md:table-cell">Key</th>
                        <th className="text-right py-3 px-4 font-mono text-xs text-muted-text uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchasedTracks
                        .filter((track: any) => {
                          if (!downloadSearch) return true;
                          const q = downloadSearch.toLowerCase();
                          return track.title?.toLowerCase().includes(q) || track.artist?.toLowerCase().includes(q);
                        })
                        .map((track: any) => (
                        <tr key={track.id} className="border-b border-border-gray last:border-b-0 hover:bg-surface-container-high transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={track.artwork_url || track.artwork || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=80&h=80&fit=crop'}
                                alt={track.title}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                              <span className="font-bold text-on-surface">{track.title}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell text-muted-text">{track.artist}</td>
                          <td className="py-3 px-4 hidden md:table-cell"><span className="font-mono text-sm text-on-surface">{track.bpm}</span></td>
                          <td className="py-3 px-4 hidden md:table-cell"><span className="font-mono text-sm text-on-surface">{track.key}</span></td>
                          <td className="py-3 px-4 text-right">
                            <button
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-electric-red text-white rounded-lg text-xs font-bold red-glow"
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
                              <Download size={14} /> Download
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 mt-6">
                {[
                  { label: 'Total Downloaded', value: purchasedTracks.length },
                  { label: 'Storage Used', value: `${(purchasedTracks.length * 8.5).toFixed(1)} MB` },
                  { label: 'License Tier', value: 'PRO' },
                ].map((stat, i) => (
                  <div key={i} className="bg-surface-gray border border-border-gray rounded-xl p-4 text-center">
                    <div className="font-mono text-xs text-muted-text uppercase tracking-wider mb-2">{stat.label}</div>
                    <div className="font-mono text-lg font-bold text-on-surface">{stat.value}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Personal Info Tab */}
          {activeTab === 'info' && (
            <section>
              <h2 className="font-display text-xl font-bold text-on-surface mb-6">Update Profile</h2>
              <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-mono text-muted-text uppercase tracking-wider mb-2">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text" />
                    <input 
                      type="text" 
                      value={displayName} 
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full pl-10 pr-3 py-3 bg-surface-gray border border-border-gray rounded-lg text-on-surface placeholder:text-border-gray focus:outline-none focus:border-electric-red transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-muted-text uppercase tracking-wider mb-2">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text" />
                    <input 
                      type="email" 
                      value={email} 
                      readOnly
                      disabled
                      className="w-full pl-10 pr-3 py-3 bg-surface-container border border-border-gray rounded-lg text-muted-text cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-border-gray mt-1">Email cannot be changed directly.</p>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-electric-red text-white rounded-lg font-bold uppercase tracking-wider red-glow hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  <span>Save Changes</span>
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-border-gray">
                <h2 className="font-display text-xl font-bold text-on-surface mb-4">Account Role</h2>
                <div className="flex items-center justify-between p-4 bg-surface-gray border border-border-gray rounded-xl">
                  <div>
                    <div className="font-bold text-on-surface">
                      {isAdmin ? 'Administrator' : isProducer ? 'Producer / Label' : 'Member'}
                    </div>
                    <div className="text-sm text-muted-text mt-1">
                      {isAdmin
                        ? 'Full access to all features, user management, and site configuration.'
                        : isProducer
                          ? 'Upload and manage your own tracks. Access the Producer Studio.'
                          : 'Browse, purchase, and download tracks. Upgrade to Producer to upload music.'}
                    </div>
                  </div>
                  {!isProducer && !isAdmin && (
                    <Link 
                      to="/auth?signup=producer" 
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-bold whitespace-nowrap"
                    >
                      <BarChart3 size={16} /> Upgrade to Producer
                    </Link>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Order History Tab */}
          {activeTab === 'orders' && (
            <section>
              <h2 className="font-display text-xl font-bold text-on-surface mb-6">My Order History</h2>
              
              {ordersLoading ? (
                <div className="flex flex-col items-center py-12 gap-2">
                  <Loader2 className="animate-spin text-electric-red" size={32} />
                  <span className="text-sm text-muted-text">Loading purchase history...</span>
                </div>
              ) : orders.length === 0 ? (
                <div className="py-12 text-center text-muted-text">
                  <ShoppingBag size={48} className="mx-auto mb-4 opacity-50" />
                  <p>You haven't placed any orders yet.</p>
                  <button 
                    onClick={() => navigate('/browse')}
                    className="mt-4 px-4 py-2 bg-electric-red text-white rounded-lg text-sm font-bold"
                  >
                    Browse Music Catalog
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-surface-gray border border-border-gray rounded-xl overflow-hidden">
                      <div className="flex justify-between items-center px-4 py-3 border-b border-border-gray">
                        <div>
                          <strong className="text-on-surface">Order #{order.id.substring(0, 8).toUpperCase()}</strong>
                          <div className="text-xs text-muted-text mt-1">{new Date(order.created_at).toLocaleDateString()}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-on-surface">${Number(order.total_amount).toFixed(2)}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                            order.status === 'paid' 
                              ? 'bg-success-green/10 text-success-green' 
                              : 'bg-yellow-500/10 text-yellow-500'
                          }`}>
                            {order.status === 'paid' ? <CheckCircle size={12} /> : <Clock size={12} />}
                            {order.status}
                          </span>
                        </div>
                      </div>

                      <div className="divide-y divide-border-gray">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img 
                                src={item.track?.artwork_url || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=80&h=80&fit=crop'} 
                                alt={item.track?.title || 'Track'} 
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                              <div>
                                <div className="font-medium text-on-surface text-sm">{item.track?.title || 'Unknown Track'}</div>
                                <div className="text-xs text-muted-text">
                                  {item.track?.artist || 'Unknown Artist'} {item.track?.version && `(${item.track.version})`}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-muted-text">${Number(item.price_at_purchase).toFixed(2)}</span>
                              {order.status === 'paid' && item.track?.audio_url && (
                                <button 
                                  className="w-8 h-8 flex items-center justify-center rounded-full bg-electric-red text-white red-glow"
                                  onClick={() => {
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
                                    }).catch(err => console.error('Download error:', err));
                                  }}
                                >
                                  <Download size={15} />
                                </button>
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
