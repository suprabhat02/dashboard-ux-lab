import { describe, expect, it } from 'vitest';
import { buildDashboard, isEmptyDashboard, MONTHS } from '../../src/spec/data';

describe('buildDashboard', () => {
  it('is deterministic', () => {
    expect(buildDashboard('all', 'analyst')).toEqual(buildDashboard('all', 'analyst'));
  });

  it('returns four KPIs and twelve months for all plans', () => {
    const data = buildDashboard('all', 'analyst');
    expect(data.kpis.map((kpi) => kpi.id)).toEqual([
      'mrr',
      'activeAccounts',
      'arpa',
      'churnRate',
    ]);
    expect(data.revenue).toHaveLength(MONTHS.length);
    expect(isEmptyDashboard(data)).toBe(false);
  });

  it('derives emptiness from the data (legacy has no accounts)', () => {
    const data = buildDashboard('legacy', 'analyst');
    expect(isEmptyDashboard(data)).toBe(true);
    expect(data.accounts).toEqual({ access: 'granted', value: [] });
  });

  it('gates account-level data for viewers but keeps totals', () => {
    const data = buildDashboard('all', 'viewer');
    expect(data.accounts).toEqual({ access: 'denied', requiredRole: 'analyst' });
    expect(data.kpis).toHaveLength(4);
  });

  it('filters accounts by plan', () => {
    const data = buildDashboard('enterprise', 'analyst');
    if (data.accounts.access !== 'granted') throw new Error('expected access');
    expect(data.accounts.value.length).toBeGreaterThan(0);
    expect(data.accounts.value.every((account) => account.plan === 'enterprise')).toBe(
      true,
    );
  });

  it('current MRR equals the last revenue point', () => {
    const data = buildDashboard('all', 'analyst');
    expect(data.kpis[0]?.value).toBe(data.revenue.at(-1)?.mrr);
  });
});
