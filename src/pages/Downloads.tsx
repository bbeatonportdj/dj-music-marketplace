import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, ChevronLeft, ChevronRight, User } from 'lucide-react';
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
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 5;

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    // Simulate fetching purchased tracks
    setTimeout(() => {
      setTracks([
        { id: '1', title: 'Groove Theory', artist: 'Deep Vibe Collective', bpm: 124, key: '4A', format: 'mp3', purchased_at: '2024-01-15' },
        { id: '2', title: 'Techno System (Original Mix)', artist: 'DJ Marcus', bpm: 130, key: '8A', format: 'wav', purchased_at: '2024-01-14' },
        { id: '3', title: 'Summer Feels', artist: 'Sunset Crew', bpm: 118, key: '1B', format: 'mp3', purchased_at: '2024-01-13' },
        { id: '4', title: 'Acid Rain', artist: 'The Synthetic', bpm: 128, key: '6A', format: 'aiff', purchased_at: '2024-01-12' },
        { id: '5', title: 'House Anthems Vol. 2', artist: 'Various Artists', bpm: 125, key: '5B', format: 'mp3', purchased_at: '2024-01-11' },
        { id: '6', title: 'Trance Odyssey', artist: 'Astra Project', bpm: 138, key: '9B', format: 'wav', purchased_at: '2024-01-10' },
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
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* User Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <User size={20} className="text-gray-400" />
            </div>
            <div>
              <h1 className="text-[16px] font-bold text-black">{user?.display_name || user?.email?.split('@')[0] || 'User'}</h1>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded">Pro DJ</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`px-6 py-4 text-[13px] font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-black'
                }`}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'library' && (
              <>
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Table Header (Desktop) */}
                    <div className="hidden lg:grid grid-cols-[2fr_1.5fr_80px_80px_100px] gap-4 px-4 py-3 border-b border-gray-100 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      <span>TITLE</span>
                      <span>ARTIST</span>
                      <span className="text-right">BPM</span>
                      <span className="text-right">KEY</span>
                      <span className="text-right"></span>
                    </div>

                    {/* Track Rows */}
                    <div className="divide-y divide-gray-50">
                      {tracks.map(track => (
                        <div
                          key={track.id}
                          className="grid grid-cols-[1fr] lg:grid-cols-[2fr_1.5fr_80px_80px_100px] gap-2 lg:gap-4 items-center px-4 py-4 hover:bg-gray-50 transition-colors"
                        >
                          {/* Title */}
                          <div className="min-w-0">
                            <p className="font-semibold text-[13px] text-black truncate">{track.title}</p>
                          </div>

                          {/* Artist */}
                          <span className="text-[13px] text-gray-500 truncate">{track.artist}</span>

                          {/* BPM */}
                          <span className="text-[13px] text-black text-right font-mono">{track.bpm}</span>

                          {/* Key */}
                          <span className="text-[13px] text-gray-500 text-right font-mono">{track.key}</span>

                          {/* Download Button */}
                          <div className="flex justify-end">
                            <button
                              className="px-4 py-2 bg-blue-600 text-white text-[12px] font-semibold rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                              onClick={() => handleDownload(track)}
                              disabled={downloadingId === track.id}
                            >
                              {downloadingId === track.id ? (
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Download size={12} />
                              )}
                              Download
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-gray-100">
                      <button
                        className="p-2 border border-gray-200 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft size={16} className="text-gray-400" />
                      </button>
                      <span className="text-[13px] text-gray-500">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        className="p-2 border border-gray-200 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight size={16} className="text-gray-400" />
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {activeTab === 'wishlist' && (
              <div className="flex flex-col items-center py-16 gap-4">
                <p className="text-[14px] text-gray-500">Your wishlist is empty</p>
                <button 
                  className="px-5 py-2.5 bg-blue-600 text-white text-[13px] font-semibold rounded-md hover:bg-blue-700 transition-colors"
                  onClick={() => navigate('/browse')}
                >
                  Browse Tracks
                </button>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-[400px] space-y-4">
                <div>
                  <label className="block text-[12px] text-gray-500 uppercase tracking-wider mb-2">Display Name</label>
                  <input
                    type="text"
                    defaultValue={user?.display_name || ''}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md text-[13px] text-black focus:outline-none focus:border-blue-300"
                  />
                </div>
                <div>
                  <label className="block text-[12px] text-gray-500 uppercase tracking-wider mb-2">Email</label>
                  <input
                    type="email"
                    defaultValue={user?.email || ''}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md text-[13px] text-black focus:outline-none focus:border-blue-300"
                    disabled
                  />
                </div>
                <button className="px-5 py-2.5 bg-blue-600 text-white text-[13px] font-semibold rounded-md hover:bg-blue-700 transition-colors">
                  Save Changes
                </button>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="flex flex-col items-center py-16 gap-4">
                <p className="text-[14px] text-gray-500">No download history yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Downloads;
