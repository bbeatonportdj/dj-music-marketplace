import { useState, useEffect, useRef } from 'react';
import { Play, Pause, ExternalLink, Music, Headphones, Disc3, Camera, Video, Clock, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { fetchTracks } from '../lib/api';
import type { Track } from '../lib/api';
import SEO from '../components/SEO';
import '../styles/dj-landing.css';

const DJ_NAME = 'DJ Music Marketplace';
const DJ_BIO = 'Premium DJ Edit Packs & Music | House / Tech House / Techno | 2000+ Tracks';
const DJ_AVATAR = '/logo.png';

const SOCIAL_LINKS = [
  { name: 'Facebook', url: 'https://www.facebook.com/profile.php?id=61592144669937', icon: 'fb', color: '#1877F2' },
  { name: 'Instagram', url: 'https://instagram.com', icon: 'ig', color: '#E4405F' },
  { name: 'YouTube', url: 'https://youtube.com', icon: 'yt', color: '#FF0000' },
  { name: 'TikTok', url: 'https://www.tiktok.com/@djmusicmarketplace', icon: 'tt', color: '#00f2ea' },
  { name: 'Mixcloud', url: 'https://mixcloud.com', icon: 'mc', color: '#5000FF' },
];

const GALLERY_ITEMS = [
  { type: 'image' as const, url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=600&fit=crop', caption: 'Club Night Live' },
  { type: 'image' as const, url: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=800&h=600&fit=crop', caption: 'Festival Set' },
  { type: 'image' as const, url: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?w=800&h=600&fit=crop', caption: 'Backstage' },
  { type: 'image' as const, url: 'https://images.unsplash.com/photo-1571266028243-3716f02d2d5d?w=800&h=600&fit=crop', caption: 'Studio Session' },
  { type: 'image' as const, url: 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=800&h=600&fit=crop', caption: 'Open Air' },
  { type: 'image' as const, url: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&h=600&fit=crop', caption: 'Crowd Energy' },
];

const MIX_SETS = [
  {
    id: 'mix-1',
    title: 'Summer Techno Mix 2026',
    description: '2 hours of peak-time techno bangers',
    duration: '2:00:15',
    artwork: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    genre: 'Techno',
  },
  {
    id: 'mix-2',
    title: 'Tech House Grooves',
    description: 'Smooth transitions, deep grooves',
    duration: '1:30:42',
    artwork: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=400&h=400&fit=crop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    genre: 'Tech House',
  },
  {
    id: 'mix-3',
    title: 'Deep House Sessions',
    description: 'Late night deep house selection',
    duration: '1:45:30',
    artwork: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?w=400&h=400&fit=crop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    genre: 'Deep House',
  },
];

const SOCIAL_SVG: Record<string, JSX.Element> = {
  fb: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  ig: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  ),
  yt: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
  tt: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  ),
  mc: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M17.842 8.295c-.352 0-.662.15-.888.414l-3.373 3.962-2.26-2.104c-.23-.214-.53-.342-.862-.342h-.002c-.33 0-.63.128-.86.342L5.695 13.81l-.003.002-.002.001c-.243.273-.382.612-.382.987 0 .375.14.715.382.987l.003.002 4.532 4.212c.23.214.53.342.86.342.333 0 .632-.128.862-.342l3.373-3.962 4.532 4.212c.243.273.382.612.382.987 0 .375-.14.715-.382.987l-.003.002-4.532 4.212c-.23.214-.53.342-.86.342-.333 0-.632-.128-.862-.342L3.042 16.26c-.242-.272-.382-.612-.382-.987s.14-.715.382-.987l.002-.001 4.532-4.212c.23-.214.53-.342.862-.342.33 0 .63.128.86.342l2.26 2.104 3.373-3.962c.226-.264.536-.414.888-.414h.003c.352 0 .662.15.888.414l.003.004c.226.26.366.604.366.98 0 .376-.14.72-.366.98l-3.373 3.962-2.26-2.104c-.23-.214-.53-.342-.862-.342h-.002c-.33 0-.63.128-.86.342l-.002.001z"/>
    </svg>
  ),
};

const DJLanding = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(true);
  const { currentTrack, isPlaying, playTrack, pauseTrack } = useAudio();
  const [activeMix, setActiveMix] = useState<string | null>(null);
  const mixAudioRef = useRef<HTMLAudioElement | null>(null);
  const [mixPlaying, setMixPlaying] = useState(false);
  const [mixProgress, setMixProgress] = useState(0);
  const [mixDuration, setMixDuration] = useState(0);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoadingTracks(true);
      try {
        const data = await fetchTracks({ limit: 6 });
        setTracks(data.tracks || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTracks(false);
      }
    };
    load();
  }, []);

  const handlePlay = (track: Track) => {
    if (currentTrack?.id === track.id && isPlaying) {
      pauseTrack();
    } else {
      playTrack(track);
    }
  };

  const handleMixPlay = (mix: typeof MIX_SETS[0]) => {
    if (activeMix === mix.id && mixPlaying && mixAudioRef.current) {
      mixAudioRef.current.pause();
      setMixPlaying(false);
      return;
    }

    if (mixAudioRef.current) {
      mixAudioRef.current.pause();
    }

    const audio = new Audio(mix.audioUrl);
    mixAudioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setMixDuration(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      setMixProgress(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      setMixPlaying(false);
      setMixProgress(0);
    });

    audio.play();
    setActiveMix(mix.id);
    setMixPlaying(true);
  };

  const handleMixSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mixAudioRef.current || !mixDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const newTime = pct * mixDuration;
    mixAudioRef.current.currentTime = newTime;
    setMixProgress(newTime);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <SEO
        title="DJ Music Marketplace | Premium DJ Edit Packs & Music"
        description={DJ_BIO}
        image={DJ_AVATAR}
      />
      <div className="dj-landing">
        {/* Animated Background */}
        <div className="dj-landing-bg">
          <div className="dj-landing-bg-orb dj-landing-bg-orb-1" />
          <div className="dj-landing-bg-orb dj-landing-bg-orb-2" />
          <div className="dj-landing-bg-orb dj-landing-bg-orb-3" />
        </div>

        {/* Hero */}
        <section className="dj-landing-hero">
          <div className="dj-landing-avatar-wrap">
            <div className="dj-landing-avatar-ring">
              <img src={DJ_AVATAR} alt={DJ_NAME} className="dj-landing-avatar" />
            </div>
            <div className="dj-landing-status">
              <span className="dj-landing-status-dot" />
              Available for bookings
            </div>
          </div>

          <h1 className="dj-landing-name">{DJ_NAME}</h1>
          <p className="dj-landing-bio">{DJ_BIO}</p>

          <div className="dj-landing-stats">
            <div className="dj-landing-stat">
              <Disc3 size={16} />
              <span>{tracks.length} Tracks</span>
            </div>
            <div className="dj-landing-stat">
              <Headphones size={16} />
              <span>{MIX_SETS.length} Mix Sets</span>
            </div>
            <div className="dj-landing-stat">
              <Camera size={16} />
              <span>{GALLERY_ITEMS.length} Photos</span>
            </div>
          </div>
        </section>

        {/* Social Links */}
        <section className="dj-landing-socials">
          {SOCIAL_LINKS.map(link => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="dj-landing-social-btn"
              style={{ '--social-color': link.color } as React.CSSProperties}
            >
              {SOCIAL_SVG[link.icon]}
              <span>Follow on {link.name}</span>
              <ExternalLink size={14} className="dj-landing-social-ext" />
            </a>
          ))}
        </section>

        {/* DJ Mix Sets */}
        <section className="dj-landing-mixes">
          <h2 className="dj-landing-section-title">
            <Headphones size={20} />
            DJ Mix Sets
          </h2>

          <div className="dj-landing-mix-list">
            {MIX_SETS.map((mix, idx) => (
              <div
                key={mix.id}
                className={`dj-landing-mix-card ${activeMix === mix.id ? 'active' : ''}`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="dj-landing-mix-left">
                  <button className="dj-landing-mix-play" onClick={() => handleMixPlay(mix)}>
                    {activeMix === mix.id && mixPlaying ? (
                      <Pause size={20} />
                    ) : (
                      <Play size={20} fill="currentColor" />
                    )}
                  </button>
                  <img src={mix.artwork} alt={mix.title} className="dj-landing-mix-art" />
                </div>

                <div className="dj-landing-mix-info">
                  <span className="dj-landing-mix-genre">{mix.genre}</span>
                  <h3 className="dj-landing-mix-title">{mix.title}</h3>
                  <p className="dj-landing-mix-desc">{mix.description}</p>

                  {activeMix === mix.id && (
                    <div className="dj-landing-mix-player">
                      <div className="dj-landing-mix-progress" onClick={handleMixSeek}>
                        <div className="dj-landing-mix-progress-fill" style={{ width: `${mixDuration ? (mixProgress / mixDuration) * 100 : 0}%` }} />
                      </div>
                      <div className="dj-landing-mix-times">
                        <span>{formatTime(mixProgress)}</span>
                        <span>{formatTime(mixDuration)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="dj-landing-mix-duration">
                  <Clock size={14} />
                  {mix.duration}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Tracks */}
        <section className="dj-landing-tracks">
          <h2 className="dj-landing-section-title">
            <Music size={20} />
            Latest Tracks
          </h2>

          {loadingTracks ? (
            <div className="dj-landing-loading">
              <Disc3 size={24} className="spin" />
              Loading tracks...
            </div>
          ) : tracks.length === 0 ? (
            <div className="dj-landing-empty">No tracks available yet</div>
          ) : (
            <div className="dj-landing-track-list">
              {tracks.map((track, idx) => (
                <div
                  key={track.id}
                  className={`dj-landing-track ${currentTrack?.id === track.id && isPlaying ? 'playing' : ''}`}
                  style={{ animationDelay: `${idx * 0.08}s` }}
                >
                  <button className="dj-landing-track-play" onClick={() => handlePlay(track)}>
                    {currentTrack?.id === track.id && isPlaying ? (
                      <Pause size={18} />
                    ) : (
                      <Play size={18} fill="currentColor" />
                    )}
                  </button>

                  <img
                    src={track.artwork || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=80&h=80&fit=crop'}
                    alt={track.title}
                    className="dj-landing-track-art"
                  />

                  <div className="dj-landing-track-info">
                    <span className="dj-landing-track-title">{track.title}</span>
                    <span className="dj-landing-track-artist">{track.artist}</span>
                  </div>

                  <div className="dj-landing-track-meta">
                    <span className="dj-landing-track-bpm">{track.bpm} BPM</span>
                    <span className="dj-landing-track-key">{track.key}</span>
                  </div>

                  <div className="dj-landing-track-price">
                    {track.price === 0 ? 'FREE' : `$${track.price}`}
                  </div>
                </div>
              ))}
            </div>
          )}

          <a href="https://djmusicmarketplace.fun/browse" className="dj-landing-browse-btn">
            Browse All Tracks
            <ExternalLink size={16} />
          </a>
        </section>

        {/* Gallery */}
        <section className="dj-landing-gallery">
          <h2 className="dj-landing-section-title">
            <Camera size={20} />
            Gallery
          </h2>

          <div className="dj-landing-gallery-grid">
            {GALLERY_ITEMS.map((item, idx) => (
              <div
                key={idx}
                className="dj-landing-gallery-item"
                onClick={() => setLightboxIdx(idx)}
                style={{ animationDelay: `${idx * 0.06}s` }}
              >
                <img src={item.url} alt={item.caption} />
                <div className="dj-landing-gallery-overlay">
                  <Camera size={20} />
                  <span>{item.caption}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Lightbox */}
        {lightboxIdx !== null && (
          <div className="dj-landing-lightbox" onClick={() => setLightboxIdx(null)}>
            <button className="dj-landing-lightbox-close" onClick={() => setLightboxIdx(null)}>
              <X size={24} />
            </button>
            <button
              className="dj-landing-lightbox-nav dj-landing-lightbox-prev"
              onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx - 1 + GALLERY_ITEMS.length) % GALLERY_ITEMS.length); }}
            >
              <ChevronLeft size={28} />
            </button>
            <img
              src={GALLERY_ITEMS[lightboxIdx].url}
              alt={GALLERY_ITEMS[lightboxIdx].caption}
              className="dj-landing-lightbox-img"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="dj-landing-lightbox-nav dj-landing-lightbox-next"
              onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx + 1) % GALLERY_ITEMS.length); }}
            >
              <ChevronRight size={28} />
            </button>
            <div className="dj-landing-lightbox-caption">{GALLERY_ITEMS[lightboxIdx].caption}</div>
          </div>
        )}

        {/* Video Section */}
        <section className="dj-landing-video">
          <h2 className="dj-landing-section-title">
            <Video size={20} />
            DJ Set Videos
          </h2>
          <div className="dj-landing-video-grid">
            <div className="dj-landing-video-card">
              <iframe
                src="https://www.youtube.com/embed/jcLijgO8dPU"
                title="Carl Cox - Historic Cranes Antwerp 2025"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <div className="dj-landing-video-info">
                <h3>Carl Cox - Historic Cranes Antwerp 2025</h3>
                <p>Legendary 4-hour set at Labyrinth Belgium</p>
              </div>
            </div>
            <div className="dj-landing-video-card">
              <iframe
                src="https://www.youtube.com/embed/PUWvu_4mUNA"
                title="Carl Cox - Essential Mix UNVRS Ibiza"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <div className="dj-landing-video-info">
                <h3>Carl Cox - Essential Mix @ UNVRS Ibiza</h3>
                <p>BBC Radio 1 Essential Mix live from Ibiza</p>
              </div>
            </div>
            <div className="dj-landing-video-card">
              <iframe
                src="https://www.youtube.com/embed/gqZJUN1273A"
                title="Carl Cox - We Belong Here Brooklyn"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <div className="dj-landing-video-info">
                <h3>Carl Cox - We Belong Here Brooklyn 2025</h3>
                <p>2-hour DJ set in New York City</p>
              </div>
            </div>
            <div className="dj-landing-video-card">
              <iframe
                src="https://www.youtube.com/embed/H-dcdHMKvKo"
                title="Carl Cox - Classic Fabric London"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <div className="dj-landing-video-info">
                <h3>Carl Cox - Classic DJ Set @ Fabric London</h3>
                <p>Iconic underground set at legendary club</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="dj-landing-cta">
          <h2>Want Me to Play at Your Event?</h2>
          <p>Book me for your next party, club night, or private event</p>
          <a
            href="https://www.facebook.com/profile.php?id=61592144669937"
            target="_blank"
            rel="noopener noreferrer"
            className="dj-landing-cta-btn"
          >
            Contact via Facebook
            <ExternalLink size={16} />
          </a>
        </section>

        {/* Footer */}
        <footer className="dj-landing-footer">
          <span>Powered by </span>
          <a href="https://djmusicmarketplace.fun/browse" target="_blank" rel="noopener noreferrer">DJ Music Marketplace</a>
        </footer>
      </div>
    </>
  );
};

export default DJLanding;
