import fs from "node:fs";
import path from "node:path";
import {
  checkDuplicateIds,
  validateChallengeFile,
  validateSectorsFile,
} from "../src/lib/content/validate";
import type { Challenge } from "../src/lib/content/schema";

/**
 * content:validate — CI gate from MASTER_BRIEF.md Section 6. Validates
 * /content/sectors.json and every /content/challenges/{sector}/{id}.json,
 * printing all failures and exiting non-zero on any error.
 */

const contentDir = path.join(process.cwd(), "content");
const challengesDir = path.join(contentDir, "challenges");

let failureCount = 0;
const challenges: Challenge[] = [];

function report(file: string, errors: string[]): void {
  for (const error of errors) {
    failureCount += 1;
    console.error(`✗ ${file}: ${error}`);
  }
}

const sectorsPath = path.join(contentDir, "sectors.json");
if (fs.existsSync(sectorsPath)) {
  report("content/sectors.json", validateSectorsFile(fs.readFileSync(sectorsPath, "utf8")));
} else {
  report("content/sectors.json", ["file is missing"]);
}

const sectorDirs = fs.existsSync(challengesDir)
  ? fs
      .readdirSync(challengesDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
  : [];

let fileCount = 0;
for (const sectorDir of sectorDirs) {
  const dirPath = path.join(challengesDir, sectorDir);
  const files = fs.readdirSync(dirPath).filter((file) => file.endsWith(".json"));
  for (const fileName of files) {
    fileCount += 1;
    const raw = fs.readFileSync(path.join(dirPath, fileName), "utf8");
    const { errors, challenge } = validateChallengeFile({ sectorDir, fileName, raw });
    report(`content/challenges/${sectorDir}/${fileName}`, errors);
    if (challenge) challenges.push(challenge);
  }
}

report("content/challenges", checkDuplicateIds(challenges));

if (fileCount === 0) {
  report("content/challenges", ["no challenge files found"]);
}

if (failureCount > 0) {
  console.error(
    `\ncontent:validate failed — ${failureCount} error(s) across ${fileCount} file(s).`,
  );
  process.exit(1);
}

console.log(`content:validate passed — ${fileCount} challenge(s), ${challenges.length} parsed.`);
