import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Build-2 connects to the self-hosted Supabase on the dev box. The publishable
// key is a public client key (safe to ship in the PWA). Override via Vite env
// (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY) when the host changes.
const env = (import.meta as unknown as { env?: Record<string, string> }).env ?? {};
const SUPABASE_URL = env.VITE_SUPABASE_URL ?? "http://192.168.178.38:8000";
const SUPABASE_KEY =
  env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_rHnesNn-dlSSsTBgWd_ABe__3TvZMSL";

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

// Auth (anonymous vs persona sign-in) lives in auth.ts.
export { ensureAuth } from "./auth";
