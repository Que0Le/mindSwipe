import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Build-1 connects to the self-hosted Supabase on the dev box. The publishable
// key is a public client key (safe to ship in the PWA). Override via Vite env
// (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY) when the host changes.
const env = (import.meta as unknown as { env?: Record<string, string> }).env ?? {};
const SUPABASE_URL = env.VITE_SUPABASE_URL ?? "http://192.168.178.38:8000";
const SUPABASE_KEY =
  env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_rHnesNn-dlSSsTBgWd_ABe__3TvZMSL";

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

// There is no login in build-1. We sign in anonymously so every input (attempt,
// like, view) is attributed to a real auth.uid() and protected by RLS. The anon
// account persists in localStorage and can be upgraded to email later.
let ready: Promise<void> | null = null;
export function ensureAuth(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) console.warn("anonymous sign-in failed:", error.message);
      }
    })();
  }
  return ready;
}
