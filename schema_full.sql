-- ============================================================
-- RunMusic-storeDj - Complete Database Schema
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/fbwqgbsalqgcrfxhoure/sql
-- ============================================================

-- 1. Tracks table (main catalog)
CREATE TABLE IF NOT EXISTS public.tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    version TEXT DEFAULT '',
    version_type TEXT DEFAULT 'clean',
    version_detail TEXT DEFAULT '',
    duration TEXT DEFAULT '0:00',
    bpm INTEGER DEFAULT 0,
    key TEXT DEFAULT '',
    genre TEXT DEFAULT 'Unknown',
    price NUMERIC(10,2) DEFAULT 0.00,
    audio_url TEXT NOT NULL,
    artwork_url TEXT,
    is_new BOOLEAN DEFAULT true,
    is_hot BOOLEAN DEFAULT false,
    plays INTEGER DEFAULT 0,
    energy INTEGER DEFAULT 1,
    popularity_rank INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Packs table (bundle of tracks)
CREATE TABLE IF NOT EXISTS public.packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    editor TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    genre TEXT,
    artwork_url TEXT,
    description TEXT,
    preview_url TEXT,
    is_free BOOLEAN NOT NULL DEFAULT false,
    tracks_count INTEGER DEFAULT 0,
    plays INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Pack-Tracks junction table
CREATE TABLE IF NOT EXISTS public.pack_tracks (
    pack_id UUID REFERENCES public.packs(id) ON DELETE CASCADE,
    track_id UUID REFERENCES public.tracks(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,
    PRIMARY KEY (pack_id, track_id)
);

-- 4. User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),
    payment_method TEXT DEFAULT 'promptpay',
    promptpay_ref TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Order items (junction: orders ↔ tracks)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    track_id UUID REFERENCES public.tracks(id) ON DELETE SET NULL,
    price_at_purchase NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- 7. User purchases (quick lookup for download access)
CREATE TABLE IF NOT EXISTS public.user_purchases (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    track_id UUID REFERENCES public.tracks(id) ON DELETE CASCADE,
    purchased_at TIMESTAMPTZ DEFAULT now(),
    download_count INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, track_id)
);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pack_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;

-- Tracks: public can read, admin can write
CREATE POLICY "Public read tracks" ON public.tracks FOR SELECT USING (true);

-- Packs: public can read, admin can write
CREATE POLICY "Public read packs" ON public.packs FOR SELECT USING (true);

-- Pack-Tracks: public can read, admin can write
CREATE POLICY "Public read pack_tracks" ON public.pack_tracks FOR SELECT USING (true);

-- Profiles: users read/update own
CREATE POLICY "Users read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Orders: users read/create own, admin reads all
CREATE POLICY "Users read own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Order items: users read own via order
CREATE POLICY "Users read own order items" ON public.order_items
    FOR SELECT USING (
        order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
    );
CREATE POLICY "Users create order items" ON public.order_items
    FOR INSERT WITH CHECK (
        order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
    );

-- Purchases: users read own
CREATE POLICY "Users read own purchases" ON public.user_purchases
    FOR SELECT USING (auth.uid() = user_id);

-- Admin: allow full access for admin emails
CREATE POLICY "Admin read all tracks" ON public.tracks
    FOR ALL USING (
        auth.jwt() ->> 'email' IN ('admin@beatvault.dj', 'bbeatonportdj@gmail.com')
    ) WITH CHECK (
        auth.jwt() ->> 'email' IN ('admin@beatvault.dj', 'bbeatonportdj@gmail.com')
    );

CREATE POLICY "Admin read all packs" ON public.packs
    FOR ALL USING (
        auth.jwt() ->> 'email' IN ('admin@beatvault.dj', 'bbeatonportdj@gmail.com')
    ) WITH CHECK (
        auth.jwt() ->> 'email' IN ('admin@beatvault.dj', 'bbeatonportdj@gmail.com')
    );

CREATE POLICY "Admin read all orders" ON public.orders
    FOR SELECT USING (
        auth.jwt() ->> 'email' IN ('admin@beatvault.dj', 'bbeatonportdj@gmail.com')
    );
CREATE POLICY "Admin update orders" ON public.orders
    FOR UPDATE USING (
        auth.jwt() ->> 'email' IN ('admin@beatvault.dj', 'bbeatonportdj@gmail.com')
    );
CREATE POLICY "Admin read all order items" ON public.order_items
    FOR SELECT USING (
        auth.jwt() ->> 'email' IN ('admin@beatvault.dj', 'bbeatonportdj@gmail.com')
    );
CREATE POLICY "Admin manage purchases" ON public.user_purchases
    FOR ALL USING (
        auth.jwt() ->> 'email' IN ('admin@beatvault.dj', 'bbeatonportdj@gmail.com')
    );

-- Seed initial packs
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

-- Seed initial tracks
INSERT INTO public.tracks (title, artist, version, version_type, duration, bpm, key, genre, price, audio_url, artwork_url, is_new, is_hot)
VALUES
    ('Espresso', 'Sabrina Carpenter', 'UGEEZY Intro Edit', 'intro', '3:20', 120, '8A', 'Pop', 1.99, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&h=600&fit=crop', true, true),
    ('Get Lucky', 'Daft Punk ft. Pharrell Williams', 'Disco Dan House Remix', 'clean', '4:15', 124, '11B', 'House', 2.49, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=600&fit=crop', true, false),
    ('Not Like Us', 'Kendrick Lamar', 'Dirty Intro Edit', 'dirty', '4:35', 96, '4A', 'Hip Hop', 1.99, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=600&h=600&fit=crop', false, true),
    ('Pepas', 'Farruko', 'Latin Club Edit', 'clean', '3:58', 130, '8B', 'Latin', 0.00, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?w=600&h=600&fit=crop', false, false);
