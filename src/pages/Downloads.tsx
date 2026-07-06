import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Download, Loader2, Music } from 'lucide-react';
import '../styles/orders.css';
import { apiUrl } from '../lib/apiBase';

interface Track {
  id: string;
  title: string;
  artist: string;
  version: string;
  artwork_url: string;
  bpm: number;
  key: string;
  genre: string;
  duration: string;
  purchased_at: string;
  download_count: number;
}

const Downloads = () => {
  const { user, loading: authLoading, token } = useAuth();
  const { showNotification } = useNotifications();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !token) return;

    const fetchDownloads = async () => {
      try {
        const res = await fetch(apiUrl('/api/downloads'), {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error('Failed to fetch downloads');
        const data = await res.json();
        setTracks(data as Track[]);
      } catch (error: unknown) {
        console.error('Error fetching downloads:', error);
        const message = error instanceof Error ? error.message : String(error);
        showNotification('Failed to load downloads: ' + message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDownloads();
  }, [user, token, showNotification]);

  const handleDownload = async (trackId: string, trackTitle: string) => {
    setDownloading(trackId);
    try {
      const res = await fetch(apiUrl(`/api/downloads/${trackId}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Download failed');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${trackTitle.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showNotification(`Downloading "${trackTitle}"`, 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(message);
      showNotification(message, 'error');
    } finally {
      setDownloading(null);
    }
  };

  if (authLoading) {
    return (
      <div className="orders-page">
        <div className="orders-loading">
          <Loader2 size={36} className="animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  return (
    <div className="orders-page">
      <h1 className="orders-title">
        <Download size={24} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
        My Downloads
      </h1>

      {loading ? (
        <div className="orders-loading">
          <Loader2 size={36} className="animate-spin" />
          <p>Loading your purchased tracks...</p>
        </div>
      ) : tracks.length === 0 ? (
        <div className="orders-empty">
          <Music size={48} style={{ color: 'var(--text-muted)' }} />
          <h2>No purchased tracks yet</h2>
          <p>When you purchase tracks, they will appear here for download.</p>
        </div>
      ) : (
        <div className="tracks-grid" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {tracks.map((track) => (
            <div key={track.id} className="order-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                <img
                  src={track.artwork_url || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100&h=100&fit=crop'}
                  alt={track.title}
                  style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '600', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{track.artist} {track.version && `(${track.version})`}</div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span>{track.bpm} BPM</span>
                    <span>{track.key}</span>
                    <span>{track.genre}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid var(--border-color, #333)', paddingTop: '0.75rem' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Downloaded {track.download_count} times
                </span>
                <button
                  className="pay-btn"
                  style={{ padding: '8px 16px', fontSize: '13px', width: 'auto', display: 'inline-flex', gap: '6px' }}
                  onClick={() => handleDownload(track.id, track.title)}
                  disabled={downloading === track.id}
                >
                  {downloading === track.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Download size={16} />
                  )}
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Downloads;
