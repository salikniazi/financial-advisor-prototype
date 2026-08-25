"use client";

import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client for use in client components. Uses the public
// anon key — access to any table is restricted by Row Level Security, never
// by keeping this key secret (it isn't).
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
