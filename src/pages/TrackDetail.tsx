import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Play, Pause, ShoppingCart, ArrowLeft, Heart, 
  Share2, Link as LinkIcon, Download, Disc, Clock,
  Calendar, Music2, BarChart3, Loader2, AlertCircle
} from 'lucide-react';
import { fetchTrackById, type Track } from '../lib/api';
import { directDownload } from '../lib/download';
import { useLanguage } from '../context/LanguageContext';
import { useAudio } from '../context/AudioContext';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import Waveform from '../components/Waveform';
import TrackRecommendations from '../components/TrackRecommendations';

const TrackDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { currentTrack, isPlaying, playTrack, togglePlay, currentTime, duration, seek } = useAudio();
  const { addToCart, isInCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { showNotification } = useNotifications();
  const { user } = useAuth();
  const [showShare, setShowShare] = useState(false);
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const loadTrack = async () => {
      if (!id) return;
      setLoading(true);
      const data = await fetchTrackById(id);
      setTrack(data);
      setLoading(false);
    };
    loadTrack();
  }, [id]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleFreeDownload = async () => {
    if (!track) return;
    if (!user) {
      showNotification('Please sign in to download', 'error');
      navigate('/auth');
      return;
    }
    setDownloading(true);
    try {
      await directDownload(track.id, track.title);
      showNotification(`Downloading "${track.title}"`, 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      showNotification(message, 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handlePlay = () => {
    if (!track) return;
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playTrack({
        id: track.id,
        title: track.title,
        artist: track.artist,
        artwork: track.artwork,
        preview_url: track.preview_url
      });
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showNotification('Link copied to clipboard!', 'success');
    setShowShare(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-text">
        <Loader2 className="animate-spin text-electric-red" size={48} />
        <p className="font-mono text-sm uppercase tracking-wider">Loading track details...</p>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-text">
        <AlertCircle size={64} className="text-electric-red" />
        <h2 className="font-display text-2xl font-bold text-on-surface">Track Not Found</h2>
        <p>Sorry, we couldn't find the track you're looking for.</p>
        <button 
          className="flex items-center gap-2 px-6 py-3 bg-surface-gray border border-border-gray rounded-lg text-muted-text hover:text-on-surface hover:border-electric-red transition-all"
          onClick={() => navigate('/singles')}
        >
          <ArrowLeft size={20} /> {t('pack.back')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 lg:px-16 py-8">
      {/* Top Navigation */}
      <div className="flex justify-between items-center mb-8">
        <button 
          className="flex items-center gap-2 text-muted-text hover:text-on-surface transition-colors"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={20} /> {t('pack.back')}
        </button>
        
        <div className="relative">
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-surface-gray border border-border-gray rounded-lg text-muted-text hover:text-on-surface transition-colors"
            onClick={() => setShowShare(!showShare)}
          >
            <Share2 size={18} /> Share
          </button>
          
          {showShare && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-surface-container border border-border-gray rounded-lg shadow-xl overflow-hidden z-50">
              <button 
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-muted-text hover:text-on-surface hover:bg-surface-container-high transition-colors"
                onClick={() => window.open('https://www.facebook.com/profile.php?id=61592144669937')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                Facebook
              </button>
              <button 
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-muted-text hover:text-on-surface hover:bg-surface-container-high transition-colors"
                onClick={() => window.open('https://www.tiktok.com/@djmusicmarketplace')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
                TikTok
              </button>
              <button 
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-muted-text hover:text-on-surface hover:bg-surface-container-high transition-colors"
                onClick={copyLink}
              >
                <LinkIcon size={18} /> Copy Link
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <div className="flex flex-col lg:flex-row gap-8 mb-12">
        {/* Artwork */}
        <div className="relative w-full lg:w-[400px] aspect-square rounded-xl overflow-hidden bg-surface-gray flex-shrink-0">
          <img src={track.artwork} alt={track.title} className="w-full h-full object-cover" />
          <button 
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
            onClick={handlePlay}
          >
            <div className="w-20 h-20 bg-electric-red rounded-full flex items-center justify-center text-white red-glow">
              {currentTrack?.id === track.id && isPlaying ? <Pause size={40} fill="white" /> : <Play size={40} fill="white" />}
            </div>
          </button>
        </div>
        
        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-4">
            <span className="font-mono text-xs font-bold text-electric-red uppercase tracking-wider">{track.genre}</span>
            <span className="text-border-gray">•</span>
            <span className="font-mono text-xs text-muted-text uppercase tracking-wider">{track.version}</span>
          </div>
          
          <h1 className="font-display text-4xl lg:text-5xl font-extrabold text-on-surface mb-2">{track.title}</h1>
          <p className="text-xl text-muted-text mb-6">By {track.artist}</p>
          
          <div className="flex items-center gap-6 mb-6">
            <div className="flex items-center gap-2 text-muted-text">
              <BarChart3 size={18} />
              <span className="font-mono text-sm">{(track.plays || 0).toLocaleString()} plays</span>
            </div>
            <div className="flex items-center gap-2 text-muted-text">
              <Calendar size={18} />
              <span className="font-mono text-sm">Released {track.date}</span>
            </div>
          </div>

          <div className="mb-8">
            <Waveform 
              isPlaying={currentTrack?.id === track.id && isPlaying} 
              progress={currentTrack?.id === track.id ? progress : 0} 
              onSeek={(percent) => seek(percent * duration)}
            />
          </div>

          <div className="flex items-center gap-4">
            {track.price === 0 ? (
              <button 
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-electric-red text-white rounded-lg font-bold uppercase tracking-wider red-glow hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                onClick={handleFreeDownload}
                disabled={downloading}
              >
                {downloading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                {downloading ? 'Downloading...' : 'Download Free'}
              </button>
            ) : (
              <button 
                className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-bold uppercase tracking-wider transition-all ${
                  isInCart(track.id) 
                    ? 'bg-success-green text-white' 
                    : 'bg-electric-red text-white red-glow hover:brightness-110 active:scale-[0.98]'
                }`}
                onClick={() => addToCart({ id: track.id, title: track.title, price: track.price ?? 0, artwork: track.artwork, artist: track.artist })}
                disabled={isInCart(track.id)}
              >
                <ShoppingCart size={20} />
                {isInCart(track.id) ? 'Added to Cart' : `Add to Cart — $${track.price.toFixed(2)}`}
              </button>
            )}
            <button 
              className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all ${
                isFavorite(track.id) 
                  ? 'border-electric-red bg-electric-red/10 text-electric-red' 
                  : 'border-border-gray text-muted-text hover:border-electric-red hover:text-electric-red'
              }`}
              onClick={() => toggleFavorite({
                id: track.id,
                title: track.title,
                artist: track.artist,
                artwork: track.artwork
              })}
            >
              <Heart size={24} fill={isFavorite(track.id) ? "#FF3B30" : "none"} />
            </button>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Technical Details */}
        <div className="bg-surface-gray border border-border-gray rounded-xl p-6">
          <h3 className="font-display text-lg font-bold text-on-surface mb-4">Technical Details</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border-gray">
              <div className="flex items-center gap-2 text-muted-text">
                <Music2 size={16} />
                <span className="font-mono text-sm">BPM</span>
              </div>
              <span className="font-mono text-sm font-bold text-on-surface">{track.bpm}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border-gray">
              <div className="flex items-center gap-2 text-muted-text">
                <Disc size={16} />
                <span className="font-mono text-sm">Key</span>
              </div>
              <span className="font-mono text-sm font-bold text-on-surface">{track.key}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border-gray">
              <div className="flex items-center gap-2 text-muted-text">
                <Clock size={16} />
                <span className="font-mono text-sm">Duration</span>
              </div>
              <span className="font-mono text-sm font-bold text-on-surface">{track.duration}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <div className="flex items-center gap-2 text-muted-text">
                <div className={`w-3 h-3 rounded-full ${
                  track.versionType === 'original' ? 'bg-electric-red' : 
                  track.versionType === 'extended' ? 'bg-success-green' : 
                  'bg-surface-bright'
                }`} />
                <span className="font-mono text-sm">Version</span>
              </div>
              <span className="font-mono text-sm font-bold text-on-surface">{track.version}</span>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-surface-gray border border-border-gray rounded-xl p-6">
          <h3 className="font-display text-lg font-bold text-on-surface mb-4">About this Track</h3>
          <p className="text-muted-text text-sm mb-6">
            This track is a high-quality 320kbps MP3 file, 
            professionally edited for seamless DJ transitions. 
            Perfect for club sets and radio shows.
          </p>
          <Link 
            to="/singles" 
            className="inline-flex items-center gap-2 text-electric-red font-mono text-sm font-bold uppercase tracking-wider hover:brightness-125 transition-all"
          >
            View All Singles →
          </Link>
        </div>

        {/* Recommendations */}
        {track && (
          <TrackRecommendations
            currentId={track.id}
            genre={track.genre}
          />
        )}
      </div>
    </div>
  );
};

export default TrackDetail;
