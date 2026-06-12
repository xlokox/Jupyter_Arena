import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import { en } from "@/i18n/en";

export function FinalCta() {
  return (
    <section
      aria-label={en.landing.finalCtaHeading}
      className="mx-auto max-w-3xl px-4 py-24 text-center md:py-32"
    >
      <h2 className="mb-4 font-mono text-3xl font-bold text-text md:text-4xl">
        {en.landing.finalCtaHeading}
      </h2>
      <p className="mx-auto mb-10 max-w-md text-muted">{en.landing.finalCtaBody}</p>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <Link
          href="/app"
          className="inline-flex min-h-[48px] items-center gap-2 rounded-lg bg-accent px-8 font-semibold text-bg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {en.landing.finalCtaPrimary}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
        <Link
          href="/daily"
          className="inline-flex min-h-[48px] items-center gap-2 rounded-lg border border-border bg-panel px-8 font-semibold text-text transition-colors hover:border-accent/60 hover:bg-accent/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <Calendar className="size-4 text-accent" aria-hidden />
          {en.landing.finalCtaSecondary}
        </Link>
      </div>
    </section>
  );
}
