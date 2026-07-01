import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNotifications } from './NotificationContext';

interface FavoriteItem {
  id: string | number;
  title: string;
  artist?: string;
  artwork: string;
}

interface FavoritesContextType {
  favorites: FavoriteItem[];
  toggleFavorite: (item: FavoriteItem) => void;
  isFavorite: (id: string | number) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const { showNotification } = useNotifications();

  useEffect(() => {
    const saved = localStorage.getItem('dj_favorites');
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('dj_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (item: FavoriteItem) => {
    if (isFavorite(item.id)) {
      setFavorites(favorites.filter(f => f.id !== item.id));
      showNotification(`Removed "${item.title}" from favorites`, 'info');
    } else {
      setFavorites([...favorites, item]);
      showNotification(`Added "${item.title}" to favorites`, 'success');
    }
  };

  const isFavorite = (id: string | number) => favorites.some(f => f.id === id);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used within FavoritesProvider');
  return context;
};
