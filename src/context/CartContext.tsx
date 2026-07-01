import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNotifications } from './NotificationContext';

interface Pack {
  id: number | string;
  title: string;
  price: number;
  artwork: string;
  editor?: string;
  artist?: string;
}

interface CartContextType {
  cart: Pack[];
  addToCart: (pack: Pack) => void;
  removeFromCart: (id: number | string) => void;
  clearCart: () => void;
  isInCart: (id: number | string) => boolean;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Pack[]>([]);
  const { showNotification } = useNotifications();

  // Load cart from localStorage on init
  useEffect(() => {
    const savedCart = localStorage.getItem('dj_cart');
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    localStorage.setItem('dj_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (pack: Pack) => {
    if (!isInCart(pack.id)) {
      setCart([...cart, pack]);
      showNotification(`Added "${pack.title}" to cart`, 'success');
    }
  };

  const removeFromCart = (id: number | string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const clearCart = () => setCart([]);

  const isInCart = (id: number | string) => cart.some(item => item.id === id);

  const totalPrice = cart.reduce((total, item) => total + item.price, 0);

  return (
    <div className="cart-provider-wrapper">
      <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, isInCart, totalPrice }}>
        {children}
      </CartContext.Provider>
    </div>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
