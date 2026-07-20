import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

const SEO = ({ title, description, image, url, type = 'website' }: SEOProps) => {
  const siteName = 'DJ Music Marketplace';
  const fullTitle = title ? `${title} | ${siteName}` : `${siteName} - Premium DJ Edit Packs & Music`;
  const desc = description || 'High-performance audio gear for the global underground. Browse, preview, and download premium DJ edits, remixes, and original productions.';
  const ogImage = image || 'https://djmusicmarketplace.fun/og-image.png';
  const ogUrl = url || window.location.href;

  useEffect(() => {
    document.title = fullTitle;

    const setMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', property);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const setName = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('og:title', fullTitle);
    setMeta('og:description', desc);
    setMeta('og:image', ogImage);
    setMeta('og:url', ogUrl);
    setMeta('og:type', type);
    setMeta('og:site_name', siteName);

    setName('description', desc);
    setName('twitter:card', 'summary_large_image');
    setName('twitter:title', fullTitle);
    setName('twitter:description', desc);
    setName('twitter:image', ogImage);
  }, [fullTitle, desc, ogImage, ogUrl, type]);

  return null;
};

export default SEO;
