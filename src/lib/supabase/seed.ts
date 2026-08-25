import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { assetRows, liabilityRows } from "@/lib/mock/netWorth";

export type SeedResult = { seeded: boolean; rowCount?: number };

/**
 * One-time, per-user seed of net_worth_snapshots from the mock data's
 * category histories. Idempotent: does nothing if the user already has any
 * rows. Uses the service-role client to bypass RLS — the caller is
 * responsible for having already verified `userId` against a real session
 * (see src/app/api/seed/route.ts, called from src/app/login/page.tsx right
 * after a successful sign-in).
 */
export async function seedNetWorthSnapshotsForUser(userId: string): Promise<SeedResult> {
  const supabase = createServiceRoleClient();

  const { count, error: countError } = await supabase
    .from("net_worth_snapshots")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countError) {
    throw new Error(`Failed checking existing net_worth_snapshots: ${countError.message}`);
  }
  if (count && count > 0) {
    return { seeded: false };
  }

  const rows = [...assetRows, ...liabilityRows].flatMap((row) =>
    row.history.map((point) => ({
      user_id: userId,
      month: `${point.month}-01`, // MonthPoint.month is "YYYY-MM" -> first of month
      category: row.key,
      value: row.isLiability ? -point.value : point.value,
    }))
  );

  if (rows.length === 0) {
    return { seeded: true, rowCount: 0 };
  }

  // upsert + ignoreDuplicates as a defensive backstop against a rare
  // concurrent double sign-in racing the count check above — the unique
  // (user_id, category, month) constraint makes this safe either way.
  const { error: insertError } = await supabase
    .from("net_worth_snapshots")
    .upsert(rows, { onConflict: "user_id,category,month", ignoreDuplicates: true });

  if (insertError) {
    throw new Error(`Failed inserting net_worth_snapshots: ${insertError.message}`);
  }

  return { seeded: true, rowCount: rows.length };
}
