import { Bug } from "lucide-react";
import { tokenize, type Language, type TokenKind } from "@/lib/tokenizer/tokenize";
import { en } from "@/i18n/en";

const KIND_CLASS: Record<TokenKind, string> = {
  keyword: "text-syntax-keyword",
  string: "text-syntax-string",
  comment: "text-syntax-comment",
  number: "text-syntax-number",
  type: "text-syntax-type",
  function: "text-syntax-function",
  plain: "text-text",
};

interface CodeCellProps {
  code: string;
  language: Language;
  /** 1-based inclusive bug region; only shown for the unpatched code. */
  bugRegion: { start: number; end: number } | null;
  title: string;
  /** True on the first render after a correct fix — flashes the patched code green. */
  justSolved?: boolean;
}

export function CodeCell({ code, language, bugRegion, title, justSolved = false }: CodeCellProps) {
  const lines = tokenize(code, language);

  return (
    <section aria-label={en.workspace.codeCellAria} className="flex gap-3">
      <span className="hidden w-16 shrink-0 pt-3 text-end font-mono text-xs text-accent sm:block">
        {en.workspace.inLabel} [1]:
      </span>
      <div className="min-w-0 flex-1 overflow-hidden rounded-md border border-border bg-code-bg">
        <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
          <span className="truncate font-mono text-xs text-muted">{title}</span>
          <span className="rounded bg-panel-2 px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted">
            {language}
          </span>
        </div>
        <pre
          className={`overflow-x-auto p-0 font-mono text-[13px] leading-6 ${
            justSolved ? "motion-safe:animate-[line-patch_0.6s_ease-out]" : ""
          }`}
        >
          <code>
            {lines.map((tokens, index) => {
              const lineNumber = index + 1;
              const inBugRegion =
                bugRegion !== null && lineNumber >= bugRegion.start && lineNumber <= bugRegion.end;
              return (
                <span
                  key={lineNumber}
                  className={`flex ${inBugRegion ? "border-s-2 border-accent bg-accent/10" : "border-s-2 border-transparent"}`}
                >
                  <span
                    aria-hidden
                    className="w-10 shrink-0 select-none pe-3 text-end text-xs leading-6 text-muted"
                  >
                    {lineNumber}
                  </span>
                  <span className="flex-1 whitespace-pre pe-8">
                    {tokens.map((token, i) => (
                      <span key={i} className={KIND_CLASS[token.kind]}>
                        {token.text}
                      </span>
                    ))}
                  </span>
                  {inBugRegion && lineNumber === bugRegion.start && (
                    <span
                      role="img"
                      aria-label={en.workspace.bugRegionAria}
                      className="sticky right-2 me-2 flex items-center"
                    >
                      <Bug className="size-3.5 text-accent" />
                    </span>
                  )}
                </span>
              );
            })}
          </code>
        </pre>
      </div>
    </section>
  );
}
