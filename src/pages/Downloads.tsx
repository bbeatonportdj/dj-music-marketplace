import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { directDownload } from '../lib/download';

interface PurchasedTrack {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  format: string;
  purchased_at: string;
}

const Downloads = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotifications();
  
  const [activeTab, setActiveTab] = useState<'library' | 'wishlist' | 'settings' | 'history'>('library');
  const [tracks, setTracks] = useState<PurchasedTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setTimeout(() => {
      setTracks([
        { id: '1', title: 'Groove Theory', artist: 'Deep Vibe Collective', bpm: 124, key: '4A', format: 'mp3', purchased_at: '2024-01-15' },
        { id: '2', title: 'Techno System (Original Mix)', artist: 'DJ Marcus', bpm: 130, key: '8A', format: 'wav', purchased_at: '2024-01-14' },
        { id: '3', title: 'Summer Feels', artist: 'Sunset Crew', bpm: 118, key: '1B', format: 'mp3', purchased_at: '2024-01-13' },
        { id: '4', title: 'Acid Rain', artist: 'The Synthetic', bpm: 128, key: '6A', format: 'aiff', purchased_at: '2024-01-12' },
      ]);
      setLoading(false);
    }, 1000);
  }, [user, navigate]);

  const handleDownload = async (track: PurchasedTrack) => {
    setDownloadingId(track.id);
    try {
      await directDownload(track.id, track.title);
      showNotification(`Downloading "${track.title}"`, 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      showNotification(message, 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  const tabs = [
    { id: 'library', label: 'My Library' },
    { id: 'wishlist', label: 'Wishlist' },
    { id: 'settings', label: 'Account Settings' },
    { id: 'history', label: 'Download History' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* User Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-[#FC4239] flex items-center justify-center">
            <User size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-[16px] font-bold text-white">{user?.display_name || user?.email?.split('@')[0] || 'User'}</h1>
            <span className="px-2 py-0.5 bg-[#FC4239]/15 text-[#FC4239] text-[10px] font-bold rounded-full border border-[#FC4239]/40">Pro DJ</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-[#0F0F0F] rounded-xl border border-white/[0.06] overflow-hidden">
          <div className="flex border-b border-white/[0.06] overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`px-6 py-4 text-[13px] font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'text-[#FC4239] border-b-2 border-[#FC4239]'
                    : 'text-white/45 hover:text-white'
                }`}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-white/10 border-t-[#FC4239] rounded-full animate-spin" />
              </div>
            ) : activeTab === 'library' ? (
              <div className="space-y-3">
                {tracks.map(track => (
                  <div key={track.id} className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-lg border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[13px] text-white truncate">{track.title}</p>
                      <p className="text-[12px] text-white/45">{track.artist} · {track.bpm} BPM · {track.key}</p>
                    </div>
                    <span className="text-[10px] font-mono text-white/30 uppercase">{track.format}</span>
                    <button
                      className="px-4 py-2 bg-[#FC4239] text-white text-[12px] font-semibold rounded-lg hover:bg-[#e03a32] transition-colors flex items-center gap-2"
                      onClick={() => handleDownload(track)}
                      disabled={downloadingId === track.id}
                    >
                      {downloadingId === track.id ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Download size={14} />
                      )}
                      Download
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-16 gap-3">
                <p className="text-[14px] text-white/45">No content available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Downloads;
