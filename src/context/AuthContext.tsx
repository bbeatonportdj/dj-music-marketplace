import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { apiUrl } from '../lib/apiBase';

/* eslint-disable react-refresh/only-export-components */
export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  role: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAdmin: boolean;
  isProducer: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, role?: string, display_name?: string, phone?: string) => Promise<{ error: string | null; user?: UserProfile | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signInWithFacebook: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfileName: (displayName: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isProducer, setIsProducer] = useState(false);

  // Load user from HttpOnly cookie on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch(apiUrl('/api/auth/me'));
        
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setIsAdmin(data.user.role === 'admin');
          setIsProducer(data.user.role === 'producer');
        }
      } catch (err) {
        console.error('Failed to load user info:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to login');
      }

      setUser(data.user);
      setIsAdmin(data.user.role === 'admin');
      setIsProducer(data.user.role === 'producer');
      return { error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { error: message };
    }
  };

  const signUp = async (email: string, password: string, role?: string, display_name?: string, phone?: string) => {
    try {
      const res = await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          display_name: display_name || email.split('@')[0],
          phone: phone || undefined,
          ...(role && { role }),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to register');
      }

      // Load user from cookie session (if session was created)
      const meRes = await fetch(apiUrl('/api/auth/me'));
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.user) {
          setUser(meData.user);
          setIsAdmin(meData.user.role === 'admin');
          setIsProducer(meData.user.role === 'producer');
          return { error: null, user: meData.user };
        }
      }

      // No active session — email verification required
      return { error: null, user: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { error: message };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const client = getSupabaseClient();
      const { error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth?oauth=1&provider=google'
        }
      });
      return { error: error ? String(error) : null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { error: message };
    }
  };

  const signInWithFacebook = async () => {
    try {
      const client = getSupabaseClient();
      const { error } = await client.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: window.location.origin + '/auth?oauth=1&provider=facebook'
        }
      });
      return { error: error ? String(error) : null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { error: message };
    }
  };

  const signOut = async () => {
    try {
      await fetch(apiUrl('/api/auth/logout'), { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    setUser(null);
    setToken(null);
    setIsAdmin(false);
    setIsProducer(false);
  };

  const updateProfileName = async (displayName: string) => {
    try {
      const res = await fetch(apiUrl('/api/auth/profile'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setUser(data.user);
      return { error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { error: message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isAdmin, isProducer, loading, signIn, signUp, signInWithGoogle, signInWithFacebook, signOut, updateProfileName }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
