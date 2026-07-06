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
  signUp: (email: string, password: string, role?: string) => Promise<{ error: string | null }>;
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

  // Load user from JWT token on mount
  useEffect(() => {
    const loadUser = async () => {
      const savedToken = localStorage.getItem('jwt_token');
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(apiUrl('/api/auth/me'), {
          headers: {
            'Authorization': `Bearer ${savedToken}`,
          },
        });
        
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setToken(savedToken);
          setIsAdmin(data.user.role === 'admin');
          setIsProducer(data.user.role === 'producer');
        } else {
          // Token expired or invalid
          localStorage.removeItem('jwt_token');
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

      localStorage.setItem('jwt_token', data.token);
      setUser(data.user);
      setToken(data.token);
      setIsAdmin(data.user.role === 'admin');
      setIsProducer(data.user.role === 'producer');
      return { error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { error: message };
    }
  };

  const signUp = async (email: string, password: string, role?: string) => {
    try {
      const res = await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          display_name: email.split('@')[0],
          ...(role && { role }),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to register');
      }

      localStorage.setItem('jwt_token', data.token);
      setUser(data.user);
      setToken(data.token);
      setIsAdmin(data.user.role === 'admin');
      setIsProducer(data.user.role === 'producer');
      return { error: null };
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
    localStorage.removeItem('jwt_token');
    setUser(null);
    setToken(null);
    setIsAdmin(false);
    setIsProducer(false);
  };

  const updateProfileName = async (displayName: string) => {
    try {
      const savedToken = localStorage.getItem('jwt_token');
      if (!savedToken) throw new Error('Not authenticated');

      const res = await fetch(apiUrl('/api/auth/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedToken}`,
        },
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

