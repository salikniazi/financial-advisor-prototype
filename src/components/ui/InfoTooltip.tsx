"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

export default function InfoTooltip({ description, source }: { description: string; source?: string }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);

  function place() {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCoords({ top: rect.bottom + 8, left: rect.left + rect.width / 2 });
  }

  function show() {
    place();
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    // Reposition/close on scroll or resize so the popover never drifts from — or gets
    // trapped behind — the row it belongs to (tables here scroll internally).
    const onScroll = () => setOpen(false);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  return (
    <span
      ref={anchorRef}
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="More info"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (open) {
            setOpen(false);
          } else {
            show();
          }
        }}
        className="text-muted hover:text-ink transition-colors"
      >
        <Info size={14} strokeWidth={2} />
      </button>
      {open &&
        coords &&
        createPortal(
          <span
            className="fixed z-[100] w-60 -translate-x-1/2 rounded-xl border border-border bg-ink px-3 py-2.5 text-xs leading-relaxed text-white shadow-lg"
            style={{ top: coords.top, left: coords.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="block text-white/90">{description}</span>
            {source && <span className="mt-1.5 block font-semibold text-yellow">{source}</span>}
          </span>,
          document.body
        )}
    </span>
  );
}
