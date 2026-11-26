import { supabase } from "./supabase";
import { currentPersonaKey, rememberPersona } from "./localState";
import { DEFAULT_FLAGS, type Flags, type Identity, type Role } from "./types";

// Anonymous visitors belong to the Public Network (tenant 1) for flag purposes,
// so they get its config (ads on) without being a member of anything.
const PUBLIC_TENANT_ID = 1;

export { currentPersonaKey } from "./localState";

// Build-2 demo auth: the Public persona is an anonymous sign-in (build-1's
// model); the School personas are seeded email/password accounts so roles,
// assignments and moderation have durable, distinct identities. These are
// throwaway demo accounts on the dev box — the credentials are intentionally
// public, and real signup/OAuth is a later phase.
export interface Persona {
  key: string;
  label: string;
  sublabel: string;
  kind: "anon" | "password";
  email?: string;
  password?: string;
}

export const PERSONAS: Persona[] = [
  { key: "public", label: "Public visitor", sublabel: "Open network · anonymous", kind: "anon" },
  {
    key: "student",
    label: "Alex",
    sublabel: "Student · Lincoln High (Paid)",
    kind: "password",
    email: "student@demo.mindswipe",
    password: "demo1234",
  },
  {
    key: "student2",
    label: "Sam",
    sublabel: "Student · Lincoln High (Paid)",
    kind: "password",
    email: "student2@demo.mindswipe",
    password: "demo1234",
  },
  {
    key: "teacher",
    label: "Ms. Schmidt",
    sublabel: "Teacher · Lincoln High (Paid)",
    kind: "password",
    email: "teacher@demo.mindswipe",
    password: "demo1234",
  },
  {
    key: "author",
    label: "Prof. Rivera",
    sublabel: "Teacher · Riverdale (Private)",
    kind: "password",
    email: "author@demo.mindswipe",
    password: "demo1234",
  },
];

/** Switch personas: drop the current session, sign in as the new one. The caller
 *  reloads afterwards so all per-user state re-hydrates cleanly. */
export async function signInAs(p: Persona): Promise<void> {
  await supabase.auth.signOut();
  if (p.kind === "anon") {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
  } else {
    const { error } = await supabase.auth.signInWithPassword({
      email: p.email as string,
      password: p.password as string,
    });
    if (error) throw error;
  }
  rememberPersona(p.key);
}

// Ensure there is a session for the remembered persona (default: Public/anon).
let ready: Promise<void> | null = null;
export function ensureAuth(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) return;
      const key = currentPersonaKey();
      const persona = PERSONAS.find((x) => x.key === key) ?? PERSONAS[0];
      try {
        await signInAs(persona);
      } catch {
        // Seeded account unavailable (box reset?) — fall back to anonymous.
        await supabase.auth.signInAnonymously().catch(() => {});
        rememberPersona("public");
      }
    })();
  }
  return ready;
}

async function loadFlags(tenantId: number): Promise<{ plan: string | null; flags: Flags }> {
  const { data } = await supabase
    .from("tenant_config")
    .select("plan,flags")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  return {
    plan: (data?.plan as string) ?? null,
    flags: { ...DEFAULT_FLAGS, ...((data?.flags as Partial<Flags>) ?? {}) },
  };
}

/** The signed-in user, their first membership (tenant + role), and the feature
 *  flags of their tenant — the public tenant's flags for anonymous visitors. */
export async function getIdentity(): Promise<Identity> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const { plan, flags } = await loadFlags(PUBLIC_TENANT_ID);
    return { userId: "", isAnonymous: true, tenantId: null, role: null, displayName: null, plan, flags };
  }
  const { data } = await supabase
    .from("membership")
    .select("tenant_id,role,display_name")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  const { plan, flags } = await loadFlags(data?.tenant_id ?? PUBLIC_TENANT_ID);
  return {
    userId: user.id,
    isAnonymous: Boolean((user as { is_anonymous?: boolean }).is_anonymous),
    tenantId: data?.tenant_id ?? null,
    role: (data?.role as Role) ?? null,
    displayName: data?.display_name ?? null,
    plan,
    flags,
  };
}
