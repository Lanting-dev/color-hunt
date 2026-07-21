import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const authConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = authConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export async function getSession() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function onAuthChange(callback) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

export async function signInWithEmail(email) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) throw error;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function fetchEntries() {
  if (!supabase) return [];
  const session = await getSession();
  if (!session?.user) return [];

  const { data, error } = await supabase
    .from('color_entries')
    .select('day,color_hex,photo,score,painting_id,captured_at')
    .order('day', { ascending: false });

  if (error) throw error;
  return (data || []).map((entry) => ({
    day: entry.day,
    colorHex: entry.color_hex,
    photo: entry.photo,
    score: entry.score,
    paintingId: entry.painting_id,
    ts: entry.captured_at ? Date.parse(entry.captured_at) : null,
  }));
}

export async function syncEntries(entries) {
  if (!supabase) return { ok: false, skipped: true };
  const session = await getSession();
  if (!session?.user || entries.length === 0) return { ok: true, count: 0 };

  const rows = entries.map((entry) => ({
    user_id: session.user.id,
    day: entry.day,
    color_hex: entry.colorHex,
    photo: entry.photo,
    score: Number.isFinite(entry.score) ? entry.score : null,
    painting_id: entry.paintingId,
    captured_at: entry.ts ? new Date(entry.ts).toISOString() : null,
  }));

  const { error } = await supabase
    .from('color_entries')
    .upsert(rows, { onConflict: 'user_id,day' });

  if (error) throw error;
  return { ok: true, count: rows.length };
}
