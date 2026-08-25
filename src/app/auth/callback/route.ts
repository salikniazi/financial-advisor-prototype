import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { seedNetWorthSnapshotsForUser } from "@/lib/supabase/seed";

export const runtime = "nodejs";

// Exchanges the magic link's one-time code for a session, then — on first
// ever sign-in for that user — seeds net_worth_snapshots from the mock data.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      try {
        await seedNetWorthSnapshotsForUser(data.user.id);
      } catch (seedError) {
        // Never block sign-in on a seed failure — this is a starting-data
        // convenience, not part of the auth flow itself. Surface via logs.
        console.error("[auth/callback] seed failed:", seedError);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
