import { Heart, Trash2, Play } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { useAudio } from '../context/AudioContext';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';
import '../styles/favorites.css';

const Favorites = () => {
  const { favorites, toggleFavorite } = useFavorites();
  const { playTrack } = useAudio();
  const { t } = useLanguage();

  if (favorites.length === 0) {
    return (
      <div className="fav-empty">
        <Heart size={64} className="empty-icon" />
        <h2>No favorites yet</h2>
        <p>Heart some tracks to see them here!</p>
        <Link to="/singles" className="browse-btn">{t('nav.singles')}</Link>
      </div>
    );
  }

  return (
    <div className="fav-container animate-fade-in">
      <h1>My Favorites</h1>
      <div className="fav-grid">
        {favorites.map((item) => (
          <div key={item.id} className="fav-card">
            <div className="fav-artwork-container">
              <img src={item.artwork} alt={item.title} />
              <div className="fav-overlay">
                <button 
                  className="play-btn-circle" 
                  onClick={() => playTrack({
                    id: item.id as any,
                    title: item.title,
                    artist: item.artist,
                    artwork: item.artwork,
                    preview_url: '' // In real app, we'd have this
                  })}
                >
                  <Play fill="currentColor" size={24} />
                </button>
              </div>
            </div>
            <div className="fav-info">
              <h3>{item.title}</h3>
              <p>{item.artist}</p>
              <button className="remove-fav-btn" onClick={() => toggleFavorite(item)}>
                <Trash2 size={16} /> Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Favorites;
