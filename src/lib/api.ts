export interface Track {
  id: string;
  title: string;
  artist: string;
  version: string;
  versionType: string;
  versionDetail?: string;
  duration: string;
  bpm: number;
  key: string;
  genre: string;
  price: number;
  artwork: string;
  preview_url: string;
  created_at?: string;
  date?: string;
  plays?: number;
  energy?: number;
  rank?: number;
  isNew?: boolean;
  isHot?: boolean;
  isExclusive?: boolean;
}

export interface Pack {
  id: string;
  title: string;
  editor: string;
  price: number;
  genre: string;
  artwork: string;
  description: string;
  preview_url: string;
  is_free: boolean;
  tracks_count: number;
  created_at?: string;
  date?: string;
  plays?: number;
}

// Static/Seed packs for catalog navigation
const STATIC_PACKS: Pack[] = [
  {
    id: 'pack-pure-hits-1',
    title: 'PURE HITS VOL. 1',
    editor: 'UGEEZY EDITS',
    price: 10.00,
    genre: 'Pop',
    artwork: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&h=600&fit=crop',
    description: 'The ultimate collection of high-energy DJ edits for your next club set. Featuring custom intros, short edits, and acapella transitions.',
    preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    is_free: false,
    tracks_count: 40,
    created_at: new Date().toISOString(),
    date: new Date().toLocaleDateString(),
    plays: 3500,
  },
  {
    id: 'pack-90s-house',
    title: '90S HOUSE ANTHEMS',
    editor: 'DISCO DAN',
    price: 0.00,
    genre: 'House',
    artwork: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=600&fit=crop',
    description: 'Relive the golden era of house music with these classic 90s club edits. Perfect for deep house and retro-themed sets.',
    preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    is_free: true,
    tracks_count: 25,
    created_at: new Date().toISOString(),
    date: new Date().toLocaleDateString(),
    plays: 1800,
  },
  {
    id: 'pack-latin-vibes',
    title: 'LATIN VIBES PACK',
    editor: 'DJ RICARDO',
    price: 0.00,
    genre: 'Latin',
    artwork: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?w=600&h=600&fit=crop',
    description: 'A vibrant collection of Latin rhythms and club edits. Salsa, reggaeton, and Afrobeat fusions ready for the dancefloor.',
    preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    is_free: true,
    tracks_count: 15,
    created_at: new Date().toISOString(),
    date: new Date().toLocaleDateString(),
    plays: 2400,
  },
  {
    id: 'pack-trap-soul',
    title: 'TRAP SOUL BASICS',
    editor: 'METRO BEATS',
    price: 12.00,
    genre: 'Hip Hop',
    artwork: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=600&h=600&fit=crop',
    description: 'Essential trap and soul edits for modern hip hop DJs. Smooth transitions, hard-hitting drops, and soulful breakdowns.',
    preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    is_free: false,
    tracks_count: 30,
    created_at: new Date().toISOString(),
    date: new Date().toLocaleDateString(),
    plays: 4100,
  }
];

export const fetchTracks = async (): Promise<Track[]> => {
  try {
    const res = await fetch('/api/music');
    if (!res.ok) throw new Error('Failed to fetch tracks');
    const data = await res.json();
    
    return data.map((t: any) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      version: t.version || '',
      versionType: t.version_type || 'clean',
      versionDetail: t.version_detail || '',
      duration: t.duration || '0:00',
      bpm: t.bpm || 0,
      key: t.key || '',
      genre: t.genre || 'Unknown',
      price: typeof t.price === 'string' ? parseFloat(t.price) : (t.price || 0),
      artwork: t.artwork_url || '',
      preview_url: t.audio_url || '',
      created_at: t.created_at,
      date: new Date(t.created_at).toLocaleDateString(),
      plays: t.plays || Math.floor(Math.random() * 5000) + 500,
      energy: t.energy || Math.floor(Math.random() * 5) + 1,
      rank: t.popularity_rank || Math.floor(Math.random() * 100) + 1,
      isNew: t.is_new || false,
      isHot: t.is_hot || false,
      isExclusive: t.is_exclusive || false
    }));
  } catch (error) {
    console.error('Error fetching tracks:', error);
    return [];
  }
};

export const fetchTrackById = async (id: string | number): Promise<Track | null> => {
  try {
    const res = await fetch(`/api/music/${id}`);
    if (!res.ok) throw new Error('Track not found');
    const data = await res.json();
    
    return {
      id: data.id,
      title: data.title,
      artist: data.artist,
      version: data.version || '',
      versionType: data.version_type || 'clean',
      versionDetail: data.version_detail || '',
      duration: data.duration || '0:00',
      bpm: data.bpm || 0,
      key: data.key || '',
      genre: data.genre || 'Unknown',
      price: typeof data.price === 'string' ? parseFloat(data.price) : (data.price || 0),
      artwork: data.artwork_url || '',
      preview_url: data.audio_url || '',
      created_at: data.created_at,
      date: new Date(data.created_at).toLocaleDateString(),
      plays: data.plays || Math.floor(Math.random() * 5000) + 500,
      energy: data.energy || Math.floor(Math.random() * 5) + 1,
      rank: data.popularity_rank || Math.floor(Math.random() * 100) + 1,
      isNew: data.is_new || false,
      isHot: data.is_hot || false,
      isExclusive: data.is_exclusive || false
    };
  } catch (error) {
    console.error('Error fetching track by id:', error);
    return null;
  }
};

export const fetchPacks = async (): Promise<Pack[]> => {
  return STATIC_PACKS;
};

export const fetchPackById = async (id: string): Promise<Pack | null> => {
  const pack = STATIC_PACKS.find(p => p.id === id);
  return pack || null;
};

export const fetchTracksByPackId = async (packId: string): Promise<Track[]> => {
  const pack = await fetchPackById(packId);
  if (!pack) return [];
  
  // Filter all catalog tracks that match this pack's genre (e.g. Pop/House/Latin/Hip Hop)
  const allTracks = await fetchTracks();
  const packGenre = pack.genre.toLowerCase();
  
  return allTracks.filter(t => {
    const trackGenre = t.genre.toLowerCase();
    if (packGenre === 'pop' && (trackGenre.includes('pop') || trackGenre.includes('top 40'))) return true;
    return trackGenre.includes(packGenre);
  });
};
