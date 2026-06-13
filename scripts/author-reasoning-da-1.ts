#!/usr/bin/env -S tsx
/**
 * Dev-time batch — composes da-036..040 (reasoning easy batch 1) by stitching
 * a per-challenge content map with figure-builder SVGs minted inline. Idempotent.
 *
 *   pnpm exec tsx scripts/author-reasoning-da-1.ts
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildFigure } from "./figure-builder";

const OUT_DIR = join(__dirname, "..", "content", "challenges", "da");

interface ReasoningSpec {
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
    isCorrect: boolean;
    resultLog: string;
    rationale: string;
  }>;
  hints: [string, string];
  explanationMd: string;
  recruiterReview: string;
  tutorial: { bodyMd: string; videos: Array<{ title: string; searchQuery: string }> };
  estMinutes: number;
  conceptCard: string;
  lineNotes: Array<{ line: number; noteMd: string }>;
  takeaway: string;
  figureSvg?: string;
  figureCaption?: string;
}

function compose(spec: ReasoningSpec) {
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
      // Reasoning missions don't carry a code patch; the field is required by
      // the schema but tolerated as empty by the renderer (a wrong reading is
      // not "code that runs").
      patchCode: spec.initialCode,
      isCorrect: o.isCorrect,
      resultLog: o.resultLog,
      rationale: o.rationale,
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
    track: "reasoning",
    ...(spec.figureSvg ? { figureSvg: spec.figureSvg } : {}),
    ...(spec.figureCaption ? { figureCaption: spec.figureCaption } : {}),
  };
}

// ── da-036 ── chart-choice: "which product is biggest?" ───────────────────
const DA_036_FIG = buildFigure({
  kind: "bar",
  title: "units_by_product_q2.png",
  xLabel: "product",
  yLabel: "units sold",
  xCategories: ["mug", "tee", "pen", "cap", "bag"],
  values: [340, 290, 250, 220, 180],
  color: "accent",
});
const DA_036: ReasoningSpec = {
  id: "da-036-chart-choice-biggest",
  difficulty: "easy",
  title: "36_which_chart_biggest.ipynb",
  icon: "bar-chart-3",
  conceptTags: ["chart-choice", "judgment", "reasoning"],
  descriptionMd:
    "## Mission: Pick the Chart\n\nA stakeholder asks: *\"Which product is selling the most this quarter?\"* You've got five products and one number per product — units sold. You can pick any of three chart types to answer the question. Which one lets the audience read the answer fastest, without translation?\n\nThe reasoning track isn't about which chart *can* show this — multiple can. It's about which chart **matches the question's shape**: a single comparison across discrete categories. Pick the chart that lets the eye do the work, and name what makes the other two worse.",
  initialCode:
    "# Scenario: a Slack message from the head of merch.\n# > \"Hey — which product is selling the most this quarter?\n# >  Drop a chart in the channel when you have a sec.\"\n#\n# Data: five products, units sold this quarter (illustrative numbers).\nproducts = ['mug', 'tee', 'pen', 'cap', 'bag']\nunits    = [340, 290, 250, 220, 180]",
  buggyLineStart: 6,
  buggyLineEnd: 6,
  traceback:
    "Junior analyst's draft: 'I'll do a line chart so the comparison feels dynamic — the line will go from highest to lowest.'",
  correctOutput:
    "Senior analyst's verdict: 'Bar chart, sorted descending — discrete categories, single comparison, label each bar with the unit count.'",
  options: [
    {
      key: "a",
      label: "Bar chart, sorted descending, one bar per product",
      isCorrect: true,
      resultLog:
        "Acting on this reading: a 30-second chart anyone can read at a glance — the longest bar IS the answer.",
      rationale:
        "Bar lengths are the most accurate visual encoding the eye does for discrete categories. Sorting descending puts the answer first; labelling each bar with the count removes the need to read the axis. This is what the stakeholder actually asked for — one comparison across five discrete things.",
    },
    {
      key: "b",
      label: "Line chart with products on the x-axis",
      isCorrect: false,
      resultLog:
        "Acting on this reading: the chart implies a trend across products that doesn't exist; readers ask 'why does pen come after tee?'",
      rationale:
        "A line chart implies an ordered/continuous x-axis — the eye reads the slope as 'change over time.' Products are not a sequence, so the line *manufactures* a story that isn't in the data. This is the same anti-pattern as the da-020 bar-vs-line bug, in reverse: wrong chart type for the shape of the question.",
    },
    {
      key: "c",
      label: "Pie chart — five slices, each labelled with the product name",
      isCorrect: false,
      resultLog:
        "Acting on this reading: stakeholders argue about which slice is bigger; bottom two (220 vs 180) look identical at this size.",
      rationale:
        "Humans can't compare angles accurately, especially for similar values — that's why every viz textbook warns off pie charts with more than 3–4 slices. Bar lengths beat pie angles every time. Use pie only for one-or-two-clear-dominator stories with very few slices.",
    },
  ],
  hints: [
    "What is the question asking for? A single ordering across discrete categories. What visual encoding maps best to that?",
    "Bar lengths beat angles and beat manufactured slopes. Sort descending and label the bars.",
  ],
  explanationMd:
    "### Why this is the right reading\nThe question is *comparison across discrete categories*. The visual encoding that maps to that question most directly is **length**, not angle (pie) and not slope (line). Bars sorted descending make the answer the leftmost bar; labelling each bar removes axis-translation work for the reader.\n\n### What makes the other two reasonings weak\n- **Line over categories** manufactures a trend by drawing a slope between adjacent bars. The slope has no meaning — pen isn't \"between\" tee and cap in any real sense — but the eye will read it as one.\n- **Pie chart with five slices** asks the reader to compare angles for similar values. Two-eighths vs three-tenths look identical at a glance. Bars are strictly better for this shape.\n\n### The general principle\nMatch the chart type to the question's *shape*. Discrete categorical comparison → bar. Change over an ordered axis → line. Two-or-three-slice part-of-whole with one dominator → bar still wins, but pie won't actively mislead.",
  recruiterReview:
    "Good — you didn't fall for the 'line feels dynamic' instinct or the pie-by-default habit. You picked the chart whose visual encoding matches the question's shape, and you named *why* the other two are worse. Two refinements for next time: 1) for >10 categories, prefer a horizontal bar chart with sorted bars so the long category labels don't overlap; 2) when bars are very close in height, annotate them with the exact value — don't make the reader compare bar tops to axis ticks.",
  tutorial: {
    bodyMd:
      "## Matching Chart Type to the Question's Shape\n\nThe single most-impactful viz skill: knowing what shape your question wants. The chart should let the reader's eye answer the question without translation.\n\n### The mapping that covers 90% of business charts\n| Question's shape | Right chart |\n|---|---|\n| Which category is biggest? (discrete, one comparison) | **Bar** (sorted) |\n| How is X changing over an ordered axis (time, date, age)? | **Line** |\n| What's the distribution of X? | **Histogram** or **box-and-whisker** |\n| How does X relate to Y across many observations? | **Scatter** |\n| How does X break down into parts? | **Stacked bar** or **treemap** (rarely pie) |\n| How does X vary across two dimensions? | **Heatmap** |\n\n### Why bar wins this question\n- **Bar lengths** are the most accurate visual encoding humans use. We're great at saying \"this bar is about twice that one.\"\n- **Sorting descending** puts the answer first — the eye doesn't have to scan to find the biggest.\n- **Labels on bars** remove the need to look up at an axis.\n\n### Why the alternatives are weaker\n- **Pie/donut**: angle comparison is imprecise. Two slices that differ by 10% look identical. Pies are also hard to label cleanly once you have more than 3–4 slices.\n- **Line over categories**: the line *implies an order* that isn't real. Readers ask \"why is pen between tee and cap?\" and assume there's structure where there isn't.\n- **3-D bars**: depth distortion makes them unreadable — never use them.\n- **Bubble chart**: useful when each row has 3+ dimensions (x, y, size). Overkill for a single comparison.\n\n### The horizontal bar variant\nFor long category labels (\"Q4 2024 enterprise retention\") or for >8 categories, rotate to a horizontal bar chart with `ax.barh(...)`. The label fits on its own line and the eye still reads length correctly.\n\n### Practical authoring checklist\n1. Sort the bars (descending for \"biggest first\", ascending for \"smallest first\" if that matches the question).\n2. Annotate values directly on the bars when precision matters.\n3. Anchor the x-axis (the value axis) at zero — same lesson as da-018, length should equal magnitude.\n4. Pick a single accent colour; don't rainbow-colour discrete categories with no ordering meaning.\n5. The chart title should *be the question being answered*, not the file name (\"Which product sold most in Q2?\").\n\n### Common reasoning mistakes\n- 'Line feels dynamic' → drawing slopes through categorical data. Slope = lie.\n- 'Pie for percentages' → angles fail for >3 similar values.\n- 'Sort alphabetically by product name' → forces the eye to do work the chart should do (sort by the value being compared).\n- 'One chart for many questions' → a chart that tries to answer 'which is biggest AND how have they changed AND who buys them' answers none well. Make multiple charts.\n\n### You just learned…\nThe chart type is part of the message. **Discrete categorical comparison → sorted bar.** A line over categories invents a trend; a pie with too many slices makes the eye compare angles it can't compare. Match the chart's shape to the question's shape, and the reader's eye does the work.",
    videos: [
      { title: "Picking the right chart type", searchQuery: "data visualization chart type selection beginner" },
      { title: "Why pie charts are bad", searchQuery: "why pie charts are bad data visualization explained" },
    ],
  },
  estMinutes: 5,
  conceptCard:
    "This mission is about **matching chart type to question shape**.\n\n- Discrete categorical comparison → **sorted bar chart**.\n- A line over categories *invents* a trend; pie angles can't be compared accurately.\n- The chart type should let the eye answer the question without translation.\n\nThe stakeholder asks 'which product is biggest?' — three discrete categories with one number each. Bars sorted descending are the cleanest answer.",
  lineNotes: [
    { line: 1, noteMd: "The stakeholder ask — short, casual, single question." },
    { line: 5, noteMd: "Five discrete categories with one number each — perfect for a bar chart." },
    { line: 6, noteMd: "The values, ordered however the data came in. Always sort *before* you plot." },
  ],
  takeaway: "Discrete categorical comparison → sorted bar — lines invent trends, pies hide differences.",
  figureSvg: DA_036_FIG,
  figureCaption: "Data the stakeholder is asking about — five products, one quarter, units sold.",
};

// ── da-037 ── chart-choice: "did DAU grow this week?" ─────────────────────
const DA_037_FIG = buildFigure({
  kind: "line",
  title: "dau_last_7_days.png",
  xLabel: "day",
  yLabel: "DAU",
  xCategories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  series: [{ label: "DAU", values: [1200, 1240, 1280, 1330, 1380, 1420, 1460], color: "accent" }],
  yRange: [0, 1600],
});
const DA_037: ReasoningSpec = {
  id: "da-037-chart-choice-trend",
  difficulty: "easy",
  title: "37_did_dau_grow.ipynb",
  icon: "activity",
  conceptTags: ["chart-choice", "trend", "reasoning"],
  descriptionMd:
    "## Mission: 'Did DAU Grow This Week?'\n\nA PM Slacks: *\"Did DAU grow this week? Send me whatever chart shows it best.\"* You've got 7 days of daily active users — Monday through Sunday — and the numbers slope steadily up. Three chart types are on the table. Which one answers *\"did it grow?\"* fastest, and what makes the other two worse?\n\nThe question is about a **trend over an ordered axis (time)**. A line lets the eye read slope as rate of change. A bar chart reads as seven separate categories. A pie chart can't represent change at all. Pick the right shape — and name the failure mode of the other two.",
  initialCode:
    "# Scenario: PM asks 'did DAU grow this week?'\n# Data: 7 days of daily active users (illustrative numbers).\ndays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']\ndau  = [1200, 1240, 1280, 1330, 1380, 1420, 1460]",
  buggyLineStart: 4,
  buggyLineEnd: 4,
  traceback:
    "Junior analyst's draft: 'A bar chart — one bar per day. Stakeholders can read each value precisely.'",
  correctOutput:
    "Senior analyst's verdict: 'Line chart with markers, y-axis anchored at zero. Slope = the answer.'",
  options: [
    {
      key: "a",
      label: "Line chart, markers on each day, y-axis from 0",
      isCorrect: true,
      resultLog:
        "Acting on this reading: the PM glances at the chart and reads the slope as 'yes, growing'. Done.",
      rationale:
        "The question is about **change over time** — the eye reads slope as the rate of change. Markers on each day keep specific values identifiable. Anchoring the y-axis at zero (same rule as da-018) keeps the slope honest: visible length equals magnitude. A line over the seven days is the most direct visual answer to 'did it grow?'",
    },
    {
      key: "b",
      label: "Bar chart, one bar per day, sorted by value",
      isCorrect: false,
      resultLog:
        "Acting on this reading: the PM stares at seven bars trying to mentally connect the tops to see the trend. Worse: sorting by value destroys the time order.",
      rationale:
        "Bars read as **discrete category comparisons** — the eye doesn't naturally connect bar tops into a slope. Sorting by value (rather than by day) actively destroys the time axis, which is the whole point. This is the same da-020 anti-pattern: bar where line was right.",
    },
    {
      key: "c",
      label: "Pie chart with one slice per day",
      isCorrect: false,
      resultLog:
        "Acting on this reading: the PM can't tell whether DAU grew or shrank — pie shows parts of a whole, not change over time.",
      rationale:
        "A pie chart represents **parts of a whole at one moment** — it has no time axis at all. Whether the chart was made for a growing or shrinking week, the seven slices look about the same. Pie *cannot* answer 'did it grow?' regardless of how skilfully drawn.",
    },
  ],
  hints: [
    "Read the verb: *grew*. That's a question about change over time. Which encoding makes change easiest to see?",
    "Line slope reads as rate of change. Bars don't connect, pies don't have a time axis.",
  ],
  explanationMd:
    "### Why this is the right reading\nThe question is *trend over an ordered axis* — \"did it grow?\" is asking the eye to read a slope. The encoding that maps directly to slope is a line. Markers preserve per-day exact values; the zero-anchored y-axis keeps the slope honest.\n\n### What makes the other two reasonings weak\n- **Bar chart**: the eye reads bars as discrete category heights, not as a connected sequence. Sorting by value (as the wrong option says) destroys the time axis entirely. The chart that *could* show the trend ends up answering a different question.\n- **Pie chart**: has no time axis. It represents parts of a whole at a single moment. There's no honest way to read \"did it grow?\" from a pie at all.\n\n### The general principle\nThe **shape of the question** (\"did it grow?\") must match the **shape of the chart** (line — slope = rate of change). Bars are for categorical comparison. Pies are for clear-dominator parts-of-whole. Use the chart whose visual encoding directly answers the verb in the question.",
  recruiterReview:
    "Solid — you read the verb in the question ('grow' = change over time) and matched it to slope. You also named the failure mode of the bar chart (sorting by value destroys the time axis) and the categorical failure of the pie. Two refinements: 1) pair the line chart with `set_ylim(0, max*1.15)` so the slope reads honestly (combining the lesson with da-018); 2) if the trend is very small relative to the absolute level, add a small annotation 'DAU grew 22% W/W' so the chart and the headline number agree.",
  tutorial: {
    bodyMd:
      "## Reading the Verb in the Question\n\nThe most reliable trick for picking a chart type: **read the verb in the stakeholder's question**, and ask what visual encoding maps to that verb.\n\n### The verb → encoding cheat sheet\n| Verb in the ask | Visual encoding | Chart type |\n|---|---|---|\n| 'grew', 'changed', 'trended' | slope | **line** |\n| 'biggest', 'most', 'highest' | length | **bar** (sorted) |\n| 'distributed', 'typical', 'spread' | shape of a histogram or box | **histogram / box** |\n| 'related to', 'correlates with' | cloud shape, slope | **scatter** |\n| 'broken down into parts', 'composition' | area or stack | **stacked bar / area** |\n| 'compared across two dimensions' | colour cell | **heatmap** |\n\n### Why line wins this question\nThe slope of a line says rate of change. Going up means growing. Flat means flat. Down means shrinking. Each marker preserves the exact value, so the reader can still get \"DAU on Sunday was 1460.\"\n\n### Why bar loses for trends\nBars are read as separate categories. The eye doesn't connect bar tops into a slope; it compares bar heights pairwise. For seven days the comparison is *seven choose two = 21 pairwise reads* the audience has to mentally aggregate into 'is this growing?' A line does the aggregation visually for them.\n\nThe most insidious form of the bar-vs-line bug is when the wrong-answer impulse is *sorting by value* — that destroys the time axis entirely.\n\n### Why pie can't represent change\nA pie shows parts of a whole at one moment in time. There's no axis for change. If you handed someone a pie of \"DAU each day this week,\" they couldn't tell whether the week grew, shrank, or held flat — only the slice sizes (which are usually similar enough to look identical).\n\n### Practical authoring checklist for trend charts\n1. Use `ax.plot(x, y, marker=\"o\")` — markers keep individual values identifiable.\n2. **Anchor the y-axis at zero** for absolute counts (the da-018 rule) so the slope reads honestly.\n3. Sort the x-axis in **time order**, not by value (the da-019 rule).\n4. If the change is small relative to the absolute level, annotate the headline (\"+22% W/W\").\n5. For multi-line charts, add a legend or label the lines directly.\n\n### Common reasoning mistakes\n- Sorting the x-axis by value when the question is about a trend.\n- Hiding the trend with autoscaled y (da-018).\n- Using a pie because 'percentage went up' — pie doesn't show change.\n- Smoothing too aggressively — the line should answer the question, not pretend the noise isn't there.\n\n### You just learned…\nThe verb in the ask tells you the chart type. \"Grew / changed / trended\" → **line**. \"Biggest / most\" → **bar**. \"Typical\" → **histogram**. Pies don't show change. Match the chart's visual encoding to the question's verb and the reader's eye does the work.",
    videos: [
      { title: "Bar vs line vs pie", searchQuery: "bar vs line vs pie chart when to use each tutorial" },
      { title: "Reading the question to pick a chart", searchQuery: "data visualization match chart type to question" },
    ],
  },
  estMinutes: 5,
  conceptCard:
    "This mission is about **matching chart shape to the question's verb**.\n\n- 'Grew' / 'changed' = trend = **line** (slope reads as rate of change).\n- Bars read as discrete category comparisons — wrong for trends.\n- Pies have no time axis — they can't answer 'did it grow?' at all.\n\nThe PM asked 'did DAU grow this week?' — that's a trend question. A line chart with a zero-anchored y-axis answers it in one glance.",
  lineNotes: [
    { line: 1, noteMd: "The stakeholder ask — the verb 'grow' tells you the chart shape." },
    { line: 3, noteMd: "Seven days — a continuous time-ordered sequence." },
    { line: 4, noteMd: "Smoothly increasing values — perfect for a line." },
  ],
  takeaway: "The verb in the question picks the chart: 'grew' → line, 'biggest' → bar.",
  figureSvg: DA_037_FIG,
  figureCaption: "DAU last week — 7 days of values the PM is asking about (illustrative).",
};

// ── da-038 ── chart-misreading: 3 interpretations, pick the supported one ──
const DA_038_FIG = buildFigure({
  kind: "bar",
  title: "monthly_signups_2025.png",
  xLabel: "month",
  yLabel: "signups",
  xCategories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  values: [820, 870, 905, 950, 985, 1020],
  color: "accent",
  yRange: [0, 1200],
});
const DA_038: ReasoningSpec = {
  id: "da-038-chart-misreading",
  difficulty: "easy",
  title: "38_what_does_the_chart_say.ipynb",
  icon: "scale",
  conceptTags: ["chart-reading", "interpretation", "reasoning"],
  descriptionMd:
    "## Mission: What Does the Chart Actually Say?\n\nA colleague drops the chart below into a deck for tomorrow's exec meeting. The chart is *honest* — y-axis anchored at zero, real values, no funky scales, clear labels. Three exec-deck headlines are on the table. **Two of them over-claim** — they assert things the chart doesn't actually support. One is exactly what the chart says.\n\nPick the headline that's supported by what the chart shows — not by what the audience hopes it shows.",
  initialCode:
    "# Scenario: an exec-deck headline candidate.\n# Chart shown below: monthly signups Jan–Jun 2025 (illustrative).\n# Values: 820, 870, 905, 950, 985, 1020.\n# What does it actually support?",
  buggyLineStart: 1,
  buggyLineEnd: 1,
  traceback:
    "Junior analyst's draft: 'Signups exploded in 2025 — we're on track to hit 5,000 by year end. Recommend doubling acquisition spend.'",
  correctOutput:
    "Senior analyst's verdict: 'Signups grew ~24% Jan→Jun, ~4–5% per month. Trend looks steady; extrapolation is *speculation*, not what the chart shows.'",
  options: [
    {
      key: "a",
      label: "'Signups grew ~24% from Jan to Jun — about 4–5% per month, steady.'",
      isCorrect: true,
      resultLog:
        "Acting on this reading: the deck headline matches what the chart shows; downstream decisions reference accurate numbers.",
      rationale:
        "This headline restates the chart literally. 820 → 1020 is ~24% growth over 6 months, ~4–5% per month — both numbers are arithmetic from the bars. No extrapolation, no causal claim, no comparison to a target the chart doesn't show. This is the *only* thing the audience can claim from this chart alone.",
    },
    {
      key: "b",
      label: "'Signups exploded — we'll hit 5,000 by year end. Double acquisition spend.'",
      isCorrect: false,
      resultLog:
        "Acting on this reading: the team spends 2× on acquisition, hits ~1,300 in July, exec asks why we missed the forecast.",
      rationale:
        "Two over-claims: (1) **'Exploded' is a 24% half-year rise** — call it what it is. (2) **Extrapolating** 6 months of linear-ish growth to a year-end target ignores seasonality, saturation, and basic forecasting humility (da-054). The chart shows 6 months; it can't tell you about month 12. Worse: it bundles in a *recommendation* the chart doesn't support at all.",
    },
    {
      key: "c",
      label: "'Our new homepage redesign in February drove a 24% lift.'",
      isCorrect: false,
      resultLog:
        "Acting on this reading: marketing claims credit publicly; product disagrees; trust in the analyst's reads erodes.",
      rationale:
        "**Correlation, not causation.** The chart shows growth across months. It does *not* show what caused that growth. Maybe the redesign helped; maybe seasonal demand was the real driver; maybe a campaign in a different month was. Attributing 'X% lift' to a specific change requires a controlled comparison — at minimum a before/after with a counterfactual, ideally a holdout test. This is the **`da-040` correlation-vs-causation** trap one card early.",
    },
  ],
  hints: [
    "What does the chart literally show? Six numbers in time order. What does it *not* show? Causes, futures, alternatives.",
    "Reject anything that adds a cause, a future, or a comparison the bars don't depict.",
  ],
  explanationMd:
    "### Why this is the right reading\nA chart is a **statement about the values it depicts** — nothing more. This bar chart says: in months Jan through Jun 2025, signups were `[820, 870, 905, 950, 985, 1020]`. Any honest exec-deck headline restates that and stops there. Growth rate (24% over 6 months, ~4–5% per month) is arithmetic from the bars — fine. Anything else is **adding a claim**.\n\n### What makes the over-claims weak\n- **'Exploded ... 5,000 by year end'** is two errors stacked. \"Exploded\" is editorializing a 24% rise. \"5,000 by year end\" extrapolates from 6 months to 12, assuming a constant growth rate the chart cannot promise. (Forecasting humility — see da-054.)\n- **'Homepage redesign drove the lift'** is a causal claim. The chart shows the *what*, not the *why*. Attribution requires a controlled comparison: a holdout, an A/B test, or at minimum a counterfactual the chart doesn't show. (Correlation vs causation — see da-040.)\n\n### The general principle\nA chart is *evidence*, not *argument*. When you write the headline, ask: would I be able to defend this from the chart alone? If you'd need extra evidence (causal attribution, future-trend assumption, comparison to a target), you're **adding to the chart**, not reading it. State only what the chart shows — and label the rest as *opinion* or *requires further analysis*.",
  recruiterReview:
    "Strong — you didn't let the deck-headline pressure pull you into over-claiming. You rejected both the extrapolation (claims about month 12 the 6-month chart can't support) and the causal attribution (the chart shows what, not why). That's the senior-analyst instinct: state what the chart shows, label everything else as opinion. One refinement: when stakeholders want a forward-looking headline, pair the chart with an explicit *forecast* (with uncertainty bands) and label it as such — don't let the readers turn 'recent slope' into 'commitment.'",
  tutorial: {
    bodyMd:
      "## Reading a Chart Without Over-Claiming\n\nThe most-corrupting habit in business analytics is letting the deck headline *add to* what the chart shows. The chart is evidence; the headline should restate that evidence and stop.\n\n### Three traps the eye walks into\n#### 1) Adverbs that aren't in the data\n'Exploded.' 'Stalled.' 'Surged.' These describe the *reader's reaction*, not the data. A 24% half-year rise isn't an explosion in absolute terms — it's a healthy ~4–5% per month. Write the number, not the adverb.\n\n#### 2) Extrapolation from a short window\nIf the chart shows 6 months, the headline can't honestly claim things about month 12. Seasonality, saturation, and competitive response all bend the curve. **Forecasting humility**: short windows can't tell you about long ones. If a forward claim is needed, do a *forecast* (with uncertainty bands) and label it as such, separate from the historical chart.\n\n#### 3) Causal attribution\n'The redesign caused the lift.' The chart shows growth happening in the months *after* the redesign. It does **not** show:\n- What signups would have been *without* the redesign (the counterfactual).\n- Whether other things changed in the same window (campaigns, partnerships, seasonality).\n- Whether the redesign affected signups specifically vs other downstream metrics.\nAttribution requires a controlled comparison: an A/B test, a difference-in-differences against a baseline, or at minimum an honest counterfactual narrative. A bar chart of one metric over time **cannot** prove cause.\n\n### A two-question litmus test for any chart headline\nBefore you write the headline, ask:\n1. **Can I draw a finger from the chart's data to every word in this headline?** If part of the headline requires *additional* data (a target, a comparison group, a future projection), the chart alone doesn't support it.\n2. **Would I bet my paycheck on this headline if challenged?** Adverbs and extrapolations rarely survive that test. Numbers and direction do.\n\n### Good headline patterns\n- 'Signups grew 24% Jan→Jun, ~4–5% per month.' — restates the values.\n- 'June was the largest month so far in 2025.' — true, from the chart.\n- 'Trend looks steady; July's value will tell us whether to update the forecast.' — names a next step without claiming the future.\n\n### Bad headline patterns (and why)\n- 'On track for 5,000.' → extrapolation.\n- 'X caused Y.' → causal attribution from observational data.\n- 'Exploded.' → adverb without an anchor.\n- 'Best year ever.' → comparison the chart doesn't show.\n\n### Common reasoning mistakes\n- Letting the audience's *expected* story shape the headline rather than the data.\n- Conflating 'after' with 'because of' (post hoc ergo propter hoc).\n- Smoothing or selectively framing the data to fit a narrative.\n- Promising future numbers from past slopes.\n\n### You just learned…\nA chart is **evidence**, not **argument**. The honest headline restates what the chart shows and labels anything else as opinion. Reject adverbs, extrapolations, and causal claims the chart can't carry alone.",
    videos: [
      { title: "Reading charts critically", searchQuery: "how to read a chart without misinterpreting data viz" },
      { title: "Correlation vs causation explained", searchQuery: "correlation does not imply causation tutorial beginner" },
    ],
  },
  estMinutes: 6,
  conceptCard:
    "This mission is about **reading a chart without adding claims it doesn't carry**.\n\n- A chart is **evidence**, not **argument**. Restate what's there; label everything else as opinion.\n- Watch for: adverbs ('exploded'), extrapolations ('by year end'), causal claims ('X caused Y').\n- Litmus test: can you draw a finger from the chart's data to every word in your headline?\n\nThe chart shows 6 months of steady growth. The right headline restates that and stops.",
  lineNotes: [
    { line: 1, noteMd: "The scenario — a deck-headline candidate is what we're judging." },
    { line: 3, noteMd: "The data the chart depicts — these six numbers are everything the chart 'says.'" },
    { line: 4, noteMd: "The question to ask of every headline: what does the chart *actually* support?" },
  ],
  takeaway: "A chart is evidence, not argument — restate what it shows, don't add claims it can't carry.",
  figureSvg: DA_038_FIG,
  figureCaption: "Monthly signups Jan–Jun 2025 — the chart the headline is supposed to summarise.",
};

// ── da-039 ── stakeholder framing: "did the feature work?" ─────────────────
const DA_039: ReasoningSpec = {
  id: "da-039-stakeholder-framing",
  difficulty: "easy",
  title: "39_did_the_feature_work.ipynb",
  icon: "list-todo",
  conceptTags: ["stakeholder-framing", "metric-design", "reasoning"],
  descriptionMd:
    "## Mission: 'Did The Feature Work?'\n\nA PM Slacks: *\"Did the new save-to-cart button work?\"* You can't answer 'yes' or 'no' from a single chart — the question is **under-specified**. Before opening a notebook, you need to translate the PM's ask into three questions whose answers, together, tell the story. Pick the trio that does the work.\n\nThe wrong options each fail in a real, common way: vanity metric, no counterfactual, or a fishing expedition through every metric in the warehouse. The right trio is small, specific, and decision-supporting.",
  initialCode:
    "# Scenario: PM ask — 'did the new save-to-cart button work?'\n# Before opening a notebook, define the three questions that\n# together answer the PM's question. Pick the right trio.\nfeature = 'save-to-cart button'\nlaunched = '2025-05-15'",
  buggyLineStart: 4,
  buggyLineEnd: 5,
  traceback:
    "Junior analyst's draft: 'I'll send a chart of total saves over time — that shows whether it worked, right?'",
  correctOutput:
    "Senior analyst's verdict: 'Three questions: (1) what does \"work\" mean — saves, conversions, revenue? (2) Compared to what — pre-launch users, a holdout, an A/B test? (3) What size effect would change a decision?'",
  options: [
    {
      key: "a",
      label: "(1) What does 'work' mean? (2) Compared to what? (3) What effect size matters?",
      isCorrect: true,
      resultLog:
        "Acting on this reading: the three answers tell the PM not just 'did it work?' but 'should we double down, iterate, or kill it?'",
      rationale:
        "This trio pins down the three things the PM left vague. **(1) Definition**: 'work' could mean saves, save-then-buy conversion, revenue, or retention — different metrics will say different things. **(2) Counterfactual**: change vs *what*? A naked time series shows the *what*, not the *why* (the da-040 / da-038 lesson). You need a comparison: an A/B holdout, a pre/post with a control, etc. **(3) Effect size that matters**: a 0.1% lift might be 'positive' and irrelevant. Name what would be big enough to act on. With these three answered, the resulting analysis supports a decision.",
    },
    {
      key: "b",
      label: "(1) Total saves. (2) Save trend over time. (3) Top users by saves.",
      isCorrect: false,
      resultLog:
        "Acting on this reading: the PM gets three charts that all answer the same shallow question (\"are people saving?\") and zero that compare against an alternative.",
      rationale:
        "Three views of the **same** metric is not three questions. This trio answers 'how many saves are there?' three ways — and never asks 'compared to what?' or 'is this enough?' Without a counterfactual the analysis can't distinguish 'the feature worked' from 'we'd have had this growth anyway' (the da-040 trap). Without a decision threshold the PM is left with numbers and no recommendation.",
    },
    {
      key: "c",
      label: "Pull every metric the warehouse has and report which ones moved.",
      isCorrect: false,
      resultLog:
        "Acting on this reading: out of 40 metrics looked at, 5 'moved significantly' by chance — the PM cherry-picks one for the deck, and the next launch fails to reproduce it.",
      rationale:
        "This is the **multiple-comparisons / cherry-picked-metric** failure mode (da-048). If you check 40 metrics at p<0.05, you expect ~2 to look 'significant' by pure chance. Reporting whichever ones moved guarantees a confident-looking but unreliable story. Specify the metric(s) you care about *before* looking — pre-registration, not post-hoc selection.",
    },
  ],
  hints: [
    "What's vague in 'did the feature work?' Three things — name them in the three sub-questions.",
    "Definition. Counterfactual. Effect size that matters. The PM left all three implicit.",
  ],
  explanationMd:
    "### Why this is the right framing\nStakeholder questions like 'did X work?' are almost always **three nested questions in a trench coat**. Surface them explicitly and the analysis writes itself.\n\n1. **What does 'work' mean?** — a metric definition. Saves? Save-then-buy conversion? Lift in 30-day retention? Pick one (or a small set) *before* you look. Otherwise you'll subconsciously pick whichever moved most.\n2. **Compared to what?** — a counterfactual. A naked 'after launch' number can't be a verdict. You need a comparison: an A/B holdout, a difference-in-differences vs an unaffected segment, a pre/post with proper controls. The chart of 'saves over time' from the wrong trio answers what happened, not whether the feature caused it.\n3. **What effect size would change a decision?** — the action threshold. 'Worked' implies a decision: ship it broader, iterate, kill it. Different decisions need different evidence bars. Naming the threshold up front prevents 'statistically significant but commercially trivial' results from getting credit.\n\n### What makes the other two reasonings weak\n- **'Three views of saves'** is the same question three ways. Without a counterfactual or a definition of success, you can show how many people saved without ever knowing whether the feature *worked*.\n- **'Pull every metric and report movers'** is the multiple-comparisons trap (da-048): with 40 metrics and p<0.05, ~2 will move 'significantly' by chance alone. Pre-register the metrics you care about; don't go hunting after the fact.\n\n### The general principle\nWhen a stakeholder asks an under-specified question, **the analysis starts with framing, not data**. The three questions to surface every time: definition, counterfactual, action threshold. Many wasted analyses are wasted because one of those three was assumed instead of asked.",
  recruiterReview:
    "Strong — you didn't dive into the data; you stopped to frame the question. That's the senior-analyst move. Defining 'work' before measuring it prevents the metric-roulette problem. Naming the counterfactual prevents post-hoc storytelling. Naming the effect size that matters prevents 'statistically significant but business-irrelevant' results from carrying credit they don't deserve. Two refinements: 1) write these three things into the analysis brief *before* SQL hits the warehouse — share it with the PM for sign-off; 2) if a true A/B isn't possible, propose a difference-in-differences or interrupted time series and be explicit about the limitations.",
  tutorial: {
    bodyMd:
      "## Framing Before Analysing\n\nThe single biggest leverage point in analyst work isn't a better tool — it's a better question. Most asks come in vague: 'did it work?', 'how is X doing?', 'should we keep doing Y?'. Framing surfaces the three implicit sub-questions every such ask hides.\n\n### The three questions hidden in every 'did X work?'\n#### 1) What does 'work' mean?\nThis is a metric-definition question. 'Save-to-cart button works' could mean:\n- People click the button more often (engagement).\n- People who click eventually buy more often (conversion).\n- Total order value goes up (revenue).\n- People come back to find their saves later (retention).\n\nDifferent metrics may give different answers. **Pick the metric(s) you'll evaluate *before* looking at the data.** This is the simplest defense against subconscious cherry-picking.\n\n#### 2) Compared to what?\nA post-launch number alone can't prove the feature did anything. You need a comparison:\n- **A/B test**: users randomly assigned to see the feature vs not.\n- **Holdout**: a fraction never sees the feature; compare against them.\n- **Difference-in-differences**: compare the *change* in feature users vs a matched non-feature group, controlling for seasonal trends.\n- **Pre/post with controls**: weaker, only works when no other factor changed in the window.\n\nNo counterfactual = no causal claim. You can describe what happened; you can't say the feature did it (the da-040 lesson).\n\n#### 3) What effect size would change a decision?\nDecisions are binary or near-binary: ship/kill/iterate. Different decisions tolerate different evidence bars.\n- Shipping a small UI experiment widely: a 1% lift on a primary metric might be enough.\n- Doubling down a $1M investment: needs a much bigger, well-confirmed effect.\n\nName the threshold up front: 'we'd ship if conversion lifts ≥X% with p<0.05 and a 95% CI excluding 0.' Then the result is a decision, not a narrative.\n\n### Why this framing matters\nWithout framing:\n- You measure whatever's easy and call it 'evidence.'\n- You skip the counterfactual and write a confident story about correlation.\n- You pick the metric that moved most after the fact.\n- The decision turns on whoever argues loudest in the meeting.\n\nWith framing:\n- The metric is defined ahead of time.\n- The comparison is explicit and defensible.\n- The threshold for action is agreed upon.\n- The decision falls out of the data.\n\n### The pre-analysis brief\nA one-paragraph brief, signed by the PM before any SQL, will save you days of post-hoc argument:\n> 'We're evaluating whether the save-to-cart button works. Primary metric: 30-day save→buy conversion. Comparison: A/B holdout (50% see the button, 50% don't). Decision rule: ship widely if conversion lifts ≥X% with p<0.05; iterate if smaller; kill if negative.'\n\nThree sentences. Frames the entire downstream analysis. Prevents 40-metric fishing expeditions and confident-but-unsupported attribution.\n\n### Common reasoning mistakes\n- 'Total saves went up, so it worked.' — no comparison, no decision threshold.\n- 'Let me look at all the metrics and see what moved.' — multiple-comparisons + cherry-picking (da-048).\n- 'It must have worked — usage went up afterwards.' — post hoc, not because of (the da-040 correlation/causation trap).\n- Picking the metric that gave the best result *after* seeing the data.\n\n### You just learned…\nThe three questions hidden in every 'did X work?': **definition**, **counterfactual**, **action threshold**. Surface them *before* opening the notebook. The analysis becomes a clean decision instead of a fishing expedition with a deck attached.",
    videos: [
      { title: "Framing analyst questions", searchQuery: "data analyst stakeholder question framing tutorial" },
      { title: "Pre-registration and A/B testing basics", searchQuery: "pre-registration analysis hypothesis a/b test beginner" },
    ],
  },
  estMinutes: 7,
  conceptCard:
    "This mission is about **framing the question before opening the data**.\n\n- 'Did X work?' is three questions hiding: **definition**, **counterfactual**, **action threshold**.\n- Define the metric *before* looking — otherwise you'll subconsciously cherry-pick.\n- Without a counterfactual you can describe what happened but can't say the feature did it.\n\nThe PM's ask is under-specified — surface the three sub-questions and the analysis falls into place.",
  lineNotes: [
    { line: 1, noteMd: "The PM's ask, verbatim — the vagueness is the problem." },
    { line: 4, noteMd: "The feature in question." },
    { line: 5, noteMd: "The launch date — relevant to choosing a pre/post window." },
  ],
  takeaway: "Frame three sub-questions before any SQL: definition, counterfactual, action threshold.",
};

// ── da-040 ── correlation vs causation ─────────────────────────────────────
const DA_040: ReasoningSpec = {
  id: "da-040-correlation-causation",
  difficulty: "easy",
  title: "40_users_who_save_more.ipynb",
  icon: "scale",
  conceptTags: ["correlation", "causation", "selection-bias", "reasoning"],
  descriptionMd:
    "## Mission: 'Users Who Use the Feature Retain Better'\n\nA growth PM shares a finding: *'Users who use the save-to-cart button retain at 2.4× the rate of users who don't. We should make it the homepage hero — get everyone to use it.'*\n\nThe number is real. The correlation is real. The recommendation is **not what the data shows**. There are at least two alternative explanations that would produce exactly the same observed pattern with the feature having zero causal effect on retention. Pick the response that names the gap honestly — and the experiment that would close it.",
  initialCode:
    "# Scenario: a finding from product analytics.\n# > Users who use the save-to-cart button retain at 2.4× the rate of\n# > users who don't.\n# > Recommendation: 'make the button the homepage hero, force adoption.'\n#\n# What's the most defensible response?",
  buggyLineStart: 1,
  buggyLineEnd: 1,
  traceback:
    "Junior analyst's draft: '2.4× retention — huge lift. We should ship the hero treatment to drive adoption.'",
  correctOutput:
    "Senior analyst's verdict: 'The 2.4× is correlation between two outcomes (engagement + retention) — could be selection bias (engaged users were going to retain anyway) or confounding (both are caused by something upstream). Need an A/B test on *exposure*, not usage.'",
  options: [
    {
      key: "a",
      label: "Push back: the comparison is observational. Recommend an A/B test on exposure to the feature.",
      isCorrect: true,
      resultLog:
        "Acting on this reading: the team runs a randomized test (half see the prominent button, half don't), measures retention lift on the *exposed* group — not the users who self-selected to engage.",
      rationale:
        "This is **selection bias dressed as a feature win**. Users who *choose* to use any engagement feature were probably going to be more retentive *anyway* — the kind of user who clicks save-to-cart is also the kind of user who comes back. The 2.4× compares two groups that differ in many ways besides feature use, so the gap conflates the feature's effect with the type of user. An A/B test on *exposure* (does showing the button cause retention lift?) is the only way to isolate the feature's contribution from the user's pre-existing propensity to retain.",
    },
    {
      key: "b",
      label: "Ship the hero treatment — 2.4× retention is huge.",
      isCorrect: false,
      resultLog:
        "Acting on this reading: the team makes the button prominent for everyone, retention is flat the next month, the team can't explain why.",
      rationale:
        "**Acting on correlation as if it were causation.** The 2.4× is the gap between *self-selected engagers* and *self-selected non-engagers*. Making the button prominent doesn't turn non-engagers into engagers — it just shows the button to people who weren't going to use it. The 'lift' was never causally tied to the feature; it was a property of the kind of user who already used it. This is one of the most common, most expensive product mistakes.",
    },
    {
      key: "c",
      label: "Build a propensity-score model to control for user-type and re-estimate.",
      isCorrect: false,
      resultLog:
        "Acting on this reading: 3 weeks of modeling work that *still* can't rule out unobserved confounders — the team has a fancier point estimate and no real answer.",
      rationale:
        "Better than naïvely shipping, but propensity scoring controls only for **observed** covariates. Unobserved differences between engagers and non-engagers (intent to purchase, account age, motivation level) still confound the estimate. It's a useful tool when randomization is genuinely impossible, but here a real randomized test is available — and a test gives you causal evidence directly without trying to model your way around the bias.",
    },
  ],
  hints: [
    "Who chose to use the feature? Were they random? If not, what kind of user were they before they ever saw the button?",
    "Push for an experiment on *exposure*, not on *usage*. The treatment is showing the button, not clicking it.",
  ],
  explanationMd:
    "### Why this is the right reading\nThe 2.4× number isn't false — it's just answering a *different* question than the recommendation assumes. The number compares:\n- **Group A**: users who *chose* to use the save-to-cart button.\n- **Group B**: users who *chose* not to.\n\nThese groups differ in *many* ways besides feature use: engagement level, intent to purchase, account age, motivation. So the gap between them mixes (a) the feature's actual effect, (b) the user type difference, and (c) any unmeasured confounders. The recommendation acts as if the feature *caused* the gap; the data can't say that.\n\n### Why the other readings fail\n- **'Ship the hero treatment'** — making the button prominent shows it to users who *weren't* going to use it. Those users have the lower-retention type. Forcing them to see the button doesn't make them into the higher-retention type. The 2.4× evaporates because it was never about the button.\n- **'Build a propensity-score model'** is a real technique, but it controls only for **observed** covariates. The user attributes that predict 'will I use this feature?' are largely the ones that predict 'will I retain?' — and the most important ones are unobserved (intent, motivation). The model gives you a more confident-looking number, not a more honest one.\n\n### The general principle\n**Correlation ≠ causation, especially with self-selected groups.** If group membership is a *choice*, the choice itself is correlated with the outcome — and you can't disentangle one from the other observationally. The fix is randomization: assign exposure (not usage), measure outcomes, compare. When randomization is impossible, name the limit explicitly in the writeup — don't pretend a model fixes it.",
  recruiterReview:
    "Strong — you didn't get pulled in by the 2.4× headline. You recognised the comparison was observational, named the specific bias (selection / self-selection), and proposed the right fix (A/B on exposure). That's how senior analysts kill expensive product mistakes before they ship. One refinement: when proposing the experiment, also pre-register the metric and decision threshold (the lesson from da-039) so the post-test debate isn't 'did it work?' rephrased ten ways.",
  tutorial: {
    bodyMd:
      "## Correlation vs Causation — The Cheap Trap\n\nThis is the single most expensive reasoning failure in product analytics. It costs companies real money every quarter and undergirds a remarkable fraction of confidently-wrong launch decisions.\n\n### The shape of the trap\nYou observe two things move together:\n- Users who use feature X have higher retention.\n- Customers who answer the survey are more loyal.\n- Companies that adopt practice Y are more profitable.\n\nThe instinct is: *X causes the better outcome*. So push more X and you'll get more of the outcome.\n\nThe trap is that X and the outcome are *both* often caused by an upstream factor — engagement, motivation, capability, organizational health — and the correlation you see is a downstream symptom of *that*, not a causal effect of X.\n\n### Two specific failure modes\n#### 1) Selection bias\nThe group that chose to use the feature is **not random**. Engagers, by definition, are the type who engages. Their retention is high *because they're engagers*, not because the feature taught them to be. Showing the button to a non-engager doesn't make them into an engager.\n\nExamples:\n- 'Customers who call support have higher LTV.' → calling support is a sign of investment; investors stay.\n- 'Patients who adhere to medication recover better.' → people who can stick to a regimen are different from people who can't, in many ways besides the pills.\n- 'Employees who use the wellness app are happier.' → opting in is selection.\n\n#### 2) Confounding\nA third variable causes *both* the feature use and the outcome. Without controlling for it, the feature gets credit for the third variable's effect.\n\nExamples:\n- 'Cities with more ice cream sales have more drownings.' → both caused by summer.\n- 'Countries with more chocolate consumption have more Nobel laureates.' → both correlated with national wealth and education.\n\n### How to tell the difference\n#### Run a real experiment\nRandomly assign exposure (or treatment, or whatever the intervention is). Measure outcome. Compare. If the groups were truly random pre-assignment, the difference in outcome **is** the causal effect.\n- **A/B test**: the gold standard for product. Assign users to see-feature vs not-see-feature; measure retention.\n- **Stepped-wedge / staggered rollout**: when full simultaneous A/B isn't possible, roll out in waves and compare across waves.\n\n#### When you can't experiment\nWhen randomization is genuinely impossible (regulatory, ethical, infeasible), there are quasi-experimental designs:\n- **Difference-in-differences**: compare the *change* in treated vs untreated over a discontinuity.\n- **Regression discontinuity**: compare units just above vs just below a sharp cutoff.\n- **Instrumental variables**: find a 'natural lottery' that predicts treatment but not outcome directly.\n\nEach has its limits. **Be explicit about the limits** in the writeup. Don't pretend you've measured the causal effect when you haven't.\n\n### What *doesn't* fix it\n- **More data**: a million-row observational dataset is still observational. The bias doesn't average out.\n- **Statistical controls**: regression with covariates controls only for the covariates you observed. Unobserved confounders still bias the estimate.\n- **Propensity scoring**: better than naïve adjustment, but only addresses observed confounders — same limitation.\n- **Fancy models**: a deep network doesn't help. The bias is in the data, not the model.\n\n### A two-question litmus test\n1. **Did the groups choose their group?** If yes, you have selection bias. (Self-reported features, opt-in surveys, free trials.)\n2. **Is there a third variable that could plausibly cause both X and the outcome?** If yes, confounding is at play.\n\nIf either answer is yes, **state the limit and call for an experiment**, or label the analysis as 'descriptive, not causal.'\n\n### Common reasoning mistakes\n- 'They went together, so X caused Y.'\n- 'I controlled for everything I could think of, so it's causal.'\n- 'The effect is so big it must be real.' (Big effects are often big *biases*.)\n- 'A model would fix this.' (No.)\n\n### You just learned…\nObserved correlations between feature use and outcomes almost always **mix** the feature's effect with the user's pre-existing type. The only way to isolate the feature's *causal* contribution is randomization. When you can't randomize, name the limit; never let an observational correlation drive a confident causal recommendation.",
    videos: [
      { title: "Correlation vs causation explained for analysts", searchQuery: "correlation does not imply causation analyst examples tutorial" },
      { title: "Why A/B tests matter for product decisions", searchQuery: "ab test causal product decisions selection bias tutorial" },
    ],
  },
  estMinutes: 8,
  conceptCard:
    "This mission is about **why observed correlations don't justify causal recommendations**.\n\n- Users who *chose* to use a feature differ from users who didn't in many ways — selection bias.\n- A third variable can cause both feature use *and* the outcome — confounding.\n- The fix is **randomization** (A/B on exposure), not a fancier model.\n\nThe 2.4× retention gap between users who use the feature and users who don't is correlation. Acting on it as causation costs real money.",
  lineNotes: [
    { line: 2, noteMd: "The observed correlation — real but ambiguous." },
    { line: 4, noteMd: "The recommendation — assumes the correlation is causal. It might not be." },
    { line: 6, noteMd: "The reframe question: what does the data actually support?" },
  ],
  takeaway: "Correlation ≠ causation, especially when group membership was a choice — randomize to know.",
};

const SPECS = [DA_036, DA_037, DA_038, DA_039, DA_040];
for (const spec of SPECS) {
  const composed = compose(spec);
  const filePath = join(OUT_DIR, `${spec.id}.json`);
  writeFileSync(filePath, JSON.stringify(composed, null, 2));
  console.log(`wrote ${filePath}`);
}
console.log(`authored ${SPECS.length} reasoning challenges`);
