import type { Metadata } from "next";
import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { OtpForm } from "@/components/auth/otp-form";
import { en } from "@/i18n/en";

export const metadata: Metadata = {
  title: `Sign up — ${en.app.name}`,
  description: en.auth.signupPageIntro,
};

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="border-b border-border px-4 py-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-base font-bold text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <FlaskConical className="size-5 text-accent" aria-hidden />
          {en.app.name}
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <OtpForm
          title={en.auth.signupPageTitle}
          intro={en.auth.signupPageIntro}
          benefits={en.auth.signupBenefits}
        />
      </main>
    </div>
  );
}
