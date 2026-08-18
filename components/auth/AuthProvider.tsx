'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { UserProfile } from '@/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  userProfile: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initSession } }) => {
      setSession(initSession);
      const currentUser = initSession?.user || null;
      setUser(currentUser);
      if (currentUser) {
        setUserProfile({
          uid: currentUser.id,
          email: currentUser.email || 'admin@anandhardware.com',
          displayName: currentUser.user_metadata?.displayName || 'Anand Hardware Staff',
          role: (currentUser.user_metadata?.role as any) || 'admin',
        });
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      const currentUser = currentSession?.user || null;
      setUser(currentUser);
      if (currentUser) {
        setUserProfile({
          uid: currentUser.id,
          email: currentUser.email || 'admin@anandhardware.com',
          displayName: currentUser.user_metadata?.displayName || 'Anand Hardware Staff',
          role: (currentUser.user_metadata?.role as any) || 'admin',
        });
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (error) {
        // Fallback for admin credentials in demo/standalone environment
        if (email === 'admin@anandhardware.com' && pass === 'AnandAdmin2026!') {
          const demoUser: UserProfile = {
            uid: 'admin-static-uid-001',
            email: 'admin@anandhardware.com',
            displayName: 'Anand Hardware Admin',
            role: 'admin',
          };
          setUserProfile(demoUser);
          setUser({ id: 'admin-static-uid-001', email: 'admin@anandhardware.com' } as User);
          return;
        }
        throw new Error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, userProfile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
