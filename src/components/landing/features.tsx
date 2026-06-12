import { BrainCircuit, Database, Globe, Layers, Lightbulb, Star, Trophy } from "lucide-react";
import { en } from "@/i18n/en";

const features = [
  {
    icon: BrainCircuit,
    title: en.landing.featureMl,
    body: en.landing.featureMlBody,
    accent: true,
  },
  {
    icon: Layers,
    title: en.landing.featureDl,
    body: en.landing.featureDlBody,
    accent: false,
  },
  {
    icon: Globe,
    title: en.landing.featureFs,
    body: en.landing.featureFsBody,
    accent: false,
  },
  {
    icon: Database,
    title: en.landing.featureDb,
    body: en.landing.featureDbBody,
    accent: false,
  },
  {
    icon: Lightbulb,
    title: en.landing.featureHints,
    body: en.landing.featureHintsBody,
    accent: false,
  },
  {
    icon: Star,
    title: en.landing.featureReviews,
    body: en.landing.featureReviewsBody,
    accent: false,
  },
  {
    icon: Trophy,
    title: en.landing.featurePortfolio,
    body: en.landing.featurePortfolioBody,
    accent: false,
  },
];

export function Features() {
  return (
    <section
      aria-label={en.landing.featuresHeading}
      className="border-y border-border bg-panel py-20 md:py-28"
    >
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="mb-12 text-center font-mono text-2xl font-bold text-text md:text-3xl">
          {en.landing.featuresHeading}
        </h2>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="list">
          {features.map((feature) => (
            <li
              key={feature.title}
              className={`rounded-lg border p-5 ${
                feature.accent
                  ? "border-accent/40 bg-accent/5"
                  : "border-border bg-panel-2"
              }`}
            >
              <feature.icon
                className={`mb-3 size-6 ${feature.accent ? "text-accent" : "text-muted"}`}
                aria-hidden
              />
              <h3 className="mb-1.5 font-semibold text-text">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{feature.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
