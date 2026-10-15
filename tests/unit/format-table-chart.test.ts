import { describe, expect, it } from 'vitest';
import { buildChartModel, CHART, niceMax } from '../../src/spec/chart';
import { buildDashboard } from '../../src/spec/data';
import { getFormatter } from '../../src/spec/format';
import { nextSort, sortAccounts } from '../../src/spec/table';
import type { Kpi } from '../../src/spec/types';

const kpi = (over: Partial<Kpi>): Kpi => ({
  id: 'mrr',
  value: 110,
  previous: 100,
  format: 'currency',
  better: 'up',
  ...over,
});

const LRI = '⁦';
const PDI = '⁩';

describe('format', () => {
  it('formats values per locale', () => {
    const en = getFormatter('en');
    expect(en.value(48120, 'currency')).toBe('$48,120');
    expect(en.value(1234, 'count')).toBe('1,234');
    expect(en.value(2.345, 'percent')).toBe('2.3%');
    expect(getFormatter('es').value(1234, 'count')).toBe('1234');
    expect(getFormatter('es').value(12345, 'count')).toBe('12.345');
    // Arabic keeps Latin digits (ADR 0004).
    expect(getFormatter('ar').value(12345, 'count')).toMatch(/12[,٬]345/);
    expect(getFormatter('ar').value(12345, 'count')).not.toMatch(/[٠-٩]/);
  });

  it('describes deltas in words and judges tone by "better"', () => {
    const en = getFormatter('en');
    expect(en.delta(kpi({}), 'September')).toEqual({
      label: `${LRI}+10.0%${PDI}`,
      description: 'Up 10.0% from September',
      direction: 'up',
      tone: 'positive',
    });
    const churn = en.delta(
      kpi({ format: 'percent', value: 3, previous: 2, better: 'down' }),
      'September',
    );
    expect(churn).toMatchObject({ label: `${LRI}+1.0 pts${PDI}`, tone: 'negative' });
    expect(churn?.description).toBe('Up 1.0 percentage points from September');
    expect(en.delta(kpi({ previous: null }), 'September')).toBeNull();
    expect(getFormatter('es').delta(kpi({}), 'septiembre')?.description).toBe(
      'Sube 10,0 % respecto a septiembre',
    );
  });

  it('names months in each language', () => {
    expect(getFormatter('en').monthLong('2026-10')).toBe('October 2026');
    expect(getFormatter('es').monthLong('2026-10')).toBe('octubre de 2026');
    expect(getFormatter('ar').monthName('2026-10')).toBe('أكتوبر');
  });
});

describe('table sorting', () => {
  const accounts = (() => {
    const data = buildDashboard('all', 'analyst');
    if (data.accounts.access !== 'granted') throw new Error('expected access');
    return data.accounts.value;
  })();

  it('sorts by MRR descending without mutating input', () => {
    const before = [...accounts];
    const sorted = sortAccounts(accounts, { key: 'mrr', direction: 'descending' }, 'en');
    expect(accounts).toEqual(before);
    for (let i = 1; i < sorted.length; i += 1) {
      expect(sorted[i - 1]!.mrr).toBeGreaterThanOrEqual(sorted[i]!.mrr);
    }
  });

  it('toggles direction on the same key and uses natural order on a new key', () => {
    expect(nextSort({ key: 'mrr', direction: 'descending' }, 'mrr').direction).toBe(
      'ascending',
    );
    expect(nextSort({ key: 'mrr', direction: 'descending' }, 'name').direction).toBe(
      'ascending',
    );
    expect(nextSort({ key: 'name', direction: 'ascending' }, 'seats').direction).toBe(
      'descending',
    );
  });
});

describe('chart model', () => {
  const revenue = buildDashboard('all', 'analyst').revenue;

  it('rounds the axis maximum to a nice number', () => {
    expect(niceMax(0)).toBe(1);
    expect(niceMax(47_000)).toBe(50_000);
    expect(niceMax(2_100)).toBe(2_500);
  });

  it('builds one bar per month with a localised summary', () => {
    const model = buildChartModel(revenue, 'en');
    expect(model.bars).toHaveLength(12);
    expect(model.bars.at(-1)?.isLatest).toBe(true);
    expect(model.summary).toMatch(
      /^Bar chart\. Monthly recurring revenue (rose|fell|was flat) from \$/,
    );
    expect(buildChartModel(revenue, 'es').summary).toMatch(/^Gráfico de barras\./);
    expect(buildChartModel(revenue, 'ar').summary).toMatch(/^مخطط أعمدة\./);
  });

  it('mirrors the time axis for right-to-left locales', () => {
    const ltr = buildChartModel(revenue, 'en');
    const rtl = buildChartModel(revenue, 'ar');
    const ltrLatest = ltr.bars.at(-1)!;
    const rtlLatest = rtl.bars.at(-1)!;
    // Newest month: rightmost in LTR, leftmost in RTL, at mirrored positions.
    expect(ltrLatest.x).toBeGreaterThan(ltr.bars[0]!.x);
    expect(rtlLatest.x).toBeLessThan(rtl.bars[0]!.x);
    expect(rtlLatest.x).toBeCloseTo(CHART.width - ltrLatest.x - ltrLatest.width, 6);
    // Value axis labels move to the right-hand side.
    expect(rtl.axis.labelX).toBeGreaterThan(CHART.width / 2);
    expect(ltr.axis.labelX).toBeLessThan(CHART.width / 2);
  });
});
