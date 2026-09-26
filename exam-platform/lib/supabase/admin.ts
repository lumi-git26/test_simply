import { createClient } from "@supabase/supabase-js";

// SERVICE ROLE — server-side only, never import this in a Client Component.
// Used by API routes that need to write on behalf of anonymous/email-only
// students (submissions, answers) who have no Supabase auth session, and by
// the notify/mail-merge route which reads subscribers across teachers.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
