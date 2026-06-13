import { BookOpen, Play, Zap } from "lucide-react";
import { en } from "@/i18n/en";

const steps = [
  {
    icon: BookOpen,
    title: en.landing.step1Title,
    body: en.landing.step1Body,
    number: "01",
  },
  {
    icon: Zap,
    title: en.landing.step2Title,
    body: en.landing.step2Body,
    number: "02",
  },
  {
    icon: Play,
    title: en.landing.step3Title,
    body: en.landing.step3Body,
    number: "03",
  },
];

export function HowItWorks() {
  return (
    <section
      aria-label={en.landing.howHeading}
      className="mx-auto max-w-5xl px-4 py-20 md:py-28"
    >
      <h2 className="mb-12 text-center font-mono text-2xl font-bold text-text md:text-3xl">
        {en.landing.howHeading}
      </h2>
      <ol className="grid gap-8 md:grid-cols-3" role="list">
        {steps.map((step) => (
          <li
            key={step.number}
            className="flex flex-col gap-4 rounded-lg border border-border bg-panel p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex size-10 items-center justify-center rounded-md bg-accent/10 text-accent">
                <step.icon className="size-5" aria-hidden />
              </div>
              <span aria-hidden className="font-mono text-3xl font-bold text-muted">
                {step.number}
              </span>
            </div>
            <h3 className="font-semibold text-text">{step.title}</h3>
            <p className="text-sm leading-relaxed text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
