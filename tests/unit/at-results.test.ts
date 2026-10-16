import { describe, expect, it } from 'vitest';
import { AT_RUNS, latestResult, type AtRun } from '../../src/site/at-results';

const run = (date: string, outcome: 'pass' | 'fail'): AtRun => ({
  date,
  tester: 'Tester',
  setup: 'nvdaFirefox',
  versions: 'NVDA, Firefox, Windows',
  build: 'react',
  locale: 'en',
  results: { error: { outcome } },
  issue: 'https://github.com/suprabhat02/dashboard-ux-lab/issues/1',
});

describe('screen reader results', () => {
  it('shows the most recent run for a setup and scenario', () => {
    const runs = [
      run('2026-11-01', 'fail'),
      run('2026-11-20', 'pass'),
      run('2026-11-10', 'fail'),
    ];
    expect(latestResult(runs, 'nvdaFirefox', 'error')?.result.outcome).toBe('pass');
  });

  it('never invents a result for a scenario or setup nobody tested', () => {
    const runs = [run('2026-11-01', 'pass')];
    expect(latestResult(runs, 'nvdaFirefox', 'slow')).toBeNull();
    expect(latestResult(runs, 'talkback', 'error')).toBeNull();
  });

  it('records every run with an ISO date and the issue it came from', () => {
    for (const entry of AT_RUNS) {
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(entry.issue).toMatch(
        /^https:\/\/github\.com\/suprabhat02\/dashboard-ux-lab\/issues\/\d+$/,
      );
    }
  });
});
