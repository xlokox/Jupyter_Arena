#!/usr/bin/env -S tsx
/**
 * figure-builder — dev-time helper that emits the inline SVG strings we paste
 * into the da graph challenge JSON. Runtime never executes; the JSON ships
 * pre-rendered SVG. Keep figures consistent: same viewBox, same token-driven
 * colors, same axis style.
 *
 * Usage (from repo root):
 *   pnpm exec tsx scripts/figure-builder.ts | pbcopy
 *
 * The main() block at the bottom holds the actual spec for the next figure
 * you want to mint — edit it, run the script, paste into the challenge JSON's
 * `figureSvg` (or option `resultFigureSvg`).
 */

const W = 700;
const H = 400;
const PAD = { top: 36, right: 24, bottom: 56, left: 64 };
const PW = W - PAD.left - PAD.right;
const PH = H - PAD.top - PAD.bottom;

type Color = "accent" | "muted" | "success" | "warning" | "danger";
const TONE: Record<Color, string> = {
  accent: "#7CD992",
  muted: "#8B9099",
  success: "#7CD992",
  warning: "#E8B65A",
  danger: "#E36C6C",
};

type BarSpec = {
  kind: "bar";
  title: string;
  xLabel: string;
  yLabel: string;
  xCategories: string[];
  values: number[];
  color?: Color;
  /** Override the y-axis range; otherwise auto-scaled to [0, max*1.1]. */
  yRange?: [number, number];
  /** Hide the x tick labels — used to show "bars with no category names". */
  hideXLabels?: boolean;
  /** Hide the y-axis entirely (axes-missing bug). */
  hideAxes?: boolean;
};

type LineSpec = {
  kind: "line";
  title: string;
  xLabel: string;
  yLabel: string;
  xCategories: string[];
  series: Array<{ label: string; values: number[]; color: Color }>;
  yRange?: [number, number];
  showLegend?: boolean;
};

type ScatterSpec = {
  kind: "scatter";
  title: string;
  xLabel: string;
  yLabel: string;
  points: Array<{ x: number; y: number; weight?: number }>;
  xRange: [number, number];
  yRange: [number, number];
  /** When true, all dots are uniform — the "weights ignored" bug. */
  uniformSize?: boolean;
  color?: Color;
};

type HistSpec = {
  kind: "hist";
  title: string;
  xLabel: string;
  yLabel: string;
  /** Counts per bin, left-to-right. */
  counts: number[];
  /** First bin's left edge; used for x ticks. */
  xStart: number;
  binWidth: number;
  color?: Color;
};

type BoxplotSpec = {
  kind: "boxplot";
  title: string;
  xLabel: string;
  yLabel: string;
  /** Per-category five-number summary plus optional outliers. */
  groups: Array<{
    label: string;
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
    outliers?: number[];
    color?: Color;
  }>;
  yRange?: [number, number];
};

type HeatmapSpec = {
  kind: "heatmap";
  title: string;
  xLabel: string;
  yLabel: string;
  /** Cell values, row-major. cells[r][c] is the value at row r, column c. */
  cells: number[][];
  rowLabels: string[];
  colLabels: string[];
  /** Highest absolute value used for colour scaling — usually max of `cells`. */
  vMax?: number;
  /** Optional per-cell text overlay; defaults to the rounded value. */
  showValues?: boolean;
  color?: Color;
};

type PRCurveSpec = {
  kind: "pr-curve";
  title: string;
  /** Operating points along the curve, ordered by descending threshold. */
  points: Array<{ recall: number; precision: number }>;
  /** Optional marked operating point with a label (e.g. "threshold = 0.55"). */
  marker?: { recall: number; precision: number; label: string };
  /** Baseline (positive class rate) drawn as a dashed reference line. */
  baseline?: number;
  color?: Color;
};

type TrainValLossSpec = {
  kind: "train-val-loss";
  title: string;
  /** Shared x-axis (epoch or step). */
  epochs: number[];
  trainLoss: number[];
  valLoss: number[];
  /** Optional annotation, e.g. "diverges at epoch 12 — overfitting". */
  annotation?: { atEpoch: number; text: string };
  yRange?: [number, number];
};

type FigureSpec =
  | BarSpec
  | LineSpec
  | ScatterSpec
  | HistSpec
  | BoxplotSpec
  | HeatmapSpec
  | PRCurveSpec
  | TrainValLossSpec;

