import { z } from "zod";
import { UNLOCK_LEVELS } from "@/lib/game/xp";

/**
 * Content schemas — MASTER_BRIEF.md Section 6. These mirror the Postgres
 * schema (Section 5) exactly; the seed script (Phase 4) maps camelCase fields
 * to snake_case columns 1:1.
 */

export const SECTOR_IDS = ["py", "da", "ml", "dl", "fullstack", "db"] as const;
export const DIFFICULTIES = ["easy", "medium", "hard", "very_hard"] as const;
export const LANGUAGES = ["python", "jsx", "javascript", "sql"] as const;
export const OPTION_KEYS = ["a", "b", "c"] as const;
/** Track label — `debugging` is the default (fix-the-bug missions); `reasoning`
 * is the judgment track (interpretive choices, no code patch). */
export const TRACKS = ["debugging", "reasoning"] as const;
export type Track = (typeof TRACKS)[number];

export const SectorSchema = z.object({
  id: z.enum(SECTOR_IDS),
  name: z.string().min(1),
  position: z.number().int().min(0),
  /** Gated sectors level-lock by difficulty; the Data Analyst on-ramp is ungated. */
  isGated: z.boolean().default(true),
});

export const SectorsFileSchema = z.array(SectorSchema).min(1);

/**
 * Inline SVG must start with `<svg`, end with `</svg>`, and carry none of the
 * tokens a renderer-injected payload could weaponise. The renderer also gates
 * on this (defense in depth) but the schema rejects bad content at the seed
 * boundary so a broken figure can never round-trip into the DB.
 */
const SVG_DANGER_RE = /<script\b|javascript:|\son[a-z]+\s*=/i;
const figureSvgField = z
  .string()
  .min(40)
  .refine((s) => /^\s*<svg[\s>]/i.test(s) && /<\/svg>\s*$/i.test(s), {
    message: "figureSvg must start with <svg and end with </svg>",
  })
  .refine((s) => !SVG_DANGER_RE.test(s), {
    message: "figureSvg contains a banned token (<script, javascript:, or on*= handler)",
  });

export const ChallengeOptionSchema = z.object({
  key: z.enum(OPTION_KEYS),
  label: z.string(),
  patchCode: z.string(),
  isCorrect: z.boolean(),
  resultLog: z.string().min(20),
  rationale: z.string().min(60),
  /** Optional post-fix figure rendered in the output cell after a successful run. */
  resultFigureSvg: figureSvgField.optional(),
});

export const ChallengeSchema = z.object({
  id: z.string().regex(/^(ml|dl|fullstack|db|da|py)-\d{3}-[a-z0-9-]+$/),
  sector: z.enum(SECTOR_IDS),
  difficulty: z.enum(DIFFICULTIES),
  title: z.string(),
  language: z.enum(LANGUAGES),
  icon: z.string(),
  conceptTags: z.array(z.string()).min(1).max(5),
  descriptionMd: z.string().min(200),
  initialCode: z.string(),
  buggyLineStart: z.number().int().positive(),
  buggyLineEnd: z.number().int().positive(),
  traceback: z.string().min(40),
  correctOutput: z.string().min(20),
  options: z.array(ChallengeOptionSchema).length(3),
  hints: z.tuple([z.string(), z.string()]),
  explanationMd: z.string().min(150),
  recruiterReview: z.string().min(120),
  tutorial: z.object({
    bodyMd: z.string().min(1200),
    videos: z.array(z.object({ title: z.string(), searchQuery: z.string() })).length(2),
  }),
  estMinutes: z.number().int().min(2).max(20),
  version: z.number().int().min(1),
  unlockLevelOverride: z.number().int().positive().optional(),
  // Learn-first layer (beginner sectors). All optional in the schema; the
  // validator requires conceptCard + lineNotes for py/da only.
  conceptCard: z.string().optional(),
  lineNotes: z
    .array(z.object({ line: z.number().int().positive(), noteMd: z.string().min(1) }))
    .optional(),
  takeaway: z.string().optional(),
  // Figure pipeline (the da graph challenges). Optional in the schema; the
  // validator requires figureSvg + figureCaption + correct-option resultFigureSvg
  // for GRAPH_CHALLENGE_IDS (da-016..025) only. Stored as inline SVG so the
  // runtime executes nothing — "content is data, not code."
  figureSvg: figureSvgField.optional(),
  figureCaption: z.string().min(8).max(160).optional(),
  // Reasoning vs debugging track. Optional; undefined ≡ "debugging" (default).
  // Surfaced as a sidebar filter + mission badge — no gating, no XP change.
  track: z.enum(TRACKS).optional(),
  // In-context glossary for jargon used in the briefing/tutorial. Optional;
  // capped at 8 entries so the disclosure stays focused. Each entry's
  // definition is rendered as Markdown — keep it to a single paragraph.
  glossary: z
    .array(z.object({ term: z.string().min(1).max(60), definitionMd: z.string().min(8) }))
    .max(8)
    .optional(),
  // Sub-sector tag organising missions by real-world job (e.g. "data-flow"
  // inside Full Stack). Optional; valid values are kept in the map at
  // src/lib/content/sub-sectors.ts and verified by checkSubSector below.
  subSector: z.string().min(1).max(40).optional(),
});

export type Sector = z.infer<typeof SectorSchema>;

/**
 * The list-view projection (Section 11: list views ship metadata only;
 * challenge bodies load on demand). Keep in sync with getChallengeMetas.
 */
export interface ChallengeMeta {
  id: string;
  sector: z.infer<typeof ChallengeSchema>["sector"];
  difficulty: z.infer<typeof ChallengeSchema>["difficulty"];
  title: string;
  language: z.infer<typeof ChallengeSchema>["language"];
  icon: string;
  conceptTags: string[];
  estMinutes: number;
  /** Minimum player level required to attempt this challenge (client display + anon gate). */
  unlockLevel: number;
  /** Mission track — never undefined on the meta (default 'debugging' applied in toMeta). */
  track: Track;
  /** Sub-sector tag — optional; undefined when no tag is set on the challenge. */
  subSector?: string;
}

export const toMeta = (
  c: z.infer<typeof ChallengeSchema>,
  ungatedSectors?: ReadonlySet<string>,
): ChallengeMeta => ({
  id: c.id,
  sector: c.sector,
  difficulty: c.difficulty,
  title: c.title,
  language: c.language,
  icon: c.icon,
  conceptTags: c.conceptTags,
  estMinutes: c.estMinutes,
  // Ungated sectors (the Data Analyst on-ramp) are always playable → level 1.
  unlockLevel: ungatedSectors?.has(c.sector)
    ? 1
    : (c.unlockLevelOverride ?? UNLOCK_LEVELS[c.difficulty] ?? 1),
  // null/undefined on the row means the default fix-the-bug track.
  track: c.track ?? "debugging",
  subSector: c.subSector,
});
export type ChallengeOption = z.infer<typeof ChallengeOptionSchema>;
export type Challenge = z.infer<typeof ChallengeSchema>;
export type Difficulty = (typeof DIFFICULTIES)[number];
export type SectorId = (typeof SECTOR_IDS)[number];
