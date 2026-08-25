// Pakistani-style number grouping (lakh/crore): e.g. 12,34,567
export function groupIndian(numStr: string): string {
  const negative = numStr.startsWith("-");
  const s = negative ? numStr.slice(1) : numStr;
  const [intPart, decPart] = s.split(".");
  let result: string;
  if (intPart.length <= 3) {
    result = intPart;
  } else {
    const last3 = intPart.slice(-3);
    const rest = intPart.slice(0, -3);
    const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    result = `${grouped},${last3}`;
  }
  return (negative ? "-" : "") + result + (decPart ? `.${decPart}` : "");
}

export function formatPKR(value: number, opts?: { decimals?: number; compact?: boolean }): string {
  const decimals = opts?.decimals ?? 0;
  if (opts?.compact) {
    return formatCompactPKR(value);
  }
  const rounded = value.toFixed(decimals);
  return `Rs ${groupIndian(rounded)}`;
}

export function formatCompactPKR(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_00_00_000) {
    return `${sign}Rs ${groupIndian((abs / 1_00_00_000).toFixed(2))} Cr`;
  }
  if (abs >= 1_00_000) {
    return `${sign}Rs ${(abs / 1_00_000).toFixed(2)} Lac`;
  }
  if (abs >= 1000) {
    return `${sign}Rs ${(abs / 1000).toFixed(1)}K`;
  }
  return `${sign}Rs ${abs.toFixed(0)}`;
}

export function formatNumber(value: number, decimals = 0): string {
  return groupIndian(value.toFixed(decimals));
}

export function formatPercent(value: number, decimals = 2): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatMonthShort(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr).getTime();
  const now = new Date("2026-08-25").getTime();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}
