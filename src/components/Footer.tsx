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
            <span>RunMusic-storeDj</span>
          </div>
          <p className="brand-desc">
            Premium beats and music packs for professional DJs worldwide.
          </p>
           <div className="social-links">
             <a href="https://www.facebook.com/nongnoo.songsart?mibextid=wwXIfr&rdid=uQu4sTjg6VfWut3j&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F14khreodNL9%2F%3Fmibextid%3DwwXIfr" target="_blank" rel="noopener noreferrer"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg> Facebook</a>
             <a href="https://www.instagram.com/djnn.official" target="_blank" rel="noopener noreferrer"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg> Instagram</a>
             <a href="#" target="_blank" rel="noopener noreferrer"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.26A4.48 4.48 0 0 0 12 2H10.5a1.5 1.5 0 0 0-1.5 1.5V11h4a2 2 0 0 0 2-2v-3a4.5 4.5 0 0 0-2-4.5z"></path><path d="M23 13a10.9 10.9 0 0 1-3.14 1.26A4.48 4.48 0 0 0 12 12H10.5a1.5 1.5 0 0 0-1.5 1.5V21a1.5 1.5 0 0 0 1.5 1.5H12a4.48 4.48 0 0 0 4.5-4.5V15a2 2 0 0 0 2 2v3a4.5 4.5 0 0 0 4.5-4.5z"></path></svg> Twitter</a>
             <a href="#" target="_blank" rel="noopener noreferrer"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19C5.12 19.56 8.88 19.56 8.88 19.56s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2C23 17.08 23 12.25 23 11.75a29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg> Youtube</a>
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
            <span>support@runmusic-storedj.com</span>
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
        <p>&copy; 2026 RunMusic-storeDj. All rights reserved.</p>
        <p className="made-with">Made with 🤍 in DJ community</p>
      </div>
    </footer>
  );
};

export default Footer;
