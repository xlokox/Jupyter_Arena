import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Markdown renderer for briefings, explanations, and tutorials.
 * Raw HTML is never rendered (react-markdown's default — no rehype-raw),
 * per MASTER_BRIEF.md Section 4. Styling is applied via component overrides
 * to keep the design-token system in charge.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: (props) => <h2 className="mb-3 mt-1 text-lg font-bold text-text" {...props} />,
        h2: (props) => <h2 className="mb-3 mt-1 text-lg font-bold text-text" {...props} />,
        h3: (props) => (
          <h3
            className="mb-2 mt-4 text-sm font-semibold uppercase tracking-wide text-accent"
            {...props}
          />
        ),
        p: (props) => <p className="mb-3 leading-relaxed text-text/90" {...props} />,
        ul: (props) => <ul className="mb-3 list-disc space-y-1 ps-5 text-text/90" {...props} />,
        ol: (props) => <ol className="mb-3 list-decimal space-y-1 ps-5 text-text/90" {...props} />,
        li: (props) => <li className="leading-relaxed" {...props} />,
        strong: (props) => <strong className="font-semibold text-text" {...props} />,
        a: (props) => (
          <a
            className="text-accent underline underline-offset-2 hover:text-accent-hover"
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          />
        ),
        code: (props) => (
          <code
            className="rounded bg-code-bg px-1 py-0.5 font-mono text-[0.85em] text-syntax-string"
            {...props}
          />
        ),
        pre: (props) => (
          <pre
            className="mb-3 overflow-x-auto rounded-md border border-border bg-code-bg p-3 font-mono text-xs"
            {...props}
          />
        ),
        blockquote: (props) => (
          <blockquote className="mb-3 border-s-2 border-accent ps-3 text-muted" {...props} />
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
