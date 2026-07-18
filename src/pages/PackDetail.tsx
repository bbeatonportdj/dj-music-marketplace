import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Play, Pause, ShoppingCart, ArrowLeft, Clock,
  Share2, Link as LinkIcon, Loader2, AlertCircle, Download
} from 'lucide-react';
import { fetchPackById, fetchTracksByPackId } from '../lib/api';
import { directDownload } from '../lib/download';
import type { Pack, Track } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';
import { useAudio } from '../context/AudioContext';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import Waveform from '../components/Waveform';
import TrackRecommendations from '../components/TrackRecommendations';
import '../styles/pack-detail.css';

const PackDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { currentTrack, isPlaying, playTrack, togglePlay, currentTime, duration } = useAudio();
  const { addToCart, isInCart } = useCart();
  const { showNotification } = useNotifications();
  const { user } = useAuth();
  const [showShare, setShowShare] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [pack, setPack] = useState<Pack | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculate real progress for the Waveform
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleFreeDownload = async () => {
    if (!pack) return;
    if (!user) {
      showNotification('Please sign in to download', 'error');
      navigate('/auth');
      return;
    }
    setDownloading(true);
    try {
      // Download first track of pack (or all if multiple)
      for (const track of tracks) {
        await directDownload(track.id, track.title);
      }
      showNotification(`Downloading "${pack.title}"`, 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      showNotification(message, 'error');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      const [packData, tracksData] = await Promise.all([
        fetchPackById(id),
        fetchTracksByPackId(id)
      ]);
      setPack(packData);
      setTracks(tracksData);
      setLoading(false);
    };
    load();
  }, [id]);

  const handleTrackPlay = (track: Track) => {
    if (!pack) return;
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playTrack({
        id: track.id,
        title: track.title,
        artist: track.artist,
        artwork: track.artwork || pack.artwork,
        preview_url: track.preview_url || pack.preview_url
      });
    }
  };

  const handlePackPlay = () => {
    if (!pack) return;
    playTrack({
      id: pack.id,
      title: pack.title,
      artist: pack.editor,
      artwork: pack.artwork,
      preview_url: pack.preview_url
    });
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
        <p>Loading beat pack details...</p>
      </div>
    );
  }

  if (!pack) {
    return (
      <div className="track-detail-error">
        <AlertCircle size={64} />
        <h2>Beat Pack Not Found</h2>
        <p>Sorry, we couldn't find the beat pack you're looking for.</p>
        <button className="back-btn" onClick={() => navigate('/browse')}>
          <ArrowLeft size={20} /> {t('pack.back')}
        </button>
      </div>
    );
  }

  return (
    <div className="pack-detail-container">
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
              <button onClick={() => window.open('https://facebook.com')}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg> Facebook</button>
              <button onClick={() => window.open('https://twitter.com')}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg> Twitter</button>
              <button onClick={copyLink}><LinkIcon size={18} /> Copy Link</button>
            </div>
          )}
        </div>
      </div>

      <div className="pack-header">
        <div className="pack-header-artwork">
          <img src={pack.artwork} alt={pack.title} />
          <button className="play-overlay-btn" onClick={handlePackPlay}>
            {currentTrack?.id === pack.id && isPlaying
              ? <Pause size={40} fill="white" />
              : <Play size={40} fill="white" />
            }
          </button>
        </div>
        <div className="pack-header-info">
          <span className="genre-tag">{pack.genre}</span>
          <h1>{pack.title}</h1>
          <p className="editor-name">By {pack.editor}</p>
          {pack.description && <p className="pack-description">{pack.description}</p>}
          
          <div className="pack-actions">
            {pack.is_free ? (
              <div className="price-tag" style={{ color: '#4ade80' }}>FREE</div>
            ) : (
              <div className="price-tag">${pack.price.toFixed(2)}</div>
            )}
            {pack.is_free ? (
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
                className={`buy-now-btn ${isInCart(pack.id) ? 'added' : ''}`}
                onClick={() => addToCart(pack as unknown as Parameters<typeof addToCart>[0])}
                disabled={isInCart(pack.id)}
              >
                <ShoppingCart size={20} />
                {isInCart(pack.id) ? 'Added' : t('pack.add_to_cart')}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="tracklist-section">
        <h2>
          {t('pack.tracklist')}
          {tracks.length > 0 && <span> ({tracks.length} {t('pack.tracks')})</span>}
          {tracks.length === 0 && pack.tracks_count > 0 && <span> ({pack.tracks_count} {t('pack.tracks')})</span>}
        </h2>

        {tracks.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>No tracks linked to this pack yet.</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>
              Admins can link tracks to packs via the admin panel.
            </p>
          </div>
        ) : (
          <div className="track-list">
            <div className="track-header-row">
              <div className="col-play"></div>
              <div className="col-title">{t('table.track')}</div>
              <div className="col-bpm">{t('table.bpm')}</div>
              <div className="col-key">{t('table.key')}</div>
              <div className="col-duration"><Clock size={16} /></div>
            </div>

            {tracks.map((track, index) => (
              <div key={track.id} className={`track-row ${currentTrack?.id === track.id ? 'active' : ''}`}>
                <div className="col-play">
                  <button className="track-play-btn" onClick={() => handleTrackPlay(track)}>
                    {currentTrack?.id === track.id && isPlaying
                      ? <Pause size={16} fill="white" />
                      : <Play size={16} fill="white" />
                    }
                  </button>
                </div>
                <div className="col-title">
                  <span className="track-index">{index + 1}.</span>
                  <div className="track-name-cell">
                    <Link to={`/track/${track.id}`} className="track-name-link">
                      <span className="track-name">{track.title}</span>
                    </Link>
                    {currentTrack?.id === track.id && (
                      <Waveform isPlaying={isPlaying} progress={progress} />
                    )}
                  </div>
                </div>
                <div className="col-bpm">{track.bpm}</div>
                <div className="col-key">{track.key}</div>
                <div className="col-duration">{track.duration}</div>
              </div>
            ))}
          </div>
        )}

        {pack && (
          <TrackRecommendations
            currentId={pack.id}
            genre={pack.genre}
            excludeIds={tracks.map(t => t.id)}
          />
        )}
      </div>
    </div>
  );
};

export default PackDetail;
