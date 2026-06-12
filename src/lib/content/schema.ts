import { z } from "zod";
import { UNLOCK_LEVELS } from "@/lib/game/xp";

/**
 * Content schemas — MASTER_BRIEF.md Section 6. These mirror the Postgres
 * schema (Section 5) exactly; the seed script (Phase 4) maps camelCase fields
 * to snake_case columns 1:1.
 */

export const SECTOR_IDS = ["ml", "dl", "fullstack", "db"] as const;
export const DIFFICULTIES = ["easy", "medium", "hard", "very_hard"] as const;
export const LANGUAGES = ["python", "jsx", "javascript", "sql"] as const;
export const OPTION_KEYS = ["a", "b", "c"] as const;

export const SectorSchema = z.object({
  id: z.enum(SECTOR_IDS),
  name: z.string().min(1),
  position: z.number().int().min(0),
});

export const SectorsFileSchema = z.array(SectorSchema).min(1);

export const ChallengeOptionSchema = z.object({
  key: z.enum(OPTION_KEYS),
  label: z.string(),
  patchCode: z.string(),
  isCorrect: z.boolean(),
  resultLog: z.string().min(20),
  rationale: z.string().min(60),
});

export const ChallengeSchema = z.object({
  id: z.string().regex(/^(ml|dl|fullstack|db)-\d{3}-[a-z0-9-]+$/),
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
}

export const toMeta = (c: z.infer<typeof ChallengeSchema>): ChallengeMeta => ({
  id: c.id,
  sector: c.sector,
  difficulty: c.difficulty,
  title: c.title,
  language: c.language,
  icon: c.icon,
  conceptTags: c.conceptTags,
  estMinutes: c.estMinutes,
  unlockLevel: c.unlockLevelOverride ?? UNLOCK_LEVELS[c.difficulty] ?? 1,
});
export type ChallengeOption = z.infer<typeof ChallengeOptionSchema>;
export type Challenge = z.infer<typeof ChallengeSchema>;
export type Difficulty = (typeof DIFFICULTIES)[number];
export type SectorId = (typeof SECTOR_IDS)[number];
