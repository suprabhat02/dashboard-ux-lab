import type { AccountStatus, Kpi, Plan, PlanFilter, ValueFormat } from './types';

/**
 * Formatting is part of the visual spec: both implementations must print the same
 * strings, or the parity tests (and visitors comparing them) would see differences.
 */
const LOCALE = 'en-US';

const currency = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const compactCurrency = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});
const count = new Intl.NumberFormat(LOCALE);
const percent = new Intl.NumberFormat(LOCALE, {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});
const monthShort = new Intl.DateTimeFormat(LOCALE, { month: 'short', timeZone: 'UTC' });
const monthLong = new Intl.DateTimeFormat(LOCALE, {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
const day = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatValue(value: number, format: ValueFormat): string {
  switch (format) {
    case 'currency':
      return currency.format(value);
    case 'count':
      return count.format(value);
    case 'percent':
      return `${percent.format(value)}%`;
  }
}

export function formatCompactCurrency(value: number): string {
  return compactCurrency.format(value);
}

export type DeltaTone = 'positive' | 'negative' | 'neutral';

export interface Delta {
  /** Short visual label, e.g. "+4.2%". */
  readonly label: string;
  /** Full sentence for assistive technology, e.g. "Up 4.2% from September". */
  readonly description: string;
  readonly direction: 'up' | 'down' | 'flat';
  readonly tone: DeltaTone;
}

/**
 * Percentage change for currency and counts; percentage-point change for rates,
 * because "churn up 50%" from 2% to 3% misleads.
 */
export function formatDelta(kpi: Kpi, previousMonthLabel: string): Delta | null {
  if (kpi.previous === null) return null;
  const isRate = kpi.format === 'percent';
  const change = isRate
    ? kpi.value - kpi.previous
    : kpi.previous === 0
      ? null
      : ((kpi.value - kpi.previous) / kpi.previous) * 100;
  if (change === null) return null;

  const rounded = Math.round(change * 10) / 10;
  const direction = rounded > 0 ? 'up' : rounded < 0 ? 'down' : 'flat';
  const magnitude = percent.format(Math.abs(rounded));
  const unit = isRate ? ' pts' : '%';
  const sign = direction === 'up' ? '+' : direction === 'down' ? '−' : '';
  const tone: DeltaTone =
    direction === 'flat' ? 'neutral' : direction === kpi.better ? 'positive' : 'negative';
  const unitWords = isRate ? ' percentage points' : '%';
  const description =
    direction === 'flat'
      ? `Unchanged from ${previousMonthLabel}`
      : `${direction === 'up' ? 'Up' : 'Down'} ${magnitude}${unitWords} from ${previousMonthLabel}`;

  return { label: `${sign}${magnitude}${unit}`, description, direction, tone };
}

function monthDate(isoMonth: string): Date {
  return new Date(`${isoMonth}-01T00:00:00Z`);
}

export function formatMonthShort(isoMonth: string): string {
  return monthShort.format(monthDate(isoMonth));
}

export function formatMonthLong(isoMonth: string): string {
  return monthLong.format(monthDate(isoMonth));
}

export function formatDate(isoDate: string): string {
  return day.format(new Date(`${isoDate}T00:00:00Z`));
}

export const PLAN_LABEL: Record<PlanFilter, string> = {
  all: 'All plans',
  starter: 'Starter',
  growth: 'Growth',
  enterprise: 'Enterprise',
  legacy: 'Legacy',
};

export const STATUS_LABEL: Record<AccountStatus, string> = {
  active: 'Active',
  trial: 'Trial',
  past_due: 'Past due',
  churned: 'Churned',
};

export function planLabel(plan: Plan | PlanFilter): string {
  return PLAN_LABEL[plan];
}
