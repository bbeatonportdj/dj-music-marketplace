import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, Check } from 'lucide-react';
import { fetchTracks, type Track } from '../lib/api';
import { useAudio } from '../context/AudioContext';
import { useCart } from '../context/CartContext';

interface Props {
  currentId: string | number;
  genre: string;
  excludeIds?: (string | number)[];
}

const TrackRecommendations: React.FC<Props> = ({ currentId, genre, excludeIds = [] }) => {
  const { currentTrack, isPlaying, playTrack } = useAudio();
  const { addToCart, isInCart } = useCart();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const all = await fetchTracks();
      if (!mounted) return;
      const exclude = new Set([currentId, ...excludeIds]);
      const recommended = all
        .filter(t => t.genre === genre && !exclude.has(t.id))
        .slice(0, 4);
      setTracks(recommended);
      setLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, [currentId, genre, excludeIds]);

  if (loading) return null;
  if (tracks.length === 0) return null;

  return (
    <div className="recommendations">
      <h3>You May Also Like</h3>
      <div className="recommendations-grid">
        {tracks.map(track => {
          const isCurrentPlaying = currentTrack?.id === track.id && isPlaying;
          const isFree = track.price === 0;
          return (
            <div key={track.id} className="recommendation-card">
              <div className="rec-artwork-wrap">
                <img src={track.artwork} alt={track.title} className="rec-artwork" />
                <button
                  className="rec-play-btn"
                  onClick={() => playTrack({
                    id: track.id,
                    title: track.title,
                    artist: track.artist,
                    preview_url: track.preview_url,
                    artwork: track.artwork
                  })}
                >
                  {isCurrentPlaying ? <Pause size={14} fill="white" /> : <Play size={14} fill="white" />}
                </button>
              </div>
              <Link to={`/track/${track.id}`} className="rec-info">
                <span className="rec-title">{track.title}</span>
                <span className="rec-artist">{track.artist}</span>
              </Link>
              <div className="rec-meta">
                <span className="rec-bpm">{track.bpm} BPM</span>
                <span className="rec-key">{track.key}</span>
              </div>
              <button
                className={`rec-cart-btn ${isInCart(track.id) ? 'added' : ''}`}
                onClick={() => addToCart({ id: track.id, title: track.title, price: track.price ?? 0, artwork: track.artwork, artist: track.artist })}
              >
                {isInCart(track.id) ? <><Check size={14} /> Added</> : isFree ? 'Free' : `$${track.price}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrackRecommendations;
