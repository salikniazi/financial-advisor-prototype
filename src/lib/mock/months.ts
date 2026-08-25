// Generates the last N month labels ending at the current prototype "today" (Aug 2026),
// most recent first.
export function lastMonths(n: number): string[] {
  const out: string[] = [];
  const base = new Date("2026-08-25");
  for (let i = 0; i < n; i++) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    out.push(d.toISOString().slice(0, 7)); // YYYY-MM
  }
  return out;
}

// Simple seeded pseudo-random so mock data is stable across renders.
export function seedRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Build a history series that trends from a start value to an end value with noise,
// most-recent-first (matches lastMonths order).
export function buildTrendSeries(
  months: string[],
  endValue: number,
  totalGrowthPct: number,
  volatility: number,
  seed: number
): { month: string; value: number }[] {
  const rand = seedRandom(seed);
  const n = months.length;
  const startValue = endValue / (1 + totalGrowthPct);
  const series: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1); // 0 = oldest .. 1 = newest, but we'll fill newest->oldest below
    series.push(t);
  }
  // build oldest -> newest then reverse
  const values: number[] = [];
  for (let i = 0; i < n; i++) {
    const progress = i / (n - 1);
    const base = startValue + (endValue - startValue) * progress;
    const noise = (rand() - 0.5) * 2 * volatility * base;
    values.push(Math.max(0, base + noise));
  }
  values[n - 1] = endValue; // ensure exact end value at most recent
  const reversed = values.reverse(); // most recent first
  return months.map((month, i) => ({ month, value: Math.round(reversed[i]) }));
}
