import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, ShoppingCart, ArrowLeft, Heart } from 'lucide-react';
import { fetchTrackById, fetchTracks } from '../lib/api';
import { useAudio } from '../context/AudioContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import Waveform from '../components/Waveform';
import TrackCarousel from '../components/TrackCarousel';
import type { Track } from '../lib/api';

const TrackDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentTrack, isPlaying, playTrack } = useAudio();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { showNotification } = useNotifications();
  
  const [track, setTrack] = useState<Track | null>(null);
  const [recommendedTracks, setRecommendedTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchTrackById(id).then(data => {
      setTrack(data);
      setLoading(false);
      if (data) {
        fetchTracks().then(allTracks => {
          const filtered = allTracks
            .filter(t => t.id !== id && t.genre === data.genre)
            .slice(0, 10);
          setRecommendedTracks(filtered);
        });
      }
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-[#0A0A0A]">
        <div className="w-8 h-8 border-2 border-white/10 border-t-[#FC4239] rounded-full animate-spin" />
      </div>
    );
  }

  if (!track) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-[#0A0A0A]">
        <p className="text-white/45">Track not found</p>
        <button 
          className="text-[#FC4239] font-semibold hover:underline"
          onClick={() => navigate('/')}
        >
          Go back
        </button>
      </div>
    );
  }

  const isCurrentPlaying = currentTrack?.id === track.id && isPlaying;

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24">
      {/* Back Button */}
      <div className="max-w-[1200px] mx-auto px-6 py-4">
        <button 
          className="flex items-center gap-2 text-white/45 hover:text-white transition-colors text-[13px]"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      {/* Track Header */}
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Track Info */}
          <div className="flex-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#FC4239] mb-3">{track.genre}</p>
            <h1 className="text-3xl lg:text-5xl font-extrabold text-white mb-2 tracking-tight">{track.title}</h1>
            <p className="text-lg text-white/65 mb-6">{track.artist}</p>
            
            {/* Metadata */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div>
                <p className="text-[10px] text-white/45 uppercase tracking-[0.15em] mb-1 font-mono">Label</p>
                <p className="text-[13px] text-white font-medium">Independent</p>
              </div>
              <div>
                <p className="text-[10px] text-white/45 uppercase tracking-[0.15em] mb-1 font-mono">Release Date</p>
                <p className="text-[13px] text-white font-medium">
                  {track.created_at ? new Date(track.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-white/45 uppercase tracking-[0.15em] mb-1 font-mono">BPM</p>
                <p className="text-[13px] text-white font-medium font-mono">{track.bpm}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/45 uppercase tracking-[0.15em] mb-1 font-mono">Key</p>
                <p className="text-[13px] text-white font-medium font-mono">{track.key}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/45 uppercase tracking-[0.15em] mb-1 font-mono">Genre</p>
                <p className="text-[13px] text-white font-medium">{track.genre}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                className="px-6 py-3 bg-[#FC4239] text-white text-[13px] font-semibold rounded-lg hover:bg-[#e03a32] transition-colors flex items-center gap-2"
                onClick={() => {
                  if (!user) {
                    showNotification('Please sign in to add to crate', 'error');
                    navigate('/auth');
                    return;
                  }
                  addToCart({
                    id: track.id,
                    title: track.title,
                    price: track.price ?? 0,
                    artwork: track.artwork,
                    artist: track.artist
                  });
                  showNotification('Added to crate', 'success');
                }}
              >
                <ShoppingCart size={16} />
                ADD TO CRATE {track.price === 0 ? '- FREE' : `- $${track.price?.toFixed(2)}`}
              </button>
              <button className="p-3 border border-white/10 rounded-lg hover:bg-white/5 transition-colors">
                <Heart size={16} className="text-white/45" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Waveform Section */}
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="bg-[#0F0F0F] rounded-xl p-6 border border-white/[0.06]">
          {/* Play Controls */}
          <div className="flex items-center gap-4 mb-6">
            <button
              className="w-12 h-12 flex items-center justify-center rounded-full bg-[#FC4239] text-white hover:bg-[#e03a32] transition-all"
              onClick={() => playTrack({
                id: track.id,
                title: track.title,
                artist: track.artist,
                preview_url: track.preview_url,
              })}
            >
              {isCurrentPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            </button>
            <div>
              <p className="text-[14px] font-semibold text-white">{track.title}</p>
              <p className="text-[12px] text-white/45">{track.artist}</p>
            </div>
          </div>

          {/* Waveform */}
          <div className="bg-[#1C1C1C] rounded-lg border border-[#2A2A2A] p-4">
            <Waveform
              url={track.preview_url}
              isPlaying={isCurrentPlaying}
              height={80}
              barWidth={2}
              barGap={1}
            />
          </div>

          {/* Time Display */}
          <div className="flex justify-between mt-2 text-[11px] font-mono text-white/45">
            <span>0:00</span>
            <span>3:45</span>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <h2 className="text-[18px] font-bold text-white mb-4">About this track</h2>
        <p className="text-[14px] text-white/65 leading-relaxed">
          {track.title} is a {track.genre} track by {track.artist}. 
          With a BPM of {track.bpm} and key of {track.key}, this track is perfect for your next set.
        </p>
      </div>

      {/* Recommended Tracks */}
      {recommendedTracks.length > 0 && (
        <div className="max-w-[1200px] mx-auto px-6">
          <TrackCarousel tracks={recommendedTracks} />
        </div>
      )}
    </div>
  );
};

export default TrackDetail;
