import { apiUrl } from './apiBase';
import { getSupabaseClient } from './supabase';

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
  full_audio_url?: string;
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

const FALLBACK_TRACKS: Track[] = [
  {
    id: 'fallback-midnight-drop',
    title: 'Midnight Drop',
    artist: 'DJ Axiom',
    version: 'Extended Mix',
    versionType: 'extended',
    versionDetail: 'Extended mix for peak-time sets',
    duration: '3:45',
    bpm: 124,
    key: 'A Minor',
    genre: 'House',
    price: 0,
    artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=600&fit=crop',
    preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    created_at: new Date().toISOString(),
    date: new Date().toLocaleDateString(),
    plays: 4520,
    energy: 4,
    rank: 12,
    isNew: true,
    isHot: true,
    isExclusive: false,
  },
  {
    id: 'fallback-sunset-rewind',
    title: 'Sunset Rewind',
    artist: 'Maya Voss',
    version: 'Radio Edit',
    versionType: 'radio',
    versionDetail: 'Clean radio edit',
    duration: '3:18',
    bpm: 108,
    key: 'F Sharp Minor',
    genre: 'Pop',
    price: 0,
    artwork: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&h=600&fit=crop',
    preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    created_at: new Date().toISOString(),
    date: new Date().toLocaleDateString(),
    plays: 3890,
    energy: 3,
    rank: 18,
    isNew: true,
    isHot: false,
    isExclusive: false,
  },
  {
    id: 'fallback-cascade',
    title: 'Cascade',
    artist: 'Nico Vale',
    version: 'Club Cut',
    versionType: 'club',
    versionDetail: 'Punchy club cut',
    duration: '4:02',
    bpm: 132,
    key: 'C Major',
    genre: 'Techno',
    price: 5,
    artwork: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&h=600&fit=crop',
    preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    created_at: new Date().toISOString(),
    date: new Date().toLocaleDateString(),
    plays: 3150,
    energy: 5,
    rank: 22,
    isNew: false,
    isHot: true,
    isExclusive: true,
  },
  {
    id: 'fallback-afterglow',
    title: 'Afterglow',
    artist: 'Luna Drift',
    version: 'Deep House Edit',
    versionType: 'deep',
    versionDetail: 'Deep grove edit',
    duration: '3:56',
    bpm: 118,
    key: 'D Minor',
    genre: 'Deep House',
    price: 0,
    artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=600&fit=crop',
    preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    created_at: new Date().toISOString(),
    date: new Date().toLocaleDateString(),
    plays: 2760,
    energy: 4,
    rank: 30,
    isNew: true,
    isHot: false,
    isExclusive: false,
  },
];

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

const trackFromSupabase = (t: Record<string, unknown>): Track => {
  const id = String(t.id ?? '');
  const created_at = t.created_at ? String(t.created_at) : new Date().toISOString();
  const priceVal = t.price;
  const price = typeof priceVal === 'string' ? parseFloat(priceVal) : (typeof priceVal === 'number' ? priceVal : 0);

  return {
    id,
    title: String(t.title ?? ''),
    artist: String(t.artist ?? ''),
    version: String(t.version ?? ''),
    versionType: String(t.version_type ?? 'clean'),
    versionDetail: String(t.version_detail ?? ''),
    duration: String(t.duration ?? '0:00'),
    bpm: Number(t.bpm ?? 0),
    key: String(t.key ?? ''),
    genre: String(t.genre ?? 'Unknown'),
    price,
    artwork: String(t.artwork_url ?? ''),
    preview_url: `/api/preview/${id}`,
    full_audio_url: String(t.audio_url ?? ''),
    created_at,
    date: new Date(created_at).toLocaleDateString(),
    plays: Number(t.plays ?? Math.floor(Math.random() * 5000) + 500),
    energy: Number(t.energy ?? Math.floor(Math.random() * 5) + 1),
    rank: Number(t.popularity_rank ?? Math.floor(Math.random() * 100) + 1),
    isNew: Boolean(t.is_new ?? false),
    isHot: Boolean(t.is_hot ?? false),
    isExclusive: Boolean(t.is_exclusive ?? false),
  };
};

