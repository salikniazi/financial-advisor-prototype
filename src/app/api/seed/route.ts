import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { seedNetWorthSnapshotsForUser } from "@/lib/supabase/seed";

export const runtime = "nodejs";

/**
 * Seeds net_worth_snapshots for the CURRENTLY SIGNED-IN user, read from
 * their own session cookie — never from a client-supplied id, so a caller
 * can only ever seed their own account. Idempotent: a no-op if the user
 * already has rows.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  try {
    const result = await seedNetWorthSnapshotsForUser(user.id);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
