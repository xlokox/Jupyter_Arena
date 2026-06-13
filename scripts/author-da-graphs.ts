#!/usr/bin/env -S tsx
/**
 * Dev-time batch — composes the da-016..025 graph challenge JSON files by
 * stitching a per-challenge content map together with the SVG strings minted
 * by mint-da-figures.ts. Writes each challenge to content/challenges/da/*.json,
 * idempotent. Run after mint-da-figures.ts:
 *
 *   pnpm exec tsx scripts/mint-da-figures.ts
 *   pnpm exec tsx scripts/author-da-graphs.ts
 *
 * Each spec mirrors the Zod schema. Tutorial bodies live in this file so the
 * authoring is co-located; reviewers see one diff per challenge.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const FIGURES: Record<string, string> = JSON.parse(
  readFileSync("/tmp/da-figures.json", "utf8"),
);
const OUT_DIR = join(__dirname, "..", "content", "challenges", "da");

interface DaSpec {
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
    /** When true, attach the *-after figure as resultFigureSvg (correct option only by convention). */
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
  figureCaption: string;
}

function compose(spec: DaSpec) {
  const figureSvg = FIGURES[`${spec.id.slice(0, 6)}-before`];
  const resultFigureSvg = FIGURES[`${spec.id.slice(0, 6)}-after`];
  if (!figureSvg || !resultFigureSvg) {
    throw new Error(`missing figures for ${spec.id}`);
  }
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
      ...(o.attachFigure ? { resultFigureSvg } : {}),
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
    figureSvg,
    figureCaption: spec.figureCaption,
  };
}

// ── da-016 ── plt.show() missing ─────────────────────────────────────────
const DA_016: DaSpec = {
  id: "da-016-missing-plt-show",
  difficulty: "easy",
  title: "16_monthly_revenue.ipynb",
  icon: "bar-chart-3",
  conceptTags: ["matplotlib", "plt-show", "plotting"],
  descriptionMd:
    "## Mission: Where Did the Chart Go?\n\nYou wrote six lines of matplotlib to plot monthly revenue and your boss asked for the chart. You ran the cell — and nothing. No figure window, no embedded image, just text output saying `<Figure size 700x400 with 1 Axes>`.\n\nThat repr is your hint. matplotlib **built** the figure but never **rendered** it. In a notebook with `%matplotlib inline` the figure usually shows on its own at the end of the cell, but as soon as you assign or print the figure handle the auto-display is suppressed. Add the one missing call.",
  initialCode:
    "import matplotlib.pyplot as plt\n\nmonths = [\"Jan\", \"Feb\", \"Mar\", \"Apr\", \"May\", \"Jun\"]\nrevenue = [4200, 4500, 4900, 5100, 5400, 5800]\n\nfig, ax = plt.subplots(figsize=(7, 4))\nax.bar(months, revenue, color=\"#7CD992\")\nax.set_title(\"monthly_revenue_2025.png\")\nax.set_xlabel(\"month\")\nax.set_ylabel(\"revenue (USD)\")\nprint(fig)",
  buggyLineStart: 11,
  buggyLineEnd: 11,
  traceback:
    "<Figure size 700x400 with 1 Axes>\n# the figure built but never rendered — printing the handle suppressed the auto-display",
  correctOutput:
    "<Figure size 700x400 with 1 Axes>\n# figure rendered below — bars climbing Jan → Jun, ~4200 → 5800",
  options: [
    {
      key: "a",
      label: "Call `plt.show()` at the end",
      patchCode:
        "import matplotlib.pyplot as plt\n\nmonths = [\"Jan\", \"Feb\", \"Mar\", \"Apr\", \"May\", \"Jun\"]\nrevenue = [4200, 4500, 4900, 5100, 5400, 5800]\n\nfig, ax = plt.subplots(figsize=(7, 4))\nax.bar(months, revenue, color=\"#7CD992\")\nax.set_title(\"monthly_revenue_2025.png\")\nax.set_xlabel(\"month\")\nax.set_ylabel(\"revenue (USD)\")\nplt.show()",
      isCorrect: true,
      resultLog:
        "<Figure size 700x400 with 1 Axes>\n# figure rendered below — bars climbing Jan → Jun, ~4200 → 5800",
      rationale:
        "`plt.show()` flushes the active figure to the renderer (inline image in Jupyter, GUI window in a script). It's the explicit \"draw what I built\" call. The notebook's normal auto-display happens when the last expression of a cell *is* a figure; once you printed `fig`, the last expression was `None` (the return of `print`), and the auto-display didn't fire. `plt.show()` makes the rendering unconditional and is the safer habit.",
      attachFigure: true,
    },
    {
      key: "b",
      label: "Save the figure to disk so you can open it manually",
      patchCode:
        "import matplotlib.pyplot as plt\n\nmonths = [\"Jan\", \"Feb\", \"Mar\", \"Apr\", \"May\", \"Jun\"]\nrevenue = [4200, 4500, 4900, 5100, 5400, 5800]\n\nfig, ax = plt.subplots(figsize=(7, 4))\nax.bar(months, revenue, color=\"#7CD992\")\nax.set_title(\"monthly_revenue_2025.png\")\nax.set_xlabel(\"month\")\nax.set_ylabel(\"revenue (USD)\")\nprint(fig)\nfig.savefig(\"/tmp/monthly_revenue_2025.png\")",
      isCorrect: false,
      resultLog:
        "<Figure size 700x400 with 1 Axes>\n# figure saved to /tmp/monthly_revenue_2025.png — but still no inline render",
      rationale:
        "Writes the figure to disk, but the notebook still shows nothing inline — your boss is asking \"where's the chart?\" again. Saving is for shipping a final image; for showing it in the notebook, call `plt.show()` (and remove the `print(fig)` that suppresses auto-display).",
    },
    {
      key: "c",
      label: "Remove the `print(fig)` and trust the notebook auto-display",
      patchCode:
        "import matplotlib.pyplot as plt\n\nmonths = [\"Jan\", \"Feb\", \"Mar\", \"Apr\", \"May\", \"Jun\"]\nrevenue = [4200, 4500, 4900, 5100, 5400, 5800]\n\nfig, ax = plt.subplots(figsize=(7, 4))\nax.bar(months, revenue, color=\"#7CD992\")\nax.set_title(\"monthly_revenue_2025.png\")\nax.set_xlabel(\"month\")\nax.set_ylabel(\"revenue (USD)\")",
      isCorrect: false,
      resultLog: "# (no output — relying on notebook auto-display, which doesn't trigger in scripts)",
      rationale:
        "Often works in a Jupyter cell — the last expression `ax.set_ylabel(...)` evaluates to the Text object, not the figure, so auto-display is hit or miss. And in a plain `.py` script it does nothing. `plt.show()` is the rendering call that works in every context; reach for it.",
    },
  ],
  hints: [
    "Read what the cell printed: `<Figure size 700x400 with 1 Axes>`. matplotlib built a figure but never *rendered* it.",
    "Add `plt.show()` as the last line. That's the call that flushes the active figure to the inline display (or GUI window).",
  ],
  explanationMd:
    "### Why the bug occurs\nmatplotlib separates **building** a figure (`subplots`, `bar`, `set_title`) from **rendering** it. In a Jupyter notebook the last expression of a cell is auto-displayed — *if* it happens to be a figure. Print the figure (or assign it, or call something that returns `None` last) and the auto-display step doesn't fire. The figure object exists in memory; you just never told matplotlib to show it.\n\n### Why the fix is correct\n`plt.show()` renders the active figure to whatever backend matplotlib is using — inline image in Jupyter, GUI window in a script, PNG bytes in a headless server. It's unconditional and explicit, so the chart appears regardless of what the rest of the cell does. The general habit: **build with `ax.*`, render with `plt.show()`**. It's also the call that flushes pending state so the next cell starts clean.",
  recruiterReview:
    "Good — you recognised that matplotlib's figure-object repr is a smell, not a successful render, and reached for `plt.show()`. Two follow-ups: 1) in a notebook you can also write `display(fig)` or just leave `fig` as the last expression — but in scripts `plt.show()` is the portable answer. 2) When you have multiple figures in one cell, each needs its own `plt.show()` or you'll see them stacked oddly. Approved. ✅",
  tutorial: {
    bodyMd:
      "## How matplotlib Figures Get to the Screen\n\nmatplotlib has a build/render split that trips up almost every new analyst. Once you see it once, it never confuses you again.\n\n### The two phases\n```python\nfig, ax = plt.subplots()    # build — creates the Figure and Axes objects\nax.bar(x, y)                # build — adds bars to the axes\nax.set_xlabel(\"x\")          # build — sets a label\nplt.show()                  # render — draws the figure where it can be seen\n```\nThe first three lines don't show anything — they only configure objects in memory. `plt.show()` is the call that flushes them to the renderer.\n\n### Why a Jupyter cell *sometimes* shows the chart anyway\nJupyter auto-displays the **last expression** of a cell. If that expression evaluates to a Figure (or anything with a `_repr_html_` / `_repr_png_`), Jupyter renders it. So\n```python\nfig, ax = plt.subplots()\nax.bar(x, y)\nfig                           # last expression — Figure object — auto-displays\n```\nworks. But the moment you add a final line that returns something else (`print(fig)`, `ax.set_title(...)`, an assignment, an `import`), the auto-display chain breaks and you see nothing.\n\nThe fix is to be explicit:\n```python\nplt.show()\n```\nNow it doesn't matter what the last expression is — matplotlib renders whatever's pending.\n\n### `plt.show()` vs `fig.show()` vs `display(fig)`\n- `plt.show()` — renders the **currently active** figure(s) using the configured backend. In Jupyter that's inline; in a script, a GUI window.\n- `fig.show()` — renders just `fig`. Useful when you have multiple figures.\n- `display(fig)` — works in Jupyter (it's from IPython). Bypasses the auto-display chain.\n\nIn a notebook with `%matplotlib inline`, `plt.show()` is the most-portable choice.\n\n### Saving vs showing\n```python\nfig.savefig(\"chart.png\", dpi=150)\n```\nWrites the figure to disk — useful for reports — but **doesn't** show it inline. If you want both, do both.\n\n### A small worked example\n```python\nimport matplotlib.pyplot as plt\n\nmonths = [\"Jan\", \"Feb\", \"Mar\"]\nrevenue = [42, 47, 51]\n\nfig, ax = plt.subplots(figsize=(6, 4))\nax.bar(months, revenue, color=\"#7CD992\")\nax.set_title(\"Q1 revenue\")\nax.set_xlabel(\"month\")\nax.set_ylabel(\"revenue (k)\")\nplt.show()\n```\nThe `plt.show()` is the line that makes the chart appear. Drop it and you have a beautifully configured invisible figure.\n\n### The `%matplotlib inline` magic\nA notebook line `%matplotlib inline` (often in the first cell) tells matplotlib to render inline images instead of opening GUI windows. It's the standard for Jupyter and is what makes `plt.show()` produce an embedded PNG.\n\n### Common beginner mistakes\n- Building a figure and forgetting `plt.show()` (the bug).\n- Printing the figure and being surprised by `<Figure size ...>`.\n- Calling `plt.show()` inside a `for` loop without `plt.close(fig)` afterwards — memory leak in long-running scripts.\n- Mixing `plt.bar(...)` (state-machine API) with `ax.bar(...)` (object-oriented API). Pick one; OO is clearer in longer scripts.\n\n### You just learned…\nmatplotlib **builds** then **renders**. `plt.show()` is the render call. In Jupyter, the auto-display chain rescues you when your last cell expression *is* the figure, but the moment something else takes that slot, the chart vanishes. Make `plt.show()` a habit and you'll never debug a missing figure again.",
    videos: [
      {
        title: "matplotlib plt.show() and the build/render split",
        searchQuery: "matplotlib plt show beginner tutorial figure render",
      },
      {
        title: "Why my matplotlib chart doesn't appear",
        searchQuery: "matplotlib figure not showing notebook fix beginner",
      },
    ],
  },
  estMinutes: 5,
  conceptCard:
    "This mission is about **how matplotlib gets a figure on screen**.\n\n- `subplots()` / `ax.bar(...)` only **build** the figure in memory.\n- `plt.show()` is the call that **renders** it to the notebook (or GUI).\n- The Jupyter auto-display only fires when the last expression *is* the figure; `print(fig)` suppresses it.\n\nThe code prints the figure handle (`<Figure …>`) instead of rendering. Add `plt.show()` as the last line.",
  lineNotes: [
    {
      line: 1,
      noteMd: "Standard import — `plt` is the figure builder & renderer entry point.",
    },
    {
      line: 6,
      noteMd: "Creates a Figure and an Axes — in memory only, nothing on screen yet.",
    },
    {
      line: 7,
      noteMd: "Adds bars. Still in memory; the renderer hasn't been asked to draw.",
    },
    {
      line: 11,
      noteMd:
        "**The bug.** `print(fig)` shows the repr string and breaks Jupyter's auto-display chain. Replace with `plt.show()`.",
    },
  ],
  takeaway: "Building a figure is not rendering it — end the cell with plt.show() to show the chart.",
  figureCaption:
    "Before — the cell prints '<Figure size 700x400 with 1 Axes>' and nothing renders.",
};

