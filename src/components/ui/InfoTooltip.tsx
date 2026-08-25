"use client";

import { useState } from "react";
import { Info } from "lucide-react";

export default function InfoTooltip({ description, source }: { description: string; source?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="More info"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen((o) => !o);
        }}
        className="text-muted hover:text-ink transition-colors"
      >
        <Info size={14} strokeWidth={2} />
      </button>
      {open && (
        <span
          className="absolute left-1/2 top-full z-50 mt-2 w-60 -translate-x-1/2 rounded-xl border border-border bg-ink px-3 py-2.5 text-xs leading-relaxed text-white shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="block text-white/90">{description}</span>
          {source && <span className="mt-1.5 block font-semibold text-yellow">{source}</span>}
        </span>
      )}
    </span>
  );
}
