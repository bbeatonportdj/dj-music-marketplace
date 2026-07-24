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
          <h3 className="text-[13px] font-bold text-white mb-3 uppercase tracking-wider">Sub-genres</h3>
          <div className="space-y-1">
            {(SUB_GENRES[selectedGenre as keyof typeof SUB_GENRES] || SUB_GENRES['Techno']).map(sub => (
              <button
                key={sub}
                className={`block w-full text-left px-3 py-2 text-[13px] rounded-lg transition-colors ${
                  searchQuery.toLowerCase().includes(sub.toLowerCase())
                    ? 'bg-blue-600/10 text-blue-400 font-medium border border-blue-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
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
          <h3 className="text-[13px] font-bold text-white mb-3 uppercase tracking-wider">BPM Range</h3>
          <p className="text-[13px] text-gray-500 mb-3 font-mono">{bpmMin}-{bpmMax} BPM</p>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider">Min</label>
              <input
                type="range"
                min={0}
                max={200}
                value={bpmMin}
                onChange={(e) => setBpmMin(Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-[12px] font-mono text-white">{bpmMin}</span>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider">Max</label>
              <input
                type="range"
                min={0}
                max={200}
                value={bpmMax}
                onChange={(e) => setBpmMax(Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-[12px] font-mono text-white">{bpmMax}</span>
            </div>
          </div>
        </div>

        {/* Key */}
        <div>
          <h3 className="text-[13px] font-bold text-white mb-3 uppercase tracking-wider">Key</h3>
          <div className="flex gap-1 mb-3">
            <button
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                selectedKeySystem === 'Camelot' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
              onClick={() => setSelectedKeySystem('Camelot')}
            >
              Camelot
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                selectedKeySystem === 'Musical' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
              onClick={() => setSelectedKeySystem('Musical')}
            >
              Musical
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {CAMELOT_KEYS.map(key => (
              <button
                key={key}
                className={`px-2 py-1.5 rounded text-[11px] font-mono transition-all ${
                  selectedKey === key 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
                onClick={() => setSelectedKey(selectedKey === key ? '' : key)}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        {/* Label */}
        <div>
          <h3 className="text-[13px] font-bold text-white mb-3 uppercase tracking-wider">Label</h3>
          <div className="space-y-1">
            {LABELS.slice(0, 5).map(label => (
              <button
                key={label}
                className={`block w-full text-left px-3 py-2 text-[13px] rounded-lg transition-colors ${
                  selectedLabel === label
                    ? 'bg-blue-600/10 text-blue-400 font-medium border border-blue-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-[12px] text-gray-500 font-mono uppercase tracking-widest">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Header */}
      <div className="border-b border-white/5 bg-white/[0.02]">
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-blue-500 font-mono text-[10px] uppercase tracking-[0.2em] mb-1">Browse</p>
              <h1 className="text-2xl font-extrabold text-white">Find Your Tracks</h1>
            </div>
            
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search tracks, artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-[13px] text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="hidden lg:block">
            <Sidebar />
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Mobile Filter Toggle */}
            <button
              className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[13px] text-white mb-4"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
            >
              <SlidersHorizontal size={14} />
              Filters
            </button>

            {/* Track Count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] text-gray-500">{filteredTracks.length} tracks</p>
              <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
                <button className="px-4 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-wide bg-blue-600 text-white">
                  All
                </button>
              </div>
            </div>

            {/* Track Table */}
            <div className="bg-white/[0.02] rounded-xl overflow-hidden border border-white/5">
              {/* Header */}
              <div className="hidden lg:grid grid-cols-[40px_2fr_1.5fr_80px_80px_100px] gap-4 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                <span className="text-[10px] font-semibold text-gray-500 uppercase">#</span>
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Track Title</span>
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Artist</span>
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider text-right">BPM</span>
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider text-right">Key</span>
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider text-right">Price</span>
              </div>

              {/* Rows */}
              {filteredTracks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                    <Search size={20} className="text-gray-600" />
                  </div>
                  <p className="text-[14px] text-gray-500">No tracks found</p>
                  <button 
                    className="text-[13px] text-blue-500 font-semibold hover:text-blue-400 transition-colors"
                    onClick={() => { setSearchQuery(''); setSelectedGenre('All'); }}
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                filteredTracks.map((track, idx) => (
                  <div
                    key={track.id}
                    className={`group grid grid-cols-[40px_1fr] lg:grid-cols-[40px_2fr_1.5fr_80px_80px_100px] gap-4 items-center px-4 py-3 border-b border-white/[0.03] last:border-b-0 cursor-pointer transition-all hover:bg-white/[0.04] ${
                      currentTrack?.id === track.id ? 'bg-blue-500/10' : ''
                    }`}
                    onMouseEnter={() => preloadTrack({
                      id: track.id,
                      title: track.title,
                      artist: track.artist,
                      preview_url: track.preview_url,
                    })}
                  >
                    {/* Number / Play */}
                    <div className="flex items-center justify-center">
                      <span className="text-[12px] text-gray-600 font-mono group-hover:hidden">{String(idx + 1).padStart(2, '0')}</span>
                      <button
                        className="hidden group-hover:flex w-7 h-7 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-500 transition-all"
                        onClick={e => {
                          e.stopPropagation();
                          playTrack(track);
                        }}
                      >
                        {currentTrack?.id === track.id && isPlaying ? (
                          <Pause size={10} fill="currentColor" />
                        ) : (
                          <Play size={10} fill="currentColor" className="ml-0.5" />
                        )}
                      </button>
                    </div>

                    {/* Track Info (Mobile) */}
                    <div className="min-w-0">
                      <p className="font-semibold text-[13px] text-white truncate group-hover:text-blue-400 transition-colors">{track.title}</p>
                      <p className="text-[12px] text-gray-500 truncate lg:hidden">{track.artist}</p>
                    </div>

                    {/* Artist (Desktop) */}
                    <span className="hidden lg:block text-[13px] text-gray-400 truncate">{track.artist}</span>

                    {/* BPM (Desktop) */}
                    <span className="hidden lg:block text-[12px] text-gray-300 text-right font-mono">{track.bpm}</span>

                    {/* Key (Desktop) */}
                    <span className="hidden lg:block text-[12px] text-gray-500 text-right font-mono">{track.key}</span>

                    {/* Price */}
                    <div className="flex justify-end">
                      {track.price === 0 ? (
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold rounded border border-emerald-500/20">FREE</span>
                      ) : (
                        <button className="px-3 py-1 bg-white/5 border border-white/10 text-white text-[11px] font-semibold rounded hover:bg-blue-600 hover:border-blue-600 transition-all">
                          ${track.price.toFixed(2)}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Browse;
