import { getMessages, LOCALE_META, type Locale } from './i18n';
import type { Kpi, ValueFormat } from './types';

/**
 * Locale-aware formatting. Part of the visual spec: both implementations print
 * exactly these strings, so parity tests compare text, not markup.
 *
 * Intl formatters are expensive to construct, so one set is built per locale and
 * cached for the lifetime of the page.
 */

export type DeltaTone = 'positive' | 'negative' | 'neutral';

export interface Delta {
  /** Short visual label, e.g. "+4.2%". Rendered aria-hidden. */
  readonly label: string;
  /** Full sentence for assistive technology, e.g. "Up 4.2% from September". */
  readonly description: string;
  readonly direction: 'up' | 'down' | 'flat';
  readonly tone: DeltaTone;
}

export interface Formatter {
  readonly locale: Locale;
  value(value: number, format: ValueFormat): string;
  compactCurrency(value: number): string;
  /** Axis ticks: the unit is stated once in the caption, not on every tick. */
  compactNumber(value: number): string;
  monthShort(isoMonth: string): string;
  monthLong(isoMonth: string): string;
  /** Month name only, used in sentences ("from September"). */
  monthName(isoMonth: string): string;
  date(isoDate: string): string;
  decimal(value: number): string;
  integer(value: number): string;
  delta(kpi: Kpi, previousMonth: string): Delta | null;
}

const monthDate = (isoMonth: string): Date => new Date(`${isoMonth}-01T00:00:00Z`);
const dayDate = (isoDate: string): Date => new Date(`${isoDate}T00:00:00Z`);

function createFormatter(locale: Locale): Formatter {
  const tag = LOCALE_META[locale].intl;
  const t = getMessages(locale).dashboard;
  // narrowSymbol: "$" in every locale. "US$" reorders awkwardly inside Arabic text.
  const currency = new Intl.NumberFormat(tag, {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 0,
  });
  const compact = new Intl.NumberFormat(tag, {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
    notation: 'compact',
    maximumFractionDigits: 1,
  });
  const compactNumber = new Intl.NumberFormat(tag, {
    notation: 'compact',
    maximumFractionDigits: 1,
  });
  const integer = new Intl.NumberFormat(tag, { maximumFractionDigits: 0 });
  const oneDecimal = new Intl.NumberFormat(tag, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const percent = new Intl.NumberFormat(tag, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const monthShort = new Intl.DateTimeFormat(tag, { month: 'short', timeZone: 'UTC' });
  const monthLong = new Intl.DateTimeFormat(tag, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const monthName = new Intl.DateTimeFormat(tag, { month: 'long', timeZone: 'UTC' });
  const day = new Intl.DateTimeFormat(tag, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

  // In right-to-left text, "85,928 US$" must stay one left-to-right run, or the
  // bidi algorithm splits it into "$US 85,928". Isolate it (LRI … PDI).
  const isolate =
    LOCALE_META[locale].dir === 'rtl'
      ? (text: string) => `\u2066${text}\u2069`
      : (text: string) => text;

  const value = (amount: number, format: ValueFormat): string => {
    switch (format) {
      case 'currency':
        return isolate(currency.format(amount));
      case 'count':
        return integer.format(amount);
      case 'percent':
        return percent.format(amount / 100);
    }
  };

  return {
    locale,
    value,
    compactCurrency: (amount) => isolate(compact.format(amount)),
    compactNumber: (amount) => compactNumber.format(amount),
    monthShort: (m) => monthShort.format(monthDate(m)),
    monthLong: (m) => monthLong.format(monthDate(m)),
    monthName: (m) => monthName.format(monthDate(m)),
    date: (d) => day.format(dayDate(d)),
    decimal: (n) => oneDecimal.format(n),
    integer: (n) => integer.format(n),

    /**
     * Percentage change for currency and counts; percentage-point change for rates,
     * because "churn up 50%" from 2% to 3% misleads.
     */
    delta(kpi, previousMonth) {
      if (kpi.previous === null) return null;
      const isRate = kpi.format === 'percent';
      if (!isRate && kpi.previous === 0) return null;
      const change = isRate
        ? kpi.value - kpi.previous
        : ((kpi.value - kpi.previous) / kpi.previous) * 100;
      const rounded = Math.round(change * 10) / 10;
      const direction = rounded > 0 ? 'up' : rounded < 0 ? 'down' : 'flat';
      const magnitude = oneDecimal.format(Math.abs(rounded));
      const tone: DeltaTone =
        direction === 'flat'
          ? 'neutral'
          : direction === kpi.better
            ? 'positive'
            : 'negative';
      const sign = direction === 'up' ? '+' : direction === 'down' ? '−' : '';
      const unit = isRate ? ` ${t.pointsUnit}` : '%';
      // Keep "+4.2%" as one left-to-right run inside right-to-left text.
      const label = `⁦${sign}${magnitude}${unit}⁩`;
      const description =
        direction === 'flat'
          ? t.deltaFlat(previousMonth)
          : t.delta(direction, magnitude, isRate, previousMonth);
      return { label, description, direction, tone };
    },
  };
}

const cache = new Map<Locale, Formatter>();

export function getFormatter(locale: Locale): Formatter {
  let formatter = cache.get(locale);
  if (!formatter) {
    formatter = createFormatter(locale);
    cache.set(locale, formatter);
  }
  return formatter;
}
