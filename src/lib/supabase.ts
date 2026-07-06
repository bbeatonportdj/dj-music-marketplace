import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// ป้องกันแอปค้างถ้ายังไม่ได้ใส่ URL
export const supabase: SupabaseClient | null = supabaseUrl
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null; // ให้เป็น null ไปก่อนเพื่อไม่ให้แอปพัง

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }
  return supabase;
};

if (!supabaseUrl) {
  console.warn('Supabase URL is missing. App is running in demo mode.');
}
