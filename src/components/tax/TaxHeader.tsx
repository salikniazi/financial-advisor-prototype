"use client";

import { Clock, ShieldCheck, Check } from "lucide-react";
import clsx from "clsx";
import { taxMeta } from "@/lib/mock/tax";
import { daysUntil, formatDate } from "@/lib/format";
import { useTaxStatus } from "./TaxStatusProvider";

const trackerSteps = ["Draft", "Under Review", "Filed"] as const;

export default function TaxHeader() {
  const { status } = useTaxStatus();
  const days = daysUntil(taxMeta.deadline);
  const currentIndex = trackerSteps.indexOf(status);

  return (
    <div className="mb-2 flex flex-wrap items-center gap-x-6 gap-y-3">
      <div>
        <p className="font-heading text-lg text-ink">{taxMeta.taxYear}</p>
        <p className="flex items-center gap-1.5 text-xs text-muted mt-0.5">
          <Clock size={12} /> File by {formatDate(taxMeta.deadline)} · {days} days left
        </p>
      </div>

      <div className="flex items-center gap-1.5 rounded-full bg-green-bg px-3 py-1.5 text-xs font-semibold text-green">
        <ShieldCheck size={13} /> {taxMeta.filerStatus}
      </div>

      <div className="flex items-center gap-1.5">
        {trackerSteps.map((step, i) => (
          <div key={step} className="flex items-center gap-1.5">
            <span
              className={clsx(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
                i <= currentIndex ? "bg-ink text-yellow" : "bg-cream text-muted"
              )}
            >
              {i < currentIndex && <Check size={12} />}
              {step}
            </span>
            {i < trackerSteps.length - 1 && <span className="h-px w-4 bg-border" />}
          </div>
        ))}
      </div>
    </div>
  );
}
