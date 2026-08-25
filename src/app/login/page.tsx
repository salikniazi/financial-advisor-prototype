"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const [email, setEmail] = useState("");
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(
    searchParams.get("error") ? "That sign-in link didn't work — it may have expired. Please request a new one." : null
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || status === "sending") return;
    setStatus("sending");
    setError(null);

    const supabase = createClient();
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    if (redirectTo) callbackUrl.searchParams.set("next", redirectTo);

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: callbackUrl.toString() },
    });

    if (otpError) {
      setStatus("error");
      setError(otpError.message);
      return;
    }
    setStatus("sent");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="text-4xl leading-none">🍋</span>
          <h1 className="mt-3 font-heading text-3xl text-ink">Lime</h1>
          <p className="mt-1.5 text-sm text-muted">Your money, understood.</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          {status === "sent" ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-green-bg text-green">
                <CheckCircle2 size={22} />
              </span>
              <p className="font-heading text-lg text-ink">Check your email</p>
              <p className="text-sm text-muted">
                We sent a sign-in link to <span className="font-semibold text-ink">{email}</span>. Click it to open Lime.
              </p>
              <button
                onClick={() => setStatus("idle")}
                className="mt-1 text-xs font-semibold text-ink/60 underline underline-offset-2 hover:text-ink"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h2 className="mb-1 font-heading text-xl text-ink">Sign in</h2>
              <p className="mb-5 text-sm text-muted">Enter your email and we&apos;ll send you a magic link — no password needed.</p>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">Email</span>
                <div className="relative mt-1.5">
                  <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-border bg-cream py-2.5 pl-10 pr-3.5 text-sm outline-none focus:border-ink/30"
                  />
                </div>
              </label>

              {error && (
                <div className="mt-3 flex items-start gap-1.5 rounded-xl bg-red-bg px-3 py-2.5 text-xs text-red">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={status === "sending" || !email.trim()}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-yellow px-4 py-2.5 text-sm font-semibold text-ink hover:bg-yellow-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === "sending" && <Loader2 size={15} className="animate-spin" />}
                {status === "sending" ? "Sending..." : "Send magic link"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          All data in this prototype is mocked for demonstration purposes.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
