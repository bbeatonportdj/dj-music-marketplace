import { Heart, Trash2, Play } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { useAudio } from '../context/AudioContext';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';

const Favorites = () => {
  const { favorites, toggleFavorite } = useFavorites();
  const { playTrack } = useAudio();
  const { t } = useLanguage();

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-text">
        <Heart size={64} className="text-border-gray" />
        <h2 className="font-display text-2xl font-bold text-on-surface">No favorites yet</h2>
        <p>Heart some tracks to see them here!</p>
        <Link 
          to="/singles" 
          className="inline-flex items-center gap-2 px-6 py-3 bg-electric-red text-white rounded-lg font-bold uppercase tracking-wider red-glow hover:brightness-110 active:scale-[0.98] transition-all"
        >
          {t('nav.singles')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-16 py-8">
      <h1 className="font-display text-4xl font-extrabold text-on-surface mb-8">My Favorites</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {favorites.map((item) => (
          <div key={item.id} className="bg-surface-gray border border-border-gray rounded-xl overflow-hidden group">
            <div className="relative aspect-square">
              <img src={item.artwork} alt={item.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  className="w-14 h-14 bg-electric-red rounded-full flex items-center justify-center text-white red-glow"
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
              <h3 className="font-display font-bold text-on-surface truncate">{item.title}</h3>
              <p className="text-sm text-muted-text truncate">{item.artist}</p>
              <button 
                className="mt-2 flex items-center gap-1 text-xs text-muted-text hover:text-electric-red transition-colors"
                onClick={() => toggleFavorite(item)}
              >
                <Trash2 size={14} /> Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Favorites;
