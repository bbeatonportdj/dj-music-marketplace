import React, { createContext, useContext, useState, useRef } from 'react';

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
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playTrack = (track: Track) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
      return;
    }
    
    setCurrentTrack(track);
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(0); // Reset duration until metadata loads
    
    if (audioRef.current) {
      audioRef.current.src = track.preview_url;
      audioRef.current.play().catch(err => {
        console.error("Playback failed:", err);
        setIsPlaying(false);
      });
    }
  };

  const pauseTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
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
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      const maxDuration = Math.min(audioRef.current.duration || 30, 30);
      const cappedTime = Math.min(time, maxDuration);
      audioRef.current.currentTime = cappedTime;
      setCurrentTime(cappedTime);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      const maxDuration = Math.min(audioRef.current.duration || 30, 30);
      if (time >= maxDuration) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
        setIsPlaying(false);
      } else {
        setCurrentTime(time);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const trackDuration = audioRef.current.duration;
      setDuration(isNaN(trackDuration) ? 30 : Math.min(trackDuration, 30));
    }
  };

  return (
    <AudioContext.Provider value={{ 
      currentTrack, isPlaying, duration, currentTime, 
      playTrack, pauseTrack, togglePlay, seek 
    }}>
      {children}
      <audio 
        ref={audioRef} 
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
