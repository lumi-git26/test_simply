import { createBrowserClient } from "@supabase/ssr";

// Used in Client Components (teacher dashboard, exam builder UI).
// Runs with the anon key + RLS — a teacher only ever sees/edits their own rows.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
