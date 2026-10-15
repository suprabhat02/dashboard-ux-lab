import {
  formatCompactCurrency,
  formatMonthLong,
  formatMonthShort,
  formatValue,
} from './format';
import type { RevenuePoint } from './types';

/**
 * Chart geometry is part of the visual spec, so it is computed once here and
 * rendered by each implementation. Rendering (SVG elements, events) stays in the
 * implementations; maths and labels do not.
 */

export const CHART = {
  width: 640,
  height: 240,
  padding: { top: 16, right: 8, bottom: 28, left: 52 },
  barGap: 0.32,
  tickCount: 4,
} as const;

export interface ChartBar {
  readonly month: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly shortLabel: string;
  /** "October 2026: $48,120" — used for titles and the data table. */
  readonly description: string;
  readonly isLatest: boolean;
}

export interface ChartTick {
  readonly y: number;
  readonly label: string;
}

export interface ChartModel {
  readonly bars: readonly ChartBar[];
  readonly ticks: readonly ChartTick[];
  /** One-sentence summary used as the SVG's accessible name. */
  readonly summary: string;
}

/** Round a maximum up to a "nice" value (1, 2, 2.5, 5 × 10ⁿ) so ticks read cleanly. */
export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const exponent = Math.floor(Math.log10(value));
  const base = 10 ** exponent;
  const fraction = value / base;
  const nice = [1, 2, 2.5, 5, 10].find((step) => fraction <= step) ?? 10;
  return nice * base;
}

export function buildChartModel(points: readonly RevenuePoint[]): ChartModel {
  const { width, height, padding, barGap, tickCount } = CHART;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const max = niceMax(Math.max(0, ...points.map((point) => point.mrr)));
  const slot = points.length > 0 ? plotWidth / points.length : plotWidth;
  const barWidth = slot * (1 - barGap);
  const yFor = (value: number): number =>
    padding.top + plotHeight - (value / max) * plotHeight;

  const bars = points.map((point, index): ChartBar => {
    const y = yFor(point.mrr);
    return {
      month: point.month,
      x: padding.left + index * slot + (slot - barWidth) / 2,
      y,
      width: barWidth,
      height: padding.top + plotHeight - y,
      shortLabel: formatMonthShort(point.month),
      description: `${formatMonthLong(point.month)}: ${formatValue(point.mrr, 'currency')}`,
      isLatest: index === points.length - 1,
    };
  });

  const ticks = Array.from({ length: tickCount + 1 }, (_, index): ChartTick => {
    const value = (max / tickCount) * index;
    return { y: yFor(value), label: formatCompactCurrency(value) };
  });

  return { bars, ticks, summary: summarize(points) };
}

function summarize(points: readonly RevenuePoint[]): string {
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return 'No revenue data.';
  const peak = points.reduce(
    (best, point) => (point.mrr > best.mrr ? point : best),
    first,
  );
  const trend =
    last.mrr > first.mrr ? 'rose' : last.mrr < first.mrr ? 'fell' : 'was flat';
  return (
    `Bar chart. Monthly recurring revenue ${trend} from ${formatValue(first.mrr, 'currency')} ` +
    `in ${formatMonthLong(first.month)} to ${formatValue(last.mrr, 'currency')} in ` +
    `${formatMonthLong(last.month)}, peaking at ${formatValue(peak.mrr, 'currency')} in ` +
    `${formatMonthLong(peak.month)}.`
  );
}
