import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type User } from '@supabase/supabase-js';

// Shared by the AI endpoints (files starting with `_` are not deployed as routes).
// Verifies the caller's Supabase access token so anonymous internet traffic can't spend Groq credits.
// Guest (anonymous sign-in) users have a valid session too, so they pass — guests have full access.
export async function requireUser(
  req: VercelRequest,
  res: VercelResponse,
): Promise<{ user: User; jwt: string } | null> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';
  if (!supabaseUrl || !supabaseAnonKey) {
    res.status(503).json({ error: 'Supabase not configured.' });
    return null;
  }

  const jwt = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
  if (!jwt) {
    res.status(401).json({ error: 'Sign in to use AI features.' });
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: { user }, error } = await supabase.auth.getUser(jwt);
  if (error || !user) {
    res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
    return null;
  }

  return { user, jwt };
}