// ── da-017 ── wrong x-axis labels ────────────────────────────────────────
const DA_017: DaSpec = {
  id: "da-017-wrong-xtick-labels",
  difficulty: "easy",
  title: "17_top_products.ipynb",
  icon: "bar-chart-3",
  conceptTags: ["matplotlib", "xticks", "labels"],
  descriptionMd:
    "## Mission: Label the Bars\n\nYour chart of `top 5 products by units sold` came out with the right *shape* — five bars, descending heights — but the x-axis labels are `0, 1, 2, 3, 4`. The values are right; the labels are wrong. Your boss can't tell which bar is `mug` and which is `bag`.\n\nThe trap: `ax.bar(products, sales)` would label automatically, but you wrote `ax.bar(range(len(sales)), sales)` and forgot to tell the axis what to call those numeric positions. Use the right `bar()` arguments — or set the ticks afterwards.",
  initialCode:
    "import matplotlib.pyplot as plt\n\nproducts = [\"mug\", \"tee\", \"pen\", \"cap\", \"bag\"]\nsales    = [320, 280, 240, 200, 160]\n\nfig, ax = plt.subplots(figsize=(7, 4))\nax.bar(range(len(sales)), sales, color=\"#E8B65A\")\nax.set_title(\"top_products_q2.png\")\nax.set_xlabel(\"product\")\nax.set_ylabel(\"units sold\")\nplt.show()",
  buggyLineStart: 7,
  buggyLineEnd: 7,
  traceback:
    "<Figure size 700x400 with 1 Axes>\n# x-axis labels are 0, 1, 2, 3, 4 — should be mug, tee, pen, cap, bag",
  correctOutput:
    "<Figure size 700x400 with 1 Axes>\n# bars labelled mug, tee, pen, cap, bag below the right heights",
  options: [
    {
      key: "a",
      label: "Pass the names to `bar()` directly: `ax.bar(products, sales, …)`",
      patchCode:
        "import matplotlib.pyplot as plt\n\nproducts = [\"mug\", \"tee\", \"pen\", \"cap\", \"bag\"]\nsales    = [320, 280, 240, 200, 160]\n\nfig, ax = plt.subplots(figsize=(7, 4))\nax.bar(products, sales, color=\"#7CD992\")\nax.set_title(\"top_products_q2.png\")\nax.set_xlabel(\"product\")\nax.set_ylabel(\"units sold\")\nplt.show()",
      isCorrect: true,
      resultLog:
        "<Figure size 700x400 with 1 Axes>\n# bars labelled mug, tee, pen, cap, bag — heights unchanged",
      rationale:
        "When `bar()`'s first argument is a list of strings, matplotlib uses them as **categorical** x-positions: one bar per name, name printed below. No manual tick-setting needed. This is the cleanest fix and reads exactly like the code's intent.",
      attachFigure: true,
    },
    {
      key: "b",
      label: "Set the labels manually with `ax.set_xticklabels(products)`",
      patchCode:
        "import matplotlib.pyplot as plt\n\nproducts = [\"mug\", \"tee\", \"pen\", \"cap\", \"bag\"]\nsales    = [320, 280, 240, 200, 160]\n\nfig, ax = plt.subplots(figsize=(7, 4))\nax.bar(range(len(sales)), sales, color=\"#E8B65A\")\nax.set_xticklabels(products)\nax.set_title(\"top_products_q2.png\")\nax.set_xlabel(\"product\")\nax.set_ylabel(\"units sold\")\nplt.show()",
      isCorrect: false,
      resultLog:
        "UserWarning: FixedFormatter should only be used together with FixedLocator\n<Figure size 700x400 with 1 Axes>\n# labels render but matplotlib warns the ticks weren't fixed first",
      rationale:
        "Works visually but raises the noisy `FixedFormatter should only be used together with FixedLocator` warning, because you set labels without setting the underlying tick positions. The correct two-line form is `ax.set_xticks(range(len(products))); ax.set_xticklabels(products)`. Letting `bar()` handle both is shorter and warning-free.",
    },
    {
      key: "c",
      label: "Rotate the existing numeric labels so they're easier to read",
      patchCode:
        "import matplotlib.pyplot as plt\n\nproducts = [\"mug\", \"tee\", \"pen\", \"cap\", \"bag\"]\nsales    = [320, 280, 240, 200, 160]\n\nfig, ax = plt.subplots(figsize=(7, 4))\nax.bar(range(len(sales)), sales, color=\"#E8B65A\")\nax.set_title(\"top_products_q2.png\")\nax.set_xlabel(\"product\")\nax.set_ylabel(\"units sold\")\nax.tick_params(axis=\"x\", rotation=45)\nplt.show()",
      isCorrect: false,
      resultLog:
        "<Figure size 700x400 with 1 Axes>\n# numbers 0..4 tilted 45° — still numbers, still useless",
      rationale:
        "Rotates `0..4` to be more readable — but they're still `0..4`. The audience needs **what each bar is**, not a prettier presentation of placeholder numbers. The fix is to label them at all; pass the names to `bar()`.",
    },
  ],
  hints: [
    "Look at `bar()`'s first argument. You wrote `range(len(sales))` — numeric positions. matplotlib will label whatever you hand it.",
    "Pass `products` as the first argument: `ax.bar(products, sales, ...)`. matplotlib uses strings as categorical tick labels automatically.",
  ],
  explanationMd:
    "### Why the bug occurs\n`ax.bar(x, heights)` lays out one bar per `x` value. If `x` is numeric, the x-axis shows numbers; if `x` is a list of strings, matplotlib treats them as **categorical** and uses each string as the bar's tick label. The code passed `range(len(sales))`, which is `[0, 1, 2, 3, 4]` — so the axis honestly shows `0, 1, 2, 3, 4`. Nothing wrong with the heights; the labels just describe the positions you actually used.\n\n### Why the fix is correct\nPassing `products` as the first argument tells matplotlib \"there are five categories named `mug`, `tee`, `pen`, `cap`, `bag`,\" and it draws one bar per category with the name underneath. No manual tick-setting, no warning, one line shorter. The general rule: **let `bar()` see the names you want to show.** Reach for manual `set_xticks` / `set_xticklabels` only when the positions and labels truly differ (e.g. logarithmic ticks with custom labels).",
  recruiterReview:
    "Good — you saw that the bars were right and only the labels were wrong, then reached for the simplest correct fix (pass categories to `bar()`). The warning-emitting `set_xticklabels`-without-`set_xticks` mistake is one of matplotlib's most-Googled errors — knowing why it complains will save you when you do need manual tick control. Approved. ✅",
  tutorial: {
    bodyMd:
      "## Labelling Bars\n\nGetting the x-axis labels right is one of the smallest matplotlib skills that separates a notebook draft from something a stakeholder can read.\n\n### The categorical shortcut\nIf the first argument to `bar()` is a list of strings, matplotlib treats them as categories and labels each bar with the corresponding string:\n```python\nax.bar([\"mug\", \"tee\", \"pen\"], [320, 280, 240])\n```\nThree bars, labelled `mug`, `tee`, `pen`. No further work needed.\n\n### The manual route — and why it's longer than it looks\nIf you pass numeric positions, the axis labels them with those numbers:\n```python\nax.bar([0, 1, 2], [320, 280, 240])  # x-axis: 0, 1, 2\n```\nTo override, you need to set **both** the tick positions and the labels:\n```python\npositions = [0, 1, 2]\nlabels    = [\"mug\", \"tee\", \"pen\"]\nax.bar(positions, [320, 280, 240])\nax.set_xticks(positions)        # fix the tick positions\nax.set_xticklabels(labels)      # then attach labels\n```\nDoing only `set_xticklabels` triggers matplotlib's `FixedFormatter should only be used together with FixedLocator` warning — it's reminding you that you set labels without committing to where the ticks live.\n\n### When to use manual ticks\nThe categorical shortcut is right 95% of the time. Manual ticks are for:\n- **Custom positions** — e.g. log-scale ticks at `[1, 10, 100]`.\n- **Different label set than data** — e.g. plotting numeric `month_index` (`0..11`) and labelling with month abbreviations.\n- **Long labels** that need rotation:\n  ```python\n  ax.tick_params(axis=\"x\", rotation=45)\n  ```\n\n### Rotation, alignment, and overlap\nWhen labels are long and overlap, three knobs help:\n```python\nax.tick_params(axis=\"x\", rotation=45)\nplt.setp(ax.get_xticklabels(), ha=\"right\")  # right-align after rotation\nfig.tight_layout()                          # let matplotlib expand for the labels\n```\nWithout `tight_layout` rotated labels can be clipped at the bottom.\n\n### Multiple bars per category (grouped bars)\nWhen you have two series per category, you draw two `bar` calls with shifted x-positions:\n```python\nimport numpy as np\nproducts = [\"mug\", \"tee\", \"pen\"]\nx = np.arange(len(products))\nax.bar(x - 0.2, q1, width=0.4, label=\"Q1\")\nax.bar(x + 0.2, q2, width=0.4, label=\"Q2\")\nax.set_xticks(x)\nax.set_xticklabels(products)\nax.legend()\n```\nNumeric `x` is unavoidable here — but you set both ticks and labels.\n\n### Common beginner mistakes\n- `ax.bar(range(len(items)), values)` and being surprised by `0..N` labels.\n- `set_xticklabels(...)` without `set_xticks(...)` and getting the formatter warning.\n- Rotated labels falling off the figure — forgot `tight_layout`.\n\n### You just learned…\nLet `bar()` see the categories you want to display — pass them as the first argument. Manual tick control is for cases where positions and labels truly differ. When you do go manual, set both `set_xticks` and `set_xticklabels` together.",
    videos: [
      {
        title: "Bar chart labels in matplotlib for beginners",
        searchQuery: "matplotlib bar chart x axis labels categorical tutorial",
      },
      {
        title: "set_xticks vs set_xticklabels explained",
        searchQuery: "matplotlib xticks xticklabels FixedFormatter warning",
      },
    ],
  },
  estMinutes: 5,
  conceptCard:
    "This mission is about **how matplotlib decides x-axis labels**.\n\n- Pass strings as the first arg to `bar()` → matplotlib labels each bar with the string.\n- Pass numbers → matplotlib labels with those numbers.\n- `set_xticklabels` alone warns; you need `set_xticks` too.\n\nThe code passes `range(len(sales))` so the bars are at `0..4` and the labels show `0..4`. Pass `products` instead.",
  lineNotes: [
    {
      line: 3,
      noteMd: "The category names — these are the labels we want on the x-axis.",
    },
    {
      line: 4,
      noteMd: "The bar heights — these line up with `products` by position.",
    },
    {
      line: 7,
      noteMd:
        "**The bug.** `range(len(sales))` is `[0, 1, 2, 3, 4]` — numeric positions. Replace with `products` so matplotlib uses the names.",
    },
    {
      line: 9,
      noteMd:
        "`set_xlabel` is the **axis title** below the ticks — not the per-bar labels. Different thing.",
    },
  ],
  takeaway: "Pass categories (strings) to bar() — matplotlib labels each bar with the string for free.",
  figureCaption:
    "Before — the bars are right but x-ticks say 0..4 instead of the category names.",
};

