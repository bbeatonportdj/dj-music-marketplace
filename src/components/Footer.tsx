import { Link } from 'react-router-dom';

const FacebookIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const TwitterIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
  </svg>
);

const InstagramIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const Footer = () => {
  return (
    <footer className="bg-[#080808] border-t border-white/[0.06]">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Product */}
          <div>
            <h4 className="font-mono text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/55 mb-4">Product</h4>
            <ul className="space-y-3">
              <li><Link to="/browse" className="text-[14px] text-white/70 hover:text-white transition-colors">Library</Link></li>
              <li><Link to="/new-releases" className="text-[14px] text-white/70 hover:text-white transition-colors">New Releases</Link></li>
              <li><Link to="/search" className="text-[14px] text-white/70 hover:text-white transition-colors">Genres</Link></li>
              <li><Link to="/faq" className="text-[14px] text-white/70 hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-mono text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/55 mb-4">Company</h4>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-[14px] text-white/70 hover:text-white transition-colors">About</Link></li>
              <li><Link to="/contact" className="text-[14px] text-white/70 hover:text-white transition-colors">Contact</Link></li>
              <li><Link to="/faq" className="text-[14px] text-white/70 hover:text-white transition-colors">Support</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-mono text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/55 mb-4">Legal</h4>
            <ul className="space-y-3">
              <li><Link to="/terms" className="text-[14px] text-white/70 hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="text-[14px] text-white/70 hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-mono text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/55 mb-4">Connect</h4>
            <div className="flex items-center gap-4">
              <a 
                href="https://www.facebook.com/profile.php?id=61592144669937" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-white/45 hover:text-white transition-colors"
              >
                <FacebookIcon size={18} />
              </a>
              <a 
                href="https://twitter.com/djmusicmarketplace" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-white/45 hover:text-white transition-colors"
              >
                <TwitterIcon size={18} />
              </a>
              <a 
                href="https://www.instagram.com/djmusicmarketplace" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-white/45 hover:text-white transition-colors"
              >
                <InstagramIcon size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="DJ Marketplace" className="h-6 w-auto" />
          </Link>
          <p className="text-[12.5px] text-white/45">© 2026 DJ Marketplace. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
