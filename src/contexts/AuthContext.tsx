import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getCurrentSession, onAuthStateChange } from '../services/auth';
import type { AuthState } from '../types';

interface AuthContextType extends AuthState {
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    getCurrentSession().then((session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Subscribe to auth state changes
    const subscription = onAuthStateChange((user) => {
      setUser(user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const authState: AuthContextType = {
    isAuthenticated: !!user,
    isAdminMode: !!user,
    user,
    setUser,
  };

  if (loading) {
    return null; // Or a loading spinner
  }

  return <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
