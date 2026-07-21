/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { toStreamUrl } from '../lib/gdrive';

interface Track {
  id: string | number;
  title: string;
  artist?: string;
  preview_url: string;
  artwork?: string;
}

interface AudioContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  playTrack: (track: Track) => void;
  pauseTrack: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  preloadTrack: (track: Track) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

// Preload cache
const preloadedUrls = new Set<string>();

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadAudioRef = useRef<HTMLAudioElement | null>(null);

  const playTrack = useCallback((track: Track) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
      return;
    }
    
    const streamUrl = toStreamUrl(track.preview_url);
    setCurrentTrack(track);
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(0);
    
    if (audioRef.current) {
      if (preloadedUrls.has(streamUrl)) {
        audioRef.current.src = streamUrl;
        audioRef.current.load();
      } else {
        audioRef.current.src = streamUrl;
      }
      audioRef.current.play().catch(err => {
        console.error("Playback failed:", err);
        setIsPlaying(false);
      });
    }
  }, [currentTrack]);

  const preloadTrack = useCallback((track: Track) => {
    const streamUrl = toStreamUrl(track.preview_url);
    if (!streamUrl || preloadedUrls.has(streamUrl)) return;
    
    if (!preloadAudioRef.current) {
      preloadAudioRef.current = new Audio();
      preloadAudioRef.current.preload = 'auto';
    }
    
    preloadAudioRef.current.src = streamUrl;
    preloadAudioRef.current.load();
    preloadedUrls.add(streamUrl);
    
    if (preloadedUrls.size > 20) {
      const firstUrl = preloadedUrls.values().next().value;
      if (firstUrl) preloadedUrls.delete(firstUrl);
    }
  }, []);

  const pauseTrack = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      pauseTrack();
    } else {
      audioRef.current.play().catch(err => {
        console.error("Playback failed:", err);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  }, [isPlaying, pauseTrack]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      const maxDuration = audioRef.current.duration || 0;
      const cappedTime = Math.min(time, maxDuration);
      audioRef.current.currentTime = cappedTime;
      setCurrentTime(cappedTime);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      const maxDuration = audioRef.current.duration || 0;
      if (maxDuration > 0 && time >= maxDuration) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
        setIsPlaying(false);
      } else {
        setCurrentTime(time);
      }
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      const trackDuration = audioRef.current.duration;
      setDuration(isNaN(trackDuration) ? 0 : trackDuration);
    }
  }, []);

  return (
    <AudioContext.Provider value={{ 
      currentTrack, isPlaying, duration, currentTime, 
      playTrack, pauseTrack, togglePlay, seek, preloadTrack 
    }}>
      {children}
      <audio 
        ref={audioRef} 
        preload="auto"
        onEnded={() => {
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
          }
          setCurrentTime(0);
          setIsPlaying(false);
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useAudio must be used within AudioProvider');
  return context;
};
