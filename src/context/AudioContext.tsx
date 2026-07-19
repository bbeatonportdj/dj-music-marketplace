/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

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
    
    setCurrentTrack(track);
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(0);
    
    if (audioRef.current) {
      // Check if already preloaded
      if (preloadedUrls.has(track.preview_url)) {
        // Use preloaded audio - should be instant
        audioRef.current.src = track.preview_url;
        audioRef.current.load();
      } else {
        audioRef.current.src = track.preview_url;
      }
      audioRef.current.play().catch(err => {
        console.error("Playback failed:", err);
        setIsPlaying(false);
      });
    }
  }, [currentTrack]);

  const preloadTrack = useCallback((track: Track) => {
    if (!track.preview_url || preloadedUrls.has(track.preview_url)) return;
    
    // Create hidden audio element for preloading
    if (!preloadAudioRef.current) {
      preloadAudioRef.current = new Audio();
      preloadAudioRef.current.preload = 'auto';
    }
    
    preloadAudioRef.current.src = track.preview_url;
    preloadAudioRef.current.load();
    preloadedUrls.add(track.preview_url);
    
    // Limit cache size
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
      const maxDuration = Math.min(audioRef.current.duration || 90, 90);
      const cappedTime = Math.min(time, maxDuration);
      audioRef.current.currentTime = cappedTime;
      setCurrentTime(cappedTime);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      const maxDuration = Math.min(audioRef.current.duration || 90, 90);
      if (time >= maxDuration) {
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
      setDuration(isNaN(trackDuration) ? 90 : Math.min(trackDuration, 90));
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
