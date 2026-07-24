import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface WaveformProps {
  url: string;
  isPlaying: boolean;
  onReady?: (duration: number) => void;
  onSeek?: (time: number) => void;
  height?: number;
  barWidth?: number;
  barGap?: number;
}

const Waveform = ({ 
  url, 
  isPlaying, 
  onReady, 
  onSeek,
  height = 64,
  barWidth = 2,
  barGap = 1
}: WaveformProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !url) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      height,
      waveColor: '#e5e7eb',
      progressColor: '#2563EB',
      cursorColor: '#ef4444',
      cursorWidth: 2,
      barWidth,
      barGap,
      barRadius: 2,
      normalize: true,
      backend: 'WebAudio',
    });

    ws.load(url);

    ws.on('ready', () => {
      setIsReady(true);
      onReady?.(ws.getDuration());
    });

    ws.on('interaction', (time) => {
      onSeek?.(time);
    });

    wavesurferRef.current = ws;

    return () => {
      ws.destroy();
    };
  }, [url, height, barWidth, barGap, onReady, onSeek]);

  useEffect(() => {
    if (!wavesurferRef.current || !isReady) return;
    
    if (isPlaying) {
      wavesurferRef.current.play();
    } else {
      wavesurferRef.current.pause();
    }
  }, [isPlaying, isReady]);

  return (
    <div className="w-full">
      <div ref={containerRef} className="w-full rounded-lg overflow-hidden" />
    </div>
  );
};

export default Waveform;
