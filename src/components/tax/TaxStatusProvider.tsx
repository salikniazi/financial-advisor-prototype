"use client";

import { createContext, useContext, useState } from "react";
import { taxMeta } from "@/lib/mock/tax";

type SubmissionStatus = "Draft" | "Under Review" | "Filed";

type TaxStatusContextValue = {
  status: SubmissionStatus;
  submit: () => void;
};

const TaxStatusContext = createContext<TaxStatusContextValue | null>(null);

export function TaxStatusProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SubmissionStatus>(taxMeta.submissionStatus);
  return <TaxStatusContext.Provider value={{ status, submit: () => setStatus("Under Review") }}>{children}</TaxStatusContext.Provider>;
}

export function useTaxStatus() {
  const ctx = useContext(TaxStatusContext);
  if (!ctx) throw new Error("useTaxStatus must be used within TaxStatusProvider");
  return ctx;
}
