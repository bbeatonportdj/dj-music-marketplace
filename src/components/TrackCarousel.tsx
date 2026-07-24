import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAudio } from '../context/AudioContext';
import type { Track } from '../lib/api';

interface TrackCarouselProps {
  tracks: Track[];
  title?: string;
  subtitle?: string;
}

const TrackCarousel = ({ tracks, title = 'You might also like', subtitle = 'Recommended Tracks' }: TrackCarouselProps) => {
  const navigate = useNavigate();
  const { currentTrack, isPlaying, playTrack } = useAudio();
  
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    slidesToScroll: 1,
  });

  const [prevEnabled, setPrevEnabled] = useState(false);
  const [nextEnabled, setNextEnabled] = useState(true);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPrevEnabled(emblaApi.canScrollPrev());
    setNextEnabled(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-black">{title}</h2>
          {subtitle && <p className="text-[13px] text-gray-500">{subtitle}</p>}
        </div>
        <div className="flex gap-2">
          <button
            className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={scrollPrev}
            disabled={!prevEnabled}
          >
            <ChevronLeft size={14} className="text-gray-400" />
          </button>
          <button
            className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={scrollNext}
            disabled={!nextEnabled}
          >
            <ChevronRight size={14} className="text-gray-400" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {tracks.map((track) => {
            const isCurrentPlaying = currentTrack?.id === track.id && isPlaying;
            return (
              <div
                key={track.id}
                className="flex-shrink-0 w-[180px] cursor-pointer group"
                onClick={() => navigate(`/track/${track.id}`)}
              >
                <div className="relative w-[180px] h-[180px] bg-gray-100 rounded-lg mb-3 overflow-hidden">
                  {track.artwork ? (
                    <img src={track.artwork} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <Play size={24} className="text-gray-300" />
                    </div>
                  )}
                  {/* Play Button Overlay */}
                  <button
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      playTrack({
                        id: track.id,
                        title: track.title,
                        artist: track.artist,
                        preview_url: track.preview_url,
                      });
                    }}
                  >
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                      {isCurrentPlaying ? (
                        <Pause size={16} className="text-black" fill="currentColor" />
                      ) : (
                        <Play size={16} className="text-black ml-0.5" fill="currentColor" />
                      )}
                    </div>
                  </button>
                </div>
                <p className="font-semibold text-[13px] text-black truncate">{track.title}</p>
                <p className="text-[12px] text-gray-500 truncate">{track.artist}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TrackCarousel;
