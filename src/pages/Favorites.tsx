import { Heart, Trash2, Play } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { useAudio } from '../context/AudioContext';
import { Link } from 'react-router-dom';

const Favorites = () => {
  const { favorites, toggleFavorite } = useFavorites();
  const { playTrack } = useAudio();

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-[#0A0A0A]">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
          <Heart size={24} className="text-white/25" />
        </div>
        <h2 className="text-xl font-extrabold text-white">No favorites yet</h2>
        <p className="text-white/45 text-[14px]">Heart some tracks to see them here!</p>
        <Link 
          to="/browse" 
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#FC4239] text-white rounded-lg font-bold text-[13px] hover:bg-[#e03a32] transition-colors"
        >
          Browse Tracks
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#FC4239] mb-1">Library</p>
        <h1 className="text-3xl font-extrabold text-white mb-8">My Favorites</h1>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {favorites.map((item) => (
            <div key={item.id} className="bg-[#0F0F0F] border border-white/[0.06] rounded-xl overflow-hidden group hover:border-white/[0.12] transition-colors">
              <div className="relative aspect-square">
                <img src={item.artwork} alt={item.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    className="w-14 h-14 bg-[#FC4239] rounded-full flex items-center justify-center text-white shadow-[0_4px_20px_rgba(252,66,57,0.3)]"
                    onClick={() => playTrack({
                      id: item.id,
                      title: item.title,
                      artist: item.artist,
                      artwork: item.artwork,
                      preview_url: ''
                    })}
                  >
                    <Play fill="currentColor" size={24} />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-bold text-[13px] text-white truncate">{item.title}</h3>
                <p className="text-[12px] text-white/45 truncate">{item.artist}</p>
                <button 
                  className="mt-2 flex items-center gap-1 text-[11px] text-white/45 hover:text-[#FC4239] transition-colors"
                  onClick={() => toggleFavorite(item)}
                >
                  <Trash2 size={12} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Favorites;