export const fetchTracks = async (): Promise<Track[]> => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map(trackFromSupabase);
    }
  } catch (e) {
    console.warn('Supabase tracks fetch failed, trying API:', e);
  }

  try {
    const res = await fetch(apiUrl('/api/music'));
    if (!res.ok) throw new Error('Failed to fetch tracks');
    const data = await res.json();

    if (Array.isArray(data) && data.length > 0) {
      return data.map(trackFromSupabase);
    }
  } catch (error) {
    console.error('API fetch failed, using fallback:', error);
  }

  return FALLBACK_TRACKS;
};

export const fetchTrackById = async (id: string | number): Promise<Track | null> => {
  const idStr = String(id);

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('id', idStr)
      .maybeSingle();

    if (!error && data) {
      return trackFromSupabase(data as Record<string, unknown>);
    }
  } catch (e) {
    console.warn('Supabase track fetch failed, trying API:', e);
  }

  try {
    const res = await fetch(apiUrl(`/api/music/${idStr}`));
    if (!res.ok) throw new Error('Track not found');
    const data = await res.json();
    return trackFromSupabase(data as Record<string, unknown>);
  } catch (error) {
    console.error('Error fetching track by id:', error);
  }

  const fallbackTrack = FALLBACK_TRACKS.find(track => track.id === idStr);
  return fallbackTrack ?? null;
};

const mapSupabasePack = (p: Record<string, unknown>): Pack => ({
  id: String(p.id ?? ''),
  title: String(p.title ?? ''),
  editor: String(p.editor ?? ''),
  price: typeof p.price === 'string' ? parseFloat(p.price) : (typeof p.price === 'number' ? p.price : 0),
  genre: String(p.genre ?? ''),
  artwork: String(p.artwork_url ?? ''),
  description: String(p.description ?? ''),
  preview_url: String(p.preview_url ?? ''),
  is_free: Boolean(p.is_free ?? false),
  tracks_count: Number(p.tracks_count ?? 0),
  created_at: p.created_at ? String(p.created_at) : new Date().toISOString(),
  date: p.created_at ? new Date(String(p.created_at)).toLocaleDateString() : new Date().toLocaleDateString(),
  plays: Number(p.plays ?? Math.floor(Math.random() * 5000) + 500),
});

export const fetchPacks = async (): Promise<Pack[]> => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('packs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (data && data.length > 0) {
      return data.map(mapSupabasePack);
    }
  } catch (error) {
    console.warn('Supabase packs fetch failed, using static fallback:', error);
  }

  return STATIC_PACKS;
};

export const fetchPackById = async (id: string): Promise<Pack | null> => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('packs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (data) return mapSupabasePack(data as Record<string, unknown>);
  } catch (error) {
    console.warn('Supabase pack fetch failed, using static fallback:', error);
  }

  const pack = STATIC_PACKS.find(p => p.id === id);
  return pack || null;
};

export const fetchTracksByPackId = async (packId: string): Promise<Track[]> => {
  const pack = await fetchPackById(packId);
  if (!pack) return [];

  try {
    const supabase = getSupabaseClient();
    const { data: packTracks, error: ptError } = await supabase
      .from('pack_tracks')
      .select('track_id, position')
      .eq('pack_id', packId)
      .order('position', { ascending: true });

    if (!ptError && packTracks && packTracks.length > 0) {
      const trackIds = packTracks.map((pt: Record<string, unknown>) => pt.track_id);
      const { data: tracks, error: trError } = await supabase
        .from('tracks')
        .select('*')
        .in('id', trackIds);

      if (!trError && tracks && tracks.length > 0) {
        const trackMap = new Map(tracks.map((t: Record<string, unknown>) => [t.id, t]));
        return packTracks
          .map((pt: Record<string, unknown>) => {
            const t = trackMap.get(pt.track_id) as Record<string, unknown> | undefined;
            if (!t) return null;
            return trackFromSupabase(t);
          })
          .filter((t: Track | null): t is Track => t !== null);
      }
    }
  } catch (error) {
    console.warn('Supabase pack_tracks fetch failed, using genre fallback:', error);
  }

  const allTracks = await fetchTracks();
  const packGenre = pack.genre.toLowerCase();

  return allTracks.filter(t => {
    const trackGenre = t.genre.toLowerCase();
    if (packGenre === 'pop' && (trackGenre.includes('pop') || trackGenre.includes('top 40'))) return true;
    return trackGenre.includes(packGenre);
  });
};
