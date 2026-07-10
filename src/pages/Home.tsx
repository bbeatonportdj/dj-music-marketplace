import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Music, Zap, TrendingUp, Award, Clock, ChevronRight, ExternalLink } from 'lucide-react';
import { fetchTracks } from '../lib/api';
import type { Track } from '../lib/api';
import { useAudio } from '../context/AudioContext';
import '../styles/home.css';

const GENRE_CRATES = [
  { name: 'Techno', icon: '⚡', color: '#ff453a' },
  { name: 'House', icon: '🏠', color: '#ffcc00' },
  { name: 'Drum & Bass', icon: '🥁', color: '#32d74b' },
  { name: 'Trance', icon: '🌀', color: '#5e5ce6' },
  { name: 'Hardstyle', icon: '🔥', color: '#ff9f0a' },
  { name: 'Dubstep', icon: '💥', color: '#bf5af2' },
];

function Home() {
  const navigate = useNavigate();
  const { currentTrack, isPlaying, playTrack } = useAudio();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'latest' | 'popular'>('latest');

  useEffect(() => {
    fetchTracks().then(data => {
      setTracks(data);
      setLoading(false);
    });
  }, []);

  const latestTracks = [...tracks]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 8);

  const popularTracks = [...tracks]
    .sort((a, b) => (b.plays || 0) - (a.plays || 0))
    .slice(0, 8);

  const displayTracks = activeTab === 'latest' ? latestTracks : popularTracks;

  const totalTracks = tracks.length;
  const genres = new Set(tracks.map(t => t.genre).filter(Boolean));
  const paidTracks = tracks.filter(t => t.price > 0).length;
  const freeTracks = tracks.filter(t => t.price === 0).length;

  const stats = [
    { label: 'Total Tracks', value: totalTracks.toLocaleString(), icon: <Music size={20} />, color: '#ff453a' },
    { label: 'Genres', value: genres.size.toString(), icon: <Zap size={20} />, color: '#ffcc00' },
    { label: 'Premium', value: paidTracks.toString(), icon: <Award size={20} />, color: '#32d74b' },
    { label: 'Free Downloads', value: freeTracks.toString(), icon: <TrendingUp size={20} />, color: '#5e5ce6' },
  ];

  if (loading) {
    return (
      <div className="home-loading">
        <div className="home-loading-spinner" />
        <p>Loading arsenal...</p>
      </div>
    );
  }

  return (
    <div className="home">
      <div className="home-container">
        {/* Hero / Stats */}
        <section className="home-hero">
          <div className="home-hero-content">
            <h1 className="home-hero-title">
              <span className="home-hero-accent">BEAT</span> VAULT
            </h1>
            <p className="home-hero-subtitle">PREMIUM DJ EDITS &amp; MUSIC</p>
          </div>
          <div className="home-stats">
            {stats.map(stat => (
              <div key={stat.label} className="home-stat-card" style={{ '--stat-color': stat.color } as React.CSSProperties}>
                <div className="home-stat-icon" style={{ color: stat.color }}>
                  {stat.icon}
                </div>
                <div className="home-stat-info">
                  <p className="home-stat-value">{stat.value}</p>
                  <p className="home-stat-label">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Genre Crates */}
        <section className="home-crates">
          <div className="home-section-header">
            <h2 className="home-section-title">GENRE CRATES</h2>
            <button className="home-section-link" onClick={() => navigate('/new-releases')}>
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div className="home-crates-grid">
            {GENRE_CRATES.map(crate => {
              const count = tracks.filter(t => t.genre.toLowerCase() === crate.name.toLowerCase()).length;
              if (count === 0) return null;
              return (
                <div
                  key={crate.name}
                  className="home-crate-card"
                  style={{ '--crate-color': crate.color } as React.CSSProperties}
                  onClick={() => navigate(`/new-releases?genre=${encodeURIComponent(crate.name)}`)}
                >
                  <span className="home-crate-icon">{crate.icon}</span>
                  <div className="home-crate-info">
                    <h3 className="home-crate-name">{crate.name}</h3>
                    <p className="home-crate-count">{count} tracks</p>
                  </div>
                  <ExternalLink size={14} className="home-crate-link" />
                </div>
              );
            })}
          </div>
        </section>

        {/* Latest / Popular Tracks */}
        <section className="home-tracks">
          <div className="home-section-header">
            <h2 className="home-section-title">TRACKS</h2>
            <div className="home-tabs">
              <button
                className={`home-tab ${activeTab === 'latest' ? 'active' : ''}`}
                onClick={() => setActiveTab('latest')}
              >
                <Clock size={14} /> Latest
              </button>
              <button
                className={`home-tab ${activeTab === 'popular' ? 'active' : ''}`}
                onClick={() => setActiveTab('popular')}
              >
                <TrendingUp size={14} /> Popular
              </button>
            </div>
          </div>
          <div className="home-tracks-table">
            <div className="home-tracks-header">
              <span className="home-th-track">Track</span>
              <span className="home-th-genre">Genre</span>
              <span className="home-th-bpm">BPM</span>
              <span className="home-th-key">Key</span>
              <span className="home-th-price">Price</span>
              <span className="home-th-play" />
            </div>
            {displayTracks.map(track => (
              <div
                key={track.id}
                className={`home-track-row ${currentTrack?.id === track.id ? 'playing' : ''}`}
                onClick={() => navigate(`/track/${track.id}`)}
              >
                <div className="home-track-info">
                  <div
                    className="home-track-art"
                    style={{ backgroundImage: `url(${track.artwork})` }}
                  >
                    {currentTrack?.id === track.id && isPlaying ? (
                      <div className="home-track-playing">
                        <span /><span /><span />
                      </div>
                    ) : (
                      <Play
                        size={14}
                        className="home-track-play-icon"
                        onClick={e => {
                          e.stopPropagation();
                          playTrack(track);
                        }}
                      />
                    )}
                  </div>
                  <div className="home-track-meta">
                    <p className="home-track-title">{track.title}</p>
                    <p className="home-track-artist">{track.artist}</p>
                  </div>
                </div>
                <span className="home-track-genre">{track.genre}</span>
                <span className="home-track-bpm">{track.bpm}</span>
                <span className="home-track-key">{track.key}</span>
                <span className={`home-track-price ${track.price === 0 ? 'free' : ''}`}>
                  {track.price === 0 ? 'FREE' : `$${track.price.toFixed(2)}`}
                </span>
                <button
                  className="home-track-play-btn"
                  onClick={e => {
                    e.stopPropagation();
                    playTrack(track);
                  }}
                >
                  {currentTrack?.id === track.id && isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Home;
