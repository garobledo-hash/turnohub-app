import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url: string = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";
const anon: string = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "";

if (!url || !anon) {
  // eslint-disable-next-line no-console
  console.warn(
    "[supabase] Missing env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env (or Netlify env)."
  );
}

export const supabase: SupabaseClient = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});

export const isSupabaseConfigured: boolean = Boolean(url && anon);
