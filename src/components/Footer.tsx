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
    <footer className="bg-[#111111] text-white">
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-[15px] font-extrabold tracking-tight uppercase">DJ MARKETPLACE</span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-6">
            <Link to="/about" className="text-[13px] text-[#888] hover:text-white transition-colors">
              About
            </Link>
            <Link to="/faq" className="text-[13px] text-[#888] hover:text-white transition-colors">
              Support
            </Link>
            <Link to="/contact" className="text-[13px] text-[#888] hover:text-white transition-colors">
              Contact
            </Link>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-4">
            <a 
              href="https://www.facebook.com/profile.php?id=61592144669937" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[#888] hover:text-white transition-colors"
            >
              <FacebookIcon size={18} />
            </a>
            <a 
              href="https://twitter.com/djmusicmarketplace" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[#888] hover:text-white transition-colors"
            >
              <TwitterIcon size={18} />
            </a>
            <a 
              href="https://www.instagram.com/djmusicmarketplace" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[#888] hover:text-white transition-colors"
            >
              <InstagramIcon size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
