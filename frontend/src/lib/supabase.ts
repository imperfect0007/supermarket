import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = (import.meta.env.VITE_SUPABASE_URL ?? "").trim();
/** Supabase labels this "anon" or "publishable" in the dashboard; same key. */
const anon = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
  ""
).trim();

/** False if `.env` is missing — avoids a blank screen; see `SetupBanner`. */
export const isSupabaseConfigured = Boolean(url && anon);

/** Supabase browser client; null when env vars are not set. */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anon)
  : null;