// ── da-018 ── y-axis hides growth ────────────────────────────────────────
const DA_018: DaSpec = {
  id: "da-018-y-axis-hides-growth",
  difficulty: "easy",
  title: "18_weekly_signups.ipynb",
  icon: "activity",
  conceptTags: ["matplotlib", "y-axis", "scale"],
  descriptionMd:
    "## Mission: Is Growth Real or Flat?\n\nA stakeholder slacked you: *\"is the signups line growing or flat? hard to tell from your chart.\"* You look — and the line *does* slope up — but only by a hair, because matplotlib's autoscale set the y-axis to `[10195, 10275]` and the visible change is tiny.\n\nThe data is fine; the **scale** is misleading. For \"is this growing?\" questions the standard answer is to start the y-axis at **zero** so the bar/line length is proportional to the value. Force the y-limits.",
  initialCode:
    "import matplotlib.pyplot as plt\n\nweeks   = [\"W1\", \"W2\", \"W3\", \"W4\", \"W5\", \"W6\"]\nsignups = [10200, 10215, 10230, 10241, 10255, 10268]\n\nfig, ax = plt.subplots(figsize=(7, 4))\nax.plot(weeks, signups, marker=\"o\", color=\"#E8B65A\")\nax.set_title(\"weekly_signups.png\")\nax.set_xlabel(\"week\")\nax.set_ylabel(\"signups\")\nplt.show()",
  buggyLineStart: 7,
  buggyLineEnd: 7,
  traceback:
    "<Figure size 700x400 with 1 Axes>\n# y-axis autoscaled to ~[10195, 10275] — growth from 10200 → 10268 visually flat",
  correctOutput:
    "<Figure size 700x400 with 1 Axes>\n# y from 0 — line climbs from 10200 → 10268 across the chart height; growth obvious",
  options: [
    {
      key: "a",
      label: "Force the y-axis to start at 0: `ax.set_ylim(0, max(signups) * 1.15)`",
      patchCode:
        "import matplotlib.pyplot as plt\n\nweeks   = [\"W1\", \"W2\", \"W3\", \"W4\", \"W5\", \"W6\"]\nsignups = [10200, 10215, 10230, 10241, 10255, 10268]\n\nfig, ax = plt.subplots(figsize=(7, 4))\nax.plot(weeks, signups, marker=\"o\", color=\"#7CD992\")\nax.set_title(\"weekly_signups.png\")\nax.set_xlabel(\"week\")\nax.set_ylabel(\"signups\")\nax.set_ylim(0, max(signups) * 1.15)\nplt.show()",
      isCorrect: true,
      resultLog:
        "<Figure size 700x400 with 1 Axes>\n# y from 0 to ~11800 — the line now reads as the absolute size, with visible growth",
      rationale:
        "`set_ylim(0, max(signups) * 1.15)` anchors the y-axis at zero (truthful for absolute counts) and gives a small headroom above the maximum for readability. The growth from 10200 → 10268 is now ~0.6% of the visible range and the line reads as \"basically flat, with a small upward trend\" — which is the **true** story. (For percentage changes / indexed lines, starting at non-zero is sometimes fine; for absolute counts, zero is the honest default.)",
      attachFigure: true,
    },
    {
      key: "b",
      label: "Make the line thicker so the slope reads more clearly",
      patchCode:
        "import matplotlib.pyplot as plt\n\nweeks   = [\"W1\", \"W2\", \"W3\", \"W4\", \"W5\", \"W6\"]\nsignups = [10200, 10215, 10230, 10241, 10255, 10268]\n\nfig, ax = plt.subplots(figsize=(7, 4))\nax.plot(weeks, signups, marker=\"o\", color=\"#E8B65A\", linewidth=4)\nax.set_title(\"weekly_signups.png\")\nax.set_xlabel(\"week\")\nax.set_ylabel(\"signups\")\nplt.show()",
      isCorrect: false,
      resultLog:
        "<Figure size 700x400 with 1 Axes>\n# fatter line, same misleading 80-unit y-range — slope still looks dramatic",
      rationale:
        "The chart is still **lying** — autoscaling 10195 → 10275 makes a 0.6% week-over-week change look like a steep climb. A thicker line is decoration, not honesty. Fix the **scale**: anchor at zero.",
    },
    {
      key: "c",
      label: "Compute the percentage change and plot that instead",
      patchCode:
        "import matplotlib.pyplot as plt\n\nweeks   = [\"W1\", \"W2\", \"W3\", \"W4\", \"W5\", \"W6\"]\nsignups = [10200, 10215, 10230, 10241, 10255, 10268]\nbase = signups[0]\npct   = [(s - base) / base * 100 for s in signups]\n\nfig, ax = plt.subplots(figsize=(7, 4))\nax.plot(weeks, pct, marker=\"o\", color=\"#E8B65A\")\nax.set_title(\"weekly_signups.png\")\nax.set_xlabel(\"week\")\nax.set_ylabel(\"% change vs W1\")\nplt.show()",
      isCorrect: false,
      resultLog:
        "<Figure size 700x400 with 1 Axes>\n# % change y-axis: 0..0.67 — answers a different question than the boss asked",
      rationale:
        "A % change chart is sometimes the right answer — but it tells a *different* story (\"how much have signups grown since W1?\") than the question (\"is the absolute count growing?\"). Changing the question to make the chart look better is a presentation foot-gun. Keep the absolute counts and fix the y-axis.",
    },
  ],
  hints: [
    "Print `ax.get_ylim()` after `plot()`. You'll see autoscale set ~[10195, 10275] — the visible range is only 80 wide, so a 68-unit change fills the chart.",
    "Force the y-axis to start at zero with `ax.set_ylim(0, max(signups) * 1.15)` so the line length reads as the absolute count.",
  ],
  explanationMd:
    "### Why the bug occurs\nmatplotlib's default behaviour is to autoscale axes to fit the data tightly. For counts that vary little — `10200..10268` — that means a y-range of about 80 units. Whatever pattern is in the data fills the chart, so a 0.6% change *looks* like 60% growth.\n\nThat's not a matplotlib bug — it's the right behaviour for many cases (scientific plots that need to see structure in noise). It's the wrong behaviour for **count comparisons** that a non-technical audience reads as bar/line lengths.\n\n### Why the fix is correct\n`ax.set_ylim(0, max(signups) * 1.15)` anchors the y-axis at zero — the honest reference for absolute counts — and adds a small headroom above the max so the line doesn't touch the top edge. With the y-axis from `0` to ~`11800`, the line's slope is now proportional to the *actual* growth rate, and the chart reads truthfully.\n\nA classic rule of thumb:\n- **Counts / absolute values** → start the y-axis at 0.\n- **Percentages or indexed series** → starting at non-zero (or even using a log axis) is sometimes fine because the y-axis already represents \"distance from a baseline.\"\n\nMisleading charts are usually a feature/bug split: matplotlib defaults are accurate to the data but not always to the reader. Knowing when to override is a senior skill.",
  recruiterReview:
    "Strong — you didn't blame the data; you recognised the y-axis was telling a misleading story and fixed the scale. That's a key data-viz instinct: **the eye reads lengths, so make the axis honest about what those lengths represent.** Two follow-ups: 1) for cases where the absolute level is huge and the change is small (e.g. revenue at $10M ± $5k), a small inset chart of the *delta* sometimes communicates better than rescaling the main one. 2) `ax.set_ylim(bottom=0)` only fixes the bottom and lets autoscale handle the top — handy when the max varies. Approved. ✅",
  tutorial: {
    bodyMd:
      "## y-Axis Choices and Honest Charts\n\nThe y-axis is the most lied-with axis in business charts — usually by accident. Once you know the rules, you avoid being the source of confusion and you spot misleading charts in slide decks at a glance.\n\n### What matplotlib does by default\nAutoscale fits the data tightly. If your values vary between 10200 and 10268, the y-axis runs ~10195 to ~10275 — a range of 80. The line then fills the chart, making a small change *look* big.\n\nFor pattern-discovery — \"is there *any* trend?\" — this is great. For audience-facing comparisons — \"is the count growing?\" — it's misleading.\n\n### The zero-baseline rule of thumb\nWhen the y-axis represents an **absolute count** or **money**, start at zero:\n```python\nax.set_ylim(0, max(values) * 1.10)\n```\nThe `* 1.10` gives a small headroom above the max so the line doesn't touch the top edge.\n\n### When zero is wrong\nNot every chart should start at zero. A few common exceptions:\n- **Percentage change vs a baseline** — the y-axis already represents distance from 0; restating that visually is fine.\n- **Indexed series** (\"price relative to Jan = 100\") — same logic.\n- **Log-scale** axes — for values that span orders of magnitude (`1, 10, 100, 1000`), a log y-axis is more honest than a linear one starting at 0.\n- **Temperature, pH, time-of-day** — zero isn't even meaningful (0°F vs 0°C? midnight?).\n\nThe smell test: does the eye-length-equals-magnitude reading make sense for your axis? If yes, anchor at 0. If no, do something else.\n\n### Three useful tools\n```python\nax.set_ylim(0, 12000)             # explicit limits\nax.set_ylim(bottom=0)              # fix bottom, let autoscale handle top\nax.margins(y=0.1)                  # 10% headroom on the existing autoscale\n```\nMix and match. The first is the most explicit and stable; the second is convenient when the max changes.\n\n### Spotting misleading charts in the wild\nWhenever a bar chart's bottom is **not zero**, ask why. Common offenders:\n- Marketing graphs of a tiny price change drawn as a huge bar.\n- A 0.5% poll movement drawn as a sweeping line.\n- A two-bar comparison where one bar is 1.05× the other, but the y-axis starts at 0.95× the smaller — the difference looks like 5× instead of 5%.\n\nNot all are dishonest on purpose — many are autoscale defaults. Knowing it lets you ask the right follow-up question.\n\n### Common beginner mistakes\n- Trusting autoscale for stakeholder-facing absolute-count charts (the bug).\n- Decorating around the problem (thick lines, dramatic colours) instead of fixing the scale.\n- Starting at zero on a log-scale chart (impossible — log(0) is `-inf`).\n\n### You just learned…\nThe y-axis tells a story. For absolute counts, **start at zero** so the reader's eye-length reads as magnitude. For percentages, indexed series, or log scales, non-zero is sometimes the honest choice. Override autoscale when you know your audience will read lengths as truth.",
    videos: [
      {
        title: "y-axis choices in matplotlib — zero vs autoscale",
        searchQuery: "matplotlib set_ylim zero baseline misleading chart tutorial",
      },
      {
        title: "How chart scales lie (and how to spot them)",
        searchQuery: "data viz misleading y axis bar chart zero tutorial",
      },
    ],
  },
  estMinutes: 6,
  conceptCard:
    "This mission is about **y-axis honesty**.\n\n- matplotlib autoscales to the data — small changes can fill the chart and look huge.\n- For absolute counts / money, start the y-axis at **zero** so length = magnitude.\n- For percentages or log scales, non-zero is sometimes fine.\n\nThe chart's autoscaled range is only 80 wide, so a 0.6% rise looks dramatic. Add `ax.set_ylim(0, ...)`.",
  lineNotes: [
    {
      line: 4,
      noteMd: "The data — six counts varying by ~70 across 6 weeks. A real but small change.",
    },
    {
      line: 7,
      noteMd: "`plot()` draws the line; matplotlib will autoscale the y-axis to fit ~10200..10268.",
    },
    {
      line: 10,
      noteMd: "`set_ylabel` is the y-axis **title**, not the limits. Different thing.",
    },
    {
      line: 11,
      noteMd:
        "**The bug.** Without `set_ylim`, the y-axis range is tiny and small changes look dramatic. Anchor at zero.",
    },
  ],
  takeaway: "For absolute-count charts, start the y-axis at zero so visual length = magnitude.",
  figureCaption:
    "Before — autoscale set y to [10195, 10275]; a 0.6% change fills the whole chart height.",
};

