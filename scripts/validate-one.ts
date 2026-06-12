import fs from "node:fs";
import path from "node:path";
import { validateChallengeFile } from "../src/lib/content/validate";

/**
 * Validates a single challenge file (used by authoring agents so concurrent
 * authoring never races the whole-directory validator).
 * Usage: pnpm exec tsx scripts/validate-one.ts content/challenges/ml/ml-003-x.json
 */
const target = process.argv[2];
if (!target) {
  console.error("usage: tsx scripts/validate-one.ts <path-to-challenge.json>");
  process.exit(1);
}

const absolute = path.resolve(process.cwd(), target);
const fileName = path.basename(absolute);
const sectorDir = path.basename(path.dirname(absolute));
const raw = fs.readFileSync(absolute, "utf8");

const { errors, challenge } = validateChallengeFile({ sectorDir, fileName, raw });

// Extra single-file checks beyond the schema: line-number references in the
// traceback and result logs must not exceed the code they claim to run.
if (challenge) {
  const codeLines = challenge.initialCode.split("\n").length;
  const tracebackRefs = [...challenge.traceback.matchAll(/line (\d+)/gi)].map((m) => Number(m[1]));
  for (const ref of tracebackRefs) {
    if (ref > codeLines) {
      errors.push(
        `traceback references line ${ref} but initialCode has only ${codeLines} lines`,
      );
    }
  }
  for (const option of challenge.options) {
    const patchLines = option.patchCode.split("\n").length;
    const refs = [...option.resultLog.matchAll(/line (\d+)/gi)].map((m) => Number(m[1]));
    for (const ref of refs) {
      if (ref > patchLines) {
        errors.push(
          `option ${option.key} resultLog references line ${ref} but its patchCode has only ${patchLines} lines`,
        );
      }
    }
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`✗ ${target}: ${error}`);
  process.exit(1);
}
console.log(`✓ ${target} valid${challenge ? ` (${challenge.initialCode.split("\n").length} code lines)` : ""}`);
