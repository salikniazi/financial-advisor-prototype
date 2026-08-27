import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processStatementImport } from "@/lib/bank/processStatement";

export const runtime = "nodejs";
// Synchronous, single-request pipeline (no background job queue in this
// stage) -- request the platform's max function duration so a multi-chunk
// extraction on a large statement has room to finish. Vercel Hobby caps at
// 60s regardless; a very large statement could still time out there. See
// README for the Stage C+ note on this.
export const maxDuration = 60;

/**
 * Runs Stage B's extraction pipeline for one already-uploaded statement,
 * identified by the CURRENTLY SIGNED-IN user's own session -- never a
 * client-supplied user id. Ownership of the statement itself is enforced by
 * RLS via the session-bound Supabase client used throughout.
 */
export async function POST(req: NextRequest) {
  let body: { statementImportId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const statementImportId = body.statementImportId;
  if (!statementImportId || typeof statementImportId !== "string") {
    return NextResponse.json({ error: "statementImportId is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const result = await processStatementImport(supabase, statementImportId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json(result);
}
