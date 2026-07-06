-- ============================================================
-- RBAC Migration: Add role to profiles, uploaded_by to tracks
-- ============================================================

-- 1. Add role column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'producer', 'admin'));

-- 2. Add uploaded_by to tracks (references the app's users table, or nullable for existing tracks)
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS uploaded_by UUID;

-- 3. Update auto-create profile function to accept role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data ->> 'role', 'user')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update RLS policies for tracks (producer can manage own, admin can manage all)
DROP POLICY IF EXISTS "Public read tracks" ON public.tracks;
DROP POLICY IF EXISTS "Admin read all tracks" ON public.tracks;

CREATE POLICY "Public read tracks" ON public.tracks
    FOR SELECT USING (true);

CREATE POLICY "Producers insert own tracks" ON public.tracks
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND (
            (auth.jwt() ->> 'role') = 'producer'
            OR (auth.jwt() ->> 'role') = 'admin'
            OR auth.email() IN ('admin@beatvault.dj', 'bbeatonportdj@gmail.com')
        )
    );

CREATE POLICY "Producers update own tracks" ON public.tracks
    FOR UPDATE USING (
        auth.uid() IS NOT NULL
        AND (
            uploaded_by = auth.uid()
            OR (auth.jwt() ->> 'role') = 'admin'
            OR auth.email() IN ('admin@beatvault.dj', 'bbeatonportdj@gmail.com')
        )
    );

CREATE POLICY "Producers delete own tracks" ON public.tracks
    FOR DELETE USING (
        auth.uid() IS NOT NULL
        AND (
            uploaded_by = auth.uid()
            OR (auth.jwt() ->> 'role') = 'admin'
            OR auth.email() IN ('admin@beatvault.dj', 'bbeatonportdj@gmail.com')
        )
    );

-- 5. Update packs RLS for producers
DROP POLICY IF EXISTS "Admin read all packs" ON public.packs;

CREATE POLICY "Producers manage own packs" ON public.packs
    FOR ALL USING (
        auth.jwt() ->> 'email' IN ('admin@beatvault.dj', 'bbeatonportdj@gmail.com')
        OR (auth.jwt() ->> 'role') = 'admin'
        OR (auth.jwt() ->> 'role') = 'producer'
    ) WITH CHECK (
        auth.jwt() ->> 'email' IN ('admin@beatvault.dj', 'bbeatonportdj@gmail.com')
        OR (auth.jwt() ->> 'role') = 'admin'
        OR (auth.jwt() ->> 'role') = 'producer'
    );

-- 6. Enable admin to manage all rows via role (supplement to email-based policies)
CREATE POLICY "Admin full access orders" ON public.orders
    FOR ALL USING (
        auth.jwt() ->> 'email' IN ('admin@beatvault.dj', 'bbeatonportdj@gmail.com')
        OR (auth.jwt() ->> 'role') = 'admin'
    );

-- 7. Profiles RLS — users can read own, producers can read own, admin can read all
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;

CREATE POLICY "Profiles read own" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id
        OR (auth.jwt() ->> 'role') = 'admin'
        OR auth.email() IN ('admin@beatvault.dj', 'bbeatonportdj@gmail.com')
    );

CREATE POLICY "Profiles update own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Profiles insert own" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
