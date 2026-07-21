import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Download, Loader2, Music } from 'lucide-react';
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
  const { user, loading: authLoading } = useAuth();
  const { showNotification } = useNotifications();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchDownloads = async () => {
      try {
        const res = await fetch(apiUrl('/api/downloads'));
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
  }, [user, showNotification]);

  const handleDownload = async (trackId: string, trackTitle: string) => {
    setDownloading(trackId);
    try {
      const res = await fetch(apiUrl(`/api/downloads/${trackId}`));
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Download failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${trackTitle.replace(/_/g, ' ').replace(/\s+/g, ' ').trim() || 'track'}.mp3`);
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={36} className="animate-spin text-electric-red" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" />;

  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-16 py-8">
      <h1 className="font-display text-3xl font-extrabold text-on-surface mb-8 flex items-center gap-3">
        <Download size={24} className="text-electric-red" /> My Downloads
      </h1>

      {loading ? (
        <div className="flex flex-col items-center py-20 gap-4 text-muted-text">
          <Loader2 size={36} className="animate-spin text-electric-red" />
          <p className="font-mono text-sm uppercase tracking-wider">Loading your purchased tracks...</p>
        </div>
      ) : tracks.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-4 text-muted-text">
          <Music size={48} className="opacity-30" />
          <h2 className="font-display text-xl font-bold text-on-surface">No purchased tracks yet</h2>
          <p>When you purchase tracks, they will appear here for download.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tracks.map((track) => (
            <div key={track.id} className="bg-surface-gray border border-border-gray rounded-xl p-4">
              <div className="flex gap-4 mb-4">
                <img
                  src={track.artwork_url || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100&h=100&fit=crop'}
                  alt={track.title}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />
                <div className="min-w-0">
                  <div className="font-bold text-on-surface truncate">{track.title}</div>
                  <div className="text-sm text-muted-text truncate">{track.artist} {track.version && `(${track.version})`}</div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-text">
                    <span>{track.bpm} BPM</span>
                    <span>{track.key}</span>
                    <span>{track.genre}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-border-gray">
                <span className="text-xs text-muted-text">Downloaded {track.download_count} times</span>
                <button
                  className="flex items-center gap-1.5 px-4 py-2 bg-electric-red text-white rounded-lg text-sm font-bold red-glow hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
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
