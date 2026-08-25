"use client";

import { useMemo, useState } from "react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { seedRandom } from "@/lib/mock/months";
import { formatPKR } from "@/lib/format";

const timeframes = ["1D", "1W", "1M", "1Y"] as const;
type Timeframe = (typeof timeframes)[number];

const pointsFor: Record<Timeframe, number> = { "1D": 24, "1W": 7, "1M": 30, "1Y": 12 };
const labelFor: Record<Timeframe, (i: number, n: number) => string> = {
  "1D": (i) => `${String(i).padStart(2, "0")}:00`,
  "1W": (i) => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i % 7],
  "1M": (i) => `Day ${i + 1}`,
  "1Y": (i) => `M${i + 1}`,
};

export default function TimeframePriceChart({ currentPrice, seed, color = "#0A0A0A" }: { currentPrice: number; seed: number; color?: string }) {
  const [tf, setTf] = useState<Timeframe>("1M");

  const data = useMemo(() => {
    const n = pointsFor[tf];
    const rand = seedRandom(seed + tf.charCodeAt(0));
    const vol = tf === "1D" ? 0.006 : tf === "1W" ? 0.015 : tf === "1M" ? 0.03 : 0.09;
    const drift = (rand() - 0.45) * vol * 2;
    const values: number[] = [];
    let v = currentPrice / (1 + drift * n * 0.5);
    for (let i = 0; i < n; i++) {
      v = v * (1 + drift + (rand() - 0.5) * vol);
      values.push(v);
    }
    values[n - 1] = currentPrice;
    return values.map((value, i) => ({ label: labelFor[tf](i, n), value: Math.max(0.01, value) }));
  }, [tf, currentPrice, seed]);

  return (
    <div>
      <div className="mb-3 flex gap-1.5">
        {timeframes.map((t) => (
          <button
            key={t}
            onClick={() => setTf(t)}
            className={
              "rounded-full px-3 py-1 text-xs font-semibold transition-colors " +
              (tf === t ? "bg-ink text-yellow" : "bg-cream text-ink/60 hover:text-ink")
            }
          >
            {t}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6b6455" }} axisLine={{ stroke: "#e8e2d0" }} tickLine={false} minTickGap={30} />
          <YAxis hide domain={["auto", "auto"]} />
          <Tooltip
            formatter={(value) => [formatPKR(Number(value), { decimals: 2 }), "Price"]}
            contentStyle={{ borderRadius: 12, border: "1px solid #e8e2d0", fontSize: 12, fontFamily: "var(--font-jakarta)" }}
          />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill="url(#priceGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
