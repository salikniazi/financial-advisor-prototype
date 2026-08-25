import { NextRequest, NextResponse } from "next/server";
import { extractWithForcedTool, ToolDef } from "@/lib/ai/openrouter";
import { ParsedAsset } from "@/lib/types";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You extract structured asset data for Lime, a personal finance app for users in Pakistan. The user has pasted free text (or a document's contents) describing a financial asset that doesn't fit a default category — commonly a fixed deposit, National Savings Certificate, provident fund, but it could be something else entirely.

From the text, determine:
- name: a short, human-readable label for this specific asset (e.g. "UBL Fixed Deposit", "Defence Savings Certificate").
- type: a short category (e.g. "Fixed Deposit", "National Savings Certificate", "Provident Fund", or a reasonable category of your own if it's genuinely something else).
- currentValue: a single numeric current value in PKR. If the text gives a principal, a profit/interest rate, and a time period, reason about accrued profit to estimate a sensible current value. If it already states a current value, use that. If nothing better is available, use the most sensible number mentioned (e.g. the principal).
- fields: a set of relevant key-value pairs a Pakistani user would expect to see for this kind of asset (e.g. institution/issuer, principal amount, interest/profit rate, maturity date). Vary the fields sensibly by asset type — don't force every asset into the same fixed field set. Format each value as a short human-readable string (e.g. "Rs 500,000", "13.5% p.a.", "15 Dec 2026").

Always call record_parsed_asset with your result — never respond in plain text.`;

const recordParsedAssetTool: ToolDef = {
  type: "function",
  function: {
    name: "record_parsed_asset",
    description: "Records the structured asset extracted from the user's text.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Short human-readable label for the asset." },
        type: { type: "string", description: "Short asset category, e.g. 'Fixed Deposit'." },
        currentValue: { type: "number", description: "Current value in PKR as a plain number, no currency symbol or commas." },
        fields: {
          type: "array",
          description: "Relevant key-value detail pairs for this asset (institution, principal, rate, maturity date, etc.).",
          items: {
            type: "object",
            properties: {
              key: { type: "string", description: "Field label, e.g. 'Institution' or 'Maturity Date'." },
              value: { type: "string", description: "Field value as a short human-readable string." },
            },
            required: ["key", "value"],
            additionalProperties: false,
          },
        },
      },
      required: ["name", "type", "currentValue", "fields"],
      additionalProperties: false,
    },
  },
};

type ToolArgs = {
  name: string;
  type: string;
  currentValue: number;
  fields: { key: string; value: string }[];
};

export async function POST(req: NextRequest) {
  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text) {
    return NextResponse.json({ error: "Some text describing the asset is required." }, { status: 400 });
  }

  const result = await extractWithForcedTool<ToolArgs>({
    systemPrompt: SYSTEM_PROMPT,
    userContent: text,
    tool: recordParsedAssetTool,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  const { name, type, currentValue, fields } = result.value;
  if (typeof name !== "string" || typeof type !== "string" || typeof currentValue !== "number" || !Array.isArray(fields)) {
    return NextResponse.json({ error: "The model returned an incomplete result. Please try rephrasing." }, { status: 502 });
  }

  const parsed: ParsedAsset = {
    name,
    type,
    currentValue,
    fields: Object.fromEntries(fields.filter((f) => f && typeof f.key === "string").map((f) => [f.key, String(f.value)])),
  };

  return NextResponse.json(parsed);
}
