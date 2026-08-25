"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2, AlertTriangle } from "lucide-react";
import clsx from "clsx";
import { Card } from "@/components/ui/Card";

export type ResearchDomain = "stocks" | "crypto";

type Message = { id: string; role: "user" | "ai"; text: string; isError?: boolean };

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `research-${idCounter}`;
}

export default function ResearchChat({ domain, prompts }: { domain: ResearchDomain; prompts: string[] }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: nextId(),
      role: "ai",
      text: `Ask me anything about ${domain === "stocks" ? "PSX stocks and sectors" : "crypto markets and Pakistan's virtual asset regulation"}. This assistant is focused on research — for account-wide questions, use the Lime assistant in the corner.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const userMsg: Message = { id: nextId(), role: "user", text: trimmed };
    const historyForRequest = [...messages, userMsg]
      .filter((m) => !m.isError)
      .slice(-10)
      .map((m) => ({ role: m.role === "ai" ? ("assistant" as const) : ("user" as const), content: m.text }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/research-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, domain, history: historyForRequest.slice(0, -1) }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setMessages((prev) => [
          ...prev,
          { id: nextId(), role: "ai", text: data.error || "Something went wrong reaching the research assistant. Please try again.", isError: true },
        ]);
      } else {
        setMessages((prev) => [...prev, { id: nextId(), role: "ai", text: data.text }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "ai", text: "Couldn't reach the research assistant right now. Check your connection and try again.", isError: true },
      ]);
    } finally {
      setLoading(false);
    }
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
                m.role === "user"
                  ? "bg-yellow text-ink rounded-br-sm"
                  : m.isError
                    ? "bg-red-bg text-red rounded-bl-sm flex items-start gap-1.5"
                    : "bg-cream text-ink rounded-bl-sm"
              )}
            >
              {m.isError && <AlertTriangle size={14} className="mt-0.5 shrink-0" />}
              <span>{m.text}</span>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-cream px-3.5 py-2.5 text-sm text-ink/60">
              <Loader2 size={14} className="animate-spin" /> Thinking...
            </div>
          </div>
        )}
      </div>
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-2">
          {prompts.map((p) => (
            <button
              key={p}
              onClick={() => send(p)}
              disabled={loading}
              className="rounded-full border border-border bg-cream px-2.5 py-1 text-[11px] font-medium text-ink/70 hover:border-ink/30 disabled:opacity-50"
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
          disabled={loading}
          className="flex-1 rounded-full border border-border bg-cream px-4 py-2.5 text-sm outline-none focus:border-ink/30 disabled:opacity-60"
        />
        <button
          type="submit"
          aria-label="Send"
          disabled={loading || !input.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-yellow hover:opacity-90 disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </form>
    </Card>
  );
}
