import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload, Music, Image as ImageIcon, Loader2, Edit2, Trash2,
  RefreshCw, Save, X, ShieldOff, ChevronRight,
  AlertTriangle, CheckCircle, DollarSign, BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../lib/apiBase';
import { useNotifications } from '../context/NotificationContext';

type Tab = 'overview' | 'upload' | 'tracks';

interface TrackRecord {
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
  plays?: number;
}

const GENRES = [
  'Afro House',
  'Baile Funk/Favela Bass',
  'Bass House',
  'Big Room',
  'Drum & Bass',
  'EDM',
  'Hard Dance',
  'Hip Hop',
  'House',
  'K-Pop',
  'Latin',
  'Other',
  'Psy Trance',
  'Tech House',
  'Techno',
  'TikTok Dance',
  'Top 40',
];

const DEFAULT_FORM = {
  title: '', artist: '', version: '', version_type: 'clean',
  duration: '', bpm: '', key: '', genre: 'Top 40', price: '1.99',
  is_new: true, is_hot: false
};

const ProducerDashboard = () => {
  const { user, isProducer, isAdmin } = useAuth();
  const { showNotification } = useNotifications();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);

  const [tracks, setTracks] = useState<TrackRecord[]>([]);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [editingTrack, setEditingTrack] = useState<TrackRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchMyTracks = useCallback(async () => {
    setTracksLoading(true);
    try {
      const res = await fetch(apiUrl('/api/music/my'));
      if (res.ok) {
        const data = await res.json();
        setTracks(data as TrackRecord[]);
      }
    } catch (err) {
      console.error('Failed to fetch tracks:', err);
    } finally {
      setTracksLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isProducer || isAdmin) fetchMyTracks();
  }, [isProducer, isAdmin, fetchMyTracks]);

  if (!user) {
    return (
      <div className="admin-denied">
        <ShieldOff size={56} />
        <h2>Please sign in first</h2>
        <p>You need to be signed in to access the Producer Dashboard.</p>
        <Link to="/auth" className="admin-denied-btn">
          Sign In <ChevronRight size={16} />
        </Link>
      </div>
    );
  }

  if (!isProducer && !isAdmin) {
    return (
      <div className="admin-denied">
        <ShieldOff size={56} />
        <h2>Producer Access Required</h2>
        <p>Sign up as a Producer to upload and manage your tracks.</p>
        <Link to="/profile" className="admin-denied-btn">
          Upgrade to Producer <ChevronRight size={16} />
        </Link>
      </div>
    );
  }

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
      dataToSend.append('audioFile', audioFile);
      if (artworkFile) dataToSend.append('artworkFile', artworkFile);

      const res = await fetch(apiUrl('/api/music'), {
        method: 'POST',
        body: dataToSend,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Upload failed');

      setUploadStatus({ type: 'success', message: 'Track uploaded successfully!' });
      showNotification('Track uploaded!', 'success');
      setFormData(DEFAULT_FORM);
      setAudioFile(null);
      setArtworkFile(null);
      fetchMyTracks();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setUploadStatus({ type: 'error', message });
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(apiUrl(`/api/music/${id}`), {
        method: 'DELETE',
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

  const handleSaveEdit = async () => {
    if (!editingTrack) return;
    setSaving(true);
    try {
      const res = await fetch(apiUrl(`/api/music/${editingTrack.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingTrack),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to update');
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

  const totalPlays = tracks.reduce((sum, t) => sum + (t.plays || 0), 0);

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <BarChart3 size={20} style={{ color: 'var(--accent-color)' }} />
          <span>Producer Studio</span>
        </div>
        <div className="admin-user-info">
          <div className="admin-avatar">{user.email?.charAt(0).toUpperCase()}</div>
          <div>
            <div className="admin-user-name">{user.display_name || user.email?.split('@')[0]}</div>
            <div className="admin-user-role">Producer</div>
          </div>
        </div>
        <nav className="admin-nav">
          <button className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <BarChart3 size={18} />
            Overview
          </button>
          <button className={`admin-nav-item ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')}>
            <Upload size={18} />
            Upload Track
          </button>
          <button className={`admin-nav-item ${activeTab === 'tracks' ? 'active' : ''}`} onClick={() => setActiveTab('tracks')}>
            <Music size={18} />
            My Tracks
            {tracks.length > 0 && <span className="admin-badge-count">{tracks.length}</span>}
          </button>
        </nav>
      </aside>

      <div className="admin-main">
        {activeTab === 'overview' && (
          <div className="admin-content">
            <h1 className="admin-page-title">Producer Overview</h1>
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="stat-icon stat-icon-yellow"><Music size={22} /></div>
                <div className="stat-value">{tracks.length}</div>
                <div className="stat-label">My Tracks</div>
              </div>
              <div className="admin-stat-card">
                <div className="stat-icon stat-icon-green"><DollarSign size={22} /></div>
                <div className="stat-value">${tracks.filter(t => t.price > 0).reduce((sum, t) => sum + t.price, 0).toFixed(2)}</div>
                <div className="stat-label">Catalog Value</div>
              </div>
              <div className="admin-stat-card">
                <div className="stat-icon stat-icon-blue"><BarChart3 size={22} /></div>
                <div className="stat-value">{totalPlays.toLocaleString()}</div>
                <div className="stat-label">Total Plays</div>
              </div>
            </div>
            <div className="admin-quick-actions">
              <h2>Quick Actions</h2>
              <div className="quick-actions-grid">
                <button className="quick-action-card" onClick={() => setActiveTab('upload')}>
                  <Upload size={24} />
                  <span>Upload New Track</span>
                </button>
                <button className="quick-action-card" onClick={() => setActiveTab('tracks')}>
                  <Edit2 size={24} />
                  <span>Manage My Tracks</span>
                </button>
              </div>
            </div>
          </div>
        )}

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
                  <input name="title" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} required placeholder="e.g. Summer Vibes" />
                </div>
                <div className="form-group">
                  <label>Artist *</label>
                  <input name="artist" value={formData.artist} onChange={e => setFormData(p => ({ ...p, artist: e.target.value }))} required placeholder="e.g. Your Artist Name" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Version / Edit Name</label>
                  <input name="version" value={formData.version} onChange={e => setFormData(p => ({ ...p, version: e.target.value }))} placeholder="e.g. Extended Mix" />
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
              <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.is_new} onChange={e => setFormData(p => ({ ...p, is_new: e.target.checked }))} />
                  <span>Show "NEW" badge</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
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

        {activeTab === 'tracks' && (
          <div className="admin-content">
            <div className="admin-manage-header">
              <h1 className="admin-page-title">My Tracks</h1>
              <button className="admin-refresh-btn" onClick={fetchMyTracks}>
                <RefreshCw size={16} /> Refresh
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
                      <th>Plays</th>
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
                        <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{track.plays || 0}</td>
                        <td>
                          <div className="admin-action-cell">
                            <button className="admin-edit-btn" onClick={() => setEditingTrack(track)} title="Edit">
                              <Edit2 size={15} />
                            </button>
                            {deleteConfirmId === track.id ? (
                              <div className="delete-confirm">
                                <span>Confirm?</span>
                                <button className="admin-delete-btn confirm" onClick={() => handleDelete(track.id)} disabled={deleting}>
                                  {deleting ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
                                </button>
                                <button className="admin-cancel-btn" onClick={() => setDeleteConfirmId(null)}>
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <button className="admin-delete-btn" onClick={() => setDeleteConfirmId(track.id)} title="Delete">
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
      </div>

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
                  <label>Price ($)</label>
                  <input type="number" step="0.01" min="0" value={editingTrack.price} onChange={e => setEditingTrack(p => p ? { ...p, price: Number(e.target.value) } : p)} />
                </div>
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

export default ProducerDashboard;