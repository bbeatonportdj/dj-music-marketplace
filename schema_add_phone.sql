-- ============================================================
-- DJ Music Marketplace - Migration: Add phone column to profiles
-- Run this in Supabase SQL Editor if phone column doesn't exist
-- ============================================================

-- Add phone column (safe to run multiple times)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add email column if missing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Add role column if missing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

-- Add full_name column if missing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Enable Supabase Phone Auth provider (run in Supabase Dashboard instead)
-- Dashboard > Authentication > Providers > Phone > Enable
