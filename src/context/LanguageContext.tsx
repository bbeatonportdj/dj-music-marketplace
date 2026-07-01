import { createContext, useContext, useState, type ReactNode } from 'react';

interface LanguageContextType {
  language: 'en';
  setLanguage: (lang: 'en') => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    'nav.browse': 'Browse',
    'nav.singles': 'Singles',
    'nav.search': 'Search for beats, genres, editors...',
    'singles.title': 'Singles',
    'singles.filters': 'Filters',
    'singles.hide_sidebar': 'Hide Sidebar',
    'singles.show_sidebar': 'Filters',
    'singles.search_placeholder': 'Search tracks...',
    'singles.bpm_range': 'BPM Range',
    'singles.key': 'Key',
    'singles.genres': 'Genres',
    'singles.sort_by': 'Sort by:',
    'singles.newest': 'Newest',
    'table.track': 'Track',
    'table.bpm': 'BPM',
    'table.key': 'Key',
    'table.genre': 'Genre',
    'table.stats': 'Stats',
    'table.action': 'Action',
    'genre.all': 'All Genres',
    'auth.login': 'Login',
    'auth.signup': 'Sign Up',
    'cart.title': 'Your Cart',
    'cart.empty': 'Your cart is empty',
    'cart.empty_msg': "Looks like you haven't added any beat packs yet.",
    'cart.browse_btn': 'Browse Beats',
    'cart.summary': 'Order Summary',
    'cart.subtotal': 'Subtotal',
    'cart.total': 'Total',
    'cart.checkout': 'Proceed to Checkout',
    'cart.clear': 'Clear Cart',
    'auth.welcome': 'Welcome Back',
    'auth.create': 'Create Account',
    'auth.login_msg': 'Login to your DJ account',
    'auth.signup_msg': 'Sign up to start downloading beats',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.processing': 'Processing...',
    'auth.have_account': 'Already have an account?',
    'auth.no_account': "Don't have an account?",
    'pack.back': 'Back to Browse',
    'pack.tracklist': 'Tracklist',
    'pack.tracks': 'Tracks',
    'pack.add_to_cart': 'Add to Cart',
    'player.select': 'Select a track',
    'player.various': 'Various Artists',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language] = useState<'en'>('en');

  const handleSetLanguage = () => {
    // No-op, we only support English now
  };

  const t = (key: string): string => {
    return translations.en[key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