function xOf(i: number, n: number, padRatio = 0.15) {
  const slot = PW / n;
  return PAD.left + slot * i + slot * (padRatio / 2);
}

function frame(title: string, hideAxes: boolean): string[] {
  const out: string[] = [];
  out.push(
    `<rect x="0" y="0" width="${W}" height="${H}" fill="var(--code-bg, #11161D)" rx="6"/>`,
  );
  out.push(
    `<text x="${PAD.left}" y="22" fill="var(--text, #E6E8EC)" font-family="ui-monospace, Menlo, monospace" font-size="13" font-weight="600">${escapeXml(title)}</text>`,
  );
  if (!hideAxes) {
    out.push(
      `<line x1="${PAD.left}" y1="${PAD.top}" x2="${PAD.left}" y2="${PAD.top + PH}" stroke="var(--muted, #8B9099)" stroke-width="1"/>`,
    );
    out.push(
      `<line x1="${PAD.left}" y1="${PAD.top + PH}" x2="${PAD.left + PW}" y2="${PAD.top + PH}" stroke="var(--muted, #8B9099)" stroke-width="1"/>`,
    );
  }
  return out;
}

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function yTicks(min: number, max: number, count = 5): number[] {
  const step = (max - min) / count;
  return Array.from({ length: count + 1 }, (_, i) => min + step * i);
}

function fmt(n: number): string {
  if (!isFinite(n)) return "";
  if (Math.abs(n) >= 1000) return `${Math.round(n / 100) / 10}k`;
  if (Math.abs(n) >= 10) return String(Math.round(n));
  return String(Math.round(n * 10) / 10);
}

function renderBar(spec: BarSpec): string {
  const max = Math.max(...spec.values, 1);
  const [yMin, yMax] = spec.yRange ?? [0, max * 1.1];
  const out = frame(spec.title, !!spec.hideAxes);
  const color = TONE[spec.color ?? "accent"];
  const n = spec.values.length;
  const slot = PW / n;
  const barW = slot * 0.7;
  for (let i = 0; i < n; i++) {
    const v = spec.values[i] ?? 0;
    const h = ((v - yMin) / (yMax - yMin)) * PH;
    const x = xOf(i, n);
    const y = PAD.top + PH - h;
    out.push(
      `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" fill="${color}" opacity="0.85"/>`,
    );
    if (!spec.hideXLabels) {
      out.push(
        `<text x="${(x + barW / 2).toFixed(1)}" y="${PAD.top + PH + 18}" fill="var(--muted, #8B9099)" font-family="ui-monospace, Menlo, monospace" font-size="10" text-anchor="middle">${escapeXml(spec.xCategories[i] ?? "")}</text>`,
      );
    } else {
      out.push(
        `<text x="${(x + barW / 2).toFixed(1)}" y="${PAD.top + PH + 18}" fill="var(--muted, #8B9099)" font-family="ui-monospace, Menlo, monospace" font-size="10" text-anchor="middle">${i}</text>`,
      );
    }
  }
  if (!spec.hideAxes) {
    for (const t of yTicks(yMin, yMax)) {
      const y = PAD.top + PH - ((t - yMin) / (yMax - yMin)) * PH;
      out.push(
        `<text x="${PAD.left - 8}" y="${y + 3}" fill="var(--muted, #8B9099)" font-family="ui-monospace, Menlo, monospace" font-size="10" text-anchor="end">${fmt(t)}</text>`,
      );
    }
  }
  out.push(
    `<text x="${PAD.left + PW / 2}" y="${H - 14}" fill="var(--muted, #8B9099)" font-family="ui-monospace, Menlo, monospace" font-size="11" text-anchor="middle">${escapeXml(spec.xLabel)}</text>`,
  );
  out.push(
    `<text transform="translate(20, ${PAD.top + PH / 2}) rotate(-90)" fill="var(--muted, #8B9099)" font-family="ui-monospace, Menlo, monospace" font-size="11" text-anchor="middle">${escapeXml(spec.yLabel)}</text>`,
  );
  return wrap(out);
}

