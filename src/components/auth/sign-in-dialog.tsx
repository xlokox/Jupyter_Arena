"use client";

import { useEffect, useRef, useState } from "react";
import { KeyRound, Mail, X } from "lucide-react";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { en } from "@/i18n/en";

interface SignInDialogProps {
  onClose: () => void;
}

/**
 * Email-OTP sign-in: address → 6-digit code. Loaded via next/dynamic only
 * when the user clicks "Sign in"; the supabase client is imported lazily on
 * submit (bundle budget).
 */
export default function SignInDialog({ onClose }: SignInDialogProps) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const trapRef = useFocusTrap<HTMLDivElement>();

  useEffect(() => {
    inputRef.current?.focus();
  }, [step]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

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
      onClose();
    } catch {
      setError(en.auth.verifyError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={en.auth.close}
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label={en.auth.dialogTitle}
        className="relative w-full max-w-sm rounded-lg border border-border bg-panel p-5 shadow-xl"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold text-text">{en.auth.dialogTitle}</h2>
          <button
            type="button"
            aria-label={en.auth.close}
            onClick={onClose}
            className="-me-1 -mt-1 flex size-9 items-center justify-center rounded-md text-muted hover:text-text focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <p className="mb-4 text-sm text-muted">{en.auth.dialogIntro}</p>

        {step === "email" ? (
          <form onSubmit={sendCode} className="space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block text-muted">{en.auth.emailLabel}</span>
              <input
                ref={inputRef}
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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
              {en.auth.codeSentPrefix} <span className="font-mono text-text">{email}</span>
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
                onChange={(event) => setCode(event.target.value)}
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
              onClick={() => {
                setStep("email");
                setCode("");
                setError(null);
              }}
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
      </div>
    </div>
  );
}
