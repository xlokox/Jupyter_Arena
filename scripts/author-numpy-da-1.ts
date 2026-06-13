#!/usr/bin/env -S tsx
/**
 * Dev-time batch — composes da-021..025 (numpy + histograms, batch 1) by
 * stitching per-challenge content with inline figure-builder SVGs. Idempotent.
 *
 *   pnpm exec tsx scripts/author-numpy-da-1.ts
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildFigure } from "./figure-builder";

const OUT_DIR = join(__dirname, "..", "content", "challenges", "da");

interface Spec {
  id: string;
  difficulty: "easy" | "medium" | "hard";
  title: string;
  icon: string;
  conceptTags: string[];
  descriptionMd: string;
  initialCode: string;
  buggyLineStart: number;
  buggyLineEnd: number;
  traceback: string;
  correctOutput: string;
  options: Array<{
    key: "a" | "b" | "c";
    label: string;
    patchCode: string;
    isCorrect: boolean;
    resultLog: string;
    rationale: string;
    attachFigure?: boolean;
  }>;
  hints: [string, string];
  explanationMd: string;
  recruiterReview: string;
  tutorial: { bodyMd: string; videos: Array<{ title: string; searchQuery: string }> };
  estMinutes: number;
  conceptCard: string;
  lineNotes: Array<{ line: number; noteMd: string }>;
  takeaway: string;
  glossary: Array<{ term: string; definitionMd: string }>;
  figureSvg?: string;
  figureCaption?: string;
  resultFigureSvg?: string;
}

function compose(spec: Spec) {
  return {
    id: spec.id,
    sector: "da",
    difficulty: spec.difficulty,
    title: spec.title,
    language: "python",
    icon: spec.icon,
    conceptTags: spec.conceptTags,
    descriptionMd: spec.descriptionMd,
    initialCode: spec.initialCode,
    buggyLineStart: spec.buggyLineStart,
    buggyLineEnd: spec.buggyLineEnd,
    traceback: spec.traceback,
    correctOutput: spec.correctOutput,
    options: spec.options.map((o) => ({
      key: o.key,
      label: o.label,
      patchCode: o.patchCode,
      isCorrect: o.isCorrect,
      resultLog: o.resultLog,
      rationale: o.rationale,
      ...(o.attachFigure && spec.resultFigureSvg ? { resultFigureSvg: spec.resultFigureSvg } : {}),
    })),
    hints: spec.hints,
    explanationMd: spec.explanationMd,
    recruiterReview: spec.recruiterReview,
    tutorial: spec.tutorial,
    estMinutes: spec.estMinutes,
    version: 1,
    conceptCard: spec.conceptCard,
    lineNotes: spec.lineNotes,
    takeaway: spec.takeaway,
    glossary: spec.glossary,
    ...(spec.figureSvg ? { figureSvg: spec.figureSvg } : {}),
    ...(spec.figureCaption ? { figureCaption: spec.figureCaption } : {}),
  };
}

// ── Figures ───────────────────────────────────────────────────────────────

// da-021 — too few bins hides bimodality
const F021_BEFORE = buildFigure({
  kind: "hist",
  title: "response_time_ms.png  (bins=5)",
  xLabel: "response time (ms)",
  yLabel: "count",
  counts: [120, 250, 200, 250, 130],
  xStart: 0,
  binWidth: 100,
  color: "warning",
});
const F021_AFTER = buildFigure({
  kind: "hist",
  title: "response_time_ms.png  (bins=30 — bimodal revealed)",
  xLabel: "response time (ms)",
  yLabel: "count",
  counts: [8, 28, 55, 78, 95, 88, 62, 38, 22, 12, 6, 3, 4, 7, 12, 22, 35, 48, 62, 78, 88, 92, 80, 65, 48, 30, 18, 10, 5, 2],
  xStart: 0,
  binWidth: 17,
  color: "accent",
});

// da-022 — too many bins shows noise as structure
const F022_BEFORE = buildFigure({
  kind: "hist",
  title: "daily_signups.png  (bins=100, n=500)",
  xLabel: "signups per day",
  yLabel: "count",
  counts: [
    1, 0, 2, 1, 0, 3, 2, 1, 0, 1,
    2, 3, 5, 4, 6, 5, 7, 8, 6, 9,
    10, 12, 15, 13, 18, 22, 19, 25, 28, 31,
    34, 30, 36, 32, 38, 35, 40, 38, 33, 30,
    28, 25, 22, 19, 17, 15, 13, 11, 10, 8,
    7, 6, 5, 4, 4, 3, 3, 2, 2, 2,
    1, 1, 1, 0, 1, 0, 0, 0, 1, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
  xStart: 0,
  binWidth: 1,
  color: "warning",
});
const F022_AFTER = buildFigure({
  kind: "hist",
  title: "daily_signups.png  (bins='auto' — clean shape)",
  xLabel: "signups per day",
  yLabel: "count",
  counts: [4, 12, 38, 78, 112, 95, 64, 42, 25, 16, 8, 4, 2],
  xStart: 0,
  binWidth: 5,
  color: "accent",
});

// da-023 — right-skewed data needs log-x
const F023_BEFORE = buildFigure({
  kind: "hist",
  title: "order_value_usd.png  (linear x)",
  xLabel: "order value (USD)",
  yLabel: "count",
  counts: [850, 420, 180, 90, 45, 22, 11, 6, 3, 1, 1, 0, 0, 0, 0],
  xStart: 0,
  binWidth: 100,
  color: "warning",
});
const F023_AFTER = buildFigure({
  kind: "hist",
  title: "order_value_usd.png  (log10 x — now you can see the tail)",
  xLabel: "log10(order value USD)",
  yLabel: "count",
  counts: [20, 60, 145, 280, 380, 320, 200, 120, 70, 40, 22, 12, 6, 3, 1],
  xStart: 0,
  binWidth: 0.25,
  color: "accent",
});

// da-024 — density vs count: comparing two groups of different sizes
const F024_BEFORE = buildFigure({
  kind: "bar",
  title: "checkout_times — counts (the big group dominates)",
  xLabel: "time bucket (s)",
  yLabel: "count",
  xCategories: ["0-2", "2-4", "4-6", "6-8", "8-10"],
  values: [380, 720, 1100, 540, 180],
  color: "warning",
  yRange: [0, 1300],
});
const F024_AFTER = buildFigure({
  kind: "bar",
  title: "checkout_times — density (shapes comparable across groups)",
  xLabel: "time bucket (s)",
  yLabel: "density",
  xCategories: ["0-2", "2-4", "4-6", "6-8", "8-10"],
  values: [13, 24, 37, 18, 6],
  color: "accent",
  yRange: [0, 45],
});

// da-025 — cumulative distribution function (CDF)
const F025_BEFORE = buildFigure({
  kind: "hist",
  title: "page_load_ms — histogram (hard to read p90)",
  xLabel: "page_load (ms)",
  yLabel: "count",
  counts: [60, 150, 280, 320, 240, 160, 90, 50, 28, 12, 6, 3, 1],
  xStart: 0,
  binWidth: 100,
  color: "warning",
});
const F025_AFTER = buildFigure({
  kind: "line",
  title: "page_load_ms — CDF (read percentiles directly)",
  xLabel: "page_load (ms)",
  yLabel: "cumulative fraction",
  xCategories: ["0", "200", "400", "600", "800", "1000", "1200"],
  series: [
    { label: "CDF", values: [0.0, 0.16, 0.43, 0.72, 0.88, 0.95, 0.99], color: "accent" },
  ],
  yRange: [0, 1.05],
});

// ── Specs ─────────────────────────────────────────────────────────────────

const DA_021: Spec = {
  id: "da-021-histogram-too-few-bins",
  difficulty: "medium",
  title: "21_response_time_hist.ipynb",
  icon: "bar-chart-3",
  conceptTags: ["numpy", "matplotlib", "histogram"],
  descriptionMd:
    "## Mission: 'Is the response time normally distributed?'\n\nThe SRE team asks for a histogram of API response times. You wrote `plt.hist(times, bins=5)` and saw a single smooth hump. You reported: *\"response time is unimodal, centered around 250 ms — looks normal.\"*\n\nA day later the team comes back: their own monitoring shows a clear **two-mode** distribution — cache hits around 60 ms and cache misses around 350 ms. Where did your hump come from? Five bins, that's where. **Bin count is a lens** — too few smooths real structure away; too many shows noise as structure. The `numpy` / `matplotlib` default of `bins=10` is rarely right; `bins='auto'` lets `numpy.histogram_bin_edges` choose with the **Sturges / Freedman–Diaconis** rule.",
  initialCode:
    "import numpy as np\nimport matplotlib.pyplot as plt\n\nrng = np.random.default_rng(42)\nfast = rng.normal(60, 20, size=600)   # cache hits\nslow = rng.normal(350, 60, size=400)  # cache misses\ntimes = np.concatenate([fast, slow])\n\nfig, ax = plt.subplots(figsize=(7, 4))\nax.hist(times, bins=5, color='#E8B65A')\nax.set_title('response_time_ms.png')\nax.set_xlabel('response time (ms)')\nax.set_ylabel('count')\nplt.show()",
  buggyLineStart: 10,
  buggyLineEnd: 10,
  traceback:
    "Junior analyst's read: 'Response time is unimodal, centered ~250 ms.'\n# Five bins smoothed two modes into one fake middle hump.",
  correctOutput:
    "Senior analyst's verdict: 'Response time is BIMODAL — ~60 ms (cache hits) and ~350 ms (cache misses). Two separate stories.'",
  options: [
    {
      key: "a",
      label: "Use `bins='auto'` — lets numpy pick via Sturges / Freedman–Diaconis",
      patchCode:
        "import numpy as np\nimport matplotlib.pyplot as plt\n\nrng = np.random.default_rng(42)\nfast = rng.normal(60, 20, size=600)\nslow = rng.normal(350, 60, size=400)\ntimes = np.concatenate([fast, slow])\n\nfig, ax = plt.subplots(figsize=(7, 4))\nax.hist(times, bins='auto', color='#7CD992')\nax.set_title('response_time_ms.png (bins=auto)')\nax.set_xlabel('response time (ms)')\nax.set_ylabel('count')\nplt.show()",
      isCorrect: true,
      resultLog:
        "Two clear modes appear at ~60 ms and ~350 ms — cache hits and cache misses; the chart now matches the SRE team's monitoring.",
      rationale:
        "`bins='auto'` calls `numpy.histogram_bin_edges` and picks the larger of the Sturges (`log2(n) + 1`) and Freedman–Diaconis (`2 × IQR / n^(1/3)`) rules. For 1,000 points with a bimodal shape, that's ~30 bins — wide enough to be smooth, narrow enough to resolve both modes. This is the **portable default**: it adapts to sample size and spread, so you don't have to think about it for exploratory work.",
      attachFigure: true,
    },
    {
      key: "b",
      label: "Keep 5 bins — it's faster to read",
      patchCode:
        "import numpy as np\nimport matplotlib.pyplot as plt\n\nrng = np.random.default_rng(42)\nfast = rng.normal(60, 20, size=600)\nslow = rng.normal(350, 60, size=400)\ntimes = np.concatenate([fast, slow])\n\nfig, ax = plt.subplots(figsize=(7, 4))\nax.hist(times, bins=5, color='#E8B65A')\nplt.show()",
      isCorrect: false,
      resultLog:
        "Same five fat bars — still a fake unimodal hump; the SRE team still has to argue with your report.",
      rationale:
        "Five bins is **fewer than the rule of thumb cares about**. The two real modes are 290 ms apart; the bin width here is ~100 ms, so each bin straddles parts of both modes and averages them into a smooth lie. The cure is more bins (or a method that picks them), not fewer.",
    },
    {
      key: "c",
      label: "Use `bins=200` — more is always better",
      patchCode:
        "import numpy as np\nimport matplotlib.pyplot as plt\n\nrng = np.random.default_rng(42)\nfast = rng.normal(60, 20, size=600)\nslow = rng.normal(350, 60, size=400)\ntimes = np.concatenate([fast, slow])\n\nfig, ax = plt.subplots(figsize=(7, 4))\nax.hist(times, bins=200, color='#E8B65A')\nplt.show()",
      isCorrect: false,
      resultLog:
        "Two modes visible but each is a sea of sampling noise — bars of 2, 5, 1, 7, 3, 6 spike unpredictably; viewers see 'structure' that isn't real.",
      rationale:
        "Too many bins is the opposite trap — **noise looks like structure**. With 1,000 points and 200 bins you average ~5 points per bin; sampling fluctuations dominate. Each viewer 'sees a pattern' in noise. `bins='auto'` would have chosen ~30; that's the sweet spot for this n.",
    },
  ],
  hints: [
    "How wide is each bin? Print `np.histogram_bin_edges(times, bins=5)`. Compare to the **distance between the two real modes** (290 ms).",
    "Use `bins='auto'` and `numpy.histogram` will pick via the Freedman–Diaconis / Sturges rule — adapts to sample size automatically.",
  ],
  explanationMd:
    "### Why the bug occurs\nA histogram with too few bins **averages real structure away**. Two modes at 60 ms and 350 ms straddled by 100-ms-wide bins each contribute to the bins around the *middle*, producing a fake unimodal hump centred on the average of the two modes.\n\nMatplotlib's default `bins=10` is a convenience that was never meant to be defensible. Real exploratory analysis picks a bin count that matches the data's natural scale of variation.\n\n### Why the fix is correct\n`bins='auto'` (in both `matplotlib.pyplot.hist` and `numpy.histogram_bin_edges`) picks the **maximum of the Sturges and Freedman–Diaconis rules**:\n- **Sturges**: `ceil(log2(n) + 1)` — good for normal-ish data.\n- **Freedman–Diaconis**: `bin_width = 2 × IQR / n^(1/3)` — robust to outliers because it uses IQR instead of standard deviation.\n\nTaking the larger means you never under-bin a heavy-tailed distribution. For 1,000 points with a clear bimodal shape, you get ~30 bins — narrow enough to resolve both modes, wide enough to stay smooth.\n\n### When `bins='auto'` is not enough\n- **Very small samples (n < 50)**: `'sqrt'` rule (`ceil(sqrt(n))`) is sometimes better.\n- **Heavy tails or wide range**: combine `bins='auto'` with **log-scale x** — see `da-023`.\n- **Comparing across groups of different sizes**: switch to **density=True** so the y-axis is normalized — see `da-024`.\n\nThe broader principle: **bin count is a lens**. Always look at the histogram with 2–3 different bin counts before declaring shape — if the shape changes a lot, your sample is too small for the question.",
  recruiterReview:
    "Strong — you spotted that the SRE team's monitoring disagreed with your chart and didn't double down. The lesson is the small one: matplotlib's `bins=10` default is a starting point, not a defensible choice. `bins='auto'` is the right portable default for exploratory work. Two follow-ups: 1) always look at 2–3 bin counts before reporting a shape; if the shape changes meaningfully across reasonable bin counts, the sample is too small for a confident claim. 2) For real performance work, layer a **KDE** (`seaborn.histplot(kde=True)`) over the histogram — KDE smooths out bin-edge artefacts and makes modes obvious. Approved. ✅",
  tutorial: {
    bodyMd:
      "## Histogram Bin Count Is a Lens\n\nThe bin count of a histogram is the single most important choice you make — and the one juniors are least likely to think about. Get it right and the data tells you its shape. Get it wrong in either direction and you confidently report fiction.\n\n### The two failure modes\n#### Too few bins: smooths real structure away\nTwo modes 300 ms apart, drawn with bins 200 ms wide, look like one hump. This is exactly what happened in the mission. The eye sees a clean unimodal distribution and the analyst writes a clean unimodal sentence. The story is wrong.\n\n#### Too many bins: shows noise as structure\nOne thousand points spread across 200 bins is 5 points per bin. Sampling fluctuations dominate; viewers see 'patterns' (peaks, valleys) that vanish if you re-sample. The story is fictional in the opposite direction.\n\n### The portable default: `bins='auto'`\nIn both `numpy.histogram` and `matplotlib.pyplot.hist`, `bins='auto'` calls `numpy.histogram_bin_edges` with the `'auto'` selector, which is `max(Sturges, Freedman–Diaconis)`:\n- **Sturges**: `ceil(log2(n) + 1)`. For n=100, ~8 bins. Designed for normal-ish data.\n- **Freedman–Diaconis**: `bin_width = 2 × IQR / n^(1/3)`. Bin count = `(max − min) / bin_width`. **Robust to outliers** because it uses IQR (interquartile range) instead of standard deviation.\n\nTaking the larger of the two means heavy-tailed distributions (which Sturges under-bins) still get enough resolution.\n\n### Other named rules\n- **`'sqrt'`**: `ceil(sqrt(n))` — old-school, sometimes the right answer for very small samples.\n- **`'scott'`**: `bin_width = 3.5 × σ / n^(1/3)` — like Freedman–Diaconis but uses σ instead of IQR. Less robust to outliers.\n- **`'rice'`**: `2 × n^(1/3)` — simple and reasonable.\n- **`'doane'`**: extension of Sturges for skewed data.\n\nFor 90% of analyst work, `bins='auto'` is the right answer. Reach for the named alternatives only when `'auto'` produces something visibly wrong.\n\n### What to do when you don't trust the default\n**Look at the histogram with 2–3 bin counts.** If the shape is stable across reasonable choices, report it confidently. If small changes in bin count completely reshape the chart, your sample is too small for the question.\n\n```python\nfig, axes = plt.subplots(1, 3, figsize=(15, 4), sharey=True)\nfor ax, n in zip(axes, [10, 30, 100]):\n    ax.hist(times, bins=n)\n    ax.set_title(f'bins={n}')\nplt.show()\n```\nThis is the diagnostic version you keep on your laptop, even if the final report uses only one.\n\n### Layering a KDE\nA **kernel density estimate** smooths the histogram into a continuous curve. It hides bin-edge artefacts and makes modes obvious:\n```python\nimport seaborn as sns\nsns.histplot(times, bins='auto', kde=True)\n```\nThe KDE is itself controlled by a bandwidth parameter (the smoothing scale) — same trade-off as bin count, but the visualisation usually makes the right answer easier to see.\n\n### Bonus: when histograms are wrong altogether\n- **Few categories (<10 distinct values)**: use a **bar chart**, not a histogram.\n- **Comparing groups of different sizes**: use **density** (see da-024) or `seaborn.kdeplot`.\n- **Very heavy-tailed data**: use a **log-scale x axis** (see da-023) or switch to a **boxplot** to see percentiles directly.\n- **You need the 50th, 90th, 99th percentile**: skip the histogram and use the **CDF** (see da-025) — percentiles read off directly.\n\n### Common reasoning mistakes\n- Trusting matplotlib's `bins=10` default for production charts.\n- 'More bins is always better' — under-bins smooth structure away; over-bins create fake patterns.\n- Picking a bin count based on what the data 'looks nicer' with — pick the rule first, look at the chart second.\n- Forgetting that bimodality (or any multimodality) silently hides under wide bins.\n\n### You just learned…\nBin count is a **lens**. Too few smooths real structure away; too many shows sampling noise as fake patterns. **`bins='auto'`** uses the larger of Sturges and Freedman–Diaconis, which is the right portable default. When in doubt, look at the histogram with 2–3 bin counts; if the shape changes, your sample is too small for the question.",
    videos: [
      { title: "Histogram bin count rules", searchQuery: "numpy histogram bin count freedman diaconis tutorial" },
      { title: "Why default bin counts mislead", searchQuery: "matplotlib histogram bins auto vs default tutorial" },
    ],
  },
  estMinutes: 7,
  conceptCard:
    "This mission is about **histogram bin count as a lens**.\n\n- Too few bins **smooths real structure away** (bimodal → fake unimodal hump).\n- Too many bins shows **sampling noise as fake structure**.\n- **`bins='auto'`** uses Sturges / Freedman–Diaconis — the right portable default.\n\nThe code uses `bins=5` and hides two distinct modes (cache hits + cache misses). Switch to `bins='auto'`.",
  lineNotes: [
    { line: 4, noteMd: "Seeded `numpy.random.Generator` for reproducibility — see da-030 for the trap of forgetting this." },
    { line: 5, noteMd: "Two synthetic groups — fast cache hits centred at 60 ms; slow cache misses at 350 ms. The real data has the same shape." },
    { line: 7, noteMd: "Concatenate into one array of 1,000 response times. This is the variable the histogram works on." },
    { line: 10, noteMd: "**The bug.** `bins=5` is too few; each bin is ~100 ms wide and straddles both modes. Use `bins='auto'`." },
  ],
  takeaway: "Bin count is a lens — too few hides modes, too many shows noise; `bins='auto'` is the right portable default.",
  glossary: [
    {
      term: "histogram",
      definitionMd: "A chart that divides a numeric range into **bins** and shows the count (or density) of values falling in each. The shape of the chart depends on the bin count chosen — there is no single 'correct' histogram of a dataset.",
    },
    {
      term: "bimodal distribution",
      definitionMd: "A distribution with **two distinct peaks**. Often appears in real data when the population is actually a mix of two sub-populations with different typical values (e.g. cache hits and cache misses).",
    },
    {
      term: "Sturges rule",
      definitionMd: "Bin-count rule: `ceil(log2(n) + 1)`. Designed for normal-ish data; can under-bin heavy-tailed or large samples. The simpler of numpy's two default rules.",
    },
    {
      term: "Freedman–Diaconis rule",
      definitionMd: "Bin-width rule: `2 × IQR / n^(1/3)`. **Robust to outliers** because it uses the interquartile range. Generally produces more bins than Sturges for the same data; numpy's `'auto'` takes the larger of the two.",
    },
    {
      term: "kernel density estimate (KDE)",
      definitionMd: "Continuous smooth curve estimating the shape of the underlying distribution, drawn over (or instead of) a histogram. Independent of bin choice; smooths out bin-edge artefacts. `seaborn.histplot(kde=True)` overlays one for free.",
    },
  ],
  figureSvg: F021_BEFORE,
  figureCaption: "Before — bins=5 smooths two real modes (60ms + 350ms) into one fake hump.",
  resultFigureSvg: F021_AFTER,
};

// ── da-022 — too many bins shows noise as structure ───────────────────────
const DA_022: Spec = {
  id: "da-022-histogram-too-many-bins",
  difficulty: "medium",
  title: "22_daily_signups_hist.ipynb",
  icon: "bar-chart-3",
  conceptTags: ["numpy", "matplotlib", "histogram"],
  descriptionMd:
    "## Mission: 'I See Three Spikes — Are They Real?'\n\nYou drew a histogram of daily signups with `bins=100` (you read somewhere that more bins = more precise). The chart shows three small spikes around 12, 28, and 40 signups per day, and the PM is now asking *\"why do we get those spikes? Are they weekday vs weekend?\"*\n\nFour hours into investigating, you realise the spikes are **sampling noise** — only ~500 data points spread across 100 bins means each bin has ~5 points; random fluctuations make some bins look like real peaks. Switch to `bins='auto'` and the spikes vanish; the underlying distribution is one smooth hump centred near 20.\n\nThis is the opposite of da-021 — *too few* bins smooths structure away; *too many* manufactures fake structure.",
  initialCode:
    "import numpy as np\nimport matplotlib.pyplot as plt\n\nrng = np.random.default_rng(7)\nsignups = rng.normal(20, 6, size=500).clip(min=0)\n\nfig, ax = plt.subplots(figsize=(7, 4))\nax.hist(signups, bins=100, color='#E8B65A')\nax.set_title('daily_signups.png')\nax.set_xlabel('signups per day')\nax.set_ylabel('count')\nplt.show()",
  buggyLineStart: 8,
  buggyLineEnd: 8,
  traceback:
    "Junior analyst's read: 'I see three real spikes around 12, 28, 40 — must be different user cohorts.'\n# 100 bins × 500 points = ~5 points/bin — pure sampling noise looks like structure.",
  correctOutput:
    "Senior analyst's verdict: 'One smooth hump centred at ~20. The 'spikes' were noise — 5 data points per bin, random fluctuations.'",
  options: [
    {
      key: "a",
      label: "Use `bins='auto'` — picks ~13 bins for n=500, smooth shape emerges",
      patchCode:
        "import numpy as np\nimport matplotlib.pyplot as plt\n\nrng = np.random.default_rng(7)\nsignups = rng.normal(20, 6, size=500).clip(min=0)\n\nfig, ax = plt.subplots(figsize=(7, 4))\nax.hist(signups, bins='auto', color='#7CD992')\nax.set_title('daily_signups.png (bins=auto)')\nax.set_xlabel('signups per day')\nax.set_ylabel('count')\nplt.show()",
      isCorrect: true,
      resultLog:
        "Single smooth hump centred ~20; the 'three spikes' are gone — they were sampling noise.",
      rationale:
        "For 500 points with std≈6, Freedman–Diaconis picks ~5-signup-wide bins → ~12-13 bins. That's enough to resolve real shape changes (a single hump centred at 20) but wide enough that each bin has ~40 points — sampling fluctuations average out. **As a rule of thumb, you want at least 20-30 points per bin** for the histogram to read 'smooth.'",
      attachFigure: true,
    },
    {
      key: "b",
      label: "Use `bins=200` — even more precision",
      patchCode:
        "ax.hist(signups, bins=200, color='#E8B65A')\nplt.show()",
      isCorrect: false,
      resultLog:
        "Now ~2.5 points per bin; bars are 0, 3, 1, 4, 0, 2, 1, 5 — pure noise, no shape readable at all.",
      rationale:
        "More bins → fewer points per bin → noise dominates. The histogram still shows the data, but at this resolution every viewer reads a different story into the noise. There's no 'right' bin count that's also very high; the optimum is a *trade-off* between resolution and signal-per-bin.",
    },
    {
      key: "c",
      label: "Layer a KDE on top to smooth the noise visually",
      patchCode:
        "import seaborn as sns\nsns.histplot(signups, bins=100, kde=True)\nplt.show()",
      isCorrect: false,
      resultLog:
        "KDE shows a smooth hump centred at 20, but the **histogram bars beneath still scream 'three spikes!'** to anyone who looks past the curve.",
      rationale:
        "Adding a KDE helps you read the underlying shape, but the histogram bars under it still mislead. The right move is to **fix the histogram itself** — drop the bin count to where each bar carries meaningful signal — and *then* layer KDE if you want extra smoothness. KDE is a complement to a sensible histogram, not a fix for an over-binned one.",
    },
  ],
  hints: [
    "Print `len(signups) / 100` — how many points per bin? Below ~20 and sampling noise will dominate the bar heights.",
    "Switch to `bins='auto'` and the apparent 'spikes' will average out into the underlying smooth shape.",
  ],
  explanationMd:
    "### Why the bug occurs\nA histogram of 500 points across 100 bins puts ~5 points per bin. Each bin's count is a Poisson-distributed integer with mean 5 and standard deviation `sqrt(5) ≈ 2.2`. So adjacent bins differ by ±2-3 points just from random chance — and those differences look like 'peaks' and 'troughs' to the eye.\n\nThis is the opposite bug from da-021: there, too *few* bins smoothed real modes away. Here, too *many* bins manufactures fake modes from sampling noise. Both are the same root cause: **bin count must match sample size and underlying shape**.\n\n### Why the fix is correct\n`bins='auto'` for `n=500` typically picks 10-15 bins via Freedman–Diaconis. That's ~30-50 points per bin, where `sqrt(30) / 30 ≈ 18%` — so bar-to-bar fluctuation is small relative to the bar height, and the eye reads real shape, not noise.\n\n### Rule of thumb\n- **Each bin should hold at least 20-30 points** for the histogram to read as 'smooth.' Below that, sampling noise dominates the bar heights.\n- For samples below ~100, histograms are barely useful at all — use a **boxplot** or **dotplot** instead.\n- For samples above ~10,000, `'auto'` may pick more bins than you want for display; cap at ~50 manually.",
  recruiterReview:
    "Strong — you noticed the 'spikes' were too small to be real cohorts and reached for the correct diagnostic (fewer bins). The PM-asking-about-spikes was the symptom; the cure was upstream. Two follow-ups: 1) when you see suspicious 'spikes,' compute `len(data) / n_bins` first — if it's below 20, the spikes are almost certainly noise. 2) For small samples (<100 points), don't show a histogram at all — show a **boxplot** with the individual points overlaid (`seaborn.stripplot` or `plt.scatter`). Approved. ✅",
  tutorial: {
    bodyMd:
      "## The Over-Binning Trap\n\nThis is da-021's evil twin. Both bugs come from picking a bin count that doesn't match the sample size, but they fail in opposite directions and require opposite fixes. Knowing both keeps you honest.\n\n### The shape of the bug\n100 bins × 500 points = ~5 points per bin. The expected count in each bin is 5; the standard deviation of that count is `sqrt(5) ≈ 2.2`. So adjacent bins differ by ±2-3 points just from random sampling. Each viewer 'sees' different peaks — none of them real.\n\nThe canonical real-world version: an analyst over-bins customer-spend data; the PM asks 'why the spikes at $42 and $87?'; the team spends days investigating until someone realises the spikes are noise.\n\n### The rule of thumb\n**Aim for at least 20-30 data points per bin.** Below that, sampling fluctuations dominate and you're showing noise. Quick formula:\n```python\nrecommended_max_bins = len(data) / 25\n```\nNever let your bin count exceed that on a chart for stakeholders.\n\n### What goes wrong with the alternatives\n#### KDE on top\nA kernel density estimate smooths the noisy histogram into a clean curve. Useful — but the histogram bars beneath are still misleading. **Fix the histogram first, then layer KDE for extra polish.**\n\n#### `bins='sturges'` (matplotlib's old default)\nSturges (`ceil(log2(n) + 1)`) is designed for n < ~200. For n = 500 it picks ~10 bins, which is fine. For n = 10,000 it picks ~14 bins, which under-resolves. `'auto'` adapts; Sturges does not.\n\n#### `bins='sqrt'`\n`ceil(sqrt(n))`. For n = 500 it picks ~22 bins. Slightly over-bins for this sample but generally a reasonable hand-pickable rule for small samples.\n\n### When histograms are wrong altogether\nFor small samples (< 100), a histogram is rarely informative regardless of bin count. Better choices:\n- **Boxplot** — five-number summary, immune to bin choice.\n- **Dotplot / stripplot** — every point visible, no aggregation at all.\n- **ECDF** (empirical CDF) — see da-025 — also bin-free and read-percentile-friendly.\n\n### Diagnostic ladder\nWhen a histogram is producing 'unexpected structure':\n1. **Compute `n / n_bins`.** If < 20, your spikes are probably noise.\n2. **Re-draw with `bins='auto'`.** Does the structure survive? If not, it was noise.\n3. **Re-draw with seaborn KDE.** A KDE doesn't show bin-edge artefacts; if it's smooth where the histogram had spikes, the spikes were noise.\n4. **Resample (bootstrap).** Take a fresh random sample of half the data and redraw. Stable shape = real. Different shape = noise.\n\n### Common reasoning mistakes\n- 'More bins is more precise' (no — fewer points per bin → more noise).\n- Believing visible spikes are always real cohorts.\n- Skipping the n-per-bin sanity check.\n- KDE-over-bad-histogram instead of fix-the-histogram.\n\n### You just learned…\n**Too many bins shows noise as structure.** Aim for ≥20-30 points per bin. `bins='auto'` adapts; manual high bin counts almost always over-bin. For samples below 100, switch to boxplot or dotplot — histograms aren't honest at that scale.",
    videos: [
      { title: "Over-binning and sampling noise", searchQuery: "histogram too many bins sampling noise tutorial" },
      { title: "Choosing bin counts in numpy", searchQuery: "numpy histogram bin count rule freedman diaconis tutorial" },
    ],
  },
  estMinutes: 7,
  conceptCard:
    "This mission is about **over-binning a histogram**.\n\n- Too many bins → too few points per bin → **sampling noise looks like real structure**.\n- Aim for **≥20-30 points per bin** as a rule of thumb.\n- `bins='auto'` adapts to sample size; manual large bin counts almost always over-bin.\n\nThe code uses `bins=100` on 500 points; 'spikes' are noise. Switch to `bins='auto'`.",
  lineNotes: [
    { line: 4, noteMd: "Seeded generator for reproducibility (see da-030)." },
    { line: 5, noteMd: "500 signup counts, normally distributed around 20. `.clip(min=0)` because negative signups make no sense." },
    { line: 8, noteMd: "**The bug.** 100 bins ÷ 500 points = 5 points/bin → noise dominates. Use `bins='auto'`." },
  ],
  takeaway: "Aim for ≥20-30 points per bin; below that, sampling noise looks like real structure.",
  glossary: [
    {
      term: "sampling noise",
      definitionMd: "Random variation in observed counts arising from the finite sample size. For Poisson-distributed bin counts with mean μ, the standard deviation is `sqrt(μ)` — so low-count bins fluctuate by a lot in relative terms.",
    },
    {
      term: "Poisson distribution",
      definitionMd: "Distribution describing the number of independent events in a fixed interval. For a histogram bin, the count is approximately Poisson with mean = expected count, standard deviation = `sqrt(mean)`. Low-mean bins are noisy in relative terms.",
    },
    {
      term: "boxplot",
      definitionMd: "Five-number summary (min, Q1, median, Q3, max) shown as a box-with-whiskers. Bin-free, immune to bin-choice bugs; preferred over histograms for small samples (<100) or when comparing many groups side-by-side.",
    },
    {
      term: "dotplot / stripplot",
      definitionMd: "Plot showing every individual data point with no aggregation. Useful when n is small enough (<200) that every point fits and the analyst wants to see raw data without bin-choice trade-offs.",
    },
    {
      term: "ECDF (empirical CDF)",
      definitionMd: "Cumulative-fraction-vs-value plot of the actual data. Bin-free — every point contributes exactly one step. Percentiles read off directly on the y-axis. See da-025.",
    },
  ],
  figureSvg: F022_BEFORE,
  figureCaption: "Before — bins=100 on n=500 makes sampling noise look like three real cohort spikes.",
  resultFigureSvg: F022_AFTER,
};

// ── da-023 — right-skewed data needs log x ────────────────────────────────
const DA_023: Spec = {
  id: "da-023-histogram-log-x",
  difficulty: "medium",
  title: "23_order_value_skewed.ipynb",
  icon: "scale",
  conceptTags: ["numpy", "matplotlib", "histogram", "log-scale"],
  descriptionMd:
    "## Mission: 'Most Orders Are Tiny — Where's the Long Tail?'\n\nE-commerce order values are heavily right-skewed: most orders cluster between \\$10–\\$50; a few orders run into the thousands. Your histogram with linear-x axis shows one enormous spike near 0 and a long flat tail you can't read. Stakeholders ask *\"is there structure in the tail?\"* — and you can't tell.\n\nThe fix is one line: **use a log10 x-axis**. The dollar values span four orders of magnitude (\\$1 → \\$10,000); compressing them logarithmically reveals shape that linear axes hide. This is one of the most reliable visualization upgrades you can apply when data spans wide ranges.",
  initialCode:
    "import numpy as np\nimport matplotlib.pyplot as plt\n\nrng = np.random.default_rng(2)\n# Right-skewed order values: most $10-50, long tail to $10k.\nvalues = rng.lognormal(mean=3.5, sigma=1.0, size=2000)\n\nfig, ax = plt.subplots(figsize=(7, 4))\nax.hist(values, bins='auto', color='#E8B65A')\nax.set_title('order_value_usd.png')\nax.set_xlabel('order value (USD)')\nax.set_ylabel('count')\nplt.show()",
  buggyLineStart: 9,
  buggyLineEnd: 9,
  traceback:
    "Junior analyst's read: 'Most orders are < $100. The tail is flat — no structure.'\n# Linear x-axis compresses 99% of the data into the first 5% of the chart; tail is invisible.",
  correctOutput:
    "Senior analyst's verdict: 'Distribution is log-normal — center near $30; the tail has its own bell shape from $200-$2,000. Linear scale hid it; log scale revealed it.'",
  options: [
    {
      key: "a",
      label: "Compute log10 of the values and histogram those: `ax.hist(np.log10(values), bins='auto')`",
      patchCode:
        "import numpy as np\nimport matplotlib.pyplot as plt\n\nrng = np.random.default_rng(2)\nvalues = rng.lognormal(mean=3.5, sigma=1.0, size=2000)\n\nfig, ax = plt.subplots(figsize=(7, 4))\nax.hist(np.log10(values), bins='auto', color='#7CD992')\nax.set_title('order_value_usd.png (log10 x)')\nax.set_xlabel('log10(order value USD)')\nax.set_ylabel('count')\nplt.show()",
      isCorrect: true,
      resultLog:
        "Beautiful bell curve centred at log10(value) ≈ 1.5 (i.e. ~$30). The shape was always log-normal; linear x was hiding it.",
      rationale:
        "Histogramming `log10(values)` is the right move when the data spans **orders of magnitude**. Log-normal distributions (extremely common for revenue, file size, latency tails, follower counts) are 'normal' on a log axis. The shape becomes a clean bell curve; bin widths are equal in log-space (each bin spans a factor of ~`10^(1/n_bins)`). The x-axis labels read as log10 values; for the deck, you can either annotate ('30' under '1.5', '300' under '2.5') or use `ax.set_xscale('log')` if you keep the raw values.",
      attachFigure: true,
    },
    {
      key: "b",
      label: "Clip the data at the 95th percentile to hide the tail",
      patchCode:
        "import numpy as np\nimport matplotlib.pyplot as plt\n\nrng = np.random.default_rng(2)\nvalues = rng.lognormal(mean=3.5, sigma=1.0, size=2000)\ncap = np.percentile(values, 95)\nax.hist(values[values <= cap], bins='auto', color='#E8B65A')\nplt.show()",
      isCorrect: false,
      resultLog:
        "Center now reads well, but we've **dropped 100 orders** (5% of the data, by definition). The tail you were asked about is *gone*.",
      rationale:
        "**Throwing away the long tail to make the chart prettier is censoring the data.** The stakeholder asked specifically about the tail; clipping it answers a different question. Log-scale reveals the same data in a way the eye can read; clipping removes the data and changes what the chart 'shows.'",
    },
    {
      key: "c",
      label: "Use `bins=200` — more resolution will show the tail",
      patchCode:
        "ax.hist(values, bins=200, color='#E8B65A')\nplt.show()",
      isCorrect: false,
      resultLog:
        "Still one spike in the first 5% of the chart and 95% empty whitespace; resolution doesn't fix range compression.",
      rationale:
        "More bins fragment the *same compressed range*. The problem isn't bin count — it's that 99% of the data lives in the first 5% of the x-axis. Increasing bins doesn't help; you need a different **x-axis transform** (log) to spread the data across the chart.",
    },
  ],
  hints: [
    "Print `values.min()`, `values.max()`. Range spans 4 orders of magnitude — linear axes can't show shape across that range.",
    "Histogram `np.log10(values)` instead, or set `ax.set_xscale('log')` after the `hist` call.",
  ],
  explanationMd: "### Why the bug occurs\nA linear x-axis allocates pixel space proportionally to value. When 99% of your data is in $0–$100 and the other 1% spans $100–$10,000, the first 99% gets the first 1% of the chart's width and the rest is empty space with a few flat dots. You can't read shape from a chart that's mostly empty.\n\n### Why the fix is correct\nLog-scaling the x-axis allocates pixel space proportionally to **log of value**. A 10× change in value takes the same horizontal distance everywhere on the chart — so $1-$10 takes the same width as $1,000-$10,000. Now the shape of the underlying distribution is visible at every scale.\n\nLog-normal distributions are normal on a log scale. They're extremely common in nature and business: revenue, file sizes, follower counts, latency tails, city populations. Always **check the log-x version** when you don't see clean structure on linear axes.\n\n### Two ways to log-scale\n- **Transform the data**: histogram `np.log10(values)`. X-axis labels are log values; you may annotate with raw values for the deck.\n- **Transform the axis**: keep raw values, call `ax.set_xscale('log')`. X-axis labels show raw values (1, 10, 100, …). Each is right; team preference decides.",
  recruiterReview:
    "Strong — you didn't censor the tail to make the chart prettier. Log-x is the right call for any distribution spanning orders of magnitude, and recognising log-normal shape is a foundational analyst skill. Two follow-ups: 1) when reporting, always annotate the chart with the raw-value tick labels (`'30'` under `log10 = 1.5`) so non-technical readers don't have to mentally exponentiate. 2) For very heavy tails (Pareto/power-law), a log-log plot might be needed — but that's a different lesson. Approved. ✅",
  tutorial: {
    bodyMd:
      "## Log Scales — The Most Reliable Visualisation Upgrade\n\nWhenever you see a histogram where 99% of the data is in the first 5% of the chart, **try log-x**. This single move makes shape readable for revenue, file sizes, latency tails, follower counts, and the dozens of other quantities that follow log-normal or power-law distributions.\n\n### Why log scales work for skewed data\nLinear axes allocate space proportionally to value. If your range is $1-$10,000 and 99% of your data is in $1-$50, the first 99% of your data gets 0.5% of the chart's width.\n\nLog axes allocate space proportionally to log of value. Now `$1 → $10` and `$1000 → $10,000` take the same horizontal distance. Shape is readable everywhere.\n\n### The log-normal distribution\nA random variable X is **log-normal** if `log(X)` is normally distributed. This is extremely common because:\n- **Multiplicative effects**: many real-world quantities are produced by multiplying many small factors (revenue = traffic × conversion × order-size; multiplications of normals are log-normal in aggregate).\n- **Central Limit Theorem in log-space**: the same way means of many independent additive effects tend to normal, products tend to log-normal.\n\nExamples: order values, customer LTVs, file sizes, latency tail (p95, p99), follower counts, video view counts, city populations, income distributions, response times.\n\n### Recognising log-normal in a chart\n- Linear histogram: spike at left edge, long flat tail.\n- Log-x histogram: clean bell curve.\n- The geometric mean (`np.exp(np.mean(np.log(x)))`) is much more useful than the arithmetic mean for log-normal data.\n\n### Two ways to log-scale\n```python\n# Method 1: transform the data\nax.hist(np.log10(values), bins='auto')\nax.set_xlabel('log10(order value USD)')\n```\nPro: x-axis labels are log values; bin widths are equal in log-space.\nCon: readers have to mentally exponentiate.\n\n```python\n# Method 2: transform the axis\nax.hist(values, bins=np.logspace(0, 4, 40))   # log-spaced bin edges\nax.set_xscale('log')\n```\nPro: x-axis labels are raw values.\nCon: bin widths grow with value (each bin spans a factor of 10^(4/40) = ~1.26).\n\nFor stakeholder-facing charts, method 2 with `set_xscale('log')` is usually friendlier — the axis labels show real dollars. For internal analysis, method 1 is sometimes cleaner.\n\n### When NOT to use log\n- **Data includes zero or negative values**: log(0) is undefined. Use `symlog` or shift the data (`np.log10(values + 1)`).\n- **Data spans less than one order of magnitude**: linear is fine; log doesn't add much.\n- **Audience can't read log axes**: provide both views, or annotate heavily.\n\n### `symlog` for data crossing zero\n```python\nax.set_xscale('symlog', linthresh=10)\n```\nLinear near zero (within ±10), log farther out. Useful for residuals, log-returns, signed deltas.\n\n### Comparing distributions on log axes\nIf you're comparing two distributions (e.g. two cohorts), put them on the same log axis and overlay:\n```python\nax.hist(group_a, bins='auto', alpha=0.5, label='A', density=True)\nax.hist(group_b, bins='auto', alpha=0.5, label='B', density=True)\nax.set_xscale('log')\nax.legend()\n```\nDensity (see da-024) lets you compare groups of different sizes.\n\n### Common reasoning mistakes\n- Reporting an *arithmetic mean* of log-normal data — pulled hugely by the tail, doesn't represent typical value. Use median or geometric mean.\n- Clipping the tail to 'clean up' the chart (censors data; changes the question).\n- More bins as a fix for range compression (more bins, same compression).\n- Forgetting that `log(0)` is undefined; check for zero values before log-scaling.\n\n### You just learned…\nFor data spanning orders of magnitude, **log-x is the right axis**. Log-normal distributions are normal on log scales; spotting log-normality is a foundational analyst skill. Don't clip tails to make charts pretty — transform the axis instead.",
    videos: [
      { title: "Log scales in matplotlib", searchQuery: "matplotlib log scale histogram tutorial beginner" },
      { title: "Log-normal distributions in data", searchQuery: "lognormal distribution business data tutorial" },
    ],
  },
  estMinutes: 7,
  conceptCard:
    "This mission is about **log-x histograms for skewed data**.\n\n- Linear x-axis on data spanning **orders of magnitude** compresses 99% of points into the first 5% of the chart.\n- Log-x spreads the data across the chart; log-normal distributions become clean bell curves.\n- Either `np.log10(values)` (transform data) or `ax.set_xscale('log')` (transform axis) works.\n\nThe code histograms raw dollar values spanning $1-$10,000. Switch to log-x.",
  lineNotes: [
    { line: 5, noteMd: "Log-normal — multiplicative-effect distribution, ubiquitous in business data (revenue, file sizes, latencies)." },
    { line: 6, noteMd: "2,000 synthetic order values ranging $1 to ~$10,000." },
    { line: 9, noteMd: "**The bug.** Linear x-axis compresses the wide range; tail invisible. Histogram `np.log10(values)` instead." },
  ],
  takeaway: "For data spanning orders of magnitude, use log-x — log-normal distributions become bell curves.",
  glossary: [
    {
      term: "log-normal distribution",
      definitionMd: "A distribution where `log(X)` is normally distributed. Arises naturally from multiplicative effects. Extremely common in business data: revenue, latencies, file sizes, follower counts. Looks like a long-tail spike on linear axes; a clean bell on log-x.",
    },
    {
      term: "log scale (axis)",
      definitionMd: "Axis where equal distances represent equal *ratios*, not equal differences. `1→10`, `10→100`, `100→1000` all the same width. The right choice for data spanning orders of magnitude.",
    },
    {
      term: "right-skewed",
      definitionMd: "Distribution with a long tail to the right (large values). Most data near the low end; rare extreme values stretch the upper range. Log-normal and Pareto are common right-skewed families.",
    },
    {
      term: "geometric mean",
      definitionMd: "`exp(mean(log(x)))`. The right 'typical value' for log-normal data — the arithmetic mean is pulled hugely by the tail and doesn't represent any actual order.",
    },
    {
      term: "`symlog`",
      definitionMd: "Symmetric log scale that's linear near zero and logarithmic farther out. Used for data that crosses zero (residuals, log-returns, signed deltas) where pure log breaks at zero.",
    },
  ],
  figureSvg: F023_BEFORE,
  figureCaption: "Before — linear x on a $1-$10k range; 99% of data crammed into the first 5% of the chart.",
  resultFigureSvg: F023_AFTER,
};

// ── da-024 — density vs count for comparing groups ────────────────────────
const DA_024: Spec = {
  id: "da-024-density-vs-count",
  difficulty: "medium",
  title: "24_compare_checkout_times.ipynb",
  icon: "scale",
  conceptTags: ["numpy", "matplotlib", "histogram", "density"],
  descriptionMd:
    "## Mission: Compare Two User Groups' Checkout Times\n\nYou want to compare checkout-time distributions between two groups: **mobile** users (n = 3,000) and **desktop** users (n = 250). Overlay two histograms with `alpha=0.5` and the mobile distribution is so tall it completely buries the desktop distribution — you can't even see desktop's shape.\n\nThe distributions probably have similar shape — desktop just has fewer points. You don't want to know 'how many,' you want to know 'what shape.' The fix is **`density=True`** — each histogram is normalised so the area under it equals 1, making the **shapes** comparable regardless of sample size.",
  initialCode:
    "import numpy as np\nimport matplotlib.pyplot as plt\n\nrng = np.random.default_rng(0)\nmobile  = rng.normal(4.5, 1.2, size=3000).clip(min=0)\ndesktop = rng.normal(4.2, 1.0, size=250).clip(min=0)\n\nfig, ax = plt.subplots(figsize=(7, 4))\nax.hist(mobile,  bins='auto', alpha=0.5, label='mobile',  color='#7CD992')\nax.hist(desktop, bins='auto', alpha=0.5, label='desktop', color='#E8B65A')\nax.set_title('checkout_time_seconds.png')\nax.set_xlabel('checkout time (s)')\nax.set_ylabel('count')\nax.legend()\nplt.show()",
  buggyLineStart: 9,
  buggyLineEnd: 10,
  traceback:
    "Mobile distribution towers over desktop's; you cannot read desktop's shape at all.\n# Counts on the y-axis make groups of different sizes incomparable.",
  correctOutput:
    "Both distributions on the same density scale — shapes overlay cleanly; mobile centred slightly higher and slightly wider than desktop.",
  options: [
    {
      key: "a",
      label: "Add `density=True` to both `hist` calls",
      patchCode:
        "import numpy as np\nimport matplotlib.pyplot as plt\n\nrng = np.random.default_rng(0)\nmobile  = rng.normal(4.5, 1.2, size=3000).clip(min=0)\ndesktop = rng.normal(4.2, 1.0, size=250).clip(min=0)\n\nfig, ax = plt.subplots(figsize=(7, 4))\nax.hist(mobile,  bins='auto', density=True, alpha=0.5, label='mobile',  color='#7CD992')\nax.hist(desktop, bins='auto', density=True, alpha=0.5, label='desktop', color='#E8B65A')\nax.set_title('checkout_time_seconds.png (density)')\nax.set_xlabel('checkout time (s)')\nax.set_ylabel('density')\nax.legend()\nplt.show()",
      isCorrect: true,
      resultLog:
        "Both histograms normalised; shapes overlay. Mobile and desktop both centred ~4s; mobile slightly wider. Shapes are now directly comparable.",
      rationale:
        "`density=True` makes the histogram show the **probability density** — each bar's height is `(count in bin) / (total count × bin width)`. The **area under each histogram sums to 1**, so the y-axis is comparable across groups of *any* size. This is the right way to overlay distributions; counts can only be compared between groups of the same size.",
      attachFigure: true,
    },
    {
      key: "b",
      label: "Sub-sample mobile down to 250 points to match desktop's size",
      patchCode:
        "import numpy as np\nimport matplotlib.pyplot as plt\n\nrng = np.random.default_rng(0)\nmobile  = rng.normal(4.5, 1.2, size=3000).clip(min=0)\ndesktop = rng.normal(4.2, 1.0, size=250).clip(min=0)\nmobile = rng.choice(mobile, size=250, replace=False)\n\nfig, ax = plt.subplots(figsize=(7, 4))\nax.hist(mobile, bins='auto', alpha=0.5, label='mobile', color='#E8B65A')\nax.hist(desktop, bins='auto', alpha=0.5, label='desktop', color='#7CD992')\nax.legend()\nplt.show()",
      isCorrect: false,
      resultLog:
        "Both groups n=250 now — but **you threw away 2,750 mobile observations**; the mobile histogram is now noisier and your statistical power is shot.",
      rationale:
        "Throwing away data to match group sizes is **almost always wrong**. The whole point of the larger sample is that you have more confidence in mobile's shape. Down-sampling makes mobile noisier without helping desktop, and it changes the question ('what does the mobile distribution look like?' is no longer answered by a representative sample). Use `density=True` instead.",
    },
    {
      key: "c",
      label: "Use a log y-axis to compress the mobile histogram down",
      patchCode:
        "ax.hist(mobile,  bins='auto', alpha=0.5, label='mobile')\nax.hist(desktop, bins='auto', alpha=0.5, label='desktop')\nax.set_yscale('log')\nax.legend()\nplt.show()",
      isCorrect: false,
      resultLog:
        "Now you can see both — but log-y means 1 count and 10 counts look similar widths; you cannot compare shapes intuitively.",
      rationale:
        "Log-y is a tool for very-different-magnitude data, not for shape comparison. Once you log the y-axis the visual gap between a mode and the tail compresses; the eye reads ratios as additive distances. You'd lose the very thing you were trying to see — the shape contrast. `density=True` is the right tool: same y-scale (densities sum to 1), same shape comparison.",
    },
  ],
  hints: [
    "What's on the y-axis right now? Counts. How can you compare across groups of different sizes if the y-axis is counts?",
    "Add `density=True` to both `hist` calls — each histogram becomes a probability density (area = 1), comparable across group sizes.",
  ],
  explanationMd:
    "### Why the bug occurs\nA histogram's default y-axis is **count** — the number of data points in each bin. For a group with 3,000 points, a typical bin holds ~150 points. For a group with 250 points, the same bin holds ~12. The 3,000-group's bars are ~12× taller, regardless of shape similarity.\n\nYou wanted to compare *shape* (where does the distribution centre, how wide is the spread, are the modes the same), and the chart instead tells you about *size* (one group is bigger).\n\n### Why the fix is correct\n`density=True` normalises the histogram so that the **integral (sum of bar areas) equals 1**. Each bar height is `(count in bin) / (total count × bin width)`. The y-axis becomes a **probability density** — values are unitless and comparable across groups.\n\nNow the two groups are on the same scale; the eye reads shape directly. This is the only honest way to overlay distributions of different sizes.\n\n### Density vs frequency\n- **`density=False`** (default): y-axis is count. Direct, but uncomparable across group sizes.\n- **`density=True`**: y-axis is density (area under curve = 1). Right choice for shape comparison.\n\n### A close cousin: `weights`\nFor more general normalisation:\n```python\nweights = np.ones_like(mobile) / len(mobile)\nax.hist(mobile, weights=weights, bins='auto')\n```\nBar heights now show **fraction of total** rather than count. Useful when you want percentages directly (a 0.15 bar means 15% of points fell there).\n\n### When you want both\nDraw two side-by-side panels — one density (for shape), one count (for size). The density panel shows distribution shape; the count panel shows that mobile has 12× more samples. The reader can answer both questions.",
  recruiterReview:
    "Strong — you recognised that **shape comparison and size comparison are two different questions**, and reached for density to answer the first one honestly. Down-sampling the larger group is the lazy fix that throws away information; density preserves both groups in full. Two follow-ups: 1) when groups have wildly different sizes, also draw a **KDE** overlay (`sns.kdeplot` or `histplot(kde=True)`) — the KDE is bin-free and even smoother for shape comparison. 2) Always include the sample sizes in the legend: `'mobile (n=3000)'` so the reader knows what they're looking at. Approved. ✅",
  tutorial: {
    bodyMd:
      "## Density vs Count — Comparing Distributions Honestly\n\nWhenever you overlay two histograms, ask yourself: **am I comparing shape or size?** Counts answer 'how many'; density answers 'what shape.' These are different questions and need different y-axes.\n\n### The trap\nGroup A has 3,000 points; group B has 250. Their histograms with default `density=False`:\n- A's bars are ~12× taller in every bin.\n- B's distribution is functionally invisible.\n- The reader concludes 'A is taller everywhere' — which is true but useless.\n\nThe shape question — does A centre higher? Is A wider? Same modes? — is unanswerable.\n\n### `density=True` — the fix\n```python\nax.hist(group_a, density=True, alpha=0.5, label='A')\nax.hist(group_b, density=True, alpha=0.5, label='B')\n```\nEach histogram is normalised so its bars sum to 1 (area-wise). The y-axis is now **probability density**: how much probability mass per unit of x.\n\n- Heights are in units of `1 / x-units`.\n- A density of 0.4 at x=4 means 'around x=4, 40% of the distribution's mass per unit of x.'\n- Comparable across groups of any size.\n\n### What density mathematically is\nA histogram's density estimate is:\n```\ndensity[i] = count[i] / (n_total × bin_width[i])\n```\nThe area of bar i is `count[i] / n_total` — the fraction of points in that bin. Sum across bars: 1.\n\n### Density vs `weights=1/n`\nThe `weights` parameter is a more general tool:\n```python\nweights = np.ones_like(data) / len(data)\nax.hist(data, weights=weights)\n```\nNow bars show **fraction of total** (a 0.15 bar means 15% of points). The difference from density: weights doesn't divide by bin width, so the units stay unitless. Density's y-axis depends on bin width; weights's doesn't.\n\n**Use density when**: shapes have similar x-range and you want a true density curve.\n**Use weights=1/n when**: you want bars to be percentages and don't care about bin-width invariance.\n\n### The KDE alternative\nFor very different-sized groups, an overlaid **kernel density estimate** is even cleaner:\n```python\nimport seaborn as sns\nsns.histplot(group_a, stat='density', kde=True, label='A', alpha=0.4)\nsns.histplot(group_b, stat='density', kde=True, label='B', alpha=0.4)\n```\nThe KDE smooths bins entirely; you see smooth curves overlaid. Use when you want to focus on shape and don't care about precise bin counts.\n\n### Tell the reader the n\nWhenever you density-normalise, include the sample sizes in the legend so readers know what they're looking at:\n```python\nax.hist(group_a, density=True, label=f'A (n={len(group_a)})')\n```\nA reader who sees only the density chart might assume groups have similar size; the legend keeps them honest.\n\n### When NOT to use density\n- **Same group size**: counts are fine; density is unnecessary jargon.\n- **You actually care about counts**: 'how many users were in each bucket?' density removes that information.\n- **Audience is unfamiliar with density**: explain it, or use percentages (weights=1/n).\n\n### Side-by-side panels for both\nWhen sizes matter AND shapes matter, two panels:\n```python\nfig, (ax_density, ax_count) = plt.subplots(1, 2, figsize=(12, 4))\nax_density.hist([group_a, group_b], density=True, label=['A', 'B'])\nax_count.hist([group_a, group_b], density=False, label=['A', 'B'])\nfig.legend()\n```\nLeft panel: shape comparison. Right panel: size comparison. Reader gets both questions answered.\n\n### Common reasoning mistakes\n- Overlaying default-count histograms of different-sized groups and 'concluding' a shape difference.\n- Down-sampling the bigger group to match the smaller (throws away data and statistical power).\n- Density without sample sizes in the legend (reader doesn't know which curve is more trustworthy).\n- Reaching for log-y to 'compress' the bigger group (changes the interpretation of bar heights).\n\n### You just learned…\n**Density normalises bar heights so the area under each histogram sums to 1**, making **shapes comparable across groups of any size**. `density=True` is the right move whenever you overlay two distributions of different sizes. Counts answer 'how many'; density answers 'what shape' — they're different questions.",
    videos: [
      { title: "Histogram density vs count", searchQuery: "matplotlib histogram density true tutorial" },
      { title: "Comparing two distributions in matplotlib", searchQuery: "compare two histograms matplotlib density tutorial" },
    ],
  },
  estMinutes: 6,
  conceptCard:
    "This mission is about **density vs count when comparing distributions**.\n\n- Default histograms use **counts** on the y-axis — incomparable across groups of different sizes.\n- `density=True` normalises so **area under each histogram = 1**; shapes become comparable.\n- Down-sampling to match group sizes throws away data; use density instead.\n\nThe code overlays two count-histograms of size 3000 vs 250; the smaller is invisible. Add `density=True`.",
  lineNotes: [
    { line: 5, noteMd: "3,000 mobile observations." },
    { line: 6, noteMd: "Only 250 desktop observations — group sizes differ by 12×." },
    { line: 9, noteMd: "**The bug.** Default `density=False` (counts) makes mobile dwarf desktop. Add `density=True`." },
    { line: 10, noteMd: "Same fix here on the second hist call." },
  ],
  takeaway: "When overlaying groups of different sizes, use density=True — area under each histogram = 1, shapes become comparable.",
  glossary: [
    {
      term: "probability density",
      definitionMd: "Function whose integral over an interval gives the probability of observing a value in that interval. Units of `1 / x-units`. Total integral over all x equals 1. Histograms with `density=True` estimate this from data.",
    },
    {
      term: "normalization (of a histogram)",
      definitionMd: "Scaling bar heights so the histogram sums to a fixed total — usually 1 (density) or 100% (percentages via weights). Makes histograms of different-sized groups directly comparable.",
    },
    {
      term: "`alpha` (matplotlib)",
      definitionMd: "Transparency parameter. `alpha=0.5` means 50% transparent; lets you overlay two histograms and see both. Combined with `density=True`, the foundation pattern for distribution comparison.",
    },
    {
      term: "kernel density estimate (KDE)",
      definitionMd: "Continuous smooth curve estimating distribution shape. Independent of bin choice. `seaborn.histplot(kde=True)` overlays one for free; `seaborn.kdeplot(...)` draws KDE only. Particularly useful when comparing distributions of very different sizes.",
    },
  ],
  figureSvg: F024_BEFORE,
  figureCaption: "Before — counts on the y-axis; the bigger group (mobile, n=3000) dwarfs desktop (n=250).",
  resultFigureSvg: F024_AFTER,
};

// ── da-025 — cumulative distribution (CDF) ────────────────────────────────
const DA_025: Spec = {
  id: "da-025-cdf-percentile",
  difficulty: "hard",
  title: "25_what_is_p90.ipynb",
  icon: "activity",
  conceptTags: ["numpy", "matplotlib", "cdf", "percentile"],
  descriptionMd:
    "## Mission: 'What's the p90 of Page Load Time?'\n\nThe perf team asks for the **90th percentile** of page load times. You drew a histogram and now have to *eyeball* it: 'the 90th percentile looks like… maybe… 700 ms?' The histogram gives you a sense of shape but reading a percentile off it is **fragile and bin-dependent**.\n\nThe right visualization for percentile questions is the **cumulative distribution function (CDF)** — y-axis is 'fraction of points below this value,' so percentiles read off directly. The 90th percentile is *just the x-value where y = 0.9*. Build the CDF with `np.sort` + `np.linspace`.",
  initialCode:
    "import numpy as np\nimport matplotlib.pyplot as plt\n\nrng = np.random.default_rng(11)\nload_times = rng.lognormal(mean=5.7, sigma=0.6, size=1500)  # ms\n\nfig, ax = plt.subplots(figsize=(7, 4))\nax.hist(load_times, bins='auto', color='#E8B65A')\nax.set_title('page_load_ms histogram')\nax.set_xlabel('page_load (ms)')\nax.set_ylabel('count')\nplt.show()\n\n# Now eyeball p90 from the chart...\np90 = float(input('p90 estimate: '))   # ← the bug — guess from the chart\nprint(f'estimated p90: {p90}')",
  buggyLineStart: 15,
  buggyLineEnd: 15,
  traceback:
    "Junior analyst: 'p90 looks like ~700 ms.'\n# Actual p90 (np.percentile) = 651 ms.\n# Histogram eyeballing was off by 50 ms in either direction depending on bin choice.",
  correctOutput:
    "p90 = 651 ms — read directly off the CDF where the curve crosses y = 0.9.\n# CDF removes the bin-choice fragility; the percentile is exact.",
  options: [
    {
      key: "a",
      label: "Build a CDF: `x = np.sort(times); y = np.arange(1, len(x)+1) / len(x); ax.plot(x, y)`",
      patchCode:
        "import numpy as np\nimport matplotlib.pyplot as plt\n\nrng = np.random.default_rng(11)\nload_times = rng.lognormal(mean=5.7, sigma=0.6, size=1500)\n\n# Build the empirical CDF — sort the values, plot against the cumulative fraction.\nx = np.sort(load_times)\ny = np.arange(1, len(x) + 1) / len(x)\n\nfig, ax = plt.subplots(figsize=(7, 4))\nax.plot(x, y, color='#7CD992')\nax.axhline(0.9, color='#8B9099', linestyle='--', linewidth=1)\nax.set_title('page_load_ms CDF')\nax.set_xlabel('page_load (ms)')\nax.set_ylabel('cumulative fraction')\nplt.show()\n\np90 = np.percentile(load_times, 90)\nprint(f'p90 (numpy.percentile) = {p90:.1f}')",
      isCorrect: true,
      resultLog:
        "p90 (numpy.percentile) = 651.0\n# CDF crosses y=0.9 at x≈651 — confirms the percentile visually.",
      rationale:
        "An **empirical CDF** plots sorted values on the x-axis vs `(rank / n)` on the y-axis. Each data point contributes exactly one step on the curve; no bins, no choices, no eyeball error. The 90th percentile is *just the x-value where the curve crosses y = 0.9* — you read it off with a ruler. For the exact number, `np.percentile(data, 90)` agrees with the visual. CDFs are the right viz for any 'what percentile?' or 'what fraction below X?' question.",
      attachFigure: true,
    },
    {
      key: "b",
      label: "Eyeball a finer histogram (`bins=50`) — more bins, more precise reading",
      patchCode:
        "ax.hist(load_times, bins=50, color='#E8B65A')\nplt.show()\np90 = float(input('p90 estimate: '))",
      isCorrect: false,
      resultLog:
        "Same eyeballing problem; finer bars don't tell you where the 90% mark sits without summing them by hand.",
      rationale:
        "Eyeballing a percentile from a histogram is **fundamentally fragile** — you'd have to mentally integrate the bars from left until you've accumulated 90% of the total. More bins doesn't help; the eye can't do running cumulative sums. CDFs convert the question 'what value contains 90% of points below it?' into the trivial visual 'where does the curve hit 0.9?'",
    },
    {
      key: "c",
      label: "Use `np.percentile(load_times, 90)` directly — don't bother with a chart",
      patchCode:
        "p90 = np.percentile(load_times, 90)\nprint(f'p90 = {p90:.1f}')",
      isCorrect: false,
      resultLog:
        "p90 = 651.0\n# The number is right — but the perf team also wants to *see* the distribution. A number alone hides whether the tail is heavy, long, or normal-shaped.",
      rationale:
        "`np.percentile` is mathematically correct but the perf team's question 'what's p90?' usually implies they also want context — *how far above the median is it, what's the tail shape, is there a fat tail past p99*. The CDF answers all of those visually; the percentile alone answers just one. Always pair the number with the chart for stakeholder reporting.",
    },
  ],
  hints: [
    "How would you mentally integrate the histogram from the left until you've accumulated 90% of points? That's the inversion of plot you actually want.",
    "Sort the data, then plot sorted values vs `np.arange(1, n+1) / n` — the empirical CDF. p90 is just the x-value where the curve crosses 0.9.",
  ],
  explanationMd:
    "### Why the bug occurs\nA histogram answers 'how many points have value X?' — but **percentiles are the *cumulative* count, not the per-bin count**. Reading a percentile from a histogram means mentally integrating bars from the left until 90% of points are accumulated. The eye can't do this; you guess.\n\n### Why the fix is correct\nThe **empirical CDF** plots sorted values on the x-axis vs the cumulative fraction `rank/n` on the y-axis. Every data point contributes exactly one step. The percentile question reads directly off the chart:\n- **p50 (median)**: x-value where the curve crosses 0.5.\n- **p90**: where the curve crosses 0.9.\n- **p99**: where the curve crosses 0.99 (use log y-axis to read tails).\n\nNo bins, no bin-choice fragility, no integration in your head.\n\n### Building it: two ways\n```python\n# Method 1: np.sort + np.linspace\nx = np.sort(data)\ny = np.arange(1, len(x) + 1) / len(x)\nax.plot(x, y)\n```\n```python\n# Method 2: matplotlib ECDF (matplotlib 3.8+) or seaborn\nimport seaborn as sns\nsns.ecdfplot(data)\n```\nBoth identical conceptually.\n\n### When CDFs are the right choice\n- **Percentile reading**: 'what's p90? p99?' — direct visual reading.\n- **Comparing two distributions**: overlay two CDFs; the **vertical distance** between curves is the shift in percentile at each value. CDFs are the cleanest distribution-comparison viz.\n- **Detecting heavy tails**: a CDF that stays low for a long time on the right shows the long tail clearly.\n\n### When histograms still win\n- **Shape reading**: 'is this bimodal? Where are the modes?' — histograms show shape directly; CDFs hide modes (they appear as steeper-then-flatter segments, harder to spot).\n- **Stakeholder familiarity**: most non-technical readers don't know what a CDF is. For exec decks, either teach it or show both.",
  recruiterReview:
    "Strong — you recognised percentiles aren't a histogram question and built the CDF. Two follow-ups for production: 1) for SLA reports, always include the CDF *plus* the numerical p50/p90/p99 in a small annotation box on the chart — the visual and the numbers reinforce each other. 2) When comparing two distributions (e.g. before/after a perf optimization), overlay the two CDFs — the **horizontal distance** between curves at any percentile shows the latency improvement at that percentile, which is far more informative than mean shifts. Approved. ✅",
  tutorial: {
    bodyMd:
      "## CDFs — The Right Viz for Percentile Questions\n\nWhenever a stakeholder asks 'what's the p90?' or 'how many users see less than 500 ms?' the CDF is the right chart. Histograms answer shape questions; CDFs answer cumulative questions. Pick the chart for the question.\n\n### What a CDF is\nThe **cumulative distribution function** `F(x)` answers: 'what fraction of points are ≤ x?' For each value of x, you sum up all the points below.\n\nFor data, the **empirical CDF** is:\n```\nF̂(x) = (number of points ≤ x) / n\n```\n- F̂(min) = 1/n (the smallest point itself).\n- F̂(max) = 1.0 (all points are ≤ the max).\n- Curve is non-decreasing, ranging from 0 to 1.\n\n### Building it from numpy\n```python\nimport numpy as np\nimport matplotlib.pyplot as plt\n\nx = np.sort(data)\ny = np.arange(1, len(x) + 1) / len(x)\nplt.plot(x, y)\nplt.xlabel('value')\nplt.ylabel('cumulative fraction')\n```\nThree lines. No bins, no normalization, no choices.\n\nVisually the curve is a **staircase**: each data point is one tiny step. For n > ~500 the steps blend into a smooth-looking curve.\n\n### Reading percentiles off a CDF\nThe `kth` percentile is the x-value where the curve crosses `y = k/100`:\n- p50 (median): cross 0.5.\n- p90: cross 0.9.\n- p95: cross 0.95.\n- p99: cross 0.99.\n\nAdd horizontal reference lines for the percentiles you care about:\n```python\nax.axhline(0.9, color='gray', linestyle='--')\nax.axvline(np.percentile(data, 90), color='red', linestyle='--')\n```\n\n### Two distributions on one CDF\nWhen comparing two distributions, **overlay their CDFs**. Vertical distance between curves at a given x = 'how much more probability mass does group A have ≤ x.' Horizontal distance at a given y = 'how much smaller is A's p90 than B's p90.'\n\nThis is the cleanest distribution-comparison visualization. It also makes 'is one stochastically dominant over the other?' a one-glance question — if one CDF is always above the other, the higher one is dominated.\n\n### When CDFs are wrong\n- **Shape questions**: 'is this bimodal? Skewed?' — CDFs hide shape behind the cumulative integration. Use histogram or KDE.\n- **Comparing many groups (>4)**: too many overlaid CDFs become spaghetti. Use a panel of small histograms.\n- **Audience unfamiliarity**: train them first or use a histogram with annotated percentile lines.\n\n### Survival function — the complement\nThe **survival function** `1 − F(x)` answers 'what fraction is ABOVE x?' Critical for SLAs, error rates, and tail metrics:\n```python\ny_surv = 1 - y\nax.plot(x, y_surv)\nax.set_yscale('log')\n```\nLog-y survival lets you see how heavy the tail is. p99 reads off where the curve crosses 0.01; p999 at 0.001. This is the SLA report shape.\n\n### Boxplot for the same data\nBoxplots show the five-number summary (min, p25, median, p75, max) as a single compact box. For a side-by-side comparison of many groups, boxplots win. CDFs are better when you need the full distribution shape or non-standard percentiles.\n\n### Common reasoning mistakes\n- Eyeballing percentiles off histograms (bin-dependent and error-prone).\n- Reporting only the mean for skewed distributions (use median + p90 + p99 instead).\n- Forgetting log-y on survival functions (you can't read p99/p999 from a linear-y survival plot).\n- Overlaying too many CDFs (>4-5 becomes unreadable).\n\n### You just learned…\nThe **empirical CDF** plots sorted values vs cumulative fraction. Percentiles read off directly — p90 is where the curve crosses 0.9. Built with `np.sort` + `np.arange/n` in three lines. The right chart for any 'percentile' or 'fraction below X' question, and the cleanest way to compare two distributions visually.",
    videos: [
      { title: "Empirical CDF in matplotlib", searchQuery: "empirical cdf matplotlib python tutorial" },
      { title: "Reading percentiles from a CDF", searchQuery: "percentile cdf chart tutorial beginner" },
    ],
  },
  estMinutes: 8,
  conceptCard:
    "This mission is about the **empirical CDF**.\n\n- A CDF plots sorted values vs cumulative fraction; **percentiles read directly off the y-axis**.\n- p90 = the x-value where the curve crosses y = 0.9.\n- Build with three lines: `np.sort(data)`, `np.arange(1, n+1) / n`, `plot`.\n\nThe code asks the analyst to eyeball p90 from a histogram. Build the CDF and read it directly.",
  lineNotes: [
    { line: 5, noteMd: "Log-normal page load distribution — typical for web perf data; CDF is the right viz for percentile questions on it." },
    { line: 8, noteMd: "Histogram for shape; great for 'how is the distribution shaped?' — but **wrong** for 'what's p90?'" },
    { line: 15, noteMd: "**The bug.** Asking the analyst to *guess* a percentile from the histogram. Build the CDF instead and read p90 off where the curve crosses 0.9." },
  ],
  takeaway: "Percentiles read directly off a CDF (sorted values vs cumulative fraction) — never eyeball from a histogram.",
  glossary: [
    {
      term: "CDF (cumulative distribution function)",
      definitionMd: "F(x) = P(X ≤ x) — for a data sample, the fraction of points at or below value x. Non-decreasing curve from 0 to 1. Percentiles read directly off the y-axis: p90 is where F crosses 0.9.",
    },
    {
      term: "empirical CDF (ECDF)",
      definitionMd: "Data-driven CDF: sort the values, plot against `rank/n`. Each point contributes one step. No bins, no smoothing — just the data sorted.",
    },
    {
      term: "percentile",
      definitionMd: "The kth percentile is the value below which k% of the data falls. p50 = median; p90 = 'value below which 90% of points are.' Read directly off a CDF; computed exactly with `np.percentile(data, k)`.",
    },
    {
      term: "survival function",
      definitionMd: "S(x) = 1 − F(x) = P(X > x). The complementary view of the CDF, used for SLAs and tail-risk reporting. Pairs naturally with a log y-axis to read p99, p999, p9999 directly.",
    },
    {
      term: "p99 / p999 (tail percentiles)",
      definitionMd: "Common SLA metrics: p99 is 'value below which 99% of observations fall' — i.e. the worst 1%. p999 is the worst 0.1%. Latency-heavy services often track these on log-y survival functions.",
    },
  ],
  figureSvg: F025_BEFORE,
  figureCaption: "Before — histogram of page-load times; you can see shape but can't read p90 without eyeballing.",
  resultFigureSvg: F025_AFTER,
};

const SPECS = [DA_021, DA_022, DA_023, DA_024, DA_025];
for (const spec of SPECS) {
  const composed = compose(spec);
  const filePath = join(OUT_DIR, `${spec.id}.json`);
  writeFileSync(filePath, JSON.stringify(composed, null, 2));
  console.log(`wrote ${filePath}`);
}
console.log(`authored ${SPECS.length} numpy/histogram da challenges`);
