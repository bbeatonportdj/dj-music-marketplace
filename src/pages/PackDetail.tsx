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
    showNotification('Link copied to clipboard!', 'success');
    setShowShare(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-text">
        <Loader2 className="animate-spin text-electric-red" size={48} />
        <p className="font-mono text-sm uppercase tracking-wider">Loading beat pack details...</p>
      </div>
    );
  }

  if (!pack) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-text">
        <AlertCircle size={64} className="text-electric-red" />
        <h2 className="font-display text-2xl font-bold text-on-surface">Beat Pack Not Found</h2>
        <p>Sorry, we couldn't find the beat pack you're looking for.</p>
        <button 
          className="flex items-center gap-2 px-6 py-3 bg-surface-gray border border-border-gray rounded-lg text-muted-text hover:text-on-surface hover:border-electric-red transition-all"
          onClick={() => navigate('/browse')}
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

      {/* Pack Header */}
      <div className="flex flex-col lg:flex-row gap-8 mb-12">
        <div className="relative w-full lg:w-[400px] aspect-square rounded-xl overflow-hidden bg-surface-gray flex-shrink-0">
          <img src={pack.artwork} alt={pack.title} className="w-full h-full object-cover" />
          <button 
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
            onClick={handlePackPlay}
          >
            <div className="w-20 h-20 bg-electric-red rounded-full flex items-center justify-center text-white red-glow">
              {currentTrack?.id === pack.id && isPlaying ? <Pause size={40} fill="white" /> : <Play size={40} fill="white" />}
            </div>
          </button>
        </div>
        
        <div className="flex-1">
          <span className="font-mono text-xs font-bold text-electric-red uppercase tracking-wider">{pack.genre}</span>
          <h1 className="font-display text-4xl lg:text-5xl font-extrabold text-on-surface mt-2 mb-2">{pack.title}</h1>
          <p className="text-xl text-muted-text mb-4">By {pack.editor}</p>
          {pack.description && <p className="text-muted-text mb-6">{pack.description}</p>}
          
          <div className="flex items-center gap-6">
            <div className={`font-mono text-2xl font-bold ${pack.is_free ? 'text-success-green' : 'text-on-surface'}`}>
              {pack.is_free ? 'FREE' : `$${pack.price.toFixed(2)}`}
            </div>
            {pack.is_free ? (
              <button 
                className="flex items-center gap-2 px-8 py-4 bg-electric-red text-white rounded-lg font-bold uppercase tracking-wider red-glow hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                onClick={handleFreeDownload}
                disabled={downloading}
              >
                {downloading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                {downloading ? 'Downloading...' : 'Download Free'}
              </button>
            ) : (
              <button 
                className={`flex items-center gap-2 px-8 py-4 rounded-lg font-bold uppercase tracking-wider transition-all ${
                  isInCart(pack.id) 
                    ? 'bg-success-green text-white' 
                    : 'bg-electric-red text-white red-glow hover:brightness-110 active:scale-[0.98]'
                }`}
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

      {/* Tracklist */}
      <div>
        <h2 className="font-display text-2xl font-bold text-on-surface mb-6">
          {t('pack.tracklist')}
          {tracks.length > 0 && <span className="text-muted-text font-mono text-sm ml-2">({tracks.length} {t('pack.tracks')})</span>}
          {tracks.length === 0 && pack.tracks_count > 0 && <span className="text-muted-text font-mono text-sm ml-2">({pack.tracks_count} {t('pack.tracks')})</span>}
        </h2>

        {tracks.length === 0 ? (
          <div className="py-12 text-center text-muted-text">
            <p>No tracks linked to this pack yet.</p>
            <p className="text-sm mt-2 text-border-gray">Admins can link tracks to packs via the admin panel.</p>
          </div>
        ) : (
          <div className="bg-surface-gray border border-border-gray rounded-xl overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-4 py-3 border-b border-border-gray">
              <div className="w-10"></div>
              <div className="font-mono text-xs text-muted-text uppercase tracking-wider">Track</div>
              <div className="font-mono text-xs text-muted-text uppercase tracking-wider hidden md:table-cell">BPM</div>
              <div className="font-mono text-xs text-muted-text uppercase tracking-wider hidden md:table-cell">KEY</div>
              <div className="font-mono text-xs text-muted-text uppercase tracking-wider w-16 text-right"><Clock size={14} /></div>
            </div>

            {tracks.map((track) => (
              <div 
                key={track.id} 
                className={`grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-4 py-3 border-b border-border-gray last:border-b-0 hover:bg-surface-container-high transition-colors ${currentTrack?.id === track.id ? 'bg-surface-container' : ''}`}
              >
                <div className="w-10">
                  <button 
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container text-muted-text hover:text-electric-red transition-colors"
                    onClick={() => handleTrackPlay(track)}
                  >
                    {currentTrack?.id === track.id && isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                  </button>
                </div>
                <div className="flex flex-col justify-center">
                  <Link to={`/track/${track.id}`} className="font-bold text-on-surface hover:text-electric-red transition-colors">
                    {track.title}
                  </Link>
                  {currentTrack?.id === track.id && (
                    <div className="mt-1">
                      <Waveform isPlaying={isPlaying} progress={progress} />
                    </div>
                  )}
                </div>
                <div className="hidden md:flex items-center">
                  <span className="font-mono text-sm text-on-surface">{track.bpm}</span>
                </div>
                <div className="hidden md:flex items-center">
                  <span className="font-mono text-sm text-on-surface">{track.key}</span>
                </div>
                <div className="flex items-center justify-end">
                  <span className="font-mono text-sm text-muted-text">{track.duration}</span>
                </div>
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