function renderLine(spec: LineSpec): string {
  const allValues = spec.series.flatMap((s) => s.values);
  const max = Math.max(...allValues, 1);
  const min = Math.min(...allValues, 0);
  const [yMin, yMax] = spec.yRange ?? [min, max * 1.1];
  const out = frame(spec.title, false);
  const n = spec.xCategories.length;
  for (const series of spec.series) {
    const pts = series.values.map((v, i) => {
      const x = xOf(i, n) + PW / n / 2;
      const y = PAD.top + PH - ((v - yMin) / (yMax - yMin)) * PH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    out.push(
      `<polyline points="${pts.join(" ")}" fill="none" stroke="${TONE[series.color]}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
    );
    for (const p of pts) {
      const [x, y] = p.split(",");
      out.push(`<circle cx="${x}" cy="${y}" r="2.5" fill="${TONE[series.color]}"/>`);
    }
  }
  for (let i = 0; i < n; i++) {
    const x = xOf(i, n) + PW / n / 2;
    out.push(
      `<text x="${x.toFixed(1)}" y="${PAD.top + PH + 18}" fill="var(--muted, #8B9099)" font-family="ui-monospace, Menlo, monospace" font-size="10" text-anchor="middle">${escapeXml(spec.xCategories[i] ?? "")}</text>`,
    );
  }
  for (const t of yTicks(yMin, yMax)) {
    const y = PAD.top + PH - ((t - yMin) / (yMax - yMin)) * PH;
    out.push(
      `<text x="${PAD.left - 8}" y="${y + 3}" fill="var(--muted, #8B9099)" font-family="ui-monospace, Menlo, monospace" font-size="10" text-anchor="end">${fmt(t)}</text>`,
    );
  }
  if (spec.showLegend && spec.series.length > 1) {
    let lx = PAD.left + 8;
    const ly = PAD.top + 6;
    for (const s of spec.series) {
      out.push(`<rect x="${lx}" y="${ly}" width="10" height="3" fill="${TONE[s.color]}"/>`);
      out.push(
        `<text x="${lx + 14}" y="${ly + 4}" fill="var(--text, #E6E8EC)" font-family="ui-monospace, Menlo, monospace" font-size="10">${escapeXml(s.label)}</text>`,
      );
      lx += 14 + s.label.length * 6 + 12;
    }
  }
  out.push(
    `<text x="${PAD.left + PW / 2}" y="${H - 14}" fill="var(--muted, #8B9099)" font-family="ui-monospace, Menlo, monospace" font-size="11" text-anchor="middle">${escapeXml(spec.xLabel)}</text>`,
  );
  out.push(
    `<text transform="translate(20, ${PAD.top + PH / 2}) rotate(-90)" fill="var(--muted, #8B9099)" font-family="ui-monospace, Menlo, monospace" font-size="11" text-anchor="middle">${escapeXml(spec.yLabel)}</text>`,
  );
  return wrap(out);
}

function renderScatter(spec: ScatterSpec): string {
  const out = frame(spec.title, false);
  const color = TONE[spec.color ?? "accent"];
  const [xMin, xMax] = spec.xRange;
  const [yMin, yMax] = spec.yRange;
  for (const p of spec.points) {
    const x = PAD.left + ((p.x - xMin) / (xMax - xMin)) * PW;
    const y = PAD.top + PH - ((p.y - yMin) / (yMax - yMin)) * PH;
    const r = spec.uniformSize ? 3.2 : 2.5 + (p.weight ?? 1) * 1.3;
    out.push(
      `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${color}" opacity="0.7"/>`,
    );
  }
  for (const t of yTicks(yMin, yMax)) {
    const y = PAD.top + PH - ((t - yMin) / (yMax - yMin)) * PH;
    out.push(
      `<text x="${PAD.left - 8}" y="${y + 3}" fill="var(--muted, #8B9099)" font-family="ui-monospace, Menlo, monospace" font-size="10" text-anchor="end">${fmt(t)}</text>`,
    );
  }
  for (const t of yTicks(xMin, xMax, 4)) {
    const x = PAD.left + ((t - xMin) / (xMax - xMin)) * PW;
    out.push(
      `<text x="${x.toFixed(1)}" y="${PAD.top + PH + 18}" fill="var(--muted, #8B9099)" font-family="ui-monospace, Menlo, monospace" font-size="10" text-anchor="middle">${fmt(t)}</text>`,
    );
  }
  out.push(
    `<text x="${PAD.left + PW / 2}" y="${H - 14}" fill="var(--muted, #8B9099)" font-family="ui-monospace, Menlo, monospace" font-size="11" text-anchor="middle">${escapeXml(spec.xLabel)}</text>`,
  );
  out.push(
    `<text transform="translate(20, ${PAD.top + PH / 2}) rotate(-90)" fill="var(--muted, #8B9099)" font-family="ui-monospace, Menlo, monospace" font-size="11" text-anchor="middle">${escapeXml(spec.yLabel)}</text>`,
  );
  return wrap(out);
}

function renderHist(spec: HistSpec): string {
  const max = Math.max(...spec.counts, 1);
  const out = frame(spec.title, false);
  const color = TONE[spec.color ?? "accent"];
  const n = spec.counts.length;
  const slot = PW / n;
  for (let i = 0; i < n; i++) {
    const v = spec.counts[i] ?? 0;
    const h = (v / max) * PH;
    const x = PAD.left + i * slot;
    const y = PAD.top + PH - h;
    out.push(
      `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(slot - 1).toFixed(1)}" height="${h.toFixed(1)}" fill="${color}" opacity="0.85" stroke="var(--code-bg, #11161D)" stroke-width="1"/>`,
    );
    const label = spec.xStart + i * spec.binWidth;
    if (i % Math.max(1, Math.floor(n / 6)) === 0) {
      out.push(
        `<text x="${(x + slot / 2).toFixed(1)}" y="${PAD.top + PH + 18}" fill="var(--muted, #8B9099)" font-family="ui-monospace, Menlo, monospace" font-size="10" text-anchor="middle">${fmt(label)}</text>`,
      );
    }
  }
  for (const t of yTicks(0, max)) {
    const y = PAD.top + PH - (t / max) * PH;
    out.push(
      `<text x="${PAD.left - 8}" y="${y + 3}" fill="var(--muted, #8B9099)" font-family="ui-monospace, Menlo, monospace" font-size="10" text-anchor="end">${fmt(t)}</text>`,
    );
  }
  out.push(
    `<text x="${PAD.left + PW / 2}" y="${H - 14}" fill="var(--muted, #8B9099)" font-family="ui-monospace, Menlo, monospace" font-size="11" text-anchor="middle">${escapeXml(spec.xLabel)}</text>`,
  );
  out.push(
    `<text transform="translate(20, ${PAD.top + PH / 2}) rotate(-90)" fill="var(--muted, #8B9099)" font-family="ui-monospace, Menlo, monospace" font-size="11" text-anchor="middle">${escapeXml(spec.yLabel)}</text>`,
  );
  return wrap(out);
}

function renderBoxplot(spec: BoxplotSpec): string {
  const allValues = spec.groups.flatMap((g) => [g.min, g.q1, g.median, g.q3, g.max, ...(g.outliers ?? [])]);
  const max = Math.max(...allValues, 1);
  const min = Math.min(...allValues, 0);
  const [yMin, yMax] = spec.yRange ?? [min, max * 1.05];
  const out = frame(spec.title, false);
  const n = spec.groups.length;
  const slot = PW / n;
  const boxW = slot * 0.45;
  for (let i = 0; i < n; i++) {
    const g = spec.groups[i];
    if (!g) continue;
    const color = TONE[g.color ?? "accent"];
    const x = PAD.left + slot * i + slot / 2;
    const yOf = (v: number) => PAD.top + PH - ((v - yMin) / (yMax - yMin)) * PH;
    const yMin1 = yOf(g.min);
    const yQ1 = yOf(g.q1);
    const yMed = yOf(g.median);
    const yQ3 = yOf(g.q3);
    const yMax1 = yOf(g.max);
    out.push(
      `<line x1="${x.toFixed(1)}" y1="${yMax1.toFixed(1)}" x2="${x.toFixed(1)}" y2="${yMin1.toFixed(1)}" stroke="${color}" stroke-width="1"/>`,
    );
    out.push(
      `<line x1="${(x - boxW / 4).toFixed(1)}" y1="${yMax1.toFixed(1)}" x2="${(x + boxW / 4).toFixed(1)}" y2="${yMax1.toFixed(1)}" stroke="${color}" stroke-width="1.5"/>`,
    );
    out.push(
      `<line x1="${(x - boxW / 4).toFixed(1)}" y1="${yMin1.toFixed(1)}" x2="${(x + boxW / 4).toFixed(1)}" y2="${yMin1.toFixed(1)}" stroke="${color}" stroke-width="1.5"/>`,
    );
    out.push(
      `<rect x="${(x - boxW / 2).toFixed(1)}" y="${yQ3.toFixed(1)}" width="${boxW.toFixed(1)}" height="${(yQ1 - yQ3).toFixed(1)}" fill="${color}" fill-opacity="0.18" stroke="${color}" stroke-width="1.5"/>`,
    );
    out.push(
      `<line x1="${(x - boxW / 2).toFixed(1)}" y1="${yMed.toFixed(1)}" x2="${(x + boxW / 2).toFixed(1)}" y2="${yMed.toFixed(1)}" stroke="${color}" stroke-width="2"/>`,
    );
    for (const o of g.outliers ?? []) {
      out.push(
        `<circle cx="${x.toFixed(1)}" cy="${yOf(o).toFixed(1)}" r="2.5" fill="${TONE.danger}" opacity="0.85"/>`,
      );
    }
    out.push(
      `<text x="${x.toFixed(1)}" y="${PAD.top + PH + 18}" fill="var(--muted, #8B9099)" font-family="ui-monospace, Menlo, monospace" font-size="10" text-anchor="middle">${escapeXml(g.label)}</text>`,
    );
  }
  for (const t of yTicks(yMin, yMax)) {
    const y = PAD.top + PH - ((t - yMin) / (yMax - yMin)) * PH;
    out.push(
      `<text x="${PAD.left - 8}" y="${y + 3}" fill="var(--muted, #8B9099)" font-family="ui-monospace, Menlo, monospace" font-size="10" text-anchor="end">${fmt(t)}</text>`,
    );
  }
  out.push(
    `<text x="${PAD.left + PW / 2}" y="${H - 14}" fill="var(--muted, #8B9099)" font-family="ui-monospace, Menlo, monospace" font-size="11" text-anchor="middle">${escapeXml(spec.xLabel)}</text>`,
  );
  out.push(
    `<text transform="translate(20, ${PAD.top + PH / 2}) rotate(-90)" fill="var(--muted, #8B9099)" font-family="ui-monospace, Menlo, monospace" font-size="11" text-anchor="middle">${escapeXml(spec.yLabel)}</text>`,
  );
  return wrap(out);
}

function renderHeatmap(spec: HeatmapSpec): string {
  const out = frame(spec.title, true);
  const rows = spec.cells.length;
  const cols = spec.cells[0]?.length ?? 0;
  const cellW = PW / cols;
  const cellH = PH / rows;
  const vMax = spec.vMax ?? Math.max(...spec.cells.flat(), 1);
  const baseColor = TONE[spec.color ?? "accent"];
  // Parse the accent into an RGB triple so we can fade the fill by intensity.
  const m = baseColor.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  const rgb = m
    ? [parseInt(m[1] ?? "00", 16), parseInt(m[2] ?? "00", 16), parseInt(m[3] ?? "00", 16)]
    : [124, 217, 146];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = spec.cells[r]?.[c] ?? 0;
      const intensity = Math.max(0.06, Math.min(1, v / vMax));
      const fill = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${intensity.toFixed(2)})`;
      const x = PAD.left + c * cellW;
      const y = PAD.top + r * cellH;
      out.push(
        `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${cellW.toFixed(1)}" height="${cellH.toFixed(1)}" fill="${fill}" stroke="var(--code-bg, #11161D)" stroke-width="1"/>`,
      );
      if (spec.showValues !== false) {
        const textFill = intensity > 0.55 ? "#0A0C10" : "var(--text, #E6E8EC)";
        out.push(
          `<text x="${(x + cellW / 2).toFixed(1)}" y="${(y + cellH / 2 + 3).toFixed(1)}" fill="${textFill}" font-family="ui-monospace, Menlo, monospace" font-size="11" text-anchor="middle">${fmt(v)}</text>`,
        );
      }
    }
  }
  for (let r = 0; r < rows; r++) {
    out.push(
      `<text x="${PAD.left - 8}" y="${(PAD.top + cellH * r + cellH / 2 + 3).toFixed(1)}" fill="var(--muted, #8B9099)" font-family="ui-monospace, Menlo, monospace" font-size="10" text-anchor="end">${escapeXml(spec.rowLabels[r] ?? "")}</text>`,
    );
  }
  for (let c = 0; c < cols; c++) {
    out.push(
      `<text x="${(PAD.left + cellW * c + cellW / 2).toFixed(1)}" y="${PAD.top + PH + 18}" fill="var(--muted, #8B9099)" font-family="ui-monospace, Menlo, monospace" font-size="10" text-anchor="middle">${escapeXml(spec.colLabels[c] ?? "")}</text>`,
    );
  }
  out.push(
    `<text x="${PAD.left + PW / 2}" y="${H - 14}" fill="var(--muted, #8B9099)" font-family="ui-monospace, Menlo, monospace" font-size="11" text-anchor="middle">${escapeXml(spec.xLabel)}</text>`,
  );
  out.push(
    `<text transform="translate(20, ${PAD.top + PH / 2}) rotate(-90)" fill="var(--muted, #8B9099)" font-family="ui-monospace, Menlo, monospace" font-size="11" text-anchor="middle">${escapeXml(spec.yLabel)}</text>`,
  );
  return wrap(out);
}

