"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send } from "lucide-react";
import clsx from "clsx";
import { Card } from "@/components/ui/Card";
import { getResearchReply, ResearchDomain } from "@/lib/ai/researchRespond";

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `research-${idCounter}`;
}

export default function ResearchChat({ domain, prompts }: { domain: ResearchDomain; prompts: string[] }) {
  const [messages, setMessages] = useState<{ id: string; role: "user" | "ai"; text: string }[]>([
    {
      id: nextId(),
      role: "ai",
      text: `Ask me anything about ${domain === "stocks" ? "PSX stocks and sectors" : "crypto markets and Pakistan's virtual asset regulation"}. This assistant is focused on research — for account-wide questions, use the Lime assistant in the corner.`,
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { id: nextId(), role: "user", text: trimmed }]);
    setInput("");
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: nextId(), role: "ai", text: getResearchReply(trimmed, domain) }]);
    }, 400);
  }

  return (
    <Card className="flex flex-col">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
        <Sparkles size={16} className="text-yellow-dark" />
        <h2 className="font-heading text-base text-ink">Research Assistant</h2>
        <span className="ml-auto text-[11px] font-semibold uppercase tracking-wide text-muted">
          {domain === "stocks" ? "PSX Research" : "Crypto Research"}
        </span>
      </div>
      <div ref={scrollRef} className="flex-1 space-y-2.5 overflow-y-auto px-4 py-4" style={{ maxHeight: 340, minHeight: 220 }}>
        {messages.map((m) => (
          <div key={m.id} className={clsx("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={clsx(
                "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                m.role === "user" ? "bg-yellow text-ink rounded-br-sm" : "bg-cream text-ink rounded-bl-sm"
              )}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-2">
          {prompts.map((p) => (
            <button
              key={p}
              onClick={() => send(p)}
              className="rounded-full border border-border bg-cream px-2.5 py-1 text-[11px] font-medium text-ink/70 hover:border-ink/30"
            >
              {p}
            </button>
          ))}
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={domain === "stocks" ? "Ask about PSX sectors, valuations..." : "Ask about crypto markets, regulation..."}
          className="flex-1 rounded-full border border-border bg-cream px-4 py-2.5 text-sm outline-none focus:border-ink/30"
        />
        <button type="submit" aria-label="Send" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-yellow hover:opacity-90">
          <Send size={16} />
        </button>
      </form>
    </Card>
  );
}
