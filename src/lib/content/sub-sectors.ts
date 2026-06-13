import type { SectorId } from "./schema";

/**
 * Canonical sub-sector map. Adding a new sub-sector is a single edit here —
 * no DB migration needed because the column has no CHECK constraint and the
 * Zod schema accepts any short string (the validator narrows to this map).
 *
 * The order in each array is the order the sidebar chip row renders. The
 * UI shows the chip row only when both:
 *   1) the active sector's array has ≥ 2 entries, AND
 *   2) the current visible-challenge set contains ≥ 2 distinct sub-sectors.
 */
export const SUB_SECTOR_MAP = {
  py: ["syntax-basics", "data-structures", "control-flow", "functions", "files-and-errors"],
  da: ["data-loading", "wrangling", "charts-literacy", "stats-reasoning", "numpy-foundations"],
  ml: ["data-prep", "evaluation", "models", "pipelines"],
  dl: ["tensors-and-shapes", "training-loop", "optimization", "data-pipeline"],
  fullstack: ["data-flow", "state-and-ui", "auth-and-sessions", "async-and-network", "deploy-and-config"],
  db: ["querying", "performance", "transactions", "schema-and-migrations", "connections"],
} as const satisfies Record<SectorId, readonly string[]>;

export type SubSectorMap = typeof SUB_SECTOR_MAP;

/** Type-safe lookup: returns the allowed sub-sectors for a sector. */
export function subSectorsFor(sector: SectorId): readonly string[] {
  return SUB_SECTOR_MAP[sector];
}

/** Validity check used by the content validator. */
export function isValidSubSector(sector: SectorId, subSector: string): boolean {
  return (SUB_SECTOR_MAP[sector] as readonly string[]).includes(subSector);
}

/**
 * Display label for a sub-sector slug. Tree-shakeable, ~30 bytes — replaces
 * a 30-entry i18n map. Capitalises the first word and replaces hyphens with
 * spaces ("data-flow" → "Data flow", "state-and-ui" → "State and ui"). For
 * cleaner labels we hand-correct a handful of slugs in a tiny lookup.
 */
const SUB_SECTOR_LABEL_OVERRIDES: Record<string, string> = {
  "state-and-ui": "State & UI",
  "auth-and-sessions": "Auth & sessions",
  "async-and-network": "Async & network",
  "deploy-and-config": "Deploy & config",
  "schema-and-migrations": "Schema & migrations",
  "files-and-errors": "Files & errors",
  "numpy-foundations": "NumPy foundations",
  "tensors-and-shapes": "Tensors & shapes",
};
export function formatSubSector(slug: string): string {
  if (SUB_SECTOR_LABEL_OVERRIDES[slug]) return SUB_SECTOR_LABEL_OVERRIDES[slug] as string;
  const spaced = slug.replace(/-/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
