import { getFormatter } from './format';
import { getMessages, LOCALE_META, type Locale } from './i18n';
import type { RevenuePoint } from './types';

/**
 * Chart geometry is part of the visual spec, so it is computed once here and
 * rendered by each implementation. Rendering (SVG elements, events) stays in the
 * implementations; maths, labels and direction do not.
 *
 * Right-to-left locales mirror the time axis (newest month on the left, value
 * axis on the right), following the bidirectional guidance for time-based charts.
 * Implementations never branch on direction: they draw what the model says.
 */

export const CHART = {
  width: 640,
  height: 240,
  /** Padding on the value-axis side and the opposite side, so mirroring is a swap. */
  padding: { top: 16, axisSide: 60, farSide: 8, bottom: 28 },
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
  /** "October 2026: $48,120" — used for <title> and the data table. */
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
  /** Grid line extent and tick label placement, already mirrored for RTL. */
  readonly axis: {
    readonly gridX1: number;
    readonly gridX2: number;
    readonly labelX: number;
    readonly labelAnchor: 'start' | 'end';
  };
  /** Label above the latest bar (compact currency). */
  readonly latestLabel: string | null;
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

export function buildChartModel(
  points: readonly RevenuePoint[],
  locale: Locale,
): ChartModel {
  const fmt = getFormatter(locale);
  const rtl = LOCALE_META[locale].dir === 'rtl';
  const { width, height, padding, barGap, tickCount } = CHART;
  const plotWidth = width - padding.axisSide - padding.farSide;
  const plotHeight = height - padding.top - padding.bottom;
  const plotStart = rtl ? padding.farSide : padding.axisSide;
  const max = niceMax(Math.max(0, ...points.map((point) => point.mrr)));
  const slot = points.length > 0 ? plotWidth / points.length : plotWidth;
  const barWidth = slot * (1 - barGap);
  const yFor = (value: number): number =>
    padding.top + plotHeight - (value / max) * plotHeight;

  const bars = points.map((point, index): ChartBar => {
    const y = yFor(point.mrr);
    const slotIndex = rtl ? points.length - 1 - index : index;
    return {
      month: point.month,
      x: plotStart + slotIndex * slot + (slot - barWidth) / 2,
      y,
      width: barWidth,
      height: padding.top + plotHeight - y,
      shortLabel: fmt.monthShort(point.month),
      description: `${fmt.monthLong(point.month)}: ${fmt.value(point.mrr, 'currency')}`,
      isLatest: index === points.length - 1,
    };
  });

  const ticks = Array.from({ length: tickCount + 1 }, (_, index): ChartTick => {
    const value = (max / tickCount) * index;
    return { y: yFor(value), label: fmt.compactNumber(value) };
  });

  const latest = points.at(-1);
  return {
    bars,
    ticks,
    axis: {
      gridX1: plotStart,
      gridX2: plotStart + plotWidth,
      labelX: rtl ? width - padding.axisSide + 10 : padding.axisSide - 10,
      // Logical anchor: SVG text inherits the page direction, so 'end' means
      // "grow towards the reading start". In both directions the label grows
      // away from the plot, into the axis gutter.
      labelAnchor: 'end',
    },
    latestLabel: latest ? fmt.compactNumber(latest.mrr) : null,
    summary: summarize(points, locale),
  };
}

function summarize(points: readonly RevenuePoint[], locale: Locale): string {
  const fmt = getFormatter(locale);
  const t = getMessages(locale).dashboard.chart;
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return t.noData;
  const peak = points.reduce(
    (best, point) => (point.mrr > best.mrr ? point : best),
    first,
  );
  const trend = last.mrr > first.mrr ? 'rose' : last.mrr < first.mrr ? 'fell' : 'flat';
  const money = (value: number): string => fmt.value(value, 'currency');
  return t.summary(
    trend,
    money(first.mrr),
    fmt.monthLong(first.month),
    money(last.mrr),
    fmt.monthLong(last.month),
    money(peak.mrr),
    fmt.monthLong(peak.month),
  );
}
