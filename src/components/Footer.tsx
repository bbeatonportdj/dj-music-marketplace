import { Disc, Mail } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import '../styles/footer.css';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="main-footer">
      <div className="footer-content">
        <div className="footer-section brand-section">
          <div className="footer-logo">
            <Disc size={32} className="logo-icon" />
            <span>DJ Music Marketplace</span>
          </div>
          <p className="brand-desc">
            Premium beats and music packs for professional DJs worldwide.
          </p>
          <p className="brand-about">
            The DJ music marketplace is a dynamic and rapidly evolving landscape that serves as a hub for DJs, producers, and music enthusiasts to connect and collaborate. This marketplace offers a platform where DJs can access a vast library of tracks, remixes, and samples, catering to a wide range of genres and styles. It provides opportunities for both established artists and emerging talent to showcase their work, reach new audiences, and monetize their music. With the rise of digital technology, these marketplaces have become increasingly accessible, allowing for seamless purchasing, downloading, and streaming of music. Additionally, they often include features like community forums, virtual events, and networking opportunities, fostering a sense of community among music creators and fans alike. As the demand for diverse and innovative music continues to grow, the DJ music marketplace remains an essential component of the global music industry.
          </p>
        </div>

        <div className="footer-section links-section">
          <h3>Explore</h3>
          <ul>
            <li><a href="/browse">{t('nav.browse')}</a></li>
            <li><a href="/singles">{t('nav.singles')}</a></li>
            <li><a href="/favorites">Favorites</a></li>
            <li><a href="/auth">{t('auth.login')}</a></li>
          </ul>
        </div>

        <div className="footer-section links-section">
          <h3>Support</h3>
          <ul>
            <li><a href="#">FAQ</a></li>
            <li><a href="#">Refund Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
            <li><a href="#">Privacy Policy</a></li>
          </ul>
        </div>

        <div className="footer-section contact-section">
          <h3>Contact</h3>
          <div className="contact-item">
            <Mail size={18} />
            <span>support@djmusicmarketplace.com</span>
          </div>
          <p className="newsletter-text">
            Subscribe to get free tracks every week.
          </p>
          <div className="newsletter-form">
            <input type="email" placeholder="Email Address" />
            <button className="sub-btn">Join</button>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2026 DJ Music Marketplace. All rights reserved.</p>
        <p className="made-with">Made with 🤍 in DJ community</p>
      </div>
    </footer>
  );
};

export default Footer;
