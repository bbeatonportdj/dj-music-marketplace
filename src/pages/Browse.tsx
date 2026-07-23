import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Play, Pause, X, SlidersHorizontal } from 'lucide-react';
import { fetchTracks } from '../lib/api';
import { useAudio } from '../context/AudioContext';
import type { Track } from '../lib/api';

const SUB_GENRES: Record<string, string[]> = {
  'House': ['Deep House', 'Tech House', 'Progressive House', 'Future House', 'Bass House', 'Afro House'],
  'Techno': ['Minimal', 'Acid', 'Melodic', 'Industrial', 'Drumcoatic', 'Peak Time', 'Other'],
  'Trance': ['Uplifting', 'Psy Trance', 'Progressive Trance', 'Tech Trance', 'Vocal Trance'],
  'Drum & Bass': ['Liquid', 'Neurofunk', 'Jump Up', 'Minimal', 'Techstep'],
  'Hip Hop': ['Trap', 'Boom Bap', 'Drill', 'Lo-Fi', 'Old School'],
  'Latin': ['Reggaeton', 'Moombahton', 'Bachata', 'Salsa', 'Cumbia'],
};

const LABELS = [
  'Drumcode', 'Afterlife', 'Moon Harbour', 'Terminal M', 'Stil vor Talent',
  'KNTXT', 'Truesoul', 'Drumcode', 'Codex', 'Reinier Zonneveld'
];

const CAMELOT_KEYS = [
  '1A', '2A', '3A', '4A', '5A', '6A', '7A', '8A', '9A', '10A', '11A', '12A',
  '1B', '2B', '3B', '4B', '5B', '6B', '7B', '8B', '9B', '10B', '11B', '12B',
];