// ── da-019 ── dates plotted as strings → lexical sort ──────────────────
const DA_019: DaSpec = {
  id: "da-019-lexical-date-sort",
  difficulty: "medium",
  title: "19_monthly_orders.ipynb",
  icon: "clock",
  conceptTags: ["matplotlib", "dates", "sort", "pandas"],
  descriptionMd:
    "## Mission: Months in the Right Order\n\nYou plotted monthly orders for the year. The bars are the right heights — but the x-axis reads `Apr, Aug, Dec, Feb, Jan, Jul, Jun, Mar, May, Nov, Oct, Sep`. That's alphabetical, not chronological.\n\nYou stored the months as **strings**, and your code calls `sorted(orders_by_month.items())`. Sorting strings is *lexical* (alphabetical) — `\"Apr\" < \"Aug\" < \"Dec\"` — so Python obeys the request and you get nonsense for a time series.\n\nGive the sort a hint about chronological order, or use `pd.to_datetime` so dates are real dates.",
  initialCode:
    "import matplotlib.pyplot as plt\n\norders_by_month = {\n    \"Jan\": 2300, \"Feb\": 2600, \"Mar\": 2900, \"Apr\": 3400,\n    \"May\": 3700, \"Jun\": 4100, \"Jul\": 4400, \"Aug\": 4900,\n    \"Sep\": 5100, \"Oct\": 5600, \"Nov\": 6200, \"Dec\": 6800,\n}\nrows = sorted(orders_by_month.items())\nmonths, totals = zip(*rows)\n\nfig, ax = plt.subplots(figsize=(7, 4))\nax.plot(months, totals, marker=\"o\", color=\"#E8B65A\")\nax.set_title(\"monthly_orders_2025.png\")\nax.set_xlabel(\"month\")\nax.set_ylabel(\"orders\")\nplt.show()",
  buggyLineStart: 8,
  buggyLineEnd: 8,
  traceback:
    "<Figure size 700x400 with 1 Axes>\n# x-axis: Apr, Aug, Dec, Feb, Jan, Jul, Jun, Mar, May, Nov, Oct, Sep — alphabetical, not chronological",
  correctOutput:
    "<Figure size 700x400 with 1 Axes>\n# x-axis: Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec — chronological",
  options: [
    {
      key: "a",
      label: "Sort with a chronological key list and `key=` to look up each month's position",
      patchCode:
        "import matplotlib.pyplot as plt\n\nMONTH_ORDER = [\"Jan\",\"Feb\",\"Mar\",\"Apr\",\"May\",\"Jun\",\"Jul\",\"Aug\",\"Sep\",\"Oct\",\"Nov\",\"Dec\"]\norders_by_month = {\n    \"Jan\": 2300, \"Feb\": 2600, \"Mar\": 2900, \"Apr\": 3400,\n    \"May\": 3700, \"Jun\": 4100, \"Jul\": 4400, \"Aug\": 4900,\n    \"Sep\": 5100, \"Oct\": 5600, \"Nov\": 6200, \"Dec\": 6800,\n}\nrows = sorted(orders_by_month.items(), key=lambda kv: MONTH_ORDER.index(kv[0]))\nmonths, totals = zip(*rows)\n\nfig, ax = plt.subplots(figsize=(7, 4))\nax.plot(months, totals, marker=\"o\", color=\"#7CD992\")\nax.set_title(\"monthly_orders_2025.png\")\nax.set_xlabel(\"month\")\nax.set_ylabel(\"orders\")\nplt.show()",
      isCorrect: true,
      resultLog:
        "<Figure size 700x400 with 1 Axes>\n# x-axis: Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec — line climbs across the year",
      rationale:
        "`key=lambda kv: MONTH_ORDER.index(kv[0])` tells `sorted` to **compare by chronological position**, not by the string itself. Each month is mapped to `0..11` and sorted by that integer, so January (0) comes before April (3). This is the standard fix when your data is categorical-with-known-order. For real date columns (`pd.to_datetime`), you'd let pandas do the sorting natively.",
      attachFigure: true,
    },
    {
      key: "b",
      label: "Wrap the months in `pd.to_datetime` for sorting",
      patchCode:
        "import matplotlib.pyplot as plt\nimport pandas as pd\n\norders_by_month = {\n    \"Jan\": 2300, \"Feb\": 2600, \"Mar\": 2900, \"Apr\": 3400,\n    \"May\": 3700, \"Jun\": 4100, \"Jul\": 4400, \"Aug\": 4900,\n    \"Sep\": 5100, \"Oct\": 5600, \"Nov\": 6200, \"Dec\": 6800,\n}\nrows = sorted(orders_by_month.items(), key=lambda kv: pd.to_datetime(kv[0], format=\"%b\"))\nmonths, totals = zip(*rows)\n\nfig, ax = plt.subplots(figsize=(7, 4))\nax.plot(months, totals, marker=\"o\", color=\"#E8B65A\")\nax.set_title(\"monthly_orders_2025.png\")\nax.set_xlabel(\"month\")\nax.set_ylabel(\"orders\")\nplt.show()",
      isCorrect: false,
      resultLog:
        "<Figure size 700x400 with 1 Axes>\n# x-axis correct, but pd.to_datetime called 12 times inside sorted — slow and brittle (locale-dependent)",
      rationale:
        "Sortable result, but `pd.to_datetime(\"Jan\", format=\"%b\")` is **locale-dependent** — on a non-English locale it returns `NaT` and the sort silently uses defaults. Also runs the parse 12 times inside the comparator. A small `MONTH_ORDER` lookup is faster and predictable. (`pd.to_datetime` is the right tool when your source data is real date strings like `\"2025-01-15\"` — the rule is *use it on real dates, not abbreviations*.)",
    },
    {
      key: "c",
      label: "Force the x-axis order with `ax.set_xticks(MONTH_ORDER)` after plotting",
      patchCode:
        "import matplotlib.pyplot as plt\n\nMONTH_ORDER = [\"Jan\",\"Feb\",\"Mar\",\"Apr\",\"May\",\"Jun\",\"Jul\",\"Aug\",\"Sep\",\"Oct\",\"Nov\",\"Dec\"]\norders_by_month = {\n    \"Jan\": 2300, \"Feb\": 2600, \"Mar\": 2900, \"Apr\": 3400,\n    \"May\": 3700, \"Jun\": 4100, \"Jul\": 4400, \"Aug\": 4900,\n    \"Sep\": 5100, \"Oct\": 5600, \"Nov\": 6200, \"Dec\": 6800,\n}\nrows = sorted(orders_by_month.items())\nmonths, totals = zip(*rows)\n\nfig, ax = plt.subplots(figsize=(7, 4))\nax.plot(months, totals, marker=\"o\", color=\"#E8B65A\")\nax.set_xticks(MONTH_ORDER)\nax.set_title(\"monthly_orders_2025.png\")\nax.set_xlabel(\"month\")\nax.set_ylabel(\"orders\")\nplt.show()",
      isCorrect: false,
      resultLog:
        "<Figure size 700x400 with 1 Axes>\n# tick labels show chronological order, but the LINE still connects Apr → Aug → Dec → Feb …",
      rationale:
        "This relabels the x-axis ticks but the **line is already drawn** through the points in the (alphabetical) order they were plotted. So the labels say Jan-Feb-Mar but the line zig-zags Apr→Aug→Dec→Feb→Jan→…. Cosmetic patch, structural bug. The order has to be fixed before plotting.",
    },
  ],
  hints: [
    "Print `rows` after `sorted(orders_by_month.items())`. The keys are strings, so Python sorts them alphabetically.",
    "Pass `key=lambda kv: MONTH_ORDER.index(kv[0])` so the sort uses chronological position, not the month string itself.",
  ],
  explanationMd:
    "### Why the bug occurs\nPython's `sorted()` on strings is **lexical** — character by character, treating `\"Apr\" < \"Aug\"` because `'p' < 'u'`. For real date strings like `\"2025-01-15\"` this accidentally matches chronological order (`YYYY-MM-DD` happens to sort right), but for abbreviated month names you get the alphabet.\n\nA chart drawn after a wrong-order sort doesn't just relabel — the **line connects points in whatever order they appear**, so the visual shape is also nonsense.\n\n### Why the fix is correct\n`MONTH_ORDER.index(name)` maps each abbreviation to its chronological position (`Jan` → 0, `Feb` → 1, …, `Dec` → 11). Sorting by that integer puts the months in calendar order. The line then connects points in chronological order, the x-axis labels read left-to-right Jan..Dec, and the picture matches reality.\n\nThe broader principle: **if a value has a meaningful order other than its lexical one, the sort must know about that order**. For real date columns, pandas/Polars do this for you (`pd.to_datetime` + `df.sort_values(\"date\")`). For categorical-with-order data (months, weekdays, sizes `S/M/L`), keep an explicit `ORDER` list nearby and sort by `ORDER.index(...)` — or use a `pd.Categorical` with `ordered=True`.",
  recruiterReview:
    "Solid — you recognised that string sort and chronological sort are different things, and fixed the order at the **data layer** rather than retro-relabelling the axis. That's the pattern that survives later changes (a new month column, a different chart type). Two follow-ups: 1) `pd.Categorical([...], categories=MONTH_ORDER, ordered=True)` makes the order a property of the data, so every subsequent groupby/plot inherits it. 2) For real timestamps, store them as `datetime`/`Timestamp` from the start — string dates are a recurring source of this bug. Approved. ✅",
  tutorial: {
    bodyMd:
      "## Sorting Time-Like Data\n\nA shockingly large amount of analyst time goes into not letting strings pretend to be dates. The cheapest fix is to never store dates as strings in the first place; the second-cheapest is to know how to sort them correctly when you have to.\n\n### Lexical vs chronological\nPython's `sorted()` compares strings character-by-character:\n```python\nsorted([\"Mar\", \"Jan\", \"Feb\"])   # ['Feb', 'Jan', 'Mar']\nsorted([\"Apr\", \"Aug\", \"Dec\"])   # ['Apr', 'Aug', 'Dec']  (alphabetical)\n```\nFor month abbreviations this is wrong. For full ISO dates `\"2025-01-15\"` it happens to be right (sorting works because `YYYY-MM-DD` is *designed* to sort lexically). For US-formatted strings like `\"01/15/2025\"` it's wrong again.\n\n### Three fixes, ranked\n#### 1) Use real datetime objects (the best fix)\n```python\nimport pandas as pd\ndf[\"date\"] = pd.to_datetime(df[\"date\"])\ndf = df.sort_values(\"date\")\n```\nNow the order is intrinsic to the data — every subsequent operation (groupby, resample, plot) will respect it.\n\n#### 2) Explicit order list (when categorical-with-order)\n```python\nMONTH_ORDER = [\"Jan\",\"Feb\",\"Mar\",\"Apr\",\"May\",\"Jun\",\n               \"Jul\",\"Aug\",\"Sep\",\"Oct\",\"Nov\",\"Dec\"]\nsorted(items, key=lambda kv: MONTH_ORDER.index(kv[0]))\n```\nFast, predictable, locale-independent. Works for any ordered categorical (weekdays, sizes `S/M/L`, severity `low/med/high`).\n\n#### 3) Pandas Categorical with `ordered=True`\n```python\ndf[\"month\"] = pd.Categorical(df[\"month\"], categories=MONTH_ORDER, ordered=True)\ndf = df.sort_values(\"month\")\n```\nBakes the order into the column. All future sorts/plots inherit it.\n\n### The trap: relabelling the axis after the fact\n```python\nax.plot(months, totals)         # connects points in whatever order `months` is in\nax.set_xticks(CORRECT_ORDER)    # only changes the labels, not the line\n```\nIf the line is drawn through an out-of-order sequence, relabelling the axis just makes the labels and the line disagree. **Fix the order before plotting.**\n\n### Locales — a hidden trap\n`pd.to_datetime(\"Janv\", format=\"%b\")` works on a French-locale machine but fails on English. `datetime.strptime(\"Jan\", \"%b\")` is similarly locale-sensitive. The cheapest portable fix is an explicit order list. If you must parse abbreviations, set the locale explicitly with `locale.setlocale(...)` so the behaviour is reproducible.\n\n### Common beginner mistakes\n- Storing dates as strings and being surprised by lexical sort.\n- Trusting `sorted([\"01/15/2024\", \"02/03/2024\"])` because two examples happen to be in order.\n- Calling `set_xticks` after the line is drawn (cosmetic patch).\n\n### You just learned…\nString sort and chronological sort aren't the same. Use real `datetime` types when you can; use an explicit order list when you can't; never rely on retroactive axis relabelling to fix order bugs.",
    videos: [
      {
        title: "Sorting dates and ordered categories in pandas",
        searchQuery: "pandas sort dates categorical ordered tutorial",
      },
      {
        title: "Why my month chart is in alphabetical order",
        searchQuery: "matplotlib months alphabetical order chronological fix",
      },
    ],
  },
  estMinutes: 7,
  conceptCard:
    "This mission is about **chronological vs lexical order**.\n\n- `sorted()` on strings is **alphabetical** — `\"Apr\" < \"Aug\" < \"Dec\"`.\n- A line plot connects points in the order it sees them — wrong order = zig-zag.\n- Use real `datetime` types, an explicit order list, or `pd.Categorical(ordered=True)`.\n\nThe code sorts month strings lexically, so the line wanders. Sort with `key=lambda kv: MONTH_ORDER.index(kv[0])`.",
  lineNotes: [
    {
      line: 4,
      noteMd: "The dict — order doesn't matter here, but the keys are 3-letter abbreviations.",
    },
    {
      line: 8,
      noteMd:
        "**The bug.** `sorted(items)` on a dict of string keys uses lexical order. Pass `key=` with a chronological index.",
    },
    {
      line: 9,
      noteMd: "`zip(*rows)` splits `[(\"Jan\", 2300), …]` into two parallel tuples for plotting.",
    },
    {
      line: 12,
      noteMd: "`plot()` draws the line in `months` order — whatever order `sorted` produced.",
    },
  ],
  takeaway: "String sort is lexical, not chronological — use a key= mapping or real datetime types.",
  figureCaption:
    "Before — the line connects months in alphabetical order: Apr → Aug → Dec → Feb → Jan → …",
};

