import { Disc, Mail } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

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
    <footer className="bg-surface border-t border-border-gray py-24 mt-20">
      <div className="max-w-[1440px] mx-auto px-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Brand */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <Disc size={28} className="text-electric-red" />
            <span className="font-display text-xl font-extrabold tracking-tighter text-on-surface uppercase">BEAT VAULT</span>
          </div>
          <p className="text-muted-text text-sm">
            High-performance audio gear for the global underground. Engineered for precision, built for impact.
          </p>
          <div className="flex gap-6">
            <a href="https://www.facebook.com/profile.php?id=61592144669937" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 text-muted-text hover:text-electric-red transition-colors">
              <FacebookIcon size={20} />
              <span className="text-xs">Facebook</span>
            </a>
            <a href="https://www.tiktok.com/@djmusicmarketplace" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 text-muted-text hover:text-electric-red transition-colors">
              <TikTokIcon size={20} />
              <span className="text-xs">TikTok</span>
            </a>
          </div>
        </div>

        {/* Explore */}
        <div className="flex flex-col gap-4">
          <h4 className="font-mono text-xs font-bold text-on-surface uppercase tracking-widest">Explore</h4>
          <a href="/browse" className="text-muted-text hover:text-electric-red transition-colors font-mono text-sm">{t('nav.browse')}</a>
          <a href="/singles" className="text-muted-text hover:text-electric-red transition-colors font-mono text-sm">{t('nav.singles')}</a>
          <a href="/favorites" className="text-muted-text hover:text-electric-red transition-colors font-mono text-sm">Favorites</a>
          <a href="/auth" className="text-muted-text hover:text-electric-red transition-colors font-mono text-sm">{t('auth.login')}</a>
        </div>

        {/* Support */}
        <div className="flex flex-col gap-4">
          <h4 className="font-mono text-xs font-bold text-on-surface uppercase tracking-widest">Support</h4>
          <a href="/faq" className="text-muted-text hover:text-electric-red transition-colors font-mono text-sm">FAQ</a>
          <a href="/contact" className="text-muted-text hover:text-electric-red transition-colors font-mono text-sm">Contact</a>
          <a href="/terms" className="text-muted-text hover:text-electric-red transition-colors font-mono text-sm">Terms</a>
          <a href="/privacy" className="text-muted-text hover:text-electric-red transition-colors font-mono text-sm">Privacy</a>
        </div>

        {/* Contact */}
        <div className="flex flex-col gap-6">
          <h4 className="font-mono text-xs font-bold text-on-surface uppercase tracking-widest">Contact</h4>
          <div className="flex items-center gap-2 text-muted-text hover:text-on-surface cursor-pointer">
            <Mail size={16} />
            <span className="text-sm">support@djmusicmarketplace.com</span>
          </div>
          <div className="flex gap-2">
            <input 
              type="email" 
              placeholder="Email Address" 
              className="bg-surface-container-lowest border border-border-gray px-4 py-2 rounded text-sm w-full outline-none focus:border-electric-red text-on-surface"
            />
            <button className="bg-electric-red text-white px-4 py-2 rounded font-mono text-xs font-bold uppercase hover:brightness-110 transition-all">
              Join
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-16 mt-24 pt-8 border-t border-border-gray flex justify-between items-center">
        <span className="text-muted-text font-mono text-[10px] uppercase tracking-widest">
          &copy; 2026 BEAT VAULT. HIGH-PERFORMANCE AUDIO GEAR.
        </span>
        <span className="text-muted-text font-mono text-[10px] uppercase tracking-widest">
          MADE WITH INTENSITY BY DJ COMMUNITY
        </span>
      </div>
    </footer>
  );
};

export default Footer;
