#!/usr/bin/env -S tsx
/**
 * Dev-time batch — composes da-026..030 (numpy + charts, batch 2).
 *   pnpm exec tsx scripts/author-numpy-da-2.ts
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

// da-026 — 2D histogram as heatmap
const F026_BEFORE = buildFigure({
  kind: "scatter",
  title: "age_vs_income — scatter (overplotted)",
  xLabel: "age",
  yLabel: "income (k USD)",
  points: Array.from({ length: 400 }, (_, i) => ({
    x: 22 + (i % 50) + (i % 7),
    y: 30 + (i % 50) * 1.4 + (i % 11) * 3,
  })),
  xRange: [20, 75],
  yRange: [20, 130],
  uniformSize: true,
  color: "muted",
});
const F026_AFTER = buildFigure({
  kind: "heatmap",
  title: "age_vs_income — 2D histogram heatmap",
  xLabel: "age",
  yLabel: "income (k USD)",
  cells: [
    [3, 8, 18, 28, 22, 12, 4],
    [5, 15, 32, 45, 38, 18, 7],
    [2, 11, 25, 38, 30, 14, 5],
    [1, 6, 14, 20, 16, 8, 3],
    [0, 2, 5, 8, 6, 3, 1],
  ],
  rowLabels: ["120+", "100", "80", "60", "40"],
  colLabels: ["25", "32", "39", "46", "53", "60", "67"],
  color: "accent",
});

// da-027 — correlation matrix heatmap
const F027_BEFORE = buildFigure({
  kind: "bar",
  title: "marketing_metrics — correlation pairs (manual scan)",
  xLabel: "metric pair",
  yLabel: "Pearson r",
  xCategories: ["ad-imp", "ad-clk", "clk-sgnup", "sgnup-purch", "purch-LTV", "ad-LTV"],
  values: [0.82, 0.94, 0.68, 0.91, 0.86, 0.31],
  color: "warning",
  yRange: [0, 1.05],
});
const F027_AFTER = buildFigure({
  kind: "heatmap",
  title: "marketing_metrics — correlation matrix (np.corrcoef)",
  xLabel: "metric",
  yLabel: "metric",
  cells: [
    [1.0, 0.82, 0.78, 0.45, 0.31, 0.28],
    [0.82, 1.0, 0.94, 0.62, 0.48, 0.39],
    [0.78, 0.94, 1.0, 0.68, 0.55, 0.43],
    [0.45, 0.62, 0.68, 1.0, 0.91, 0.86],
    [0.31, 0.48, 0.55, 0.91, 1.0, 0.93],
    [0.28, 0.39, 0.43, 0.86, 0.93, 1.0],
  ],
  rowLabels: ["ad_imp", "ad_clk", "signup", "purch", "LTV30", "LTV365"],
  colLabels: ["ad_imp", "ad_clk", "signup", "purch", "LTV30", "LTV365"],
  vMax: 1.0,
  color: "accent",
});

// da-028 — np.where vs broadcast
// (no figures; pure code mission)

// da-029 — nanmean: with NaN vs without
const F029_BEFORE = buildFigure({
  kind: "bar",
  title: "weekly_mean (NaN propagated)",
  xLabel: "week",
  yLabel: "mean",
  xCategories: ["W1", "W2", "W3", "W4", "W5", "W6"],
  values: [0, 4.2, 0, 4.8, 4.5, 0],
  color: "warning",
  yRange: [0, 6],
});
const F029_AFTER = buildFigure({
  kind: "bar",
  title: "weekly_mean (np.nanmean — NaN ignored)",
  xLabel: "week",
  yLabel: "mean",
  xCategories: ["W1", "W2", "W3", "W4", "W5", "W6"],
  values: [4.1, 4.2, 4.5, 4.8, 4.5, 4.7],
  color: "accent",
  yRange: [0, 6],
});

// da-030 — random seed reproducibility
// (no figures; pure code mission)

// ── Specs ─────────────────────────────────────────────────────────────────

const DA_026: Spec = {
  id: "da-026-hist2d-heatmap",
  difficulty: "medium",
  title: "26_age_vs_income_density.ipynb",
  icon: "boxes",
  conceptTags: ["numpy", "matplotlib", "histogram2d", "density"],
  descriptionMd:
    "## Mission: 50,000-Point Scatter Is a Solid Blob\n\nYou're showing the marketing team a scatter of `age` vs `income` for 50,000 users. Every point is plotted with `alpha=0.5`; the chart is a **solid dark blob** in the middle with no visible structure. Where's the dense centre? Are there sub-populations?\n\nWhen scatter plots overplot, switch to a **2D histogram (heatmap)**. `numpy.histogram2d` bins the points into a grid; `matplotlib.imshow` (or `pcolormesh`) renders each cell as a coloured rectangle whose intensity encodes the count. Density structure pops out where the scatter couldn't show it.",
  initialCode:
    "import numpy as np\nimport matplotlib.pyplot as plt\n\nrng = np.random.default_rng(0)\nage    = rng.normal(42, 12, size=50000).clip(18, 80)\nincome = (age - 18) * 1.4 + rng.normal(0, 18, size=50000)\nincome = income.clip(20, 130)\n\nfig, ax = plt.subplots(figsize=(7, 4))\nax.scatter(age, income, alpha=0.5)  # 50k points → solid blob\nax.set_title('age_vs_income.png')\nax.set_xlabel('age')\nax.set_ylabel('income (k USD)')\nplt.show()",
  buggyLineStart: 10,
  buggyLineEnd: 10,
  traceback:
    "Solid dark cloud, no structure readable.\n# Overplotting: each point hides whatever's below it; even alpha=0.5 saturates at this density.",
  correctOutput:
    "Hot centre at age 40-50, income 60-80k; density falls off in concentric rings; long thin tail toward older/higher-income.",
  options: [
    {
      key: "a",
      label: "Build a 2D histogram and show it as a heatmap with `np.histogram2d` + `ax.imshow`",
      patchCode:
        "import numpy as np\nimport matplotlib.pyplot as plt\n\nrng = np.random.default_rng(0)\nage    = rng.normal(42, 12, size=50000).clip(18, 80)\nincome = (age - 18) * 1.4 + rng.normal(0, 18, size=50000)\nincome = income.clip(20, 130)\n\n# 2D histogram: bin counts into a 30x30 grid.\ncounts, x_edges, y_edges = np.histogram2d(age, income, bins=30)\n\nfig, ax = plt.subplots(figsize=(7, 4))\nim = ax.imshow(\n    counts.T,                            # transpose so age is x, income is y\n    origin='lower',                      # row 0 at the bottom (standard chart orientation)\n    extent=[x_edges[0], x_edges[-1], y_edges[0], y_edges[-1]],\n    aspect='auto',\n    cmap='viridis',\n)\nfig.colorbar(im, ax=ax, label='count')\nax.set_title('age_vs_income — density heatmap')\nax.set_xlabel('age')\nax.set_ylabel('income (k USD)')\nplt.show()",
      isCorrect: true,
      resultLog:
        "Heatmap shows clear hot centre, density falloff, and tail structure that the scatter completely hid.",
      rationale:
        "`np.histogram2d` is `np.histogram`'s 2D cousin: it bins points into a regular grid and returns the count per cell. `ax.imshow` renders the grid as a heatmap, mapping count to color intensity. **For >5,000 points, this is almost always the right move** — scatter overplotting hides density; heatmap reveals it. Three details: (1) transpose with `.T` so age is x and income is y (numpy convention is rows-then-cols, matplotlib is x-then-y); (2) `origin='lower'` puts row 0 at the bottom (matches chart axes); (3) `extent=` sets real x/y ranges so axis labels are meaningful. Add a `fig.colorbar` so readers can decode the colour-to-count mapping.",
      attachFigure: true,
    },
    {
      key: "b",
      label: "Lower `alpha` to 0.05 — many transparent dots will reveal density",
      patchCode:
        "ax.scatter(age, income, alpha=0.05)\nplt.show()",
      isCorrect: false,
      resultLog:
        "Better — you can vaguely see a denser middle now. But fine structure still hidden, and you have no quantitative read of the density.",
      rationale:
        "Alpha tricks work for ~10k-50k points but degrade as n grows; the chart still doesn't give you **quantitative density**. A heatmap with a colorbar lets a reader say 'this cell has 400 users, that one has 50.' Alpha-tuned scatter gives you 'darker means more, vaguely.' For real density work — building exec reports, identifying cohorts, finding the centroid — a 2D histogram is the right tool.",
    },
    {
      key: "c",
      label: "Switch to a hexbin plot: `ax.hexbin(age, income)`",
      patchCode:
        "ax.hexbin(age, income, gridsize=30, cmap='viridis')\nplt.show()",
      isCorrect: false,
      resultLog:
        "Similar look and similar information as the heatmap — but the lesson here is about `np.histogram2d`'s mechanics, not the matplotlib shortcut.",
      rationale:
        "`hexbin` IS a valid 2D-density tool — it bins into hexagons instead of rectangles, which reduces some axis-alignment artefacts. It's a fine choice. But this mission is about the underlying mechanic: numpy returns the 2D histogram, matplotlib renders it. Knowing **what `histogram2d` actually computes** lets you do non-display things with the counts (extract centroids, threshold for outliers, integrate over regions). `hexbin` is the convenient one-liner; `histogram2d + imshow` is the foundation.",
    },
  ],
  hints: [
    "Print `len(age)`. 50,000 points on a scatter is hopeless; you need binning to read density.",
    "`counts, xe, ye = np.histogram2d(age, income, bins=30)`; then `ax.imshow(counts.T, origin='lower', extent=[xe[0], xe[-1], ye[0], ye[-1]], aspect='auto')`.",
  ],
  explanationMd:
    "### Why the bug occurs\nA scatter plot draws one dot per point. With 50,000 points, dots overlap; even with `alpha=0.5` the centre saturates to opaque. Density information is hidden by overplotting.\n\n### Why the fix is correct\n`np.histogram2d` discretizes the 2D space into a regular grid (`bins` × `bins`) and counts points per cell. The output is a 2D array of counts. Rendering that array as colour intensity gives a **density map** the eye can read at a glance.\n\nTwo conventions to remember:\n- **numpy's `histogram2d` returns counts indexed as `[x_bin, y_bin]`**.\n- **matplotlib's `imshow` interprets the array as `[row, col]` = `[y, x]`**.\nSo you need `counts.T` to align the two. Plus `origin='lower'` so y increases upward (the default `'upper'` makes row 0 the top, like an image).\n\n### `hexbin`, `pcolormesh`, `imshow` — which is which\n- **`ax.imshow(counts.T, origin='lower', extent=..., aspect='auto')`** — rectangular bins, simple, what 99% of analyst code uses.\n- **`ax.pcolormesh(x_edges, y_edges, counts.T)`** — supports non-uniform bins (e.g. log-spaced), no `extent` needed because edges are explicit.\n- **`ax.hexbin(x, y, gridsize=N)`** — hexagonal bins, fewer aliasing artefacts at small bin counts, one-line API.\n\nAll three produce the same kind of chart. Reach for `imshow` when you want simplicity, `pcolormesh` when bin edges are non-uniform, `hexbin` when you want a convenient one-liner.",
  recruiterReview:
    "Strong — you didn't fight the overplotting with smaller dots; you switched to the right viz for density. Two follow-ups: 1) always add a **colorbar** (`fig.colorbar(im)`) so readers can decode 'how dense is dense?' — without it, the chart only shows *relative* density. 2) For really large n (>1M), use **`pcolormesh` with log-spaced bins** if the data is log-distributed (incomes, file sizes) so the bin sizes match the data scale. Approved. ✅",
  tutorial: {
    bodyMd:
      "## 2D Histograms — When Scatter Plots Drown\n\nScatter plots are great for ~1,000 points. Beyond ~10,000 points they overplot; beyond ~50,000 they're solid blobs. **Switch to a 2D histogram (heatmap)** and density structure becomes visible again.\n\n### When scatter fails\nA scatter plots one dot per row. As density rises, dots overlap. With `alpha=0.5` the centre saturates to opaque at ~10x average density. With `alpha=0.05` you can vaguely read density up to ~100k points but the trade-off is that *isolated* points become invisible (too transparent to see at all).\n\nReal estate analyst datasets, server log datasets, marketing-attribution datasets — all routinely span 100k-10M points. Scatter is not a tool for those scales.\n\n### `np.histogram2d` — the underlying mechanic\n```python\ncounts, x_edges, y_edges = np.histogram2d(x, y, bins=30)\n```\n- `counts.shape == (30, 30)`. Cell `[i, j]` is the count in `x_bin=i, y_bin=j`.\n- `x_edges` and `y_edges` are the bin boundaries (each has `bins + 1` elements).\n\nFor uneven bins:\n```python\nx_edges = np.logspace(0, 4, 30)              # log-spaced\ny_edges = np.linspace(0, 100, 20)            # linear\ncounts, _, _ = np.histogram2d(x, y, bins=[x_edges, y_edges])\n```\n\n### Rendering with `imshow`\n```python\nfig, ax = plt.subplots()\nim = ax.imshow(\n    counts.T,                                 # transpose: numpy is [x, y]; imshow is [row, col] = [y, x]\n    origin='lower',                           # row 0 at bottom (standard chart axes)\n    extent=[x_edges[0], x_edges[-1], y_edges[0], y_edges[-1]],\n    aspect='auto',                            # fit the figure\n    cmap='viridis',                           # perceptually uniform sequential colormap\n)\nfig.colorbar(im, ax=ax, label='count')\n```\n\nThree details that trip every junior:\n1. **`counts.T`** — numpy axis order is `[x, y]`, matplotlib's is `[row, col] = [y, x]`. Transpose to match.\n2. **`origin='lower'`** — `imshow` defaults to image convention (row 0 at top); chart axes want row 0 at bottom. Set it.\n3. **`extent=`** — without it, `imshow` shows pixel indices (0..29) instead of real x/y values.\n\n### Alternatives: `pcolormesh` and `hexbin`\n\n#### `pcolormesh` — non-uniform bins\n```python\nax.pcolormesh(x_edges, y_edges, counts.T, cmap='viridis')\n```\nNo `extent` needed because edges are explicit. Use when bins are log-spaced or otherwise non-uniform.\n\n#### `hexbin` — convenient one-liner\n```python\nax.hexbin(x, y, gridsize=30, cmap='viridis')\nfig.colorbar(ax.collections[0])\n```\nHexagonal bins, fewer aliasing artefacts at small bin counts. No `histogram2d` step needed.\n\n### Choosing a colormap\nFor **counts (always positive)**: use a **perceptually uniform sequential** colormap — `viridis`, `plasma`, `magma`, `cividis`. Avoid `jet` and `rainbow` (perceptually non-uniform; introduces fake bands).\n\nFor **diverging data (positive AND negative — e.g. residuals)**: use `RdBu_r`, `coolwarm`, `seismic`. Centre is white/neutral; signs colour-code.\n\nFor **circular data (angles, time-of-day)**: use `hsv`, `twilight`, `twilight_shifted`.\n\n### Log-counts when one bin dwarfs the rest\nIf the dense centre is 1000× denser than the periphery, the colour map saturates and you can't see structure in the periphery. Use a log-color-scale:\n```python\nfrom matplotlib.colors import LogNorm\nax.imshow(counts.T, norm=LogNorm(), ...)\n```\nNow each factor of 10× change in density maps to the same colour distance.\n\n### Common reasoning mistakes\n- Fighting overplotting with smaller dots / lower alpha when a density chart would work.\n- Forgetting `counts.T` and getting a chart with axes swapped.\n- Forgetting `origin='lower'` and getting an inverted-y chart.\n- No colorbar — viewers can't decode density.\n- Using `jet` colormap — adds perceptual artefacts.\n\n### You just learned…\nFor **>10,000 point scatters, switch to a 2D histogram**. `np.histogram2d` does the binning; `ax.imshow(counts.T, origin='lower', extent=..., aspect='auto')` renders the heatmap. Add a colorbar, use a perceptually uniform colormap (`viridis`), and consider `LogNorm` when the centre is much denser than the periphery.",
    videos: [
      { title: "2D histograms in numpy/matplotlib", searchQuery: "numpy histogram2d matplotlib imshow heatmap tutorial" },
      { title: "Density heatmaps for big scatters", searchQuery: "matplotlib hexbin 2d histogram big data tutorial" },
    ],
  },
  estMinutes: 7,
  conceptCard:
    "This mission is about **2D histograms when scatter plots overplot**.\n\n- Scatter overplots beyond ~10k points; density becomes unreadable.\n- `np.histogram2d` bins into a grid; `ax.imshow(counts.T, origin='lower', extent=..., aspect='auto')` renders.\n- Three details to remember: **`.T`**, **`origin='lower'`**, **`extent=`**.\n\nThe code scatter-plots 50,000 points; the centre is a solid blob. Switch to a 2D histogram heatmap.",
  lineNotes: [
    { line: 5, noteMd: "50,000 ages — way too many for a scatter to read density." },
    { line: 6, noteMd: "Income correlated with age plus noise — the structure we want to *see* in the chart." },
    { line: 10, noteMd: "**The bug.** `scatter` overplots at this scale. Switch to `np.histogram2d` + `imshow`." },
  ],
  takeaway: "For >10k-point scatters, use np.histogram2d + imshow — density becomes visible where scatter overplots.",
  glossary: [
    {
      term: "overplotting",
      definitionMd: "When many scatter dots overlap and hide one another's density. Generally a problem above ~5,000 points; severe above ~20,000. Fixes: alpha tuning (limited), 2D histogram (canonical), hexbin (convenient).",
    },
    {
      term: "`np.histogram2d`",
      definitionMd: "numpy's 2D binning function. Returns `(counts, x_edges, y_edges)`. `counts.shape == (n_bins_x, n_bins_y)`. The foundation for 2D density visualizations.",
    },
    {
      term: "`ax.imshow`",
      definitionMd: "Matplotlib function for rendering 2D arrays as images. With `cmap=`, each cell's value maps to a colour. For histograms: transpose, set `origin='lower'`, set `extent=`. Pair with a colorbar.",
    },
    {
      term: "perceptually uniform colormap",
      definitionMd: "Colormap where equal differences in value map to equal perceived differences in colour. Examples: `viridis`, `plasma`, `magma`, `cividis`. Avoid `jet` and `rainbow` (non-uniform, introduces fake banding).",
    },
    {
      term: "LogNorm",
      definitionMd: "`matplotlib.colors.LogNorm` — log-scale colour normalisation. Use when density spans orders of magnitude (a dense centre 1000× the periphery). Each 10× change in density is the same colour distance.",
    },
  ],
  figureSvg: F026_BEFORE,
  figureCaption: "Before — 50k-point scatter; the centre is a solid blob, density structure invisible.",
  resultFigureSvg: F026_AFTER,
};

const DA_027: Spec = {
  id: "da-027-correlation-matrix",
  difficulty: "medium",
  title: "27_marketing_correlations.ipynb",
  icon: "table-2",
  conceptTags: ["numpy", "matplotlib", "correlation", "heatmap"],
  descriptionMd:
    "## Mission: Find Related Marketing Metrics\n\nThe growth team has six metrics in a DataFrame: `ad_imp`, `ad_clk`, `signup`, `purch`, `LTV30`, `LTV365`. You need to find which pairs are tightly correlated (so the team can pick *one* per cluster as a KPI rather than reporting six redundant numbers). Your first attempt prints `df.corr()` — a numeric matrix the team can't scan visually.\n\nThe right viz is a **correlation heatmap** — `numpy.corrcoef` gives you the matrix, `imshow` renders it with colour intensity encoding the strength. At a glance the team sees the **clusters**: `ad_imp/ad_clk/signup` move together; `purch/LTV30/LTV365` move together; the two clusters are weakly cross-correlated.",
  initialCode:
    "import numpy as np\nimport pandas as pd\nimport matplotlib.pyplot as plt\n\nrng = np.random.default_rng(3)\nn = 1000\nad_imp  = rng.normal(50, 12, n)\nad_clk  = ad_imp * 0.06 + rng.normal(0, 0.3, n)\nsignup  = ad_clk * 1.2 + rng.normal(0, 0.5, n)\npurch   = rng.normal(8, 2, n) + 0.4 * signup\nltv30   = purch * 4.5 + rng.normal(0, 6, n)\nltv365  = ltv30 * 2.1 + rng.normal(0, 12, n)\n\ndf = pd.DataFrame({'ad_imp': ad_imp, 'ad_clk': ad_clk, 'signup': signup,\n                   'purch': purch, 'LTV30': ltv30, 'LTV365': ltv365})\nprint(df.corr().round(2))   # ← the buggy attempt: a numeric matrix",
  buggyLineStart: 16,
  buggyLineEnd: 16,
  traceback:
    "          ad_imp  ad_clk  signup  purch  LTV30  LTV365\n  ad_imp   1.00    0.82   0.78    0.45   0.31   0.28\n  ad_clk   0.82    1.00   0.94    0.62   0.48   0.39\n  signup   0.78    0.94   1.00    0.68   0.55   0.43\n  purch    0.45    0.62   0.68    1.00   0.91   0.86\n  LTV30    0.31    0.48   0.55    0.91   1.00   0.93\n  LTV365   0.28    0.39   0.43    0.86   0.93   1.00\n# Numbers are right; the team can't scan it for clusters at a glance.",
  correctOutput:
    "Heatmap shows two bright squares along the diagonal — `(ad_imp, ad_clk, signup)` cluster and `(purch, LTV30, LTV365)` cluster — with a cooler off-diagonal block between them. Clusters spot instantly.",
  options: [
    {
      key: "a",
      label: "Use `np.corrcoef` and render the matrix as an `imshow` heatmap with annotations",
      patchCode:
        "import numpy as np\nimport pandas as pd\nimport matplotlib.pyplot as plt\n\nrng = np.random.default_rng(3)\nn = 1000\nad_imp  = rng.normal(50, 12, n)\nad_clk  = ad_imp * 0.06 + rng.normal(0, 0.3, n)\nsignup  = ad_clk * 1.2 + rng.normal(0, 0.5, n)\npurch   = rng.normal(8, 2, n) + 0.4 * signup\nltv30   = purch * 4.5 + rng.normal(0, 6, n)\nltv365  = ltv30 * 2.1 + rng.normal(0, 12, n)\n\ndf = pd.DataFrame({'ad_imp': ad_imp, 'ad_clk': ad_clk, 'signup': signup,\n                   'purch': purch, 'LTV30': ltv30, 'LTV365': ltv365})\n\n# rowvar=False because each COLUMN of df is a variable.\ncorr = np.corrcoef(df.values, rowvar=False)\nlabels = df.columns\n\nfig, ax = plt.subplots(figsize=(6.5, 5.5))\nim = ax.imshow(corr, vmin=-1, vmax=1, cmap='RdBu_r')\nax.set_xticks(range(len(labels))); ax.set_xticklabels(labels, rotation=45, ha='right')\nax.set_yticks(range(len(labels))); ax.set_yticklabels(labels)\nfor i in range(len(labels)):\n    for j in range(len(labels)):\n        ax.text(j, i, f'{corr[i, j]:.2f}', ha='center', va='center', fontsize=9)\nfig.colorbar(im, ax=ax, label='Pearson r')\nplt.show()",
      isCorrect: true,
      resultLog:
        "Heatmap shows two bright clusters along the diagonal; off-diagonal cooler. Annotations confirm the exact correlations.",
      rationale:
        "`np.corrcoef(df.values, rowvar=False)` returns the Pearson correlation matrix — each column treated as a variable. Render with `imshow`, `vmin=-1, vmax=1` (correlation range), and **a diverging colormap** (`RdBu_r`) because correlations can be positive or negative — `0` should look neutral, `+1` and `-1` should be opposite colors. Annotating each cell with the numeric value is the convention for correlation heatmaps; it lets readers verify exact values without losing the visual cluster pattern.",
      attachFigure: true,
    },
    {
      key: "b",
      label: "Print the matrix more nicely: `print(df.corr().round(2).to_string())`",
      patchCode:
        "print(df.corr().round(2).to_string())",
      isCorrect: false,
      resultLog:
        "Better-formatted text but still 36 numbers in a 6x6 grid; the eye can't spot clusters in numeric form.",
      rationale:
        "Prettier numbers don't help the *scan* problem. **Correlation matrices are a classic case for visual rendering**: humans spot 2-D patterns of colour intensity at a glance but cannot spot patterns in tables of numbers without active reading. Heatmaps are the canonical visualization for this exact shape.",
    },
    {
      key: "c",
      label: "Use a single `viridis` colormap — it's the modern default",
      patchCode:
        "im = ax.imshow(corr, cmap='viridis')\nplt.show()",
      isCorrect: false,
      resultLog:
        "Heatmap renders, but **positive and negative correlations get mapped to the same colours**. A 0 isn't distinguishable from a -0.5; you lose half the signal.",
      rationale:
        "`viridis` is a **sequential** colormap — designed for unsigned magnitudes (counts, distances). Correlation is **diverging** — it has sign. Sequential colormaps on diverging data destroy the sign distinction. Use **`RdBu_r`** or `coolwarm` or `seismic` for correlations: blue for negative, white for zero, red for positive. Also set `vmin=-1, vmax=1` so 0 is exactly the middle of the colormap.",
    },
  ],
  hints: [
    "Try `np.corrcoef(df.values, rowvar=False)` — returns the same matrix as `df.corr()`, but numpy-typed.",
    "Render with `ax.imshow(corr, vmin=-1, vmax=1, cmap='RdBu_r')` — diverging colormap, anchored at zero.",
  ],
  explanationMd:
    "### Why the bug occurs\nA 6×6 correlation matrix has 36 numbers. The eye is great at spotting visual cluster patterns but bad at spotting patterns in tables of numbers. Printing the matrix gives the team the data but not the insight.\n\n### Why the fix is correct\n`np.corrcoef(X, rowvar=False)` computes the Pearson correlation matrix where each column of `X` is a variable. `imshow` renders the matrix as colour intensity. With `vmin=-1, vmax=1` and a **diverging colormap** (`RdBu_r`), the visual semantics match the data:\n- Strong positive (closer to +1) → deep red.\n- Strong negative (closer to -1) → deep blue.\n- Zero → white (neutral).\n\nCluster patterns — adjacent variables with high pairwise correlation — show as bright squares along the diagonal. Off-diagonal cool blocks mean two groups of variables don't correlate with each other.\n\nAnnotate each cell with the numeric value (`ax.text`) so readers can verify exact magnitudes while still benefiting from the visual scan.\n\n### Pearson vs Spearman\n- `np.corrcoef` computes **Pearson r** — measures *linear* correlation.\n- For monotonic-but-not-linear relationships (e.g. ranks), use **`scipy.stats.spearmanr`** (Spearman's ρ) — rank-based, robust to outliers and non-linear monotonic shapes.\n\nWhen reporting to non-technical stakeholders, mention which is being shown. *Pearson r = 0.95* is strong linear; *Spearman ρ = 0.95* is strong monotonic but possibly very curved.\n\n### Cluster ordering\nFor more than ~6 variables, **reorder** rows and columns so clusters are adjacent (uses `scipy.cluster.hierarchy` or `seaborn.clustermap`). For 6 variables manual ordering is fine; for 20+, automated clustering is the only honest way to read structure.",
  recruiterReview:
    "Strong — you used a diverging colormap and annotated values. Two follow-ups: 1) when reporting to stakeholders, also include a **single number per cluster** (e.g. 'the top-of-funnel cluster' = mean of `ad_imp, ad_clk, signup`) so they get one KPI instead of six. 2) For ≥8 variables, switch to **`seaborn.clustermap`** which hierarchically clusters and reorders the matrix automatically; you'll find structure that manual ordering missed. Approved. ✅",
  tutorial: {
    bodyMd:
      "## Correlation Heatmaps — Show Cluster Structure At a Glance\n\nWhenever you have a matrix of pairwise relationships (correlations, distances, similarities), the right visualisation is a **heatmap** — values map to colour intensity, the eye spots patterns instantly.\n\n### `np.corrcoef` mechanics\n```python\ncorr = np.corrcoef(X, rowvar=False)\n```\n- `rowvar=False`: each COLUMN of `X` is a variable (standard analyst layout).\n- `rowvar=True` (default!): each ROW is a variable. **This trips most juniors at least once.**\n- Returns a `(p, p)` matrix where `p` is the number of variables. Always symmetric. Diagonal is 1.\n- Values in `[-1, +1]`. +1 perfectly co-vary, 0 uncorrelated, -1 perfectly anti-co-vary.\n\nFor pandas DataFrames, `df.corr()` is the same thing — uses Pearson by default, supports Spearman / Kendall as alternatives.\n\n### Diverging colormaps — critical for signed data\n```python\nim = ax.imshow(corr, vmin=-1, vmax=1, cmap='RdBu_r')\n```\nCorrelations have **sign**. A sequential colormap (`viridis`, `plasma`) treats `-0.9` and `+0.9` as different magnitudes of the same direction — but they're opposite directions. Use a diverging colormap:\n- **`RdBu_r`** — red-blue, red for positive (reverse of default).\n- **`coolwarm`** — same family, lighter middle.\n- **`seismic`** — high-contrast, less perceptually uniform.\n- **`PiYG`**, **`PRGn`** — alternative diverging palettes.\n\nAlways set **`vmin=-1, vmax=1`** so zero is exactly the colormap's middle.\n\n### Annotating cells\nFor matrices small enough to read (≤ 10 × 10), annotate each cell:\n```python\nfor i in range(p):\n    for j in range(p):\n        ax.text(j, i, f'{corr[i, j]:.2f}', ha='center', va='center')\n```\nReaders can verify exact values while still benefiting from the heatmap's visual scan.\n\nFor larger matrices, drop annotations — they'd be unreadable — and rely on the colormap + colorbar.\n\n### Cluster reordering — `seaborn.clustermap`\nFor matrices with more than ~6 variables, the variables' *original order* in your DataFrame rarely groups correlated ones together. **Reorder** so clusters become adjacent:\n```python\nimport seaborn as sns\nsns.clustermap(corr, vmin=-1, vmax=1, cmap='RdBu_r',\n               annot=True, fmt='.2f', figsize=(8, 8))\n```\n`clustermap` does hierarchical clustering and reorders rows/columns; the resulting heatmap has **block structure** where clusters are obvious. This is the single best tool for finding 'redundant metrics' in a 20-column dataset.\n\n### Pearson, Spearman, Kendall\n- **Pearson r**: linear correlation. Best when relationships are roughly linear and outliers are reasonable.\n- **Spearman ρ**: rank-correlation. Robust to outliers and non-linear monotonic relationships. *`r=0.95` linear* vs *`ρ=0.95` monotonic but curved* tell different stories.\n- **Kendall τ**: another rank correlation; smaller magnitudes than Spearman; less affected by middle-rank changes.\n\nWhen in doubt or when data has heavy tails, **report Spearman**.\n\n### What correlation ≠ causation does (and doesn't) tell you\nA correlation heatmap shows **statistical co-movement**, not directional cause. Two variables with `r=0.95`:\n- Could share an upstream cause (\"both driven by traffic\").\n- Could be one causing the other (in either direction).\n- Could be coincident (rare for r=0.95 with reasonable n, but possible).\n\nThe heatmap *finds candidates* for relationships worth investigating; *establishing causality* requires controlled experiments or causal-inference techniques.\n\n### Common reasoning mistakes\n- Using a sequential colormap on signed correlation data (loses sign).\n- Not setting `vmin=-1, vmax=1` (colormap is auto-fit; 0.5 and 1 look similar; you lose the magnitude reference).\n- `rowvar=True` (default) — accidentally computes the wrong matrix.\n- Reading 'high correlation' as 'A causes B.'\n- Not clustering matrices > 6×6 — structure is hidden in arbitrary column order.\n\n### You just learned…\nCorrelation matrices are **heatmap-shaped data**. `np.corrcoef(X, rowvar=False)` computes the matrix; `imshow(vmin=-1, vmax=1, cmap='RdBu_r')` renders it. Annotate small ones; cluster-reorder big ones (`seaborn.clustermap`). For non-linear monotonic relationships, use Spearman. The heatmap finds candidates; causality requires experiments.",
    videos: [
      { title: "Correlation heatmaps in matplotlib", searchQuery: "matplotlib correlation matrix heatmap tutorial" },
      { title: "Pearson vs Spearman correlation", searchQuery: "pearson vs spearman correlation tutorial when to use" },
    ],
  },
  estMinutes: 7,
  conceptCard:
    "This mission is about **correlation heatmaps**.\n\n- `np.corrcoef(X, rowvar=False)` returns the Pearson correlation matrix.\n- Render with **`imshow(vmin=-1, vmax=1, cmap='RdBu_r')`** — diverging colormap, zero in the middle.\n- Annotate cells for small matrices; cluster-reorder (seaborn.clustermap) for big ones.\n\nThe code prints raw numbers; switch to a `corrcoef + imshow` heatmap so clusters are visible at a glance.",
  lineNotes: [
    { line: 7, noteMd: "Top-of-funnel metrics — strongly intercorrelated by construction." },
    { line: 11, noteMd: "Bottom-of-funnel — separate cluster." },
    { line: 16, noteMd: "**The bug.** Printing a 6x6 numeric matrix; the team can't scan it for clusters. Render as a heatmap." },
  ],
  takeaway: "For correlation matrices, np.corrcoef + imshow(vmin=-1, vmax=1, cmap='RdBu_r') — diverging colormap with zero in the middle.",
  glossary: [
    {
      term: "Pearson correlation (r)",
      definitionMd: "Measure of **linear** correlation between two variables; range `[-1, +1]`. `+1` = perfectly co-vary, `0` = uncorrelated, `-1` = perfectly anti-co-vary. Sensitive to outliers and assumes linearity.",
    },
    {
      term: "Spearman correlation (ρ)",
      definitionMd: "**Rank-based** correlation. Robust to outliers and non-linear monotonic relationships. Often the more honest choice for heavy-tailed business data.",
    },
    {
      term: "correlation matrix",
      definitionMd: "Symmetric `p × p` matrix where entry `(i, j)` is the correlation between variables `i` and `j`. Diagonal is always 1. The standard exploratory tool for finding redundant variables and metric clusters.",
    },
    {
      term: "diverging colormap",
      definitionMd: "Colormap with a neutral midpoint and contrasting endpoints, designed for **signed data** where 0 has special meaning. Examples: `RdBu_r`, `coolwarm`, `seismic`, `PiYG`. Critical for correlation matrices, residuals, before-after deltas.",
    },
    {
      term: "`seaborn.clustermap`",
      definitionMd: "Heatmap with **hierarchical clustering** that reorders rows and columns so similar items are adjacent. Reveals cluster structure that arbitrary column order hides. Essential for correlation matrices with more than ~6 variables.",
    },
  ],
  figureSvg: F027_BEFORE,
  figureCaption: "Before — printed list of pairwise correlations; clusters not visible at a glance.",
  resultFigureSvg: F027_AFTER,
};

const DA_028: Spec = {
  id: "da-028-numpy-broadcast",
  difficulty: "medium",
  title: "28_normalize_per_row.ipynb",
  icon: "shuffle",
  conceptTags: ["numpy", "broadcasting", "shape-mismatch"],
  descriptionMd:
    "## Mission: Normalize Each Row to Sum to 1\n\nYou have a `(1000, 5)` matrix — 1,000 users, 5 categories of spending. You want each **row** to sum to 1 (normalize per user). You wrote `matrix / matrix.sum()` and the result looks weird; checking `result.sum()` gives 1.0 but individual rows don't sum to anything meaningful.\n\nYou divided by the **scalar total** instead of by the **per-row total**. To divide row-by-row, you need an array of 1,000 row sums, broadcast against the `(1000, 5)` matrix. `matrix.sum(axis=1, keepdims=True)` gives you a `(1000, 1)` column of row sums; broadcast against `(1000, 5)` element-wise to normalize each row.",
  initialCode:
    "import numpy as np\n\nrng = np.random.default_rng(4)\nspending = rng.exponential(scale=50, size=(1000, 5))   # 1000 users, 5 categories\n\n# Try to normalize each row to sum to 1.\nrow_normalized = spending / spending.sum()\n\nprint('result shape:', row_normalized.shape)\nprint('whole-matrix sum:', row_normalized.sum().round(2))\nprint('first three row sums:', row_normalized.sum(axis=1)[:3].round(4))",
  buggyLineStart: 7,
  buggyLineEnd: 7,
  traceback:
    "result shape: (1000, 5)\nwhole-matrix sum: 1.0\nfirst three row sums: [0.0020 0.0009 0.0014]\n# Each row sums to its fraction of the global total — not 1 per row.",
  correctOutput:
    "result shape: (1000, 5)\nwhole-matrix sum: 1000.0\nfirst three row sums: [1. 1. 1.]\n# Each row sums to exactly 1.",
  options: [
    {
      key: "a",
      label: "Divide by row sums with `keepdims=True`: `matrix / matrix.sum(axis=1, keepdims=True)`",
      patchCode:
        "import numpy as np\n\nrng = np.random.default_rng(4)\nspending = rng.exponential(scale=50, size=(1000, 5))\n\nrow_normalized = spending / spending.sum(axis=1, keepdims=True)\n\nprint('result shape:', row_normalized.shape)\nprint('whole-matrix sum:', row_normalized.sum().round(2))\nprint('first three row sums:', row_normalized.sum(axis=1)[:3].round(4))",
      isCorrect: true,
      resultLog:
        "result shape: (1000, 5)\nwhole-matrix sum: 1000.0\nfirst three row sums: [1. 1. 1.]",
      rationale:
        "`spending.sum(axis=1)` returns a `(1000,)` array of row sums. With `keepdims=True` it returns `(1000, 1)` — a column. **Broadcasting** then aligns `(1000, 5) / (1000, 1)` element-wise: each row of `spending` is divided by the matching row sum. The `keepdims=True` is the critical detail — without it, you'd get `(1000, 5) / (1000,)` which broadcasts **column-wise**, dividing each *column* by a per-user value, which isn't what you want either.",
    },
    {
      key: "b",
      label: "Use `axis=1` without `keepdims`: `matrix / matrix.sum(axis=1)`",
      patchCode:
        "row_normalized = spending / spending.sum(axis=1)\nprint('shape:', row_normalized.shape)",
      isCorrect: false,
      resultLog:
        "ValueError: operands could not be broadcast together with shapes (1000,5) (1000,)\n# Shape mismatch: numpy can't align (1000, 5) with (1000,).",
      rationale:
        "`spending.sum(axis=1)` is `(1000,)` — a 1-D array. Broadcasting aligns the **trailing dimensions**: `(1000, 5)` vs `(1000,)` → numpy tries to broadcast the `(1000,)` as 5 columns of length 1000, which doesn't match. **You need `keepdims=True`** to get `(1000, 1)`, which broadcasts cleanly with `(1000, 5)`. This is the single most common broadcasting bug for analysts.",
    },
    {
      key: "c",
      label: "Loop over rows and normalize each: `for i in range(len(spending)): spending[i] /= spending[i].sum()`",
      patchCode:
        "import numpy as np\n\nrng = np.random.default_rng(4)\nspending = rng.exponential(scale=50, size=(1000, 5))\n\nfor i in range(len(spending)):\n    spending[i] = spending[i] / spending[i].sum()\n\nprint('first three row sums:', spending.sum(axis=1)[:3].round(4))",
      isCorrect: false,
      resultLog:
        "first three row sums: [1. 1. 1.]\n# Works, but 1000 Python-level iterations; ~100× slower than the vectorized version.",
      rationale:
        "Correct answer; awful performance. A Python loop processes 1,000 rows one at a time; the vectorized `keepdims=True` version does the same work in one numpy call running compiled C code. On 1,000 rows the difference is milliseconds vs sub-millisecond. On 10M rows it's the difference between *seconds* and *minutes*. **Vectorize whenever you can**; loops are a smell in numpy code.",
    },
  ],
  hints: [
    "Print `spending.sum(axis=1).shape` — it's `(1000,)`, a 1-D vector. To broadcast as a column, you need `(1000, 1)` — that's what `keepdims=True` gives you.",
    "Use `spending / spending.sum(axis=1, keepdims=True)`. The `(1000, 1)` row-sum column broadcasts element-wise against the `(1000, 5)` matrix.",
  ],
  explanationMd:
    "### Why the bug occurs\nnumpy's broadcasting aligns operands by **trailing dimensions**, padding with size-1 dimensions on the left as needed. For `(1000, 5) / (1000,)`, numpy tries:\n- `(1000, 5)` ← unchanged\n- `(1000,)` → padded to `(1, 1000)` — that's the shape numpy interprets it as.\n\nThe trailing dimensions are `5` and `1000` — mismatch. Hence the `ValueError`.\n\nFor `(1000, 5) / (1000, 1)` (after `keepdims=True`):\n- `(1000, 5)` ← unchanged\n- `(1000, 1)` ← unchanged\n\nTrailing dims: `5` and `1`. The `1` is broadcastable — numpy replicates the `(1000, 1)` column 5 times to match. Now each row is divided by its own row sum.\n\n### Why the fix is correct\n`keepdims=True` preserves the reduced dimension as size 1, so the result of `sum(axis=1, keepdims=True)` is `(1000, 1)` — broadcastable against `(1000, 5)`. This is the canonical numpy idiom for 'reduce along axis K but keep the axis for broadcasting.'\n\n### Three broadcasting rules to remember\n1. **Align trailing dimensions.** numpy pads with 1s on the left to make shapes the same length.\n2. **Size-1 dimensions broadcast.** A size-1 dim is replicated to match the other operand.\n3. **All non-1, non-equal dims are errors.** No silent reshaping.\n\nWith these three rules you can reason about any numpy operation. A `(1000, 5) / (1000, 1)` is fine; a `(1000, 5) / (1000,)` is not; a `(1000, 5) / (5,)` IS fine (numpy pads to `(1, 5)`, which broadcasts against `(1000, 5)`).\n\n### Always check shapes when something feels off\n```python\nprint(a.shape, b.shape, (a / b).shape)\n```\nIf the result shape isn't what you expected, broadcasting did something unexpected. **Type the shapes yourself before running an operation** when the shapes don't match exactly — you'll catch the bug before it ships.",
  recruiterReview:
    "Strong — you used `keepdims=True` and kept the operation vectorized. `keepdims` is one of those flags juniors skip and then debug for an hour; making it a habit pays dividends. Two follow-ups: 1) for very large matrices, prefer **`np.divide(a, b, out=a)`** to avoid allocating a copy. 2) When broadcasting feels confusing, write down the shapes on paper before typing — `(N, K) / (N, 1)` checks out as `(N, K)`; `(N, K) / (N,)` doesn't. Pen-and-paper resolves more numpy bugs than print statements. Approved. ✅",
  tutorial: {
    bodyMd:
      "## numpy Broadcasting — The Rules\n\nBroadcasting is what makes numpy fast and expressive, but it's also the #1 source of confusing bugs for analysts. Internalising the three rules below pays for itself within an hour.\n\n### Rule 1: Align trailing dimensions\nnumpy aligns shapes from the **right**, padding shorter shapes with size-1 dimensions on the **left**.\n\n```\n(3, 4, 5)   vs   (4, 5)\n         →   (1, 4, 5)\n```\nNow they share trailing `(4, 5)`. The leading `(3,)` broadcasts because `1` is broadcastable.\n\n### Rule 2: Size-1 dimensions broadcast\nA dimension of size 1 is replicated to match the other operand's size in that dimension.\n\n```\n(3, 4) + (1, 4)  → both treated as (3, 4)\n(3, 4) + (3, 1)  → both treated as (3, 4)\n(3, 1) + (1, 4)  → both treated as (3, 4)   # outer product shape\n```\n\n### Rule 3: All other dimensions must be exactly equal\nNo size-1, no equal → error.\n```\n(3, 4) + (3, 5)  → ERROR (trailing 4 vs 5)\n```\n\n### The three classic analyst broadcasting patterns\n\n#### A) Subtract row means\n```python\nrow_means = X.mean(axis=1, keepdims=True)   # (n, 1)\ncentered = X - row_means                     # (n, k) - (n, 1) → (n, k)\n```\n\n#### B) Subtract column means\n```python\ncol_means = X.mean(axis=0)                   # (k,)\ncentered = X - col_means                     # (n, k) - (k,) → (n, k)\n```\nNote: this one *does* work without `keepdims=True`, because `(k,)` aligns to the trailing dim of `(n, k)` directly.\n\n#### C) Outer product\n```python\nx = np.arange(3)         # (3,)\ny = np.arange(4)         # (4,)\nouter = x[:, None] * y[None, :]   # (3, 1) × (1, 4) → (3, 4)\n```\n\n### Why `axis=1` needs `keepdims=True` but `axis=0` doesn't\n- `axis=0` reduces ROWS, leaving a `(k,)` shape. Trailing dim is `k`. Aligns with `(n, k)` directly.\n- `axis=1` reduces COLUMNS, leaving a `(n,)` shape. Trailing dim is `n`, which is `≠ k` — error.\n\n**To broadcast against the original shape after reducing along axis K, set `keepdims=True`.**\n\n### Debugging broadcasting errors\n1. **Print all operand shapes.**\n2. **Mentally apply the three rules.** Align right, pad left with 1s.\n3. **Look for the failing dimension.** It's almost always 'a size-1 dim is missing where I needed one.'\n4. **Add `[:, None]` or `[None, :]` to inject the missing dim.**\n\n```python\na = np.array([1, 2, 3])              # (3,)\nb = np.array([10, 20])               # (2,)\na[:, None] + b[None, :]              # (3, 1) + (1, 2) → (3, 2) outer sum\n```\n\n### When NOT to use broadcasting\n- **Aggregation over groups** (groupby): use `pandas.DataFrame.groupby` or `np.add.reduceat`.\n- **Truly element-wise operations on labeled data** (pandas Series): pandas' alignment is smarter than raw numpy broadcasting.\n- **GPU-accelerated work**: use `torch` or `jax`; broadcasting rules are the same.\n\n### Common reasoning mistakes\n- Forgetting `keepdims=True` after `axis=1` reduction.\n- Confusing `axis=0` (reduces rows; leaves shape `(k,)`) with `axis=1` (reduces cols; leaves shape `(n,)`).\n- Writing Python loops over rows when broadcasting would work.\n- Trying `(N, K) / (K, N)` (transposed) and getting an error instead of the matrix product.\n\n### You just learned…\n**numpy aligns shapes from the right, broadcasts size-1 dims, errors on mismatches.** For reductions along `axis=1`, use `keepdims=True` to get a `(n, 1)` shape that broadcasts against the original `(n, k)`. Always print shapes when something feels off — broadcasting is precise, but your mental model has to match it.",
    videos: [
      { title: "numpy broadcasting rules", searchQuery: "numpy broadcasting rules tutorial beginner" },
      { title: "keepdims and reductions", searchQuery: "numpy keepdims sum mean axis tutorial" },
    ],
  },
  estMinutes: 6,
  conceptCard:
    "This mission is about **numpy broadcasting and `keepdims`**.\n\n- Broadcasting aligns shapes from the **trailing** dimension, padding with 1s on the left.\n- `axis=1` reduction returns a `(n,)` shape; **add `keepdims=True`** to get `(n, 1)` for broadcasting against the original `(n, k)`.\n- Always print shapes when something feels off.\n\nThe code divides by the global total instead of per-row totals. Use `keepdims=True`.",
  lineNotes: [
    { line: 4, noteMd: "1000 users × 5 categories. The grain of the report is the user." },
    { line: 7, noteMd: "**The bug.** `matrix.sum()` is the global sum; you want **row sums**. Use `matrix.sum(axis=1, keepdims=True)` so the broadcast aligns row-wise." },
  ],
  takeaway: "When reducing with axis=1, use keepdims=True so the result broadcasts cleanly against the original shape.",
  glossary: [
    {
      term: "broadcasting (numpy)",
      definitionMd: "numpy's rule for combining arrays of different shapes element-wise. Aligns shapes from the **right**, pads shorter shapes with size-1 dims on the left, and replicates size-1 dims to match the other operand. Element-wise without explicit loops.",
    },
    {
      term: "`keepdims=True`",
      definitionMd: "Parameter on numpy reductions (`sum`, `mean`, `std`, `max`, …). Keeps the reduced axis as size 1 so the result has the same number of dimensions as the input. Essential for broadcasting reductions back against the original array.",
    },
    {
      term: "`axis` parameter",
      definitionMd: "Specifies the axis along which a reduction operates. **`axis=0` reduces ROWS** (collapses the row dimension, returns a per-column result). **`axis=1` reduces COLUMNS** (collapses the column dimension, returns a per-row result). Counter-intuitive at first; memorise it.",
    },
    {
      term: "vectorization",
      definitionMd: "Replacing Python loops with numpy operations that process whole arrays in compiled C. Typically 50-1000× faster than the equivalent loop. The main reason numpy exists.",
    },
    {
      term: "`[:, None]` (slicing trick)",
      definitionMd: "Equivalent to `[:, np.newaxis]`. Inserts a size-1 dimension. Turns `(n,)` into `(n, 1)`. Use to make a 1-D vector broadcast as a column. `[None, :]` makes it broadcast as a row.",
    },
  ],
};

const DA_029: Spec = {
  id: "da-029-nanmean-vs-mean",
  difficulty: "easy",
  title: "29_weekly_mean_with_nan.ipynb",
  icon: "file-warning",
  conceptTags: ["numpy", "nan", "missing-data"],
  descriptionMd:
    "## Mission: Weekly Mean of Page Latency\n\nYou compute the **mean latency per week** from a 6-week metrics array. Some samples are missing (`NaN`). Your code calls `arr.mean(axis=0)` and the result is `[nan, 4.2, nan, 4.8, 4.5, nan]` — three weeks come back as NaN even though they each have hundreds of valid samples.\n\n**numpy propagates NaN by design**: any operation involving NaN returns NaN. The fix is to use **NaN-aware aggregations** — `np.nanmean`, `np.nansum`, `np.nanstd`, etc. They ignore NaN and average over what's left.\n\nThis is a recurring gotcha when data has sensor outages, dropped logs, or null values from upstream joins.",
  initialCode:
    "import numpy as np\n\nrng = np.random.default_rng(5)\n# 100 samples per week, 6 weeks.\nlatency = rng.normal(4.5, 1.0, size=(100, 6))\n# Inject some NaN — missing samples from sensor outages.\nlatency[5, 0] = np.nan\nlatency[12, 2] = np.nan\nlatency[44, 5] = np.nan\n\nweekly = latency.mean(axis=0)\nprint('weekly means:', weekly.round(2))",
  buggyLineStart: 11,
  buggyLineEnd: 11,
  traceback:
    "weekly means: [nan 4.27 nan 4.51 4.49 nan]\n# Three weeks return NaN because each had one missing sample out of 100.\n# numpy propagates NaN by design.",
  correctOutput:
    "weekly means: [4.50 4.27 4.55 4.51 4.49 4.48]\n# All 6 weeks report their real mean; NaN samples were ignored.",
  options: [
    {
      key: "a",
      label: "Use `np.nanmean(latency, axis=0)` — ignores NaN per column",
      patchCode:
        "import numpy as np\n\nrng = np.random.default_rng(5)\nlatency = rng.normal(4.5, 1.0, size=(100, 6))\nlatency[5, 0] = np.nan\nlatency[12, 2] = np.nan\nlatency[44, 5] = np.nan\n\nweekly = np.nanmean(latency, axis=0)\nprint('weekly means:', weekly.round(2))",
      isCorrect: true,
      resultLog:
        "weekly means: [4.50 4.27 4.55 4.51 4.49 4.48]",
      rationale:
        "**`np.nanmean` skips NaN values when computing the mean** — it averages the 99 valid samples instead of returning NaN for the whole column. Every reduction has a NaN-aware sibling: `np.nansum`, `np.nanstd`, `np.nanmedian`, `np.nanpercentile`, `np.nanvar`, `np.nanmax`, `np.nanmin`. Reach for them whenever your data might have NaN; default reductions propagate NaN by design and you'll silently lose entire weeks of data.",
      attachFigure: true,
    },
    {
      key: "b",
      label: "Drop NaN rows: `latency = latency[~np.isnan(latency).any(axis=1)]`",
      patchCode:
        "import numpy as np\n\nrng = np.random.default_rng(5)\nlatency = rng.normal(4.5, 1.0, size=(100, 6))\nlatency[5, 0] = np.nan\nlatency[12, 2] = np.nan\nlatency[44, 5] = np.nan\n\nlatency = latency[~np.isnan(latency).any(axis=1)]\nweekly = latency.mean(axis=0)\nprint('weekly means:', weekly.round(2), 'rows kept:', len(latency))",
      isCorrect: false,
      resultLog:
        "weekly means: [4.50 4.27 4.55 4.51 4.49 4.48] rows kept: 97\n# Output is right but you dropped 3 entire rows (samples 5, 12, 44) because each had one NaN.",
      rationale:
        "Output looks right but **you dropped 3 entire rows of valid data** — rows 5, 12, 44 each had one missing column, so the whole row got cut. For a multi-column report this often means dropping legitimate data from all the *other* columns. `nanmean` ignores NaN **column-by-column independently** — each week's mean uses 99 of 100 samples, not 97 of 100. Use `nanmean` when missingness is sporadic and per-column; drop rows only when missingness is *correlated* (a whole row is unreliable).",
    },
    {
      key: "c",
      label: "Fill NaN with the column mean: `latency = np.where(np.isnan(latency), np.nanmean(latency, axis=0), latency)`",
      patchCode:
        "import numpy as np\n\nrng = np.random.default_rng(5)\nlatency = rng.normal(4.5, 1.0, size=(100, 6))\nlatency[5, 0] = np.nan\nlatency[12, 2] = np.nan\nlatency[44, 5] = np.nan\n\nfill = np.nanmean(latency, axis=0)\nlatency = np.where(np.isnan(latency), fill, latency)\nweekly = latency.mean(axis=0)\nprint('weekly means:', weekly.round(2))",
      isCorrect: false,
      resultLog:
        "weekly means: [4.50 4.27 4.55 4.51 4.49 4.48]\n# Output is right but you IMPUTED — fabricated values where data was missing. Hidden cost.",
      rationale:
        "**This is *mean imputation*** — replacing missing values with the column mean. The result of `nanmean` after imputation is identical to `nanmean` before imputation (mathematically equivalent) — so the imputation is **literally pointless** for this calculation. Worse, it hides the fact that data was missing in any downstream operation (variance is now under-estimated; correlations are biased). **Use `np.nanmean` directly**; don't impute unless you genuinely need to and have a reason to choose mean over median or model-based imputation.",
    },
  ],
  hints: [
    "Print `np.isnan(latency).sum(axis=0)` — see exactly how many NaN per week. Each week has just 1 NaN out of 100, but the column average becomes NaN.",
    "Replace `latency.mean(axis=0)` with `np.nanmean(latency, axis=0)` — same shape, NaN values skipped.",
  ],
  explanationMd:
    "### Why the bug occurs\nnumpy follows IEEE 754: any arithmetic involving NaN produces NaN. `nan + 4.5 = nan`, `(nan + 4.5) / 2 = nan`. The default `mean` sums then divides — so one NaN in 100 samples gives `nan` for the whole average.\n\nThis is **by design**: NaN is supposed to be visible. The trap is that 'visible' here means the entire week's value is `nan`, but the analyst doesn't realise until they plot or report it.\n\n### Why the fix is correct\n`np.nanmean` is the NaN-skipping variant of `np.mean`. It filters NaN values out and averages over what's left, producing a real number when at least one valid value is present (returns NaN with a warning only when *all* values are NaN).\n\nEvery numpy reduction has a NaN-aware sibling:\n- `np.sum` → `np.nansum`\n- `np.mean` → `np.nanmean`\n- `np.std`, `np.var` → `np.nanstd`, `np.nanvar`\n- `np.median` → `np.nanmedian`\n- `np.percentile` → `np.nanpercentile`\n- `np.max`, `np.min` → `np.nanmax`, `np.nanmin`\n- `np.argmax`, `np.argmin` → `np.nanargmax`, `np.nanargmin`\n\nWhen working with sensor data, log data, or anything from a join, reach for these by default.\n\n### When to ignore vs handle vs drop\n- **Ignore (nanmean)**: missingness is *sporadic* and uncorrelated — one missing sample doesn't make the rest of the column unreliable.\n- **Drop**: missingness is *correlated* with something important — a row with one NaN signals the whole row is unreliable (failed instrument, partial transaction).\n- **Impute**: when you need a *non-NaN value* for downstream code (e.g. a feature for a sklearn model). Use median (more robust) over mean; or model-based (KNN, IterativeImputer). **Never** impute the mean just to silence NaN — it biases variance and correlations.\n\n### pandas equivalent\nIn pandas, `Series.mean()` and `DataFrame.mean()` **skip NaN by default** (the opposite of numpy). For numpy semantics, pass `skipna=False`. This pandas/numpy mismatch is one of the most common cross-library bugs.",
  recruiterReview:
    "Strong — you picked `nanmean` instead of dropping rows or imputing. That's the senior-analyst instinct: don't lose data, don't fabricate data, just compute the average of what's actually there. Two follow-ups: 1) when a column has >5% missingness, also report **the count of non-NaN values** alongside the mean — readers should know the sample size. 2) For correlated missingness (whole rows missing because a service went down), tag the bad rows upstream and exclude them with a documented rule, not silently. Approved. ✅",
  tutorial: {
    bodyMd:
      "## NaN-Aware numpy — Skip Missing Without Losing Data\n\nWhenever your data has NaN values — sensor outages, dropped logs, nulls from joins — numpy's default reductions will propagate NaN and silently turn entire columns into 'nan' in your report. The fix is a small habit: **`np.nan*` family of functions** that skip missing values.\n\n### What NaN actually does\nNaN follows IEEE 754 rules:\n- `nan + anything = nan`\n- `nan == nan` is `False` (yes, really)\n- `np.isnan(nan)` is `True` (the way you check)\n- `nan` is preserved across arithmetic, indexing, comparison\n\nThis is **by design** — NaN is supposed to be visible — but the visibility is per-cell, not per-column. Reductions that touch any NaN return NaN; an analyst running `mean(axis=0)` on a column with one NaN out of 1,000 will see `nan` for the whole column, lose the value, and not notice until QA hits.\n\n### The `np.nan*` family\nEvery `np.<reduction>` has a `np.nan<reduction>` sibling:\n```python\nnp.sum, np.nansum\nnp.mean, np.nanmean\nnp.std, np.nanstd, np.nanvar\nnp.median, np.nanmedian\nnp.percentile, np.nanpercentile\nnp.max, np.nanmax, np.min, np.nanmin\nnp.argmax, np.nanargmax, np.argmin, np.nanargmin\nnp.cumsum, np.nancumsum, np.cumprod, np.nancumprod\n```\nAll skip NaN values and compute over the rest. **Use them by default when working with data that might have NaN.**\n\nWith `all-NaN` columns: most `nan*` functions return NaN *with a warning*. `nanargmax` raises `ValueError`. Plan for the warnings or filter columns first.\n\n### Three patterns by missingness shape\n\n#### Pattern 1: Sporadic, uncorrelated (use `nanmean`)\nA few samples missing here and there, no systematic cause. **Skip them per column** — `nanmean(axis=0)` averages over the valid values in each column independently.\n\n#### Pattern 2: Correlated rows (drop them)\nIf a row with one NaN signals the whole row is unreliable (e.g. a failed scan that produced one NaN and other inflated values):\n```python\nclean = arr[~np.isnan(arr).any(axis=1)]\n```\nDocument the rule: 'rows with any NaN dropped because…'\n\n#### Pattern 3: Need a number to feed downstream (impute)\nML pipelines, regression, anything that can't accept NaN. **Use median imputation by default** (robust to outliers); document and validate the choice.\n```python\nfrom sklearn.impute import SimpleImputer\nimp = SimpleImputer(strategy='median')\nclean = imp.fit_transform(arr)\n```\n\n**Mean imputation is the worst choice** — biases the variance estimate (the imputed values have zero variance), inflates correlations (creates spurious co-movement), and is often picked by juniors because it's the obvious default.\n\n### pandas vs numpy — the silent semantic difference\n```python\nimport pandas as pd\n\ns = pd.Series([1, 2, np.nan, 4])\ns.mean()                # 2.333 — skipna=True default\ns.mean(skipna=False)    # nan — numpy semantics\n\nimport numpy as np\nnp.array([1, 2, np.nan, 4]).mean()      # nan — numpy default\nnp.nanmean([1, 2, np.nan, 4])           # 2.333\n```\n**pandas defaults to skipping NaN; numpy defaults to propagating it.** Mix the two and you'll get inconsistent results until you've internalised this difference.\n\n### Checking for NaN\n```python\nnp.isnan(arr).sum()                  # total NaN count\nnp.isnan(arr).sum(axis=0)            # per-column NaN count\nnp.isnan(arr).any()                  # any NaN anywhere?\nnp.where(np.isnan(arr))              # indices of NaN values\n```\n`np.isnan` is the only safe way to check; `arr == np.nan` returns False everywhere because NaN ≠ NaN.\n\n### Common reasoning mistakes\n- `arr.mean()` instead of `np.nanmean(arr)` when data may have NaN.\n- Dropping rows for sporadic missingness (loses data from other columns).\n- Mean imputation as a default (biases everything downstream).\n- Mixing pandas and numpy semantics without remembering the default difference.\n- Forgetting to *count* NaN before reporting averages.\n\n### You just learned…\nnumpy propagates NaN; pandas skips it. For numpy, use the `np.nan*` family (`nanmean`, `nansum`, `nanstd`, etc.) on data that might have NaN. Pick **ignore vs drop vs impute** based on whether missingness is sporadic, correlated, or downstream-blocking. Median > mean for imputation; pre-check NaN counts before reporting averages.",
    videos: [
      { title: "numpy NaN handling", searchQuery: "numpy nanmean nansum tutorial missing data" },
      { title: "Missing data strategies", searchQuery: "handling missing data nan python tutorial" },
    ],
  },
  estMinutes: 5,
  conceptCard:
    "This mission is about **NaN-aware reductions**.\n\n- numpy **propagates NaN** by design: any reduction touching NaN returns NaN for the whole result.\n- `np.nan*` family (`nanmean`, `nansum`, `nanstd`, …) skip NaN and compute over the rest.\n- pandas defaults to skipping NaN — opposite of numpy. Remember the difference when mixing.\n\nThe code uses `mean(axis=0)` and three weeks return NaN. Switch to `np.nanmean`.",
  lineNotes: [
    { line: 5, noteMd: "100 samples per week × 6 weeks of synthetic latency data." },
    { line: 7, noteMd: "Inject 3 NaN values — sensor outages." },
    { line: 11, noteMd: "**The bug.** Default `mean` propagates NaN. Use `np.nanmean(latency, axis=0)`." },
  ],
  takeaway: "When data has NaN, use np.nanmean / nansum / nanstd / etc. — default numpy reductions propagate NaN by design.",
  glossary: [
    {
      term: "NaN (Not a Number)",
      definitionMd: "IEEE 754 floating-point sentinel for 'missing' or 'undefined.' Any arithmetic touching NaN returns NaN. `NaN == NaN` is `False`; use `np.isnan(x)` to check.",
    },
    {
      term: "NaN propagation",
      definitionMd: "Default behaviour of numpy reductions: any NaN in the input produces NaN in the output. Designed so missing data is visible — but means whole columns silently become NaN from a single missing sample.",
    },
    {
      term: "`np.nan*` family",
      definitionMd: "NaN-aware variants of every numpy reduction: `nansum`, `nanmean`, `nanstd`, `nanvar`, `nanmedian`, `nanpercentile`, `nanmax`, `nanmin`, `nancumsum`, etc. Each skips NaN values and computes over the rest.",
    },
    {
      term: "mean imputation",
      definitionMd: "Replacing NaN with the column mean. **The worst common imputation choice** — biases variance (imputed values have zero variance), inflates correlations (spurious co-movement), and is often picked by default. Median > mean if you must impute.",
    },
    {
      term: "pandas `skipna` parameter",
      definitionMd: "pandas reductions skip NaN by default (`skipna=True`); pass `skipna=False` for numpy semantics. **Opposite default from numpy.** Remember when mixing pandas and numpy code.",
    },
  ],
  figureSvg: F029_BEFORE,
  figureCaption: "Before — three weeks (W1, W3, W6) come back as NaN because each had one missing sample.",
  resultFigureSvg: F029_AFTER,
};

const DA_030: Spec = {
  id: "da-030-random-seed-reproducibility",
  difficulty: "medium",
  title: "30_two_runs_disagree.ipynb",
  icon: "rotate-ccw",
  conceptTags: ["numpy", "random", "reproducibility"],
  descriptionMd:
    "## Mission: 'I Ran the A/B Sim Twice and Got Two Answers'\n\nYou ran a simulation to estimate the variance of an A/B test outcome under random user allocation. The first run reported `effect = 1.23%`; you re-ran the same code five minutes later and got `effect = 0.97%`. Your colleague will see *both* numbers in the deck and ask which is right.\n\nWithout a **seed**, every run of numpy's random sampler produces different values. For an analyst, this means **your results are not reproducible** — no one can verify them, and you can't track down a discrepancy. Seed your random generator with `numpy.random.default_rng(seed)` and the same code produces the same output every time.",
  initialCode:
    "import numpy as np\n\n# Simulate one A/B test outcome with no seed.\ndef one_run():\n    # 5,000 users assigned to A or B; B has a +0.5% lift in conversion.\n    rng = np.random.default_rng()   # ← no seed\n    n = 5000\n    group = rng.choice(['A', 'B'], size=n)\n    base_p = 0.10\n    converted = (rng.uniform(size=n) < (base_p + 0.005 * (group == 'B'))).astype(int)\n    p_a = converted[group == 'A'].mean()\n    p_b = converted[group == 'B'].mean()\n    return p_b - p_a\n\nrun1 = one_run()\nrun2 = one_run()\nprint(f'run1 effect: {run1:.4f}')\nprint(f'run2 effect: {run2:.4f}')\nprint('reproducible?', run1 == run2)",
  buggyLineStart: 6,
  buggyLineEnd: 6,
  traceback:
    "run1 effect: 0.0123\nrun2 effect: 0.0097\nreproducible? False\n# Two runs of the same code disagree — no one can verify the deck.",
  correctOutput:
    "run1 effect: 0.0123\nrun2 effect: 0.0123\nreproducible? True\n# Same seed → same random draws → same output. Reproducible.",
  options: [
    {
      key: "a",
      label: "Pass a fixed integer to `default_rng(42)` — the modern numpy seed pattern",
      patchCode:
        "import numpy as np\n\ndef one_run(seed: int = 42):\n    rng = np.random.default_rng(seed)\n    n = 5000\n    group = rng.choice(['A', 'B'], size=n)\n    base_p = 0.10\n    converted = (rng.uniform(size=n) < (base_p + 0.005 * (group == 'B'))).astype(int)\n    p_a = converted[group == 'A'].mean()\n    p_b = converted[group == 'B'].mean()\n    return p_b - p_a\n\nrun1 = one_run()\nrun2 = one_run()\nprint(f'run1 effect: {run1:.4f}')\nprint(f'run2 effect: {run2:.4f}')\nprint('reproducible?', run1 == run2)",
      isCorrect: true,
      resultLog:
        "run1 effect: 0.0123\nrun2 effect: 0.0123\nreproducible? True",
      rationale:
        "`numpy.random.default_rng(seed)` is **the modern numpy random API** (since 1.17, 2019). Pass an integer (anything works — 42 is the cliché, but use whatever) and the sequence of random numbers is identical on every run. **Each function that needs randomness should accept a `seed` parameter** with a sensible default. For a Monte Carlo simulation, you'd run with many different seeds and aggregate — but each individual run is reproducible.",
    },
    {
      key: "b",
      label: "Use the legacy global state: `np.random.seed(42)`",
      patchCode:
        "import numpy as np\n\nnp.random.seed(42)   # ← legacy global state\n\ndef one_run():\n    n = 5000\n    group = np.random.choice(['A', 'B'], size=n)\n    base_p = 0.10\n    converted = (np.random.uniform(size=n) < (base_p + 0.005 * (group == 'B'))).astype(int)\n    p_a = converted[group == 'A'].mean()\n    p_b = converted[group == 'B'].mean()\n    return p_b - p_a\n\nrun1 = one_run()\nrun2 = one_run()\nprint(f'run1 effect: {run1:.4f}')\nprint(f'run2 effect: {run2:.4f}')\nprint('reproducible?', run1 == run2)",
      isCorrect: false,
      resultLog:
        "run1 effect: 0.0107\nrun2 effect: 0.0091\nreproducible? False\n# Two runs of the same code STILL disagree — because run1 advanced the global RNG state, leaving run2 starting from where run1 left off.",
      rationale:
        "`np.random.seed` sets the **global RNG state**, but every random call advances it. Calling `one_run()` twice consumes one batch of randoms for run1; run2 starts where run1 left off. Same code, different outputs. The fix is to reset the seed *inside* `one_run` — or use the modern `default_rng(seed)` pattern which creates a *local* generator per call. **Global random state is one of the most common reproducibility bugs**; the modern API replaced it for exactly this reason.",
    },
    {
      key: "c",
      label: "Run more iterations and take the average — variance washes out",
      patchCode:
        "import numpy as np\n\nrng = np.random.default_rng()\n\ndef one_run():\n    n = 5000\n    group = rng.choice(['A', 'B'], size=n)\n    base_p = 0.10\n    converted = (rng.uniform(size=n) < (base_p + 0.005 * (group == 'B'))).astype(int)\n    return converted[group == 'B'].mean() - converted[group == 'A'].mean()\n\nresults = [one_run() for _ in range(1000)]\nprint(f'mean effect across 1000 runs: {np.mean(results):.4f}')",
      isCorrect: false,
      resultLog:
        "mean effect across 1000 runs: 0.0049\n# Tighter answer; but you still can't reproduce the 0.0049 — it's *also* random.",
      rationale:
        "A Monte Carlo average IS a useful technique — variance does wash out as N grows — but the *average itself* still depends on the random seed. Without a seed, the average of 1000 runs is also not reproducible (it'll be close, but not identical). **Reproducibility and convergence are independent problems**: even when you average over many runs to reduce variance, you should still seed the runs so the average is bit-exact replayable. The two together: seed your simulations *and* run many of them.",
    },
  ],
  hints: [
    "Without a seed, `default_rng()` uses the OS's entropy source — different on every run. Pass an integer seed for determinism.",
    "Use `np.random.default_rng(42)` — the modern numpy random API. Each function with randomness should accept `seed` as a parameter.",
  ],
  explanationMd:
    "### Why the bug occurs\n`np.random.default_rng()` (no argument) seeds from the OS's entropy source — different on every run. Without a fixed seed, the same code produces different numbers every time. For exploratory work this is fine; for a *result you want to verify* it's a reproducibility bug.\n\n### Why the fix is correct\nPassing an integer to `default_rng(seed)` initialises the pseudo-random generator deterministically. The same seed produces the same sequence of pseudo-random numbers, every run, on every machine, forever. This is the foundation of **scientific reproducibility** in any code that uses randomness.\n\n### Modern vs legacy numpy random\nnumpy has two random APIs:\n- **Legacy (pre-1.17, 2019)**: `np.random.seed(42)`, `np.random.randn(...)`, global state.\n- **Modern (1.17+)**: `np.random.default_rng(42)`, `rng.normal(...)`, local generator instances.\n\n**Always prefer the modern API.** It avoids global state bugs (option B's pitfall), supports better PRNG algorithms (`PCG64` by default vs the legacy Mersenne Twister), and makes seeding visible at the call site.\n\nThe legacy API still works for backwards compatibility, but new code should not use it.\n\n### Patterns for reproducibility in analysis code\n\n#### Pattern 1: top-of-script seed\n```python\nSEED = 42\nrng = np.random.default_rng(SEED)\n# use rng.normal, rng.choice, ... throughout the script\n```\nFor exploratory notebooks. One seed, reused.\n\n#### Pattern 2: function-level seed parameter\n```python\ndef simulate(n: int, *, seed: int = 0) -> float:\n    rng = np.random.default_rng(seed)\n    ...\n```\nFor library code or shared functions. Each call is independently reproducible; caller controls the seed.\n\n#### Pattern 3: Monte Carlo with seeded sub-runs\n```python\nresults = [simulate(n, seed=i) for i in range(1000)]\nmean_effect = np.mean(results)\n```\nEach sub-run is reproducible (seed=i); the aggregate is reproducible (same set of seeds); variance washes out from averaging. **Best practice for stochastic estimation.**\n\n### Reproducibility caveats\n- **PRNG output isn't guaranteed across numpy major versions.** numpy 1.17 → 2.0 may shift the legacy stream. The modern API (`default_rng`) is more stable but not bit-exact across all versions.\n- **Different OS / architectures** can produce slightly different floats from the same seed (in edge cases). For most analyst work this is invisible; for cryptographic or scientific work check the spec.\n- **Parallel code** needs careful seed management. `rng.spawn(n)` (numpy 1.25+) creates `n` independent child generators with reproducible streams.\n\n### Tracking down a 'two runs disagree' bug\n1. Are any random calls unseeded? Search for `np.random.<anything>` without a prior `default_rng(seed)`.\n2. Is the RNG passed through to all helpers? If `simulate()` creates `rng = default_rng(seed)` but calls `helper()` that creates its own `default_rng()` (no seed), you've leaked randomness.\n3. Does the code depend on dictionary iteration order, set ordering, or wall-clock time? Those add non-determinism beyond the RNG.",
  recruiterReview:
    "Strong — you used the modern `default_rng(seed)` pattern and recognised the global-state trap of `np.random.seed`. Two follow-ups for production: 1) for stakeholder-facing reports, **log the seed** alongside the result (`'effect=0.0123 (seed=42)'`) so the number is verifiable. 2) For Monte Carlo work, prefer `rng.spawn(n)` (numpy 1.25+) to generate `n` independent reproducible sub-generators for parallel runs. Approved. ✅",
  tutorial: {
    bodyMd:
      "## Reproducible Randomness — `default_rng(seed)`\n\nReproducibility is a foundation of any numerical work that's going to be reviewed, replayed, or extended. Random code without a seed is **the most common reproducibility bug**, and the fix is one line.\n\n### Why reproducibility matters\nWithout a seed:\n- Your colleague can't replicate your number.\n- A bug discovered next week can't be replayed from the same data.\n- A regression test can't compare 'before' to 'after.'\n- You can't track which version of the code produced which number.\n\nWith a seed:\n- Every run produces the same number.\n- Any reviewer can verify.\n- Regression tests are possible.\n- The seed becomes a tracking dimension: `'effect=0.012 (seed=42)'` is fully replayable.\n\n### Modern numpy random — `default_rng`\n```python\nrng = np.random.default_rng(seed=42)\nx = rng.normal(0, 1, size=1000)\ny = rng.choice([0, 1], size=100)\n```\n- `default_rng(seed)` returns a `numpy.random.Generator` instance.\n- The instance has methods for all distributions: `normal`, `uniform`, `choice`, `integers`, `permutation`, etc.\n- **All methods consume the generator's state**, so consecutive calls produce independent streams.\n- Two generators with the same seed produce identical streams; two with different seeds are independent.\n\n### Legacy API (do not use in new code)\n```python\nnp.random.seed(42)\nx = np.random.normal(0, 1, size=1000)\n```\nThis uses a **single global generator state**. Problems:\n- Any other code (a third-party library, an import side effect) that calls `np.random.<anything>` modifies that state. Your seed doesn't guarantee reproducibility if anything else is touching it.\n- Threading is dangerous: two threads share the state, race conditions corrupt streams.\n- The legacy generator uses Mersenne Twister; the modern one uses PCG64, with better statistical properties.\n\n**Use `default_rng` everywhere.**\n\n### Patterns by use case\n\n#### Exploratory notebook\n```python\nSEED = 42\nrng = np.random.default_rng(SEED)\n# use rng.* throughout\n```\nOne seed at the top; reused for the session.\n\n#### Library / shared function\n```python\ndef bootstrap_mean(data, n_boot=10000, *, seed=0):\n    rng = np.random.default_rng(seed)\n    return [rng.choice(data, size=len(data), replace=True).mean() for _ in range(n_boot)]\n```\nEvery function that uses randomness takes a `seed` parameter. The caller controls reproducibility.\n\n#### Monte Carlo\n```python\nseeds = range(1000)\nresults = [simulate(seed=s) for s in seeds]\nestimate = np.mean(results)\nci = np.percentile(results, [2.5, 97.5])\n```\nEach run is reproducible; the aggregate (mean + CI) is reproducible; variance washes out from averaging. **The right pattern for stochastic estimation.**\n\n#### Parallel Monte Carlo (numpy ≥ 1.25)\n```python\nrng = np.random.default_rng(42)\nchildren = rng.spawn(1000)   # 1000 independent reproducible sub-generators\nresults = [simulate(child) for child in children]   # can be parallelised\n```\n`spawn` is the right way to seed sub-generators for parallel work; don't pass the same seed to multiple workers or you'll get identical streams.\n\n### Mixing numpy with other random sources\nIf your simulation also uses Python's `random`, `torch`, or `sklearn`'s `random_state`, **seed each one separately**:\n```python\nimport random\nrandom.seed(42)\nimport torch\ntorch.manual_seed(42)\nrng = np.random.default_rng(42)\nclf = RandomForestClassifier(random_state=42)\n```\nSeeding one doesn't seed the others. For sklearn, pass `random_state=42` to any estimator that uses randomness (sampling, splits, init).\n\n### Reproducibility caveats\n- **numpy version**: the modern `default_rng` is stable across patch versions but not guaranteed bit-exact across major versions. Pin numpy in `requirements.txt`.\n- **OS / CPU architecture**: floats are usually identical; tail-edge cases may differ. For analytics this is invisible; for ultra-precise sci work, check.\n- **Threading / parallel**: use `rng.spawn` not separate `default_rng(seed)` calls.\n- **Dictionary / set ordering**: Python 3.7+ dicts are insertion-ordered; sets are not. If your code depends on set iteration order, you're still non-deterministic even with a seed.\n\n### Logging seeds for verifiable results\nFor any number that ships to stakeholders:\n```python\nlog.info(f'effect={effect:.4f} seed={seed} numpy_version={np.__version__}')\n```\nA reviewer can replicate the number with just the seed and the version. This is what 'reproducible analytics' actually looks like in practice.\n\n### Common reasoning mistakes\n- Using `default_rng()` without a seed for results that need to be reproducible.\n- Using legacy `np.random.seed` and being surprised when a library touches global state.\n- Seeding numpy but forgetting Python `random` or `torch` or sklearn `random_state`.\n- Re-seeding inside a loop with the same seed (every iteration produces identical 'random' values).\n- Believing that averaging many runs replaces reproducibility (no — average over seeded runs).\n\n### You just learned…\n**Reproducibility is one line: `rng = np.random.default_rng(seed)`**. The modern API gives you local generator state, better PRNG quality, and clean function-level reproducibility. Every random function in your codebase should accept a `seed` parameter; log seeds alongside published results so reviewers can verify them.",
    videos: [
      { title: "numpy default_rng tutorial", searchQuery: "numpy default_rng modern random tutorial" },
      { title: "Reproducible Monte Carlo", searchQuery: "monte carlo simulation seed reproducible python tutorial" },
    ],
  },
  estMinutes: 6,
  conceptCard:
    "This mission is about **reproducible random sampling**.\n\n- `np.random.default_rng()` (no seed) is OS-entropy-seeded — different on every run.\n- `np.random.default_rng(42)` is **deterministic** — same code, same result, every run, every machine.\n- Functions that use randomness should accept a `seed` parameter; legacy `np.random.seed` has global-state hazards.\n\nThe code uses `default_rng()` without a seed; two runs give different answers. Pass a seed.",
  lineNotes: [
    { line: 4, noteMd: "Function that produces a stochastic estimate." },
    { line: 6, noteMd: "**The bug.** `default_rng()` without an argument uses OS entropy — different every run. Pass an integer seed." },
    { line: 7, noteMd: "5000 random user assignments — depends on the seed." },
  ],
  takeaway: "Reproducibility is one line: rng = np.random.default_rng(seed). Use the modern API; log seeds alongside results.",
  glossary: [
    {
      term: "PRNG (pseudo-random number generator)",
      definitionMd: "Algorithm that produces a deterministic stream of numbers that *look* random. Seeded once; same seed → same stream. 'Pseudo' because they're not truly random — they're cryptographic-quality predictability.",
    },
    {
      term: "seed",
      definitionMd: "Initial state of a PRNG. Same seed → same stream. Without a seed, the OS entropy source is used (clock + entropy pool) and the stream differs every run.",
    },
    {
      term: "`np.random.default_rng`",
      definitionMd: "Modern numpy random API (since 1.17, 2019). Returns a `Generator` instance with `normal`, `uniform`, `choice`, `integers`, etc. methods. **Always preferred** over the legacy `np.random.seed` + global state.",
    },
    {
      term: "PCG64",
      definitionMd: "Default PRNG algorithm in modern numpy. Better statistical properties than the legacy Mersenne Twister; faster; smaller state. Used automatically by `default_rng`.",
    },
    {
      term: "Monte Carlo simulation",
      definitionMd: "Running many random sub-simulations and aggregating their outputs to estimate a quantity. Variance shrinks like `1/sqrt(n)`. Best practice: each sub-run is seeded individually so the aggregate is reproducible.",
    },
  ],
};

const SPECS = [DA_026, DA_027, DA_028, DA_029, DA_030];
for (const spec of SPECS) {
  const composed = compose(spec);
  const filePath = join(OUT_DIR, `${spec.id}.json`);
  writeFileSync(filePath, JSON.stringify(composed, null, 2));
  console.log(`wrote ${filePath}`);
}
console.log(`authored ${SPECS.length} numpy/chart da challenges`);
