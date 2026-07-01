-- ============================================================
-- RunMusic-storeDj - Schema V2: Orders, Profiles, Purchases
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/fbwqgbsalqgcrfxhoure/sql
-- ============================================================

-- 1. User profiles (extends Supabase auth.users)
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

-- 2. Orders table
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

-- 3. Order items (junction: orders ↔ tracks)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    track_id UUID REFERENCES public.tracks(id) ON DELETE SET NULL,
    price_at_purchase NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- 4. User purchases (quick lookup for download access)
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
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;

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

-- Admin: allow full access (enforced at app level via email check)
-- These policies allow the admin email to manage all orders
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
