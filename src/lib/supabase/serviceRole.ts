import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role Supabase client — bypasses Row Level Security entirely.
// SUPABASE_SERVICE_ROLE_KEY must never reach the browser or a client
// component; the `server-only` import guards against accidentally bundling
// this module into client code. Used only by the one-time seed route
// (src/app/api/seed/route.ts) to insert rows on a user's behalf after their
// own identity has already been verified from their session.
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to use the service-role client.");
  }
  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
