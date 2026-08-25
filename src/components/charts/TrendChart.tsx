"use client";

import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { formatCompactPKR, formatMonthShort, formatPKR } from "@/lib/format";
import { MonthPoint } from "@/lib/types";

export default function TrendChart({
  data,
  color = "#0A0A0A",
  height = 220,
  valueStyle = "compact",
}: {
  data: MonthPoint[];
  color?: string;
  height?: number;
  /** "compact" -> Rs 1.2 Lac / Cr style; "precise" -> Rs 58.42 with 2 decimals (e.g. fund NAV) */
  valueStyle?: "compact" | "precise";
}) {
  // data comes most-recent-first; charts read left(oldest) -> right(newest)
  const chronological = [...data].reverse();
  const yFmt = valueStyle === "precise" ? (v: number) => formatPKR(v, { decimals: 2 }) : formatCompactPKR;
  const xFmt = formatMonthShort;
  const gradId = `grad-${color.replace("#", "")}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chronological} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="month"
          tickFormatter={xFmt}
          tick={{ fontSize: 11, fill: "#6b6455" }}
          axisLine={{ stroke: "#e8e2d0" }}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis hide domain={["auto", "auto"]} />
        <Tooltip
          formatter={(value) => [yFmt(Number(value)), "Value"]}
          labelFormatter={(label) => xFmt(String(label))}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #e8e2d0",
            fontSize: 12,
            fontFamily: "var(--font-jakarta)",
          }}
        />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill={`url(#${gradId})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
