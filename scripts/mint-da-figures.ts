#!/usr/bin/env -S tsx
/**
 * Dev-time batch — mints the SVG figures for da-016..020 (slice 4).
 * Writes one JSON map of `{ "da-016-before": "<svg…>", "da-016-after": "<svg…>", … }`
 * to /tmp/da-figures.json so the authoring step can paste them into each
 * challenge file. Re-run any time you tweak a spec.
 *
 *   pnpm exec tsx scripts/mint-da-figures.ts
 */
import { writeFileSync } from "node:fs";
import { buildFigure } from "./figure-builder";

const F: Record<string, string> = {};

// da-016 — `plt.show()` missing → no figure renders.
//   Pre: an empty/featureless axes pair (mimics a notebook cell with no figure shown).
//   Post: the bar chart that was meant to appear.
F["da-016-before"] = buildFigure({
  kind: "bar",
  title: "(no figure was shown)",
  xLabel: "month",
  yLabel: "revenue (USD)",
  xCategories: ["", "", "", "", "", ""],
  values: [0, 0, 0, 0, 0, 0],
  color: "muted",
  yRange: [0, 6000],
  hideXLabels: true,
});
F["da-016-after"] = buildFigure({
  kind: "bar",
  title: "monthly_revenue_2025.png",
  xLabel: "month",
  yLabel: "revenue (USD)",
  xCategories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  values: [4200, 4500, 4900, 5100, 5400, 5800],
  color: "accent",
});

// da-017 — wrong column for x-axis labels.
//   Pre: bars with `0..N` numeric x-ticks instead of category names.
//   Post: same heights, now labelled with the category names.
F["da-017-before"] = buildFigure({
  kind: "bar",
  title: "top_products_q2.png",
  xLabel: "(x-axis labels missing — got 0..N)",
  yLabel: "units sold",
  xCategories: ["A", "B", "C", "D", "E"],
  values: [320, 280, 240, 200, 160],
  color: "warning",
  hideXLabels: true,
});
F["da-017-after"] = buildFigure({
  kind: "bar",
  title: "top_products_q2.png",
  xLabel: "product",
  yLabel: "units sold",
  xCategories: ["mug", "tee", "pen", "cap", "bag"],
  values: [320, 280, 240, 200, 160],
  color: "accent",
});

// da-018 — y-axis range autoscaled so growth is invisible.
//   Pre: line with y zoomed to the value range — looks flat.
//   Post: y starts at 0, growth visible.
F["da-018-before"] = buildFigure({
  kind: "line",
  title: "weekly_signups.png",
  xLabel: "week",
  yLabel: "signups",
  xCategories: ["W1", "W2", "W3", "W4", "W5", "W6"],
  series: [{ label: "signups", values: [10200, 10215, 10230, 10241, 10255, 10268], color: "warning" }],
  yRange: [10195, 10275],
});
F["da-018-after"] = buildFigure({
  kind: "line",
  title: "weekly_signups.png (y from 0)",
  xLabel: "week",
  yLabel: "signups",
  xCategories: ["W1", "W2", "W3", "W4", "W5", "W6"],
  series: [{ label: "signups", values: [10200, 10215, 10230, 10241, 10255, 10268], color: "accent" }],
  yRange: [0, 12000],
});

// da-019 — dates plotted as strings → lexical sort.
//   Pre: months in alphabetical order (Apr, Aug, Dec, Feb, Jan, Jul, Jun, Mar, May, Nov, Oct, Sep).
//   Post: chronological order Jan..Dec.
F["da-019-before"] = buildFigure({
  kind: "line",
  title: "monthly_orders_2025.png",
  xLabel: "month (sorted as strings)",
  yLabel: "orders",
  xCategories: ["Apr", "Aug", "Dec", "Feb", "Jan", "Jul", "Jun", "Mar", "May", "Nov", "Oct", "Sep"],
  series: [{ label: "orders", values: [3400, 4900, 6800, 2600, 2300, 4400, 4100, 2900, 3700, 6200, 5600, 5100], color: "warning" }],
});
F["da-019-after"] = buildFigure({
  kind: "line",
  title: "monthly_orders_2025.png",
  xLabel: "month (chronological)",
  yLabel: "orders",
  xCategories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  series: [{ label: "orders", values: [2300, 2600, 2900, 3400, 3700, 4100, 4400, 4900, 5100, 5600, 6200, 6800], color: "accent" }],
});

// da-020 — bar chart instead of line for a time series.
//   Pre: bars (trend hidden — eye reads each bar as discrete).
//   Post: line — slope is obvious.
F["da-020-before"] = buildFigure({
  kind: "bar",
  title: "daily_active_users.png",
  xLabel: "day",
  yLabel: "DAU",
  xCategories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  values: [1200, 1240, 1280, 1330, 1380, 1420, 1460],
  color: "warning",
});
F["da-020-after"] = buildFigure({
  kind: "line",
  title: "daily_active_users.png",
  xLabel: "day",
  yLabel: "DAU",
  xCategories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  series: [{ label: "DAU", values: [1200, 1240, 1280, 1330, 1380, 1420, 1460], color: "accent" }],
});

writeFileSync("/tmp/da-figures.json", JSON.stringify(F, null, 2));
console.log(`minted ${Object.keys(F).length} figures → /tmp/da-figures.json`);
