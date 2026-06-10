/**
 * Lightweight read-only syntax tokenizer — MASTER_BRIEF.md Section 4 locks a
 * custom tokenizer for v1 (CodeMirror read-only is an approved SHOULD upgrade).
 * Line-based with no cross-line state, which covers the challenge corpus; the
 * known limitation (multi-line strings/comments) is documented in the report.
 */

import type { Challenge } from "@/lib/content/schema";

export type Language = Challenge["language"];

export type TokenKind = "keyword" | "string" | "comment" | "number" | "type" | "function" | "plain";

export interface Token {
  text: string;
  kind: TokenKind;
}

const PYTHON_KEYWORDS = new Set([
  "False",
  "None",
  "True",
  "and",
  "as",
  "assert",
  "async",
  "await",
  "break",
  "class",
  "continue",
  "def",
  "del",
  "elif",
  "else",
  "except",
  "finally",
  "for",
  "from",
  "global",
  "if",
  "import",
  "in",
  "is",
  "lambda",
  "nonlocal",
  "not",
  "or",
  "pass",
  "raise",
  "return",
  "try",
  "while",
  "with",
  "yield",
]);

const JS_KEYWORDS = new Set([
  "async",
  "await",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "default",
  "delete",
  "do",
  "else",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "from",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "let",
  "new",
  "null",
  "of",
  "return",
  "static",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "undefined",
  "var",
  "void",
  "while",
  "yield",
]);

const SQL_KEYWORDS = new Set([
  "ADD",
  "ALTER",
  "AND",
  "AS",
  "ASC",
  "BY",
  "CASE",
  "COLUMN",
  "CREATE",
  "DELETE",
  "DESC",
  "DISTINCT",
  "DROP",
  "ELSE",
  "END",
  "EXISTS",
  "FOR",
  "FROM",
  "GROUP",
  "HAVING",
  "IN",
  "INDEX",
  "INSERT",
  "INTO",
  "IS",
  "JOIN",
  "LEFT",
  "LIKE",
  "LIMIT",
  "LOCK",
  "NOT",
  "NULL",
  "OFFSET",
  "ON",
  "OR",
  "ORDER",
  "PRIMARY",
  "RIGHT",
  "SELECT",
  "SET",
  "TABLE",
  "THEN",
  "UNION",
  "UPDATE",
  "VALUES",
  "WHEN",
  "WHERE",
]);

interface LanguageSpec {
  pattern: RegExp;
  keywords: Set<string>;
  caseInsensitiveKeywords: boolean;
}

// Alternation order matters: comments before strings before numbers before
// identifiers; the final branch consumes any single other character.
const SPECS: Record<Language, LanguageSpec> = {
  python: {
    pattern:
      /(#.*$)|([fFrRbB]{0,2}(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'))|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)|(\s+)|(.)/gm,
    keywords: PYTHON_KEYWORDS,
    caseInsensitiveKeywords: false,
  },
  javascript: {
    pattern:
      /(\/\/.*$|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][A-Za-z0-9_$]*)|(\s+)|(.)/gm,
    keywords: JS_KEYWORDS,
    caseInsensitiveKeywords: false,
  },
  jsx: {
    pattern:
      /(\/\/.*$|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][A-Za-z0-9_$]*)|(\s+)|(.)/gm,
    keywords: JS_KEYWORDS,
    caseInsensitiveKeywords: false,
  },
  sql: {
    pattern:
      /(--.*$)|('(?:''|[^'])*'|"(?:""|[^"])*")|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)|(\s+)|(.)/gm,
    keywords: SQL_KEYWORDS,
    caseInsensitiveKeywords: true,
  },
};

function classifyIdentifier(word: string, spec: LanguageSpec, followedByParen: boolean): TokenKind {
  const lookup = spec.caseInsensitiveKeywords ? word.toUpperCase() : word;
  if (spec.keywords.has(lookup)) return "keyword";
  if (/^[A-Z]/.test(word)) return "type";
  if (followedByParen) return "function";
  return "plain";
}

export function tokenizeLine(line: string, language: Language): Token[] {
  const spec = SPECS[language];
  const tokens: Token[] = [];
  const regex = new RegExp(spec.pattern.source, spec.pattern.flags);
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    const [text, comment, string, number, identifier] = match;
    if (text === "") break;
    let kind: TokenKind = "plain";
    if (comment !== undefined) kind = "comment";
    else if (string !== undefined) kind = "string";
    else if (number !== undefined) kind = "number";
    else if (identifier !== undefined) {
      const rest = line.slice(regex.lastIndex);
      kind = classifyIdentifier(identifier, spec, /^\s*\(/.test(rest));
    }
    // Merge consecutive plain tokens (whitespace, punctuation) for fewer spans.
    const previous = tokens[tokens.length - 1];
    if (kind === "plain" && previous?.kind === "plain") {
      previous.text += text;
    } else {
      tokens.push({ text, kind });
    }
  }
  return tokens;
}

export function tokenize(code: string, language: Language): Token[][] {
  return code.split("\n").map((line) => tokenizeLine(line, language));
}
