import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. **Server-only.**
 * Bypasses RLS - use ONLY for trusted server-side flows like webhook intake,
 * Twilio status callbacks, and admin user management.
 */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Required for admin operations.",
    );
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
