import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload, Music, Image as ImageIcon, Loader2, Edit2, Trash2,
  LayoutDashboard, RefreshCw, Save, X, ShieldOff, ChevronRight,
  AlertTriangle, CheckCircle, Play, Database, ShoppingBag, DollarSign
} from 'lucide-react';
import { getSupabaseClient } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../lib/apiBase';
import { useNotifications } from '../context/NotificationContext';
import '../styles/admin-dashboard.css';

type Tab = 'overview' | 'upload' | 'manage' | 'orders';

interface Track {
  id: string;
  title: string;
  artist: string;
  version: string;
  version_type: string;
  duration: string;
  bpm: number;
  key: string;
  genre: string;
  price: number;
  audio_url: string;
  artwork_url: string;
  created_at: string;
  is_new?: boolean;
  is_hot?: boolean;
}

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

const DEFAULT_FORM = {
  title: '', artist: '', version: '', version_type: 'clean',
  duration: '', bpm: '', key: '', genre: 'Top 40', price: '1.99',
  is_new: true, is_hot: false
};

const Admin = () => {
  const { user, isAdmin, token, loading: authLoading } = useAuth();
  const { showNotification } = useNotifications();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);

  const [tracks, setTracks] = useState<Track[]>([]);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [confirmingOrder, setConfirmingOrder] = useState<string | null>(null);
  interface OrderRecord {
    id: string;
    status: string;
    total_amount?: number;
    created_at?: string;
    email?: string;
    payment_method?: string;
    promptpay_ref?: string | null;
  }
  const [ordersTyped, setOrdersTyped] = useState<OrderRecord[]>([]);

  const fetchTracks = useCallback(async () => {
    setTracksLoading(true);
    try {
      const res = await fetch(apiUrl('/api/music'));
      if (res.ok) {
        const data = await res.json();
        setTracks(data as Track[]);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Failed to fetch tracks:', message);
    } finally {
      setTracksLoading(false);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const normalized = (data || []) as OrderRecord[];
      setOrders(normalized);
      setOrdersTyped(normalized);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Failed to fetch orders:', message);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      Promise.resolve().then(() => {
        fetchTracks();
        fetchOrders();
      });
    }
  }, [isAdmin, fetchTracks, fetchOrders]);

  // ------- Access Control -------
  if (authLoading) {
    return (
      <div className="admin-loading">
        <Loader2 size={36} className="spin" />
        <p>Verifying access...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="admin-denied">
        <ShieldOff size={56} />
        <h2>Please sign in first</h2>
        <p>You need to be signed in to access this page.</p>
        <Link to="/auth" className="admin-denied-btn">
          Sign In <ChevronRight size={16} />
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-denied">
        <ShieldOff size={56} />
        <h2>Access Denied</h2>
        <p>You don't have admin privileges to access this page.</p>
        <Link to="/browse" className="admin-denied-btn">
          Back to Browse <ChevronRight size={16} />
        </Link>
      </div>
    );
  }

  // ------- Upload Handlers -------
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile) { 
      setUploadStatus({ type: 'error', message: 'Please select an audio file.' }); 
      return; 
    }

    setUploadLoading(true);
    setUploadStatus(null);

    try {
      const dataToSend = new FormData();
      dataToSend.append('title', formData.title);
      dataToSend.append('artist', formData.artist);
      dataToSend.append('version', formData.version);
      dataToSend.append('version_type', formData.version_type);
      dataToSend.append('duration', formData.duration || '0:00');
      dataToSend.append('bpm', formData.bpm);
      dataToSend.append('key', formData.key);
      dataToSend.append('genre', formData.genre);
      dataToSend.append('price', formData.price);
      dataToSend.append('is_new', String(formData.is_new));
      dataToSend.append('is_hot', String(formData.is_hot));
      
      // Attach files
      dataToSend.append('audioFile', audioFile);
      if (artworkFile) {
        dataToSend.append('artworkFile', artworkFile);
      }

      const res = await fetch(apiUrl('/api/music'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: dataToSend,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setUploadStatus({ type: 'success', message: '✅ Track uploaded successfully!' });
      showNotification('Track uploaded!', 'success');
      setFormData(DEFAULT_FORM);
      setAudioFile(null);
      setArtworkFile(null);
      fetchTracks();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setUploadStatus({ type: 'error', message: message || 'Upload failed.' });
    } finally {
      setUploadLoading(false);
    }
  };

  // ------- Delete Handler -------
  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(apiUrl(`/api/music/${id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Failed to delete');
      }

      showNotification('Track deleted.', 'success');
      setTracks(prev => prev.filter(t => t.id !== id));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      showNotification('Delete failed: ' + message, 'error');
    } finally {
      setDeleteConfirmId(null);
      setDeleting(false);
    }
  };

  // ------- Edit Handler -------
  const handleSaveEdit = async () => {
    if (!editingTrack) return;
    setSaving(true);
    try {
      const res = await fetch(apiUrl(`/api/music/${editingTrack.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editingTrack),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to update');
      }

      showNotification('Track updated!', 'success');
      setTracks(prev => prev.map(t => t.id === editingTrack.id ? result : t));
      setEditingTrack(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      showNotification('Update failed: ' + message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ------- Order Handlers -------
  const handleConfirmPayment = async (orderId: string) => {
    setConfirmingOrder(orderId);
    try {
      const client = getSupabaseClient();
      const { error } = await client
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', orderId);
      if (error) throw error;
      showNotification('Payment confirmed successfully', 'success');
      setOrdersTyped(prev => prev.map(o => o.id === orderId ? { ...o, status: 'paid' } : o));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      showNotification('Failed to confirm payment: ' + message, 'error');
    } finally {
      setConfirmingOrder(null);
    }
  };

  return (
    <div className="admin-page">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <LayoutDashboard size={20} style={{ color: 'var(--accent-color)' }} />
          <span>Dashboard</span>
        </div>
        <div className="admin-user-info">
          <div className="admin-avatar">{user.email?.charAt(0).toUpperCase()}</div>
          <div>
            <div className="admin-user-name">{user.email?.split('@')[0]}</div>
            <div className="admin-user-role">⚡ Admin</div>
          </div>
        </div>
        <nav className="admin-nav">
          <button className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <Database size={18} />
            Overview
          </button>
          <button className={`admin-nav-item ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')}>
            <Upload size={18} />
            Upload Track
          </button>
          <button className={`admin-nav-item ${activeTab === 'manage' ? 'active' : ''}`} onClick={() => setActiveTab('manage')}>
            <Music size={18} />
            Manage Tracks
            {tracks.length > 0 && <span className="admin-badge-count">{tracks.length}</span>}
          </button>
          <button className={`admin-nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
            <ShoppingBag size={18} />
            Orders
            {ordersTyped.filter(o => o.status === 'pending').length > 0 && (
              <span className="admin-badge-count" style={{ background: '#eab308' }}>
                {ordersTyped.filter(o => o.status === 'pending').length}
              </span>
            )}
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="admin-main">
        {/* =========== OVERVIEW TAB =========== */}
        {activeTab === 'overview' && (
          <div className="admin-content">
            <h1 className="admin-page-title">
              Overview
            </h1>
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="stat-icon stat-icon-yellow"><Music size={22} /></div>
                <div className="stat-value">{tracks.length}</div>
                <div className="stat-label">Total Tracks</div>
              </div>
              <div className="admin-stat-card">
                <div className="stat-icon stat-icon-blue"><Database size={22} /></div>
                <div className="stat-value">{tracks.filter(t => t.price === 0).length}</div>
                <div className="stat-label">Free Tracks</div>
              </div>
              <div className="admin-stat-card">
                <div className="stat-icon stat-icon-green"><CheckCircle size={22} /></div>
                <div className="stat-value">${tracks.filter(t => t.price > 0).reduce((sum, t) => sum + t.price, 0).toFixed(0)}</div>
                <div className="stat-label">Total Catalog Value</div>
              </div>
              <div className="admin-stat-card">
                <div className="stat-icon stat-icon-green"><DollarSign size={22} /></div>
                <div className="stat-value">${ordersTyped.filter(o => o.status === 'paid').reduce((sum, o) => sum + Number(o.total_amount ?? 0), 0).toFixed(2)}</div>
                <div className="stat-label">Total Revenue</div>
              </div>
              <div className="admin-stat-card">
                <div className="stat-icon" style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308' }}><ShoppingBag size={22} /></div>
                <div className="stat-value">{ordersTyped.filter(o => new Date(o.created_at ?? new Date().toISOString()).getMonth() === new Date().getMonth()).length}</div>
                <div className="stat-label">Orders This Month</div>
              </div>
            </div>

            <div className="admin-quick-actions">
              <h2>Quick Actions</h2>
              <div className="quick-actions-grid">
                <button className="quick-action-card" onClick={() => setActiveTab('upload')}>
                  <Upload size={24} />
                  <span>Upload New Track</span>
                </button>
                <button className="quick-action-card" onClick={() => setActiveTab('manage')}>
                  <Edit2 size={24} />
                  <span>Manage Tracks</span>
                </button>
                <Link to="/singles" className="quick-action-card">
                  <Play size={24} />
                  <span>View Singles Page</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* =========== UPLOAD TAB =========== */}
        {activeTab === 'upload' && (
          <div className="admin-content">
            <h1 className="admin-page-title">Upload New Track</h1>

            {uploadStatus && (
              <div className={`admin-status admin-status-${uploadStatus.type}`}>
                {uploadStatus.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                {uploadStatus.message}
              </div>
            )}

            <form className="admin-upload-form" onSubmit={handleUploadSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Track Title *</label>
                  <input name="title" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} required placeholder="e.g. Espresso" />
                </div>
                <div className="form-group">
                  <label>Artist *</label>
                  <input name="artist" value={formData.artist} onChange={e => setFormData(p => ({ ...p, artist: e.target.value }))} required placeholder="e.g. Sabrina Carpenter" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Version / Edit Name</label>
                  <input name="version" value={formData.version} onChange={e => setFormData(p => ({ ...p, version: e.target.value }))} placeholder="e.g. Disco Dan Remix" />
                </div>
                <div className="form-group">
                  <label>Version Type</label>
                  <select name="version_type" value={formData.version_type} onChange={e => setFormData(p => ({ ...p, version_type: e.target.value }))}>
                    <option value="clean">Clean</option>
                    <option value="dirty">Dirty</option>
                    <option value="intro">Intro</option>
                    <option value="acapella">Acapella</option>
                    <option value="instrumental">Instrumental</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>BPM *</label>
                  <input name="bpm" type="number" value={formData.bpm} onChange={e => setFormData(p => ({ ...p, bpm: e.target.value }))} required placeholder="128" />
                </div>
                <div className="form-group">
                  <label>Key *</label>
                  <input name="key" value={formData.key} onChange={e => setFormData(p => ({ ...p, key: e.target.value }))} required placeholder="8A" />
                </div>
                <div className="form-group">
                  <label>Duration</label>
                  <input name="duration" value={formData.duration} onChange={e => setFormData(p => ({ ...p, duration: e.target.value }))} placeholder="3:45" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Genre</label>
                  <select name="genre" value={formData.genre} onChange={e => setFormData(p => ({ ...p, genre: e.target.value }))}>
                    {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Price ($)</label>
                  <input name="price" type="number" step="0.01" min="0" value={formData.price} onChange={e => setFormData(p => ({ ...p, price: e.target.value }))} required />
                </div>
              </div>

              <div className="form-row" style={{ gap: '2rem', marginBottom: '1.5rem' }}>
                <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.is_new} onChange={e => setFormData(p => ({ ...p, is_new: e.target.checked }))} />
                  <span>Show "NEW" badge</span>
                </label>
                <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.is_hot} onChange={e => setFormData(p => ({ ...p, is_hot: e.target.checked }))} />
                  <span>Show "HOT" badge</span>
                </label>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Audio File (MP3/WAV) *</label>
                  <label className="file-drop-zone">
                    <Music size={28} />
                    <span>{audioFile ? audioFile.name : 'Click to select audio file'}</span>
                    {audioFile && <span className="file-size">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</span>}
                    <input type="file" accept="audio/mpeg,audio/wav" onChange={e => setAudioFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
                <div className="form-group">
                  <label>Artwork Image (Optional)</label>
                  <label className="file-drop-zone">
                    <ImageIcon size={28} />
                    <span>{artworkFile ? artworkFile.name : 'Click to select artwork'}</span>
                    {artworkFile && <span className="file-size">{(artworkFile.size / 1024 / 1024).toFixed(2)} MB</span>}
                    <input type="file" accept="image/jpeg,image/png" onChange={e => setArtworkFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
              </div>

              <button type="submit" className="admin-upload-btn" disabled={uploadLoading}>
                {uploadLoading ? (
                  <><Loader2 size={18} className="spin" /> Uploading...</>
                ) : (
                  <><Upload size={18} /> Upload Track</>
                )}
              </button>
            </form>
          </div>
        )}

        {/* =========== MANAGE TRACKS TAB =========== */}
        {activeTab === 'manage' && (
          <div className="admin-content">
            <div className="admin-manage-header">
              <h1 className="admin-page-title">Manage Tracks</h1>
              <button className="admin-refresh-btn" onClick={fetchTracks}>
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>

            {tracksLoading ? (
              <div className="admin-loading-inline">
                <Loader2 size={28} className="spin" />
                <span>Loading tracks...</span>
              </div>
            ) : tracks.length === 0 ? (
              <div className="admin-empty">
                <Music size={48} />
                <p>No tracks yet. Upload your first track!</p>
                <button className="admin-upload-btn" style={{ width: 'auto' }} onClick={() => setActiveTab('upload')}>
                  <Upload size={16} /> Upload Track
                </button>
              </div>
            ) : (
              <div className="admin-tracks-table-wrap">
                <table className="admin-tracks-table">
                  <thead>
                    <tr>
                      <th style={{ width: 50 }}></th>
                      <th>Track</th>
                      <th>BPM</th>
                      <th>Key</th>
                      <th>Genre</th>
                      <th>Price</th>
                      <th>Date</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tracks.map(track => (
                      <tr key={track.id} className="admin-track-row">
                        <td>
                          <img
                            src={track.artwork_url || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=80&h=80&fit=crop'}
                            alt={track.title}
                            className="admin-track-thumb"
                          />
                        </td>
                        <td>
                          <div className="admin-track-info">
                            <span className="admin-track-title">{track.title}</span>
                            <span className="admin-track-artist">{track.artist}</span>
                            {track.version && <span className="admin-version-tag">{track.version}</span>}
                          </div>
                        </td>
                        <td><span className="admin-meta">{track.bpm}</span></td>
                        <td><span className="admin-meta">{track.key}</span></td>
                        <td><span className="admin-genre-tag">{track.genre}</span></td>
                        <td>
                          <span className={track.price === 0 ? 'admin-free-badge' : 'admin-price'}>
                            {track.price === 0 ? 'FREE' : `$${track.price.toFixed(2)}`}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                          {new Date(track.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <div className="admin-action-cell">
                            <button
                              className="admin-edit-btn"
                              onClick={() => setEditingTrack(track)}
                              title="Edit"
                            >
                              <Edit2 size={15} />
                            </button>
                            {deleteConfirmId === track.id ? (
                              <div className="delete-confirm">
                                <span>Confirm?</span>
                                <button
                                  className="admin-delete-btn confirm"
                                  onClick={() => handleDelete(track.id)}
                                  disabled={deleting}
                                >
                                  {deleting ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
                                </button>
                                <button
                                  className="admin-cancel-btn"
                                  onClick={() => setDeleteConfirmId(null)}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <button
                                className="admin-delete-btn"
                                onClick={() => setDeleteConfirmId(track.id)}
                                title="Delete"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* =========== ORDERS TAB =========== */}
        {activeTab === 'orders' && (
          <div className="admin-content">
            <div className="admin-manage-header">
              <h1 className="admin-page-title">Manage Orders</h1>
              <button className="admin-refresh-btn" onClick={fetchOrders}>
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>

            {ordersLoading ? (
              <div className="admin-loading-inline">
                <Loader2 size={28} className="spin" />
                <span>Loading orders...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="admin-empty">
                <ShoppingBag size={48} />
                <p>No orders found.</p>
              </div>
            ) : (
              <div className="admin-tracks-table-wrap">
                <table className="admin-tracks-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Email / User</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id} className="admin-track-row">
                        <td><span className="admin-meta">{order.id.split('-')[0]}</span></td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                          {new Date(order.created_at ?? new Date().toISOString()).toLocaleDateString()}
                        </td>
                        <td>{order.email || 'Unknown'}</td>
                        <td><strong>${order.total_amount}</strong></td>
                        <td>
                          <span className={`order-status status-${order.status}`} style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', background: order.status === 'paid' ? 'rgba(34,197,94,0.1)' : order.status === 'pending' ? 'rgba(234,179,8,0.1)' : 'rgba(239,68,68,0.1)', color: order.status === 'paid' ? '#22c55e' : order.status === 'pending' ? '#eab308' : '#ef4444' }}>
                            {order.status.toUpperCase()}
                          </span>
                        </td>
                        <td>{order.payment_method} {order.promptpay_ref ? `(Ref: ${order.promptpay_ref})` : ''}</td>
                        <td style={{ textAlign: 'right' }}>
                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleConfirmPayment(order.id)}
                              disabled={confirmingOrder === order.id}
                              style={{ background: '#22c55e', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              {confirmingOrder === order.id ? <Loader2 size={14} className="spin" /> : 'Confirm'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingTrack && (
        <div className="admin-modal-overlay" onClick={() => setEditingTrack(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Edit Track</h2>
              <button className="admin-modal-close" onClick={() => setEditingTrack(null)}><X size={20} /></button>
            </div>
            <div className="admin-modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Title</label>
                  <input value={editingTrack.title} onChange={e => setEditingTrack(p => p ? { ...p, title: e.target.value } : p)} />
                </div>
                <div className="form-group">
                  <label>Artist</label>
                  <input value={editingTrack.artist} onChange={e => setEditingTrack(p => p ? { ...p, artist: e.target.value } : p)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>BPM</label>
                  <input type="number" value={editingTrack.bpm} onChange={e => setEditingTrack(p => p ? { ...p, bpm: Number(e.target.value) } : p)} />
                </div>
                <div className="form-group">
                  <label>Key</label>
                  <input value={editingTrack.key} onChange={e => setEditingTrack(p => p ? { ...p, key: e.target.value } : p)} />
                </div>
                <div className="form-group">
                  <label>Duration</label>
                  <input value={editingTrack.duration} onChange={e => setEditingTrack(p => p ? { ...p, duration: e.target.value } : p)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Genre</label>
                  <select value={editingTrack.genre} onChange={e => setEditingTrack(p => p ? { ...p, genre: e.target.value } : p)}>
                    {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Version Type</label>
                  <select value={editingTrack.version_type} onChange={e => setEditingTrack(p => p ? { ...p, version_type: e.target.value } : p)}>
                    <option value="clean">Clean</option>
                    <option value="dirty">Dirty</option>
                    <option value="intro">Intro</option>
                    <option value="acapella">Acapella</option>
                    <option value="instrumental">Instrumental</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Price ($)</label>
                  <input type="number" step="0.01" min="0" value={editingTrack.price} onChange={e => setEditingTrack(p => p ? { ...p, price: Number(e.target.value) } : p)} />
                </div>
              </div>

              <div className="form-row" style={{ gap: '2rem', marginTop: '0.5rem' }}>
                <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={editingTrack.is_new} onChange={e => setEditingTrack(p => p ? { ...p, is_new: e.target.checked } : p)} />
                  <span>Show "NEW" badge</span>
                </label>
                <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={editingTrack.is_hot} onChange={e => setEditingTrack(p => p ? { ...p, is_hot: e.target.checked } : p)} />
                  <span>Show "HOT" badge</span>
                </label>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-cancel-full-btn" onClick={() => setEditingTrack(null)}>
                <X size={16} /> Cancel
              </button>
              <button className="admin-save-btn" onClick={handleSaveEdit} disabled={saving}>
                {saving ? <><Loader2 size={16} className="spin" /> Saving...</> : <><Save size={16} /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
