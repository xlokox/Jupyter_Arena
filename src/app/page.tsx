import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowRight, Calendar, FlaskConical } from "lucide-react";
import { en } from "@/i18n/en";
import { HeroCell } from "@/components/landing/hero-cell";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Features } from "@/components/landing/features";
import { ProgressionTeaser } from "@/components/landing/progression-teaser";
import { StatsStrip } from "@/components/landing/stats-strip";
import { FinalCta } from "@/components/landing/final-cta";
import { Reveal } from "@/components/landing/reveal";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: en.app.name,
  description:
    "60 realistic broken notebooks across ML, Deep Learning, Full Stack, and Databases. Read the traceback, pick the fix, watch it run. Free forever.",
  openGraph: {
    title: en.app.name,
    description:
      "Master debugging — the untaught interview skill. 60 real broken notebooks, recruiter code reviews, XP progression. Free forever.",
  },
};

export default function LandingPage() {
  return (
    <>
      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur">
        <nav
          className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3"
          aria-label={en.landing.navAria}
        >
          <Link
            href="/"
            className="flex items-center gap-2 font-mono text-lg font-bold tracking-tight text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <FlaskConical className="size-5 text-accent" aria-hidden />
            {en.app.name}
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-muted transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {en.landing.navSignIn}
            </Link>
            <Link
              href="/app"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md bg-accent px-4 text-sm font-semibold text-bg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {en.landing.navStartFree}
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section
          aria-label={en.landing.heroAria}
          className="mx-auto max-w-6xl px-4 pb-12 pt-16 md:pb-20 md:pt-24"
        >
          <div className="grid items-center gap-12 md:grid-cols-2">
            {/* Copy */}
            <div>
              <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-accent">
                {en.landing.heroEyebrow}
              </p>
              <h1 className="mb-5 font-mono text-4xl font-bold leading-tight text-text md:text-5xl">
                {en.landing.heroHeadline}
              </h1>
              <p className="mb-8 max-w-lg leading-relaxed text-muted md:text-lg">
                {en.landing.heroSubheadline}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/app"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-accent px-6 font-semibold text-bg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {en.landing.heroPrimaryCta}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-border px-6 text-sm text-muted transition-colors hover:border-accent/60 hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {en.landing.heroSecondaryCta}
                  <ArrowDown className="size-4" aria-hidden />
                </a>
              </div>
            </div>

            {/* Animated hero cell */}
            <div className="flex justify-center">
              <HeroCell />
            </div>
          </div>
        </section>

        {/* ── The problem ──────────────────────────────────────────────────── */}
        <Reveal>
          <section
            aria-label={en.landing.problemHeading}
            className="border-t border-border bg-panel py-16 md:py-20"
          >
            <div className="mx-auto max-w-3xl px-4 text-center">
              <h2 className="mb-4 font-mono text-xl font-bold text-text md:text-2xl">
                {en.landing.problemHeading}
              </h2>
              <p className="leading-relaxed text-muted md:text-lg">{en.landing.problemBody}</p>
            </div>
          </section>
        </Reveal>

        {/* ── How it works ─────────────────────────────────────────────────── */}
        <div id="how-it-works">
          <Reveal>
            <HowItWorks />
          </Reveal>
        </div>

        {/* ── Features ─────────────────────────────────────────────────────── */}
        <Reveal>
          <Features />
        </Reveal>

        {/* ── Progression ──────────────────────────────────────────────────── */}
        <Reveal>
          <ProgressionTeaser />
        </Reveal>

        {/* ── Stats strip ──────────────────────────────────────────────────── */}
        <Reveal>
          <StatsStrip />
        </Reveal>

        {/* ── Daily challenge highlight ─────────────────────────────────────── */}
        <Reveal>
          <section
            aria-label={en.landing.dailyHeading}
            className="border-t border-border bg-panel py-12 md:py-16"
          >
            <div className="mx-auto max-w-xl px-4 text-center">
              <Calendar className="mx-auto mb-3 size-7 text-accent" aria-hidden />
              <h2 className="mb-2 font-mono text-lg font-bold text-text">
                {en.landing.dailyHeading}
              </h2>
              <p className="mb-6 text-sm text-muted">{en.landing.dailyBody}</p>
              <Link
                href="/daily"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-accent/40 bg-accent/5 px-6 text-sm font-semibold text-accent transition-colors hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {en.landing.dailyCta}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </section>
        </Reveal>

        {/* ── Final CTA ────────────────────────────────────────────────────── */}
        <Reveal>
          <FinalCta />
        </Reveal>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-8">
        <p className="text-center font-mono text-xs text-muted">{en.landing.footerTagline}</p>
      </footer>
    </>
  );
}
