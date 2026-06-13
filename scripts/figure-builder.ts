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

type FigureSpec = BarSpec | LineSpec | ScatterSpec | HistSpec;

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
