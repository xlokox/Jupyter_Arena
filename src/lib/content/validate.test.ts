import { describe, expect, it } from "vitest";
import type { Challenge } from "./schema";
import { checkDuplicateIds, validateChallengeFile, validateSectorsFile } from "./validate";

/**
 * Each MASTER_BRIEF.md Section 6 QA rule is proven here by deliberately
 * violating it and asserting the validator reports it.
 */

const pad = (sentence: string, min: number): string => {
  let out = sentence;
  while (out.length < min) out += ` ${sentence}`;
  return out;
};

function makeValidChallenge(): Challenge {
  return {
    id: "ml-099-fixture-example",
    sector: "ml",
    difficulty: "easy",
    title: "99_fixture_example.ipynb",
    language: "python",
    icon: "flask-conical",
    conceptTags: ["testing"],
    descriptionMd: pad(
      "A synthetic mission briefing used only by the validator test suite to prove each QA rule fires.",
      200,
    ),
    initialCode: "import math\n\nvalue = math.sqrt(4)\nprint(value)",
    buggyLineStart: 3,
    buggyLineEnd: 3,
    traceback: pad("ValueError: math domain error raised in the fixture.", 40),
    correctOutput: pad("2.0 printed as expected.", 20),
    options: [
      {
        key: "a",
        label: "Correct fixture fix",
        patchCode: "import math\n\nvalue = math.sqrt(4.0)\nprint(value)",
        isCorrect: true,
        resultLog: pad("2.0 printed as expected.", 20),
        rationale: pad("This fixture rationale explains the principle behind the right fix.", 60),
      },
      {
        key: "b",
        label: "Wrong fixture fix",
        patchCode: "import math\n\nvalue = math.sqrt(-4)\nprint(value)",
        isCorrect: false,
        resultLog: pad("ValueError raised again by the fixture.", 20),
        rationale: pad("This fixture rationale explains why the attempt fails in practice.", 60),
      },
      {
        key: "c",
        label: "Another wrong fixture fix",
        patchCode: "import math\n\nvalue = math.pow(4, 2)\nprint(value)",
        isCorrect: false,
        resultLog: pad("16.0 printed, which is the wrong quantity.", 20),
        rationale: pad("This fixture rationale explains the silent wrong result it causes.", 60),
      },
    ],
    hints: ["Concept-level fixture hint.", "Location-level fixture hint."],
    explanationMd: pad(
      "Why the bug occurs in this fixture and why the chosen fix is correct, in two parts.",
      150,
    ),
    recruiterReview: pad(
      "Senior reviewer voice for the fixture: confirms the fix and names the principle.",
      120,
    ),
    tutorial: {
      bodyMd: pad(
        "A fixture lesson teaching the underlying concept in general terms, ending with common variations of this bug.",
        1200,
      ),
      videos: [
        { title: "Fixture video one", searchQuery: "python math sqrt basics" },
        { title: "Fixture video two", searchQuery: "python value error debugging" },
      ],
    },
    estMinutes: 4,
    version: 1,
  };
}

function validateObject(
  challenge: Challenge,
  overrides?: { sectorDir?: string; fileName?: string; rawSuffix?: string },
) {
  const raw = JSON.stringify(challenge, null, 2) + (overrides?.rawSuffix ?? "");
  return validateChallengeFile({
    sectorDir: overrides?.sectorDir ?? challenge.sector,
    fileName: overrides?.fileName ?? `${challenge.id}.json`,
    raw,
  });
}

