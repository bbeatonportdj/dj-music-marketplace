import { Disc, Mail, Facebook, Music } from 'lucide-react';
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
            <span>BEAT VAULT</span>
          </div>
          <p className="brand-desc">
            Premium DJ edits, remixes & acapellas. 1,800+ tracks across 17 genres with BPM, Key & Version info.
          </p>
          <div className="social-links">
            <a href="https://www.facebook.com/profile.php?id=61592144669937" target="_blank" rel="noopener noreferrer" className="social-link">
              <Facebook size={20} />
              <span>Facebook</span>
            </a>
            <a href="https://www.tiktok.com/@djmusicmarketplace" target="_blank" rel="noopener noreferrer" className="social-link">
              <Music size={20} />
              <span>TikTok</span>
            </a>
          </div>
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
