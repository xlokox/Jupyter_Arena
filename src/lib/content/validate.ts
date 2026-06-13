import { ChallengeSchema, SectorsFileSchema, type Challenge } from "./schema";

/**
 * Content QA checks — MASTER_BRIEF.md Section 6 pipeline: Zod parse,
 * duplicate-ID check, exactly-one-correct check, line-range bounds check,
 * banned-pattern scan, plus file/folder consistency. Pure functions so every
 * rule is unit-testable; the CLI in scripts/validate-content.ts does the IO.
 */

const BANNED_PATTERNS: ReadonlyArray<{ pattern: RegExp; message: string }> = [
  {
    pattern: /youtube\.com\/watch/,
    message:
      'hardcoded YouTube video link ("youtube.com/watch") — only search-query URLs are allowed',
  },
  { pattern: /TODO/, message: 'placeholder marker "TODO"' },
  { pattern: /lorem/i, message: 'placeholder text "lorem"' },
];

export interface ChallengeFileInput {
  /** Directory the file lives in, e.g. "ml" for content/challenges/ml/. */
  sectorDir: string;
  /** File name, e.g. "ml-001-kmeans-scaling.json". */
  fileName: string;
  /** Raw file text. */
  raw: string;
}

export interface ChallengeFileResult {
  errors: string[];
  challenge?: Challenge;
}

export function scanBannedPatterns(raw: string): string[] {
  return BANNED_PATTERNS.filter(({ pattern }) => pattern.test(raw)).map(
    ({ message }) => `banned pattern: ${message}`,
  );
}

export function checkExactlyOneCorrect(challenge: Challenge): string[] {
  const correctCount = challenge.options.filter((o) => o.isCorrect).length;
  return correctCount === 1 ? [] : [`expected exactly 1 correct option, found ${correctCount}`];
}

export function checkLineRange(challenge: Challenge): string[] {
  const errors: string[] = [];
  const lineCount = challenge.initialCode.split("\n").length;
  if (challenge.buggyLineStart > challenge.buggyLineEnd) {
    errors.push(
      `buggyLineStart (${challenge.buggyLineStart}) is after buggyLineEnd (${challenge.buggyLineEnd})`,
    );
  }
  if (challenge.buggyLineEnd > lineCount) {
    errors.push(
      `buggyLineEnd (${challenge.buggyLineEnd}) exceeds initialCode length (${lineCount} lines)`,
    );
  }
  return errors;
}

/**
 * Beginner sectors (py, da) run the learn-first flow, so every challenge there
 * must ship a concept card and line-by-line notes. Note line numbers must be
 * within the code (mirrors checkLineRange). Other sectors are unconstrained.
 */
const LEARN_FIRST_SECTORS = new Set(["py", "da"]);

export function checkBeginnerLearnFirst(challenge: Challenge): string[] {
  if (!LEARN_FIRST_SECTORS.has(challenge.sector)) return [];
  const errors: string[] = [];
  if (!challenge.conceptCard || challenge.conceptCard.trim().length === 0) {
    errors.push(`sector "${challenge.sector}" requires a conceptCard (learn-first layer)`);
  }
  if (!challenge.lineNotes || challenge.lineNotes.length === 0) {
    errors.push(`sector "${challenge.sector}" requires non-empty lineNotes (learn-first layer)`);
  }
  const lineCount = challenge.initialCode.split("\n").length;
  for (const note of challenge.lineNotes ?? []) {
    if (note.line > lineCount) {
      errors.push(`lineNotes line ${note.line} exceeds initialCode length (${lineCount} lines)`);
    }
  }
  return errors;
}

export function checkFileConsistency(
  challenge: Challenge,
  sectorDir: string,
  fileName: string,
): string[] {
  const errors: string[] = [];
  if (fileName !== `${challenge.id}.json`) {
    errors.push(`file name "${fileName}" does not match challenge id "${challenge.id}"`);
  }
  if (sectorDir !== challenge.sector) {
    errors.push(`file is in directory "${sectorDir}" but declares sector "${challenge.sector}"`);
  }
  return errors;
}

export function validateChallengeFile(input: ChallengeFileInput): ChallengeFileResult {
  const errors = scanBannedPatterns(input.raw);

  let data: unknown;
  try {
    data = JSON.parse(input.raw);
  } catch (e) {
    errors.push(`invalid JSON: ${e instanceof Error ? e.message : String(e)}`);
    return { errors };
  }

  const parsed = ChallengeSchema.safeParse(data);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      errors.push(`schema: ${issue.path.join(".") || "(root)"}: ${issue.message}`);
    }
    return { errors };
  }

  const challenge = parsed.data;
  errors.push(
    ...checkExactlyOneCorrect(challenge),
    ...checkLineRange(challenge),
    ...checkFileConsistency(challenge, input.sectorDir, input.fileName),
    ...checkBeginnerLearnFirst(challenge),
  );
  return { errors, challenge };
}

export function checkDuplicateIds(challenges: ReadonlyArray<Pick<Challenge, "id">>): string[] {
  const seen = new Map<string, number>();
  for (const { id } of challenges) {
    seen.set(id, (seen.get(id) ?? 0) + 1);
  }
  return [...seen.entries()]
    .filter(([, count]) => count > 1)
    .map(([id, count]) => `duplicate challenge id "${id}" (${count} files)`);
}

export function validateSectorsFile(raw: string): string[] {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    return [`sectors.json: invalid JSON: ${e instanceof Error ? e.message : String(e)}`];
  }
  const parsed = SectorsFileSchema.safeParse(data);
  if (!parsed.success) {
    return parsed.error.issues.map(
      (issue) => `sectors.json: ${issue.path.join(".") || "(root)"}: ${issue.message}`,
    );
  }
  return [];
}