describe("validateChallengeFile", () => {
  it("accepts a fully valid challenge", () => {
    const result = validateObject(makeValidChallenge());
    expect(result.errors).toEqual([]);
    expect(result.challenge?.id).toBe("ml-099-fixture-example");
  });

  it("rejects invalid JSON", () => {
    const result = validateChallengeFile({
      sectorDir: "ml",
      fileName: "ml-099-fixture-example.json",
      raw: "{ not json",
    });
    expect(result.errors.some((e) => e.includes("invalid JSON"))).toBe(true);
  });

  it("rejects an id that does not match the brief's pattern", () => {
    const challenge = { ...makeValidChallenge(), id: "ML_1_BadId" };
    const result = validateObject(challenge, { fileName: "ML_1_BadId.json" });
    expect(result.errors.some((e) => e.startsWith("schema: id"))).toBe(true);
  });

  it("rejects zero correct options", () => {
    const challenge = makeValidChallenge();
    challenge.options = challenge.options.map((o) => ({ ...o, isCorrect: false }));
    const result = validateObject(challenge);
    expect(result.errors).toContain("expected exactly 1 correct option, found 0");
  });

  it("rejects two correct options", () => {
    const challenge = makeValidChallenge();
    challenge.options = challenge.options.map((o, i) => ({ ...o, isCorrect: i < 2 }));
    const result = validateObject(challenge);
    expect(result.errors).toContain("expected exactly 1 correct option, found 2");
  });

  it("rejects a buggy line range beyond the end of initialCode", () => {
    const challenge = { ...makeValidChallenge(), buggyLineEnd: 99 };
    const result = validateObject(challenge);
    expect(result.errors.some((e) => e.includes("exceeds initialCode length"))).toBe(true);
  });

  it("rejects an inverted buggy line range", () => {
    const challenge = { ...makeValidChallenge(), buggyLineStart: 4, buggyLineEnd: 3 };
    const result = validateObject(challenge);
    expect(result.errors.some((e) => e.includes("is after buggyLineEnd"))).toBe(true);
  });

  it("rejects hardcoded YouTube video links", () => {
    const challenge = makeValidChallenge();
    challenge.tutorial.videos[0]!.searchQuery = "https://www.youtube.com/watch?v=abc123";
    const result = validateObject(challenge);
    expect(result.errors.some((e) => e.includes("youtube.com/watch"))).toBe(true);
  });

  it("rejects TODO placeholders anywhere in the file", () => {
    const challenge = {
      ...makeValidChallenge(),
      initialCode: "import math\n\nvalue = math.sqrt(4)  # T" + "ODO fix later\nprint(value)",
    };
    const result = validateObject(challenge);
    expect(result.errors.some((e) => e.includes('"TODO"'))).toBe(true);
  });

  it("rejects lorem placeholder text case-insensitively", () => {
    const challenge = {
      ...makeValidChallenge(),
      descriptionMd: pad("Lorem ipsum dolor sit amet briefing.", 200),
    };
    const result = validateObject(challenge);
    expect(result.errors.some((e) => e.includes('"lorem"'))).toBe(true);
  });

  it("rejects a file name that does not match the challenge id", () => {
    const result = validateObject(makeValidChallenge(), { fileName: "ml-001-other.json" });
    expect(result.errors.some((e) => e.includes("does not match challenge id"))).toBe(true);
  });

  it("rejects a file placed in the wrong sector directory", () => {
    const result = validateObject(makeValidChallenge(), { sectorDir: "db" });
    expect(result.errors.some((e) => e.includes('declares sector "ml"'))).toBe(true);
  });

  it("rejects a tutorial body shorter than the brief's minimum", () => {
    const challenge = makeValidChallenge();
    challenge.tutorial.bodyMd = "Too short to teach anything.";
    const result = validateObject(challenge);
    expect(result.errors.some((e) => e.startsWith("schema: tutorial.bodyMd"))).toBe(true);
  });
});

describe("checkDuplicateIds", () => {
  it("flags duplicate challenge ids across files", () => {
    const errors = checkDuplicateIds([{ id: "ml-001-a" }, { id: "ml-001-a" }, { id: "db-001-b" }]);
    expect(errors).toEqual(['duplicate challenge id "ml-001-a" (2 files)']);
  });

  it("passes unique ids", () => {
    expect(checkDuplicateIds([{ id: "ml-001-a" }, { id: "db-001-b" }])).toEqual([]);
  });
});

describe("validateSectorsFile", () => {
  it("accepts the canonical sector list", () => {
    const raw = JSON.stringify([
      { id: "ml", name: "Machine Learning", position: 0 },
      { id: "dl", name: "Deep Learning", position: 1 },
      { id: "fullstack", name: "Full Stack", position: 2 },
      { id: "db", name: "Databases", position: 3 },
    ]);
    expect(validateSectorsFile(raw)).toEqual([]);
  });

  it("rejects unknown sector ids", () => {
    const raw = JSON.stringify([{ id: "quantum", name: "Quantum", position: 0 }]);
    expect(validateSectorsFile(raw).length).toBeGreaterThan(0);
  });
});
