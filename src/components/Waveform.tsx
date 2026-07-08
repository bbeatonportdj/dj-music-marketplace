import React, { useState, useRef, useCallback } from 'react';
import '../styles/waveform.css';

interface WaveformProps {
  isPlaying: boolean;
  progress: number;
  onSeek?: (percent: number) => void;
  barCount?: number;
  height?: number;
}

const Waveform: React.FC<WaveformProps> = ({ 
  isPlaying, 
  progress, 
  onSeek, 
  barCount = 60,
  height = 60 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  const [bars] = useState<{ height: number }[]>(() =>
    Array.from({ length: barCount }).map(() => ({ height: Math.random() * 80 + 20 }))
  );

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || !onSeek) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    onSeek(percent);
  }, [onSeek]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    containerRef.current.style.setProperty('--hover-pos', `${percent * 100}%`);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`waveform-container ${isPlaying ? 'playing' : ''} ${onSeek ? 'interactive' : ''}`}
      style={{ height }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}
    >
      {isHovering && onSeek && <div className="waveform-hover-line" />}
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
