import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AudioPlayer from './components/AudioPlayer';
import Footer from './components/Footer';
import Browse from './pages/Browse';
import Singles from './pages/Singles';
import NewReleases from './pages/NewReleases';
import PackDetail from './pages/PackDetail';
import TrackDetail from './pages/TrackDetail';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import Cart from './pages/Cart';
import Favorites from './pages/Favorites';
import Admin from './pages/Admin';
import Orders from './pages/Orders';
import Downloads from './pages/Downloads';
import { AudioProvider } from './context/AudioContext';
import { CartProvider } from './context/CartContext';
import { LanguageProvider } from './context/LanguageContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';
import './styles/global.css';

function App() {
  return (
    <LanguageProvider>
      <NotificationProvider>
        <AuthProvider>
          <FavoritesProvider>
            <AudioProvider>
              <CartProvider>
                <Router>
                  <div className="app-container">
                    <Navbar />
                    <main className="main-content">
                      <Routes>
                        <Route path="/" element={<Navigate to="/browse" replace />} />
                        <Route path="/browse" element={<Browse />} />
                        <Route path="/new-releases" element={<NewReleases />} />
                        <Route path="/singles" element={<Singles />} />
                        <Route path="/pack/:id" element={<PackDetail />} />
                        <Route path="/track/:id" element={<TrackDetail />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/favorites" element={<Favorites />} />
                        <Route path="/orders" element={<Orders />} />
                        <Route path="/downloads" element={<Downloads />} />
                        <Route path="/admin" element={<Admin />} />
                      </Routes>
                    </main>
                    <Footer />
                    <AudioPlayer />
                  </div>
                </Router>
              </CartProvider>
            </AudioProvider>
          </FavoritesProvider>
        </AuthProvider>
      </NotificationProvider>
    </LanguageProvider>
  );
}

export default App;
