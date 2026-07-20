import { Disc, Mail } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import '../styles/footer.css';

const FacebookIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const TikTokIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
  </svg>
);

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="main-footer">
      <div className="footer-content">
        <div className="footer-section brand-section">
          <div className="footer-logo">
            <Disc size={28} className="logo-icon" />
            <span>BEAT VAULT</span>
          </div>
          <p className="brand-desc">
            High-performance audio gear for the global underground. Engineered for precision, built for impact.
          </p>
          <div className="social-links">
            <a href="https://www.facebook.com/profile.php?id=61592144669937" target="_blank" rel="noopener noreferrer" className="social-link">
              <FacebookIcon size={20} />
              <span>Facebook</span>
            </a>
            <a href="https://www.tiktok.com/@djmusicmarketplace" target="_blank" rel="noopener noreferrer" className="social-link">
              <TikTokIcon size={20} />
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
            <li><a href="#">Support</a></li>
            <li><a href="#">FAQ</a></li>
            <li><a href="#">Terms</a></li>
            <li><a href="#">Privacy</a></li>
          </ul>
        </div>

        <div className="footer-section contact-section">
          <h3>Contact</h3>
          <div className="contact-item">
            <Mail size={16} />
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
        <span>&copy; 2026 BEAT VAULT. HIGH-PERFORMANCE AUDIO GEAR.</span>
        <span className="made-with">MADE WITH INTENSITY BY DJ COMMUNITY</span>
      </div>
    </footer>
  );
};

export default Footer;
