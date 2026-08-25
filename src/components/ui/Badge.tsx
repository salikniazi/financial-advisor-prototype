import clsx from "clsx";

type Tone = "yellow" | "green" | "red" | "neutral" | "ink";

const toneClasses: Record<Tone, string> = {
  yellow: "bg-yellow text-ink border-ink/10",
  green: "bg-green-bg text-green border-green/20",
  red: "bg-red-bg text-red border-red/20",
  neutral: "bg-cream text-muted border-border",
  ink: "bg-ink text-yellow border-ink",
};

export default function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function PercentChange({ percent }: { percent: number }) {
  const positive = percent >= 0;
  return (
    <span className={clsx("font-semibold tabular-nums", positive ? "text-green" : "text-red")}>
      {positive ? "+" : ""}
      {percent.toFixed(2)}%
    </span>
  );
}

export function GainLoss({ value, percent }: { value: number; percent?: number }) {
  const positive = value >= 0;
  return (
    <span className={clsx("font-semibold", positive ? "text-green" : "text-red")}>
      {positive ? "+" : ""}
      {value.toLocaleString("en-PK", { maximumFractionDigits: 0 })}
      {percent !== undefined && (
        <span className="ml-1 text-xs opacity-80">
          ({positive ? "+" : ""}
          {percent.toFixed(2)}%)
        </span>
      )}
    </span>
  );
}