// ── da-020 ── bar instead of line for a time series ────────────────────
const DA_020: DaSpec = {
  id: "da-020-bar-vs-line",
  difficulty: "medium",
  title: "20_daily_active_users.ipynb",
  icon: "activity",
  conceptTags: ["matplotlib", "chart-type", "time-series"],
  descriptionMd:
    "## Mission: Pick the Right Chart Type\n\nYou plotted daily active users for the past week as a **bar chart**. Your boss said *\"is DAU trending up?\"* and you said *\"yes, look — Mon was 1200 and Sun was 1460.\"* They squinted. \"I can see the numbers, but the trend doesn't read.\"\n\nFor a continuous time series, bars are a poor choice — the eye reads them as discrete categorical comparisons, not as a line through time. **Use a line chart for trends, bars for category comparisons.** Same data, much clearer story.",
  initialCode:
    "import matplotlib.pyplot as plt\n\ndays = [\"Mon\", \"Tue\", \"Wed\", \"Thu\", \"Fri\", \"Sat\", \"Sun\"]\ndau  = [1200, 1240, 1280, 1330, 1380, 1420, 1460]\n\nfig, ax = plt.subplots(figsize=(7, 4))\nax.bar(days, dau, color=\"#E8B65A\")\nax.set_title(\"daily_active_users.png\")\nax.set_xlabel(\"day\")\nax.set_ylabel(\"DAU\")\nplt.show()",
  buggyLineStart: 7,
  buggyLineEnd: 7,
  traceback:
    "<Figure size 700x400 with 1 Axes>\n# bar chart — eye reads each bar as a separate category; the smooth growth doesn't pop",
  correctOutput:
    "<Figure size 700x400 with 1 Axes>\n# line chart — slope from Mon → Sun reads as a clear upward trend",
  options: [
    {
      key: "a",
      label: "Switch to a line chart: `ax.plot(days, dau, marker=\"o\")`",
      patchCode:
        "import matplotlib.pyplot as plt\n\ndays = [\"Mon\", \"Tue\", \"Wed\", \"Thu\", \"Fri\", \"Sat\", \"Sun\"]\ndau  = [1200, 1240, 1280, 1330, 1380, 1420, 1460]\n\nfig, ax = plt.subplots(figsize=(7, 4))\nax.plot(days, dau, marker=\"o\", color=\"#7CD992\")\nax.set_title(\"daily_active_users.png\")\nax.set_xlabel(\"day\")\nax.set_ylabel(\"DAU\")\nax.set_ylim(0, max(dau) * 1.15)\nplt.show()",
      isCorrect: true,
      resultLog:
        "<Figure size 700x400 with 1 Axes>\n# line climbs from ~1200 to ~1460 across the week — trend obvious",
      rationale:
        "A **line chart** is the right shape for continuous trends over time: the eye reads the slope as the rate of change. The markers (`marker=\"o\"`) keep each day's value identifiable. `set_ylim(0, ...)` is bonus discipline — for absolute counts, anchor the y-axis at zero so the slope reads as growth, not noise. Bars are for category comparisons (\"which product sold more?\"); lines are for trends (\"are signups growing?\"). Use the shape that matches the question.",
      attachFigure: true,
    },
    {
      key: "b",
      label: "Keep bars but add value labels above each one",
      patchCode:
        "import matplotlib.pyplot as plt\n\ndays = [\"Mon\", \"Tue\", \"Wed\", \"Thu\", \"Fri\", \"Sat\", \"Sun\"]\ndau  = [1200, 1240, 1280, 1330, 1380, 1420, 1460]\n\nfig, ax = plt.subplots(figsize=(7, 4))\nbars = ax.bar(days, dau, color=\"#E8B65A\")\nfor bar, v in zip(bars, dau):\n    ax.text(bar.get_x() + bar.get_width() / 2, v + 10, str(v), ha=\"center\", fontsize=8)\nax.set_title(\"daily_active_users.png\")\nax.set_xlabel(\"day\")\nax.set_ylabel(\"DAU\")\nplt.show()",
      isCorrect: false,
      resultLog:
        "<Figure size 700x400 with 1 Axes>\n# bars now annotated with values — but the trend still reads as 7 separate categories",
      rationale:
        "Labels help with exact lookup but don't fix the **chart-type mismatch**. The boss's question was about a **trend**, not about specific values — they want to *see* the slope, not read seven numbers. Use a line.",
    },
    {
      key: "c",
      label: "Use a stacked area chart instead",
      patchCode:
        "import matplotlib.pyplot as plt\n\ndays = [\"Mon\", \"Tue\", \"Wed\", \"Thu\", \"Fri\", \"Sat\", \"Sun\"]\ndau  = [1200, 1240, 1280, 1330, 1380, 1420, 1460]\n\nfig, ax = plt.subplots(figsize=(7, 4))\nax.fill_between(days, dau, color=\"#E8B65A\", alpha=0.5)\nax.set_title(\"daily_active_users.png\")\nax.set_xlabel(\"day\")\nax.set_ylabel(\"DAU\")\nplt.show()",
      isCorrect: false,
      resultLog:
        "<Figure size 700x400 with 1 Axes>\n# area chart — slope visible but emphasis is on the volume, not the rate",
      rationale:
        "Area charts work for **cumulative** or **part-of-whole** stories — the eye reads the filled area as quantity. For a simple \"is it trending up?\" the audience is asking about the **slope**, not the area under it. A line answers their question more directly.",
    },
  ],
  hints: [
    "Read the boss's question: *trend*. Bars are for category comparisons; lines are for trends. The fix is a chart-type swap.",
    "Use `ax.plot(days, dau, marker=\"o\")` for a line with point markers — the slope reads as the rate of change.",
  ],
  explanationMd:
    "### Why the bug occurs\nA bar chart says \"compare these heights\" — the eye reads each bar as a discrete category. For seven days that *are* a continuous sequence, this fights the data: the reader has to mentally connect the bar tops to imagine the trend. With smooth growth like 1200 → 1460, the bars look about the same height and the trend hides.\n\n### Why the fix is correct\nA line chart says \"follow this through time\" — the slope is the rate of change, instantly readable. Markers (`marker=\"o\"`) preserve each day's exact value. Adding `set_ylim(0, ...)` is good practice for absolute counts (avoids the misleading-autoscale trap from da-018).\n\n### When bars are right\nBars are still the right tool for:\n- **Categorical comparisons** — \"which product sold more?\"\n- **Discrete buckets** — \"how many users in each age range?\" (a histogram is just a bar chart for binned data).\n- **Negative values that need a baseline** — bars cross zero clearly.\n\n### The general rule\nThe chart type should match the question:\n| Question | Chart |\n|----------|-------|\n| \"Which category is biggest?\" | Bar |\n| \"How is X changing over time?\" | Line |\n| \"What's the distribution of X?\" | Histogram or box |\n| \"How are A and B related?\" | Scatter |\n| \"How does X break down by parts?\" | Stacked bar or area |\n\nUse the shape that lets the reader's eye answer the question without translation.",
  recruiterReview:
    "Strong — you didn't just patch the cosmetics; you recognised the question (\"is this trending?\") didn't match the chart type and made the right swap. That's a senior data-viz instinct. One nuance: for *spikey* time series (signups during a viral moment, error rate during an incident), bars sometimes communicate the \"event\" feel better than a line — but for smooth growth, line wins every time. The other thing worth practising: pairing the line with `set_ylim(0, ...)` for absolute counts is the combination of two good habits. Approved. ✅",
  tutorial: {
    bodyMd:
      "## Picking the Right Chart Type\n\nThe single most impactful viz skill is knowing what shape your question wants. Almost every chart you make will be one of half a dozen types; matching the question to the type makes you instantly clearer than 90% of charts you'll see in slide decks.\n\n### The mapping\n| Question your audience is asking | Right chart |\n|-----------------------------------|-------------|\n| \"Which category is biggest?\" | Bar (horizontal if labels are long) |\n| \"How is X changing over time?\" | Line |\n| \"What's the distribution of X?\" | Histogram, box-and-whisker, violin |\n| \"How are A and B related?\" | Scatter |\n| \"How does X break down by parts?\" | Stacked bar, area, or treemap |\n| \"How does X compare across two dimensions?\" | Heatmap |\n\nIf your chart doesn't directly answer the question, the reader has to translate. Every translation step is a chance for misread.\n\n### Line chart conventions\n```python\nax.plot(x, y, marker=\"o\", color=\"#7CD992\")\nax.set_ylim(0, max(y) * 1.15)\nax.set_xlabel(\"day\")\nax.set_ylabel(\"DAU\")\n```\n- `marker=\"o\"` (or `\"s\"`, `\"^\"`) keeps each data point identifiable.\n- `set_ylim(0, ...)` for absolute counts — combine the lessons from da-018 here.\n- Sort the x-axis chronologically before plotting (the lesson from da-019).\n\n### Bar chart conventions\n```python\nax.bar(categories, values, color=\"#7CD992\")\nax.set_xlabel(\"product\")\nax.set_ylabel(\"units sold\")\n```\n- Pass strings as the first argument so labels are automatic (da-017).\n- For long labels, use a **horizontal** bar chart: `ax.barh(categories, values)`.\n- For >10 bars, consider sorting them descending so the eye reads the most important first.\n\n### Histograms vs bar charts\nA histogram is a bar chart over **binned numeric data**. Use `ax.hist(values, bins=...)`, not `ax.bar(...)`. The number of bins (a.k.a. \"how coarse the lens is\") is everything — too few bins hides structure, too many adds noise. (You'll meet this in da-021.)\n\n### Scatter for relationships\n```python\nax.scatter(x, y, s=weights, alpha=0.6)\n```\nUse `s=` for per-point size when a third value matters (population, sales volume). `alpha=0.6` helps with overplotting in dense scatters. Avoid when you have <8 points — use a labelled bar chart instead.\n\n### Three quick anti-patterns\n1. **Pie charts with >6 slices** — humans can't compare angles accurately; use a bar chart.\n2. **3-D bar charts** — depth distortion makes them unreadable.\n3. **Dual y-axes** — fine for two metrics you've thought hard about; chaos when both axes autoscale.\n\n### Honest tooltips\nFor anything stakeholder-facing, attach the **chart title** as the question being answered (\"Daily active users, last 7 days — trending up?\") rather than the file name. The chart should self-explain.\n\n### Common beginner mistakes\n- Bars for time series (the bug).\n- Pie chart for anything with more than 4 slices.\n- Scatter for too few points.\n- Two y-axes \"to fit both metrics\" when they're truly different stories.\n\n### You just learned…\nThe chart type is part of the message. Match the **shape** to the **question**: lines for trends, bars for category comparisons, histograms for distributions, scatters for relationships. The right type lets the reader's eye answer the question directly.",
    videos: [
      {
        title: "Bar vs line chart in matplotlib — when to use each",
        searchQuery: "matplotlib bar vs line chart type tutorial beginner",
      },
      {
        title: "Picking the right chart type for your data",
        searchQuery: "data visualization chart type selection beginner",
      },
    ],
  },
  estMinutes: 6,
  conceptCard:
    "This mission is about **matching chart type to question**.\n\n- **Bars** = category comparisons. The eye reads heights as separate values.\n- **Lines** = trends over time. The eye reads slope as rate of change.\n- For \"is this growing?\" use a line; for \"which is biggest?\" use a bar.\n\nThe boss asked about a **trend**; the code drew **bars**. Switch to `ax.plot(...)` and the slope reads instantly.",
  lineNotes: [
    {
      line: 3,
      noteMd: "Seven days — a continuous time-ordered sequence.",
    },
    {
      line: 4,
      noteMd: "Smoothly increasing values — perfect for a line, awkward for bars.",
    },
    {
      line: 7,
      noteMd:
        "**The bug.** `ax.bar(...)` for a time series — the eye reads bars as categorical, the trend hides. Use `ax.plot(...)`.",
    },
  ],
  takeaway: "Bars for category comparisons, lines for trends — match the chart type to the question.",
  figureCaption:
    "Before — bar chart for a smooth weekly trend; eye reads seven separate categories, not a slope.",
};

const SPECS = [DA_016, DA_017, DA_018, DA_019, DA_020];

for (const spec of SPECS) {
  const composed = compose(spec);
  const filePath = join(OUT_DIR, `${spec.id}.json`);
  writeFileSync(filePath, JSON.stringify(composed, null, 2));
  console.log(`wrote ${filePath}`);
}
console.log(`authored ${SPECS.length} da challenges`);
