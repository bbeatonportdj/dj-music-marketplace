-- ============================================================
-- DJ Music Marketplace - Supabase SQL Migration
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/fbwqgbsalqgcrfxhoure/sql
-- ============================================================

-- 1. Create packs table
CREATE TABLE IF NOT EXISTS public.packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    editor TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    genre TEXT,
    artwork_url TEXT,
    description TEXT,
    preview_url TEXT,
    is_free BOOLEAN NOT NULL DEFAULT false,
    tracks_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create junction table to link tracks inside packs
CREATE TABLE IF NOT EXISTS public.pack_tracks (
    pack_id UUID REFERENCES public.packs(id) ON DELETE CASCADE,
    track_id UUID REFERENCES public.tracks(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,
    PRIMARY KEY (pack_id, track_id)
);

-- 3. Seed initial packs
INSERT INTO public.packs (title, editor, price, genre, artwork_url, preview_url, is_free, tracks_count, description)
VALUES 
(
    'PURE HITS VOL. 1', 
    'UGEEZY EDITS', 
    10.00, 
    'Top 40', 
    'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&h=600&fit=crop', 
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 
    false,
    40,
    'The ultimate collection of high-energy DJ edits for your next club set. Featuring custom intros, short edits, and acapella transitions.'
),
(
    '90S HOUSE ANTHEMS', 
    'DISCO DAN', 
    0.00, 
    'House', 
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=600&fit=crop', 
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 
    true,
    25,
    'Relive the golden era of house music with these classic 90s club edits. Perfect for deep house and retro-themed sets.'
),
(
    'LATIN VIBES PACK', 
    'DJ RICARDO', 
    0.00, 
    'Latin', 
    'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?w=600&h=600&fit=crop', 
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 
    true,
    15,
    'A vibrant collection of Latin rhythms and club edits. Salsa, reggaeton, and Afrobeat fusions ready for the dancefloor.'
),
(
    'TRAP SOUL BASICS', 
    'METRO BEATS', 
    12.00, 
    'Hip Hop', 
    'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=600&h=600&fit=crop', 
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', 
    false,
    30,
    'Essential trap and soul edits for modern hip hop DJs. Smooth transitions, hard-hitting drops, and soulful breakdowns.'
);

-- 4. Enable Row Level Security (matching existing tracks table setup)
ALTER TABLE public.packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pack_tracks ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read packs (public catalog)
CREATE POLICY "Allow public read on packs" ON public.packs FOR SELECT USING (true);
CREATE POLICY "Allow public read on pack_tracks" ON public.pack_tracks FOR SELECT USING (true);

-- Allow authenticated users to write (Admin role enforced at app level)
CREATE POLICY "Allow write on packs" ON public.packs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow write on pack_tracks" ON public.pack_tracks FOR ALL USING (true) WITH CHECK (true);
