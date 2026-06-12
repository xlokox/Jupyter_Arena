import fs from "node:fs";
import path from "node:path";
import { SectorsFileSchema, type Challenge, type Sector } from "./schema";
import { checkDuplicateIds, validateChallengeFile } from "./validate";

/**
 * Build/server-time content loader. Reads /content from disk, runs the same
 * validation as content:validate, and throws (failing the build) on any
 * error — a bad challenge can never ship. Server components only; in Phase 4
 * authed reads move to Supabase while this remains the SSG path.
 */

const CONTENT_DIR = path.join(process.cwd(), "content");

const SECTOR_ORDER: Record<string, number> = { py: 0, da: 1, ml: 2, dl: 3, fullstack: 4, db: 5 };

export function loadSectors(): Sector[] {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, "sectors.json"), "utf8");
  const sectors = SectorsFileSchema.parse(JSON.parse(raw));
  return [...sectors].sort((a, b) => a.position - b.position);
}

export function loadChallenges(): Challenge[] {
  const challengesDir = path.join(CONTENT_DIR, "challenges");
  const challenges: Challenge[] = [];
  const failures: string[] = [];

  for (const entry of fs.readdirSync(challengesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dirPath = path.join(challengesDir, entry.name);
    for (const fileName of fs.readdirSync(dirPath).filter((f) => f.endsWith(".json"))) {
      const raw = fs.readFileSync(path.join(dirPath, fileName), "utf8");
      const { errors, challenge } = validateChallengeFile({
        sectorDir: entry.name,
        fileName,
        raw,
      });
      if (errors.length > 0) {
        failures.push(...errors.map((e) => `${entry.name}/${fileName}: ${e}`));
      } else if (challenge) {
        challenges.push(challenge);
      }
    }
  }

  failures.push(...checkDuplicateIds(challenges));
  if (failures.length > 0) {
    throw new Error(`content failed validation:\n${failures.join("\n")}`);
  }

  return challenges.sort(
    (a, b) =>
      (SECTOR_ORDER[a.sector] ?? 9) - (SECTOR_ORDER[b.sector] ?? 9) || a.id.localeCompare(b.id),
  );
}
