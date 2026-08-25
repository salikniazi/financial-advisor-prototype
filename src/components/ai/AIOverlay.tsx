"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X, Send, ArrowRight, Loader2, AlertTriangle } from "lucide-react";
import clsx from "clsx";

export type AIAction = { label: string; href: string };

type Message = {
  id: string;
  role: "user" | "ai";
  text: string;
  actions?: AIAction[];
  isError?: boolean;
};

const suggestedPrompts = [
  "Why did my net worth drop this month?",
  "How much idle cash do I have?",
  "Am I overexposed to any sector?",
  "Should I become a tax filer?",
  "Take me to my crypto holdings",
];

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `msg-${idCounter}`;
}

export default function AIOverlay() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: nextId(),
      role: "ai",
      text: "Hi, I'm your Lime assistant. I can explain what's on screen, pull insights from across your whole financial picture, or take you somewhere else in the app. What would you like to know?",
    },
  ]);
  const pathname = usePathname();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, loading]);

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
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, pathname, history: historyForRequest.slice(0, -1) }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setMessages((prev) => [
          ...prev,
          { id: nextId(), role: "ai", text: data.error || "Something went wrong reaching Lime's AI. Please try again.", isError: true },
        ]);
      } else {
        setMessages((prev) => [...prev, { id: nextId(), role: "ai", text: data.text, actions: data.actions }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "ai", text: "Couldn't reach Lime's AI right now. Check your connection and try again.", isError: true },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open Lime assistant"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-yellow shadow-xl transition-transform hover:scale-105 active:scale-95"
      >
        {open ? <X size={22} /> : <span className="text-2xl leading-none">🍋</span>}
      </button>

      {open && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-40 flex h-[min(640px,calc(100vh-140px))] w-[min(400px,calc(100vw-32px))] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
          <div className="flex items-center gap-2.5 border-b border-border bg-ink px-5 py-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow text-sm leading-none">
              🍋
            </span>
            <div>
              <p className="font-heading text-base text-yellow leading-none">Lime Assistant</p>
              <p className="text-[11px] text-white/60 mt-1">Aware of this screen &amp; your whole account</p>
            </div>
            <button onClick={() => setOpen(false)} className="ml-auto text-white/60 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((msg) => (
              <div key={msg.id} className={clsx("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={clsx(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-yellow text-ink rounded-br-sm"
                      : msg.isError
                        ? "bg-red-bg text-red rounded-bl-sm flex items-start gap-1.5"
                        : "bg-cream text-ink rounded-bl-sm"
                  )}
                >
                  {msg.isError && <AlertTriangle size={14} className="mt-0.5 shrink-0" />}
                  <div>
                    <p>{msg.text}</p>
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-2.5 flex flex-col gap-1.5">
                        {msg.actions.map((a) => (
                          <button
                            key={a.href}
                            onClick={() => {
                              router.push(a.href);
                              setOpen(false);
                            }}
                            className="flex items-center justify-between gap-2 rounded-lg border border-ink/15 bg-card px-3 py-2 text-left text-xs font-semibold text-ink hover:bg-yellow/30"
                          >
                            {a.label}
                            <ArrowRight size={14} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
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
              {suggestedPrompts.map((p) => (
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
              placeholder="Ask Lime anything..."
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
        </div>
      )}
    </>
  );
}