function renderPRCurve(spec: PRCurveSpec): string {
  const out = frame(spec.title, false);
  const color = TONE[spec.color ?? "accent"];
  const xOfR = (r: number) => PAD.left + r * PW;
  const yOfP = (p: number) => PAD.top + PH - p * PH;
  const pts = spec.points.map((p) => `${xOfR(p.recall).toFixed(1)},${yOfP(p.precision).toFixed(1)}`);
  out.push(
    `<polyline points="${pts.join(" ")}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  );
  if (typeof spec.baseline === "number") {
    const yB = yOfP(spec.baseline);
    out.push(
      `<line x1="${PAD.left}" y1="${yB.toFixed(1)}" x2="${PAD.left + PW}" y2="${yB.toFixed(1)}" stroke="${TONE.muted}" stroke-width="1" stroke-dasharray="4 4"/>`,
    );
    out.push(
      `<text x="${PAD.left + PW - 4}" y="${(yB - 4).toFixed(1)}" fill="${TONE.muted}" font-family="ui-monospace, Menlo, monospace" font-size="10" text-anchor="end">baseline = ${fmt(spec.baseline)}</text>`,
    );
  }
  if (spec.marker) {
    const cx = xOfR(spec.marker.recall);
    const cy = yOfP(spec.marker.precision);
    out.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="5" fill="${TONE.warning}" stroke="var(--code-bg, #11161D)" stroke-width="1.5"/>`);
    out.push(
      `<text x="${(cx + 8).toFixed(1)}" y="${(cy - 8).toFixed(1)}" fill="${TONE.warning}" font-family="ui-monospace, Menlo, monospace" font-size="10">${escapeXml(spec.marker.label)}</text>`,
    );
  }
  for (let i = 0; i <= 5; i++) {
    const v = i / 5;
    const yt = yOfP(v);
    const xt = xOfR(v);
    out.push(
      `<text x="${PAD.left - 8}" y="${(yt + 3).toFixed(1)}" fill="var(--muted, #8B9099)" font-family="ui-monospace, Menlo, monospace" font-size="10" text-anchor="end">${v.toFixed(1)}</text>`,
    );
    out.push(
      `<text x="${xt.toFixed(1)}" y="${PAD.top + PH + 18}" fill="var(--muted, #8B9099)" font-family="ui-monospace, Menlo, monospace" font-size="10" text-anchor="middle">${v.toFixed(1)}</text>`,
    );
  }
  out.push(
    `<text x="${PAD.left + PW / 2}" y="${H - 14}" fill="var(--muted, #8B9099)" font-family="ui-monospace, Menlo, monospace" font-size="11" text-anchor="middle">recall</text>`,
  );
  out.push(
    `<text transform="translate(20, ${PAD.top + PH / 2}) rotate(-90)" fill="var(--muted, #8B9099)" font-family="ui-monospace, Menlo, monospace" font-size="11" text-anchor="middle">precision</text>`,
  );
  return wrap(out);
}

