import React, { useState } from 'react';
import '../styles/waveform.css';

interface WaveformProps {
  isPlaying: boolean;
  progress: number;
}

const Waveform: React.FC<WaveformProps> = ({ isPlaying, progress }) => {
  // Generate random bars once (initialize state lazily to avoid setState in effect)
  const [bars] = useState<{ height: number }[]>(() =>
    Array.from({ length: 60 }).map(() => ({ height: Math.random() * 80 + 20 }))
  );

  return (
    <div className={`waveform-container ${isPlaying ? 'playing' : ''}`}>
      {bars.map((bar, i) => {
        const barProgress = (i / bars.length) * 100;
        const isActive = progress > barProgress;
        
        return (
          <div 
            key={i} 
            className={`waveform-bar ${isActive ? 'active' : ''}`}
            style={{ 
              height: `${bar.height}%`,
              animationDelay: `${i * 0.05}s`
            }}
          />
        );
      })}
    </div>
  );
};

export default Waveform;
