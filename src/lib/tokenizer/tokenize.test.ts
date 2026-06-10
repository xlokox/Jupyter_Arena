import { describe, expect, it } from "vitest";
import { tokenize, tokenizeLine } from "./tokenize";

const text = (tokens: ReturnType<typeof tokenizeLine>) => tokens.map((t) => t.text).join("");

describe("tokenizeLine — python", () => {
  it("classifies keywords, functions, strings, and comments", () => {
    const tokens = tokenizeLine("from sklearn.cluster import KMeans  # the model", "python");
    expect(tokens.find((t) => t.text === "from")?.kind).toBe("keyword");
    expect(tokens.find((t) => t.text === "import")?.kind).toBe("keyword");
    expect(tokens.find((t) => t.text === "KMeans")?.kind).toBe("type");
    expect(tokens.find((t) => t.text === "# the model")?.kind).toBe("comment");
  });

  it("classifies f-strings as strings", () => {
    const tokens = tokenizeLine('print(f"epoch {epoch}: loss {loss:.4f}")', "python");
    expect(tokens.find((t) => t.text === "print")?.kind).toBe("function");
    expect(tokens.some((t) => t.kind === "string")).toBe(true);
  });

  it("classifies numbers", () => {
    const tokens = tokenizeLine("lr = 0.05", "python");
    expect(tokens.find((t) => t.text === "0.05")?.kind).toBe("number");
  });

  it("does not treat a hash inside a string as a comment", () => {
    const tokens = tokenizeLine("q = 'a # b'", "python");
    expect(tokens.find((t) => t.text === "'a # b'")?.kind).toBe("string");
    expect(tokens.some((t) => t.kind === "comment")).toBe(false);
  });
});

describe("tokenizeLine — jsx", () => {
  it("classifies keywords, components, and template literals", () => {
    const tokens = tokenizeLine("const next = `${task.text}-${index}`;", "jsx");
    expect(tokens.find((t) => t.text === "const")?.kind).toBe("keyword");
    expect(tokens.some((t) => t.kind === "string")).toBe(true);
  });

  it("treats capitalized identifiers as types/components", () => {
    const tokens = tokenizeLine("export default function TaskList() {", "jsx");
    expect(tokens.find((t) => t.text === "TaskList")?.kind).toBe("type");
    expect(tokens.find((t) => t.text === "function")?.kind).toBe("keyword");
  });

  it("classifies line comments", () => {
    const tokens = tokenizeLine("setClicks(next); // schedule re-render", "jsx");
    expect(tokens.find((t) => t.text === "// schedule re-render")?.kind).toBe("comment");
  });
});

describe("tokenizeLine — sql", () => {
  it("matches keywords case-insensitively and strings with doubled quotes", () => {
    const tokens = tokenizeLine("select id from users where email = 'x''y'", "sql");
    expect(tokens.find((t) => t.text === "select")?.kind).toBe("keyword");
    expect(tokens.find((t) => t.text === "where")?.kind).toBe("keyword");
    expect(tokens.find((t) => t.text === "'x''y'")?.kind).toBe("string");
  });

  it("classifies -- comments", () => {
    const tokens = tokenizeLine("SELECT 1 -- sanity probe", "sql");
    expect(tokens.find((t) => t.text === "-- sanity probe")?.kind).toBe("comment");
  });
});

describe("tokenize", () => {
  it("is lossless: concatenated tokens reproduce each input line exactly", () => {
    const code = 'def settle(x):\n    cur.execute("SELECT 1", (x,))\n    return None  # done';
    const lines = tokenize(code, "python");
    expect(lines.map(text)).toEqual(code.split("\n"));
  });

  it("returns one token array per line including empty lines", () => {
    const lines = tokenize("a = 1\n\nb = 2", "python");
    expect(lines).toHaveLength(3);
    expect(lines[1]).toEqual([]);
  });
});
