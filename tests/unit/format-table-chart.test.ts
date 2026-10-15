import { describe, expect, it } from 'vitest';
import { buildChartModel, niceMax } from '../../src/spec/chart';
import { buildDashboard } from '../../src/spec/data';
import { formatDelta, formatValue } from '../../src/spec/format';
import { nextSort, sortAccounts } from '../../src/spec/table';
import type { Kpi } from '../../src/spec/types';

const kpi = (over: Partial<Kpi>): Kpi => ({
  id: 'mrr',
  label: 'MRR',
  value: 110,
  previous: 100,
  format: 'currency',
  better: 'up',
  ...over,
});

describe('format', () => {
  it('formats values', () => {
    expect(formatValue(48120, 'currency')).toBe('$48,120');
    expect(formatValue(1234, 'count')).toBe('1,234');
    expect(formatValue(2.345, 'percent')).toBe('2.3%');
  });

  it('describes deltas in words and judges tone by "better"', () => {
    expect(formatDelta(kpi({}), 'September')).toEqual({
      label: '+10.0%',
      description: 'Up 10.0% from September',
      direction: 'up',
      tone: 'positive',
    });
    const churn = formatDelta(
      kpi({ format: 'percent', value: 3, previous: 2, better: 'down' }),
      'September',
    );
    expect(churn).toMatchObject({ label: '+1.0 pts', tone: 'negative' });
    expect(churn?.description).toBe('Up 1.0 percentage points from September');
    expect(formatDelta(kpi({ previous: null }), 'September')).toBeNull();
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
    const sorted = sortAccounts(accounts, { key: 'mrr', direction: 'descending' });
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
  it('rounds the axis maximum to a nice number', () => {
    expect(niceMax(0)).toBe(1);
    expect(niceMax(47_000)).toBe(50_000);
    expect(niceMax(2_100)).toBe(2_500);
  });

  it('builds one bar per month with a readable summary', () => {
    const model = buildChartModel(buildDashboard('all', 'analyst').revenue);
    expect(model.bars).toHaveLength(12);
    expect(model.bars.at(-1)?.isLatest).toBe(true);
    expect(model.summary).toMatch(
      /^Bar chart\. Monthly recurring revenue (rose|fell|was flat) from \$/,
    );
  });
});
