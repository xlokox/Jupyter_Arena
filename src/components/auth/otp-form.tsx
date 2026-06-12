"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound, Mail } from "lucide-react";
import Link from "next/link";
import { en } from "@/i18n/en";

interface OtpFormProps {
  title: string;
  intro: string;
  /** Optional benefit line shown below the intro (signup page). */
  benefits?: string;
}

/**
 * Full-page OTP sign-in form — same flow as SignInDialog but rendered as a
 * standalone page for /login and /signup. On success redirects to /app.
 */
export function OtpForm({ title, intro, benefits }: OtpFormProps) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
  }, [step]);

  async function sendCode(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { getBrowserClient } = await import("@/lib/supabase/client");
      const client = getBrowserClient();
      if (!client) throw new Error("supabase_not_configured");
      const { error: sendError } = await client.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (sendError) throw sendError;
      setStep("code");
    } catch {
      setError(en.auth.sendError);
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { getBrowserClient } = await import("@/lib/supabase/client");
      const client = getBrowserClient();
      if (!client) throw new Error("supabase_not_configured");
      const { error: verifyError } = await client.auth.verifyOtp({
        email,
        token: code.trim(),
        type: "email",
      });
      if (verifyError) throw verifyError;
      router.push("/app");
    } catch {
      setError(en.auth.verifyError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <h1 className="mb-2 font-mono text-xl font-bold text-text">{title}</h1>
      <p className="mb-1 text-sm text-muted">{intro}</p>
      {benefits && (
        <p className="mb-5 text-sm font-medium text-accent">{benefits}</p>
      )}
      {!benefits && <div className="mb-5" />}

      {step === "email" ? (
        <form onSubmit={sendCode} className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-muted">{en.auth.emailLabel}</span>
            <input
              ref={inputRef}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={en.auth.emailPlaceholder}
              className="w-full rounded-md border border-border bg-panel-2 px-3 py-2.5 text-text placeholder:text-muted/70 focus-visible:outline-2 focus-visible:outline-accent"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md bg-accent px-4 font-semibold text-bg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
          >
            <Mail className="size-4" aria-hidden />
            {busy ? en.auth.sending : en.auth.sendCode}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="space-y-3">
          <p className="text-sm text-muted">
            {en.auth.codeSentPrefix}{" "}
            <span className="font-mono text-text">{email}</span>
          </p>
          <label className="block text-sm">
            <span className="mb-1 block text-muted">{en.auth.codeLabel}</span>
            <input
              ref={inputRef}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full rounded-md border border-border bg-panel-2 px-3 py-2.5 font-mono text-lg tracking-[0.3em] text-text focus-visible:outline-2 focus-visible:outline-accent"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md bg-accent px-4 font-semibold text-bg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
          >
            <KeyRound className="size-4" aria-hidden />
            {busy ? en.auth.verifying : en.auth.verify}
          </button>
          <button
            type="button"
            onClick={() => { setStep("email"); setCode(""); setError(null); }}
            className="w-full text-center text-xs text-muted underline-offset-2 hover:text-text hover:underline"
          >
            {en.auth.useDifferentEmail}
          </button>
        </form>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-6 border-t border-border pt-4">
        <Link
          href="/app"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          {en.auth.backToApp}
        </Link>
      </div>
    </div>
  );
}
