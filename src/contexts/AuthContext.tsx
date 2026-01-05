'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, displayName: string, inviteCode?: string) => Promise<{ error: any; needsEmailConfirmation?: boolean; message?: string }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // URL'deki token'ı temizle
      if (event === 'SIGNED_IN' && window.location.hash.includes('access_token')) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string, displayName: string, inviteCode?: string) => {
    try {
      // API URL'ini belirle
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://devforum-backend-102j.onrender.com';
      
      // Kullanıcı adı ve display name kontrolü
      if (!username || username.trim().length < 3) {
        return { error: { message: 'Kullanıcı adı en az 3 karakter olmalı' } };
      }

      if (!displayName || displayName.trim().length < 2) {
        return { error: { message: 'Görünen ad en az 2 karakter olmalı' } };
      }

      // Email ve şifre validation
      if (!email || !password || password.length < 6) {
        return { error: { message: 'Geçersiz email veya şifre (minimum 6 karakter)' } };
      }

      // Backend'e signup isteği gönder
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          username: username.trim().toLowerCase(),
          displayName: displayName.trim(),
          inviteCode: inviteCode?.trim()
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return { 
          error: { message: result.error || result.message || 'Kayıt başarısız' },
          needsEmailConfirmation: false
        };
      }

      // Başarılı
      return { 
        error: null,
        needsEmailConfirmation: result.needsEmailConfirmation || false,
        message: result.message
      };
    } catch (error: any) {
      console.error('Kayıt hatası:', error);
      return { 
        error: { message: error.message || 'Kayıt sırasında bir hata oluştu' },
        needsEmailConfirmation: false
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