const Browse = () => {
  const [searchParams] = useSearchParams();
  const { currentTrack, isPlaying, playTrack, preloadTrack } = useAudio();
  
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedGenre, setSelectedGenre] = useState('Techno');
  const [bpmMin, setBpmMin] = useState(110);
  const [bpmMax, setBpmMax] = useState(145);
  const [selectedKey, setSelectedKey] = useState('');
  const [selectedKeySystem, setSelectedKeySystem] = useState<'Camelot' | 'Musical'>('Camelot');
  const [selectedLabel, setSelectedLabel] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    fetchTracks().then(data => {
      setTracks(data);
      setLoading(false);
    });
  }, []);

  const filteredTracks = useMemo(() => {
    return tracks.filter(track => {
      const matchesSearch = !searchQuery || 
        track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.artist?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = !selectedGenre || track.genre?.toLowerCase() === selectedGenre.toLowerCase();
      const matchesBpm = track.bpm >= bpmMin && track.bpm <= bpmMax;
      const matchesKey = !selectedKey || track.key === selectedKey;
      return matchesSearch && matchesGenre && matchesBpm && matchesKey;
    });
  }, [tracks, searchQuery, selectedGenre, bpmMin, bpmMax, selectedKey]);

  const Sidebar = () => (
    <aside className="w-[280px] flex-shrink-0">
      <div className="sticky top-24 space-y-6">
        {/* Sub-genres */}
        <div>
          <h3 className="text-[14px] font-bold text-black mb-3">Sub-genres</h3>
          <div className="space-y-1">
            {(SUB_GENRES[selectedGenre as keyof typeof SUB_GENRES] || SUB_GENRES['Techno']).map(sub => (
              <button
                key={sub}
                className={`block w-full text-left px-3 py-1.5 text-[13px] rounded transition-colors ${
                  searchQuery.toLowerCase().includes(sub.toLowerCase())
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-600 hover:text-black hover:bg-gray-50'
                }`}
                onClick={() => setSearchQuery(sub)}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>

        {/* BPM Range */}
        <div>
          <h3 className="text-[14px] font-bold text-black mb-3">BPM Range</h3>
          <p className="text-[13px] text-gray-500 mb-3">{bpmMin}-{bpmMax} BPM</p>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-gray-400 uppercase">Min</label>
              <input
                type="range"
                min={0}
                max={200}
                value={bpmMin}
                onChange={(e) => setBpmMin(Number(e.target.value))}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-[12px] font-mono text-black">{bpmMin}</span>
            </div>
            <div>
              <label className="text-[11px] text-gray-400 uppercase">Max</label>
              <input
                type="range"
                min={0}
                max={200}
                value={bpmMax}
                onChange={(e) => setBpmMax(Number(e.target.value))}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-[12px] font-mono text-black">{bpmMax}</span>
            </div>
          </div>
        </div>

        {/* Key */}
        <div>
          <h3 className="text-[14px] font-bold text-black mb-3">Key</h3>
          <div className="flex gap-2 mb-3">
            <button
              className={`px-3 py-1 text-[12px] rounded border ${
                selectedKeySystem === 'Camelot' 
                  ? 'bg-black text-white border-black' 
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedKeySystem('Camelot')}
            >
              Camelot
            </button>
            <button
              className={`px-3 py-1 text-[12px] rounded border ${
                selectedKeySystem === 'Musical' 
                  ? 'bg-black text-white border-black' 
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedKeySystem('Musical')}
            >
              Musical
            </button>
          </div>
          <select
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-[13px] text-black focus:outline-none focus:border-blue-300"
          >
            <option value="">All Keys</option>
            {CAMELOT_KEYS.map(key => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
        </div>

        {/* Label */}
        <div>
          <h3 className="text-[14px] font-bold text-black mb-3">Label</h3>
          <div className="space-y-1">
            {LABELS.map(label => (
              <button
                key={label}
                className={`block w-full text-left px-3 py-1.5 text-[13px] rounded transition-colors ${
                  selectedLabel === label
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-600 hover:text-black hover:bg-gray-50'
                }`}
                onClick={() => setSelectedLabel(selectedLabel === label ? '' : label)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Genre Header */}
      <div className="relative bg-gradient-to-r from-gray-900 to-gray-800 overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-6 py-12 flex items-center justify-between">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white uppercase tracking-tight">
            {selectedGenre || 'Browse'}
          </h1>
          <div className="hidden lg:block w-[200px] h-[120px] rounded-lg overflow-hidden opacity-60">
            <img 
              src="https://images.unsplash.com/photo-1571327073757-71d13c24de30?w=400&q=60" 
              alt="DJ" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block">
            <Sidebar />
          </div>

          {/* Mobile Filter Toggle */}
          <button
            className="lg:hidden fixed bottom-24 right-4 z-40 bg-blue-600 text-white p-3 rounded-full shadow-lg"
            onClick={() => setShowMobileFilters(true)}
          >
            <SlidersHorizontal size={20} />
          </button>

          {/* Mobile Filters Drawer */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileFilters(false)} />
              <div className="absolute right-0 top-0 h-full w-[320px] bg-white overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[16px] font-bold text-black">Filters</h2>
                  <button onClick={() => setShowMobileFilters(false)} className="text-gray-400 hover:text-black">
                    <X size={20} />
                  </button>
                </div>
                <Sidebar />
              </div>
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tracks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-[13px] text-black placeholder-gray-400 focus:outline-none focus:border-blue-300 transition-colors"
              />
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[13px] text-gray-500">
                {filteredTracks.length.toLocaleString()} tracks found
              </span>
            </div>

            {/* Track List */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : filteredTracks.length === 0 ? (
              <div className="flex flex-col items-center py-20 gap-3">
                <Search size={40} className="text-gray-200" />
                <p className="text-[14px] text-gray-500">No tracks found</p>
                <button 
                  className="text-[13px] text-blue-600 font-semibold hover:underline"
                  onClick={() => { setSearchQuery(''); setSelectedGenre('Techno'); setBpmMin(110); setBpmMax(145); setSelectedKey(''); }}
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="space-y-0">
                {/* Table Header */}
                <div className="hidden lg:grid grid-cols-[40px_1fr_1.2fr_60px_80px_80px_100px] gap-4 items-center px-4 py-3 border-b border-gray-100 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  <span></span>
                  <span>Waveform Preview</span>
                  <span>Track Title</span>
                  <span>Artist</span>
                  <span className="text-right">BPM</span>
                  <span className="text-right">Key</span>
                  <span className="text-right">Buy/Price</span>
                </div>

                {/* Track Rows */}
                {filteredTracks.slice(0, 50).map((track) => {
                  const isCurrentPlaying = currentTrack?.id === track.id && isPlaying;
                  const isFree = track.price === 0;
                  return (
                    <div
                      key={track.id}
                      className={`grid grid-cols-[1fr] lg:grid-cols-[40px_1fr_1.2fr_60px_80px_80px_100px] gap-2 lg:gap-4 items-center px-4 py-3 border-b border-gray-50 transition-all hover:bg-gray-50 ${
                        isCurrentPlaying ? 'bg-blue-50' : ''
                      }`}
                      onMouseEnter={() => preloadTrack({
                        id: track.id,
                        title: track.title,
                        artist: track.artist,
                        preview_url: track.preview_url,
                      })}
                    >
                      {/* Play Button */}
                      <button
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-black hover:bg-blue-600 hover:text-white transition-all flex-shrink-0"
                        onClick={() => playTrack({
                          id: track.id,
                          title: track.title,
                          artist: track.artist,
                          preview_url: track.preview_url,
                        })}
                      >
                        {isCurrentPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                      </button>

                      {/* Waveform Placeholder */}
                      <div className="hidden lg:flex items-center h-8 bg-gray-50 rounded overflow-hidden">
                        <div className="flex items-center h-full px-2 gap-[1px]">
                          {Array.from({ length: 60 }).map((_, i) => (
                            <div 
                              key={i}
                              className="w-[2px] bg-gray-300 rounded-full"
                              style={{ height: `${Math.random() * 100}%`, minHeight: '2px' }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Track Info */}
                      <div className="min-w-0">
                        <p className="font-semibold text-[13px] text-black truncate">{track.title}</p>
                      </div>

                      {/* Artist */}
                      <span className="text-[13px] text-gray-500 truncate">{track.artist}</span>

                      {/* BPM */}
                      <span className="text-[13px] text-black text-right font-mono">{track.bpm}</span>

                      {/* Key */}
                      <span className="text-[13px] text-gray-500 text-right font-mono">{track.key}</span>

                      {/* Price */}
                      <div className="flex justify-end">
                        {isFree ? (
                          <span className="text-[12px] text-blue-600 font-semibold">FREE</span>
                        ) : (
                          <button className="px-3 py-1 border border-gray-200 text-black text-[12px] font-semibold rounded hover:bg-black hover:text-white transition-all">
                            €{track.price.toFixed(2)} BUY
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Browse;
