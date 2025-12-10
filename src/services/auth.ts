import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

/**
 * Login with email and password using Supabase Auth
 */
export async function login(email: string, password: string): Promise<{ user: User; session: Session }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(`Login failed: ${error.message}`);
  }

  if (!data.user || !data.session) {
    throw new Error('Login failed: No user or session returned');
  }

  return { user: data.user, session: data.session };
}

/**
 * Logout the current user
 */
export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`Logout failed: ${error.message}`);
  }
}

/**
 * Get the current session
 */
export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Failed to get session:', error);
    return null;
  }

  return data.session;
}

/**
 * Get the current user
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error('Failed to get user:', error);
    return null;
  }

  return data.user;
}

/**
 * Subscribe to authentication state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });

  return subscription;
}
