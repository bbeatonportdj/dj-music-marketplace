import { Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Shuffle } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useLanguage } from '../context/LanguageContext';
import Waveform from './Waveform';
import '../styles/player.css';

const AudioPlayer = () => {
  const { currentTrack, isPlaying, togglePlay, currentTime, duration, seek } = useAudio();
  const { t } = useLanguage();

  if (!currentTrack) return null;

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = (currentTime / duration) * 100 || 0;

  const handleWaveformSeek = (percent: number) => {
    seek(percent * duration);
  };

  return (
    <div className="audio-player">
      <div className="player-left">
        <img 
          src={currentTrack.artwork || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100&h=100&fit=crop"} 
          alt={currentTrack.title} 
          className="current-track-img" 
        />
        <div className="current-track-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="current-track-title">{currentTrack.title || t('player.select')}</div>
            <span className="preview-badge">90s Preview</span>
          </div>
          <div className="current-track-editor">{currentTrack.artist || t('player.various')}</div>
        </div>
      </div>

      <div className="player-center">
        <div className="player-controls">
          <button className="control-btn"><Shuffle size={18} /></button>
          <button className="control-btn"><SkipBack size={20} fill="currentColor" /></button>
          <button className="play-pause-btn" onClick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? <Pause size={24} fill="black" /> : <Play size={24} fill="black" />}
          </button>
          <button className="control-btn"><SkipForward size={20} fill="currentColor" /></button>
          <button className="control-btn"><Repeat size={18} /></button>
        </div>
        <div className="progress-container">
          <span className="time">{formatTime(currentTime)}</span>
          <div className="waveform-player-wrap">
            <Waveform 
              isPlaying={isPlaying} 
              progress={progress} 
              onSeek={handleWaveformSeek}
              height={40}
              barCount={80}
            />
          </div>
          <span className="time">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="player-right">
        <Volume2 size={20} />
        <div className="volume-bar">
          <div className="volume-fill" style={{ width: '80%' }}></div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
