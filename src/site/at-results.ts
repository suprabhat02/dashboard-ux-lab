import type { ImplementationId, ScenarioId } from '../spec/types';

/**
 * Results of running the screen reader test script (/accessibility/screen-readers/)
 * with real assistive technology. Each run is one person, one setup, one sitting.
 *
 * How a run gets here: a tester submits the "Screen reader result" issue form on
 * GitHub; the maintainer copies it into AT_RUNS, linking the issue. Nothing is
 * recorded that was not observed: a scenario left out of a run stays "not tested".
 */

export const AT_SETUPS = [
  'nvdaFirefox',
  'voiceoverMac',
  'voiceoverIos',
  'talkback',
] as const;
export type AtSetup = (typeof AT_SETUPS)[number];

export type AtOutcome = 'pass' | 'partial' | 'fail';

export interface AtScenarioResult {
  readonly outcome: AtOutcome;
  /** What differed from the script, in the tester's words (English). */
  readonly notes?: string;
}

export interface AtRun {
  /** ISO date of the run. */
  readonly date: string;
  readonly tester: string;
  readonly setup: AtSetup;
  /** Exact versions, e.g. "NVDA 2026.2, Firefox 141, Windows 11". */
  readonly versions: string;
  readonly build: ImplementationId;
  readonly locale: 'en' | 'es' | 'ar';
  readonly results: Partial<Record<ScenarioId, AtScenarioResult>>;
  /** The GitHub issue the run was submitted in. */
  readonly issue: string;
}

export const AT_RUNS: readonly AtRun[] = [];

/** The most recent result for a setup and scenario, across builds and languages. */
export function latestResult(
  runs: readonly AtRun[],
  setup: AtSetup,
  scenario: ScenarioId,
): { readonly run: AtRun; readonly result: AtScenarioResult } | null {
  let latest: { run: AtRun; result: AtScenarioResult } | null = null;
  for (const run of runs) {
    const result = run.results[scenario];
    if (run.setup !== setup || !result) continue;
    if (!latest || run.date > latest.run.date) latest = { run, result };
  }
  return latest;
}
