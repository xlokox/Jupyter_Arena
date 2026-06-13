"use client";

import { useState } from "react";
import { Bug, MessageSquareText } from "lucide-react";
import { tokenize, type Language, type TokenKind } from "@/lib/tokenizer/tokenize";
import { Markdown } from "@/components/markdown";
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
  /** Learn-first: plain-language notes per code line (beginner sectors). */
  lineNotes?: Array<{ line: number; noteMd: string }>;
}

export function CodeCell({
  code,
  language,
  bugRegion,
  title,
  justSolved = false,
  lineNotes,
}: CodeCellProps) {
  const lines = tokenize(code, language);
  const [showNotes, setShowNotes] = useState(false);
  const hasNotes = Boolean(lineNotes && lineNotes.length > 0);
  const sortedNotes = hasNotes ? [...lineNotes!].sort((a, b) => a.line - b.line) : [];

  return (
    <section aria-label={en.workspace.codeCellAria} className="flex gap-3">
      <span className="hidden w-16 shrink-0 pt-3 text-end font-mono text-xs text-accent sm:block">
        {en.workspace.inLabel} [1]:
      </span>
      <div className="min-w-0 flex-1 overflow-hidden rounded-md border border-border bg-code-bg">
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-1.5">
          <span className="truncate font-mono text-xs text-muted">{title}</span>
          <div className="flex shrink-0 items-center gap-2">
            {hasNotes && (
              <button
                type="button"
                aria-pressed={showNotes}
                onClick={() => setShowNotes((v) => !v)}
                className="flex items-center gap-1 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted transition-colors hover:border-accent-hover hover:text-text focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
              >
                <MessageSquareText className="size-3" aria-hidden />
                {showNotes ? en.workspace.lineNotesHide : en.workspace.lineNotesToggle}
              </button>
            )}
            <span className="rounded bg-panel-2 px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted">
              {language}
            </span>
          </div>
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
        {hasNotes && showNotes && (
          <ul
            aria-label={en.workspace.lineNotesToggle}
            className="space-y-2 border-t border-border bg-panel p-3 motion-safe:animate-[output-reveal_0.35s_ease-out]"
          >
            {sortedNotes.map((note) => (
              <li key={note.line} className="flex gap-2.5 text-sm">
                <span className="mt-0.5 shrink-0 rounded bg-panel-2 px-1.5 py-0.5 font-mono text-[10px] text-accent">
                  {en.workspace.lineLabel} {note.line}
                </span>
                <div className="min-w-0 text-muted">
                  <Markdown>{note.noteMd}</Markdown>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
