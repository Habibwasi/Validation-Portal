import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

/** Guest (anonymous) sign-in is opt-in: it also needs "Allow anonymous sign-ins" enabled in Supabase. */
export const GUEST_ENABLED = import.meta.env.VITE_ENABLE_GUEST === 'true';

/** Guest accounts older than this are deleted by the `delete-expired-guests` cron job in schema.sql. */
export const GUEST_RETENTION_DAYS = 7;

export function appBaseUrl(): string {
  return (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, '') ?? window.location.origin;
}

/** Authorization header for our /api endpoints, which reject requests without a valid session. */
export async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return session ? { Authorization: `Bearer ${session.access_token}` } : {};
}

export function guestExpiresAt(user: User): Date {
  return new Date(new Date(user.created_at).getTime() + GUEST_RETENTION_DAYS * 24 * 60 * 60 * 1000);
}

/** Current user, kept in sync with auth state changes (sign-in, sign-out, email/password updates). */
export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fires INITIAL_SESSION immediately, then on every change.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return { user, loading, isGuest: user?.is_anonymous === true };
}
