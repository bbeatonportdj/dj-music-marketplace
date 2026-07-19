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
import '../styles/track-detail.css';

const TrackDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { currentTrack, isPlaying, playTrack, togglePlay, currentTime, duration } = useAudio();
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

  // Calculate real progress for the Waveform
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
    showNotification(
      'Link copied to clipboard!', 
      'success'
    );
    setShowShare(false);
  };

  if (loading) {
    return (
      <div className="track-detail-loading">
        <Loader2 className="animate-spin" size={48} />
        <p>Loading track details...</p>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="track-detail-error">
        <AlertCircle size={64} />
        <h2>Track Not Found</h2>
        <p>Sorry, we couldn't find the track you're looking for.</p>
        <button className="back-btn" onClick={() => navigate('/singles')}>
          <ArrowLeft size={20} /> {t('pack.back')}
        </button>
      </div>
    );
  }

  return (
    <div className="track-detail-container">
      <div className="detail-top-nav">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} /> {t('pack.back')}
        </button>
        <div className="share-wrapper">
          <button className="share-main-btn" onClick={() => setShowShare(!showShare)}>
            <Share2 size={20} /> Share
          </button>
          {showShare && (
            <div className="share-dropdown">
              <button onClick={() => window.open('https://www.facebook.com/profile.php?id=61592144669937')}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg> Facebook</button>
              <button onClick={() => window.open('https://www.tiktok.com/@djmusicmarketplace')}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg> TikTok</button>
              <button onClick={copyLink}><LinkIcon size={18} /> Copy Link</button>
            </div>
          )}
        </div>
      </div>

      <div className="track-hero">
        <div className="track-hero-artwork">
          <img src={track.artwork} alt={track.title} />
          <button className="play-overlay-btn" onClick={handlePlay}>
            {currentTrack?.id === track.id && isPlaying ? <Pause size={48} fill="white" /> : <Play size={48} fill="white" />}
          </button>
        </div>
        
        <div className="track-hero-info">
          <div className="track-meta-top">
            <span className="genre-tag">{track.genre}</span>
            <span className="dot">•</span>
            <span className="version-label">{track.version}</span>
          </div>
          
          <h1>{track.title}</h1>
          <p className="artist-name">By {track.artist}</p>
          
          <div className="track-stats-row">
            <div className="stat-item">
              <BarChart3 size={18} />
              <span>{(track.plays || 0).toLocaleString()} plays</span>
            </div>
            <div className="stat-item">
              <Calendar size={18} />
              <span>Released {track.date}</span>
            </div>
          </div>

          <div className="waveform-hero-container">
            <Waveform isPlaying={currentTrack?.id === track.id && isPlaying} progress={currentTrack?.id === track.id ? progress : 0} />
          </div>

          <div className="track-actions-primary">
            {track.price === 0 ? (
              <button 
                className="buy-now-btn"
                onClick={handleFreeDownload}
                disabled={downloading}
              >
                {downloading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                {downloading ? 'Downloading...' : 'Download Free'}
              </button>
            ) : (
              <button 
                className={`buy-now-btn ${isInCart(track.id) ? 'added' : ''}`}
                onClick={() => addToCart({ id: track.id, title: track.title, price: track.price ?? 0, artwork: track.artwork, artist: track.artist })}
                disabled={isInCart(track.id)}
              >
                <ShoppingCart size={20} />
                {isInCart(track.id) ? 'Added to Cart' : `Add to Cart — $${track.price.toFixed(2)}`}
              </button>
            )}
            <button 
              className={`favorite-btn ${isFavorite(track.id) ? 'active' : ''}`}
              onClick={() => toggleFavorite({
                id: track.id,
                title: track.title,
                artist: track.artist,
                artwork: track.artwork
              })}
            >
              <Heart size={24} fill={isFavorite(track.id) ? "var(--accent-color)" : "none"} />
            </button>
          </div>
        </div>
      </div>

      <div className="track-details-grid">
        <div className="details-card">
          <h3>Technical Details</h3>
          <div className="specs-list">
            <div className="spec-item">
              <div className="spec-label">
                <Music2 size={16} />
                <span>BPM</span>
              </div>
              <div className="spec-value">{track.bpm}</div>
            </div>
            <div className="spec-item">
              <div className="spec-label">
                <Disc size={16} />
                <span>Key</span>
              </div>
              <div className="spec-value">{track.key}</div>
            </div>
            <div className="spec-item">
              <div className="spec-label">
                <Clock size={16} />
                <span>Duration</span>
              </div>
              <div className="spec-value">{track.duration}</div>
            </div>
            <div className="spec-item">
              <div className="spec-label">
                <div className={`version-dot version-${track.versionType}`} />
                <span>Version</span>
              </div>
              <div className="spec-value">{track.version}</div>
            </div>
          </div>
        </div>

        <div className="details-card about-card">
          <h3>About this Track</h3>
          <p>
            This track is a high-quality 320kbps MP3 file, 
            professionally edited for seamless DJ transitions. 
            Perfect for club sets and radio shows.
          </p>
          <Link to="/singles" className="view-pack-btn">
            View All Singles
          </Link>
        </div>

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
