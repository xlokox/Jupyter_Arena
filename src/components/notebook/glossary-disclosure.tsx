import { BookOpen } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { en } from "@/i18n/en";

interface GlossaryEntry {
  term: string;
  definitionMd: string;
}

interface GlossaryDisclosureProps {
  entries: ReadonlyArray<GlossaryEntry>;
}

/**
 * In-context glossary for jargon used in the mission briefing or tutorial.
 * Native <details>/<summary> for keyboard accessibility + zero JS. Collapsed
 * by default so the existing briefing flow is unchanged for missions without
 * a glossary or for learners who don't need it.
 */
export function GlossaryDisclosure({ entries }: GlossaryDisclosureProps) {
  if (!entries.length) return null;
  return (
    <details
      data-glossary
      aria-label={en.workspace.glossaryAria}
      className="group rounded-md border border-border bg-panel-2"
    >
      <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs font-semibold text-muted transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent group-open:text-text">
        <BookOpen className="size-3.5 text-accent" aria-hidden />
        <span className="uppercase tracking-wide">{en.workspace.glossaryHeading}</span>
        <span className="ms-1 text-muted">({entries.length})</span>
      </summary>
      <dl className="space-y-2 border-t border-border px-3 py-3 text-sm">
        {entries.map((e) => (
          <div key={e.term} className="flex flex-col gap-0.5">
            <dt className="font-mono text-xs font-semibold text-accent">{e.term}</dt>
            <dd className="text-muted">
              <Markdown>{e.definitionMd}</Markdown>
            </dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