function renderTrainValLoss(spec: TrainValLossSpec): string {
  const all = [...spec.trainLoss, ...spec.valLoss];
  const lo = Math.min(...all, 0);
  const hi = Math.max(...all, 1);
  const [yMin, yMax] = spec.yRange ?? [Math.max(0, lo - 0.05), hi * 1.05];
  const out = frame(spec.title, false);
  const xMin = Math.min(...spec.epochs);
  const xMax = Math.max(...spec.epochs);
  const xOf = (e: number) => PAD.left + ((e - xMin) / Math.max(1, xMax - xMin)) * PW;
  const yOf = (v: number) => PAD.top + PH - ((v - yMin) / (yMax - yMin)) * PH;
  const series = [
    { label: "train", values: spec.trainLoss, color: TONE.accent },
    { label: "val", values: spec.valLoss, color: TONE.warning },
  ];
  for (const s of series) {
    const pts = spec.epochs.map((e, i) => `${xOf(e).toFixed(1)},${yOf(s.values[i] ?? 0).toFixed(1)}`);
    out.push(
      `<polyline points="${pts.join(" ")}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
    );
  }
  // Legend top-left.
  let lx = PAD.left + 8;
  const ly = PAD.top + 6;
  for (const s of series) {
    out.push(`<rect x="${lx}" y="${ly}" width="10" height="3" fill="${s.color}"/>`);
    out.push(
      `<text x="${lx + 14}" y="${ly + 4}" fill="var(--text, #E6E8EC)" font-family="ui-monospace, Menlo, monospace" font-size="10">${escapeXml(s.label)}</text>`,
    );
    lx += 14 + s.label.length * 6 + 12;
  }
  if (spec.annotation) {
    const xA = xOf(spec.annotation.atEpoch);
    out.push(
      `<line x1="${xA.toFixed(1)}" y1="${PAD.top}" x2="${xA.toFixed(1)}" y2="${PAD.top + PH}" stroke="${TONE.danger}" stroke-width="1" stroke-dasharray="3 3"/>`,
    );
    out.push(
      `<text x="${(xA + 5).toFixed(1)}" y="${PAD.top + 18}" fill="${TONE.danger}" font-family="ui-monospace, Menlo, monospace" font-size="10">${escapeXml(spec.annotation.text)}</text>`,
    );
  }
  for (const t of yTicks(yMin, yMax)) {
    const y = PAD.top + PH - ((t - yMin) / (yMax - yMin)) * PH;
    out.push(
      `<text x="${PAD.left - 8}" y="${y + 3}" fill="var(--muted, #8B9099)" font-family="ui-monospace, Menlo, monospace" font-size="10" text-anchor="end">${fmt(t)}</text>`,
    );
  }
  for (let i = 0; i <= 4; i++) {
    const e = xMin + ((xMax - xMin) * i) / 4;
    out.push(
      `<text x="${xOf(e).toFixed(1)}" y="${PAD.top + PH + 18}" fill="var(--muted, #8B9099)" font-family="ui-monospace, Menlo, monospace" font-size="10" text-anchor="middle">${fmt(e)}</text>`,
    );
  }
  out.push(
    `<text x="${PAD.left + PW / 2}" y="${H - 14}" fill="var(--muted, #8B9099)" font-family="ui-monospace, Menlo, monospace" font-size="11" text-anchor="middle">epoch</text>`,
  );
  out.push(
    `<text transform="translate(20, ${PAD.top + PH / 2}) rotate(-90)" fill="var(--muted, #8B9099)" font-family="ui-monospace, Menlo, monospace" font-size="11" text-anchor="middle">loss</text>`,
  );
  return wrap(out);
}

function wrap(parts: string[]): string {
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" width="100%" height="auto">${parts.join("")}</svg>`;
}

export function buildFigure(spec: FigureSpec): string {
  switch (spec.kind) {
    case "bar":
      return renderBar(spec);
    case "line":
      return renderLine(spec);
    case "scatter":
      return renderScatter(spec);
    case "hist":
      return renderHist(spec);
    case "boxplot":
      return renderBoxplot(spec);
    case "heatmap":
      return renderHeatmap(spec);
    case "pr-curve":
      return renderPRCurve(spec);
    case "train-val-loss":
      return renderTrainValLoss(spec);
  }
}

if (process.argv[1]?.endsWith("figure-builder.ts")) {
  // Edit this spec for whatever figure you want to mint next.
  const demo: BarSpec = {
    kind: "bar",
    title: "monthly_revenue_2025.png",
    xLabel: "month",
    yLabel: "revenue (USD)",
    xCategories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    values: [4200, 4500, 4900, 5100, 5400, 5800],
    color: "accent",
  };
  process.stdout.write(buildFigure(demo) + "\n");
}
