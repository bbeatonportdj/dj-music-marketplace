import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  const [isDragging, setIsDragging] = useState(false);

  const [bars] = useState<{ height: number }[]>(() =>
    Array.from({ length: barCount }).map(() => ({ height: Math.random() * 80 + 20 }))
  );

  const getPercentFromClientX = useCallback((clientX: number) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    return Math.max(0, Math.min(1, x / rect.width));
  }, []);

  const updateHoverPosition = useCallback((percent: number) => {
    if (!containerRef.current) return;
    containerRef.current.style.setProperty('--hover-pos', `${percent * 100}%`);
  }, []);

  const handleSeekAt = useCallback((clientX: number) => {
    if (!onSeek) return;
    const percent = getPercentFromClientX(clientX);
    updateHoverPosition(percent);
    onSeek(percent);
  }, [getPercentFromClientX, onSeek, updateHoverPosition]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!onSeek) return;
    e.preventDefault();
    setIsDragging(true);
    containerRef.current?.setPointerCapture(e.pointerId);
    handleSeekAt(e.clientX);
  }, [handleSeekAt, onSeek]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const percent = getPercentFromClientX(e.clientX);
    updateHoverPosition(percent);
    if (isDragging) {
      handleSeekAt(e.clientX);
    }
  }, [getPercentFromClientX, handleSeekAt, isDragging, updateHoverPosition]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (isDragging) {
      handleSeekAt(e.clientX);
    }
    setIsDragging(false);
    if (containerRef.current?.hasPointerCapture(e.pointerId)) {
      containerRef.current.releasePointerCapture(e.pointerId);
    }
  }, [handleSeekAt, isDragging]);

  useEffect(() => {
    if (!isDragging) return;

    const stopDragging = () => setIsDragging(false);
    window.addEventListener('pointerup', stopDragging);
    return () => window.removeEventListener('pointerup', stopDragging);
  }, [isDragging]);

  return (
    <div 
      ref={containerRef}
      className={`waveform-container ${isPlaying ? 'playing' : ''} ${onSeek ? 'interactive' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{ height }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setIsDragging(false);
      }}
    >
      {(isHovering || isDragging) && onSeek && <div className="waveform-hover-line" />}
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
