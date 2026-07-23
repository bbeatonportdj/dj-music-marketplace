import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, ShoppingCart, ArrowLeft, Heart } from 'lucide-react';
import { fetchTrackById, fetchTracks } from '../lib/api';
import { useAudio } from '../context/AudioContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
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
      // Fetch recommended tracks
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!track) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-gray-500">Track not found</p>
        <button 
          className="text-blue-600 font-semibold hover:underline"
          onClick={() => navigate('/')}
        >
          Go back
        </button>
      </div>
    );
  }

  const isCurrentPlaying = currentTrack?.id === track.id && isPlaying;

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Back Button */}
      <div className="max-w-[1200px] mx-auto px-6 py-4">
        <button 
          className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors text-[13px]"
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
            <h1 className="text-3xl lg:text-4xl font-extrabold text-black mb-2">{track.title}</h1>
            <p className="text-lg text-gray-500 mb-6">{track.artist}</p>
            
            {/* Metadata */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Label</p>
                <p className="text-[13px] text-black font-medium">Independent</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Release Date</p>
                <p className="text-[13px] text-black font-medium">
                  {track.created_at ? new Date(track.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">BPM</p>
                <p className="text-[13px] text-black font-medium font-mono">{track.bpm}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Key</p>
                <p className="text-[13px] text-black font-medium font-mono">{track.key}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Genre</p>
                <p className="text-[13px] text-black font-medium">{track.genre}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                className="px-6 py-3 bg-blue-600 text-white text-[13px] font-semibold rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
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
              <button className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                <Heart size={16} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Waveform Section */}
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="bg-gray-50 rounded-lg p-6">
          {/* Play Controls */}
          <div className="flex items-center gap-4 mb-6">
            <button
              className="w-12 h-12 flex items-center justify-center rounded-full bg-black text-white hover:bg-blue-600 transition-all"
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
              <p className="text-[14px] font-semibold text-black">{track.title}</p>
              <p className="text-[12px] text-gray-500">{track.artist}</p>
            </div>
          </div>

          {/* Waveform Visualization */}
          <div className="relative h-32 bg-white rounded-lg border border-gray-100 overflow-hidden">
            {/* Simulated waveform */}
            <div className="absolute inset-0 flex items-center justify-center px-4">
              <div className="flex items-center h-full gap-[2px]">
                {Array.from({ length: 200 }).map((_, i) => {
                  const height = Math.random() * 80 + 20;
                  const isPast = i < 60;
                  return (
                    <div
                      key={i}
                      className={`w-[2px] rounded-full transition-colors ${
                        isPast ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  );
                })}
              </div>
            </div>
            
            {/* Playhead */}
            <div className="absolute left-[30%] top-0 bottom-0 w-[2px] bg-red-500" />
            
            {/* Cue Points */}
            <div className="absolute right-[20%] top-2 text-[10px] text-gray-400">
              <span className="bg-white px-1 border border-gray-200 rounded text-[9px]">Cue</span>
            </div>
          </div>

          {/* Time Display */}
          <div className="flex justify-between mt-2 text-[11px] font-mono text-gray-400">
            <span>0:00</span>
            <span>3:45</span>
          </div>
        </div>
      </div>

      {/* About & Recommended */}
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* About */}
          <div>
            <h2 className="text-[18px] font-bold text-black mb-4">About this track</h2>
            <p className="text-[14px] text-gray-600 leading-relaxed">
              {track.title} is a {track.genre} track by {track.artist}. 
              With a BPM of {track.bpm} and key of {track.key}, this track is perfect for your next set.
            </p>
          </div>

          {/* Recommended Tracks */}
          <div>
            <h2 className="text-[18px] font-bold text-black mb-4">Recommended Tracks</h2>
            <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-[1fr_60px_80px_80px] gap-4 px-4 py-3 border-b border-gray-100 bg-gray-50 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                <span>TRACK TITLE</span>
                <span className="text-right">BPM</span>
                <span className="text-right">KEY</span>
                <span className="text-right">PRICE</span>
              </div>

              {/* Track Rows */}
              {recommendedTracks.slice(0, 8).map(recTrack => (
                <div
                  key={recTrack.id}
                  className="grid grid-cols-[1fr_60px_80px_80px] gap-4 items-center px-4 py-3 border-b border-gray-50 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => navigate(`/track/${recTrack.id}`)}
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[13px] text-black truncate">{recTrack.title}</p>
                    <p className="text-[12px] text-gray-500 truncate">{recTrack.artist}</p>
                  </div>
                  <span className="text-[13px] text-black text-right font-mono">{recTrack.bpm}</span>
                  <span className="text-[13px] text-gray-500 text-right font-mono">{recTrack.key}</span>
                  <span className="text-[13px] text-black text-right font-semibold">
                    {recTrack.price === 0 ? 'FREE' : `$${recTrack.price?.toFixed(2)}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackDetail;
