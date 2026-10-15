import type { LabSettings, ScenarioId } from './types';

/**
 * Scenario presets: behaviour only. All visitor-facing text (titles, explanations,
 * guidance) lives in the message catalogues under `scenarios.<id>`.
 */
export interface Scenario {
  readonly id: ScenarioId;
  readonly settings: LabSettings;
}

export const DEFAULT_SETTINGS: LabSettings = {
  latencyMs: 700,
  failure: 'never',
  role: 'analyst',
  plan: 'all',
};

export const SCENARIOS: readonly Scenario[] = [
  { id: 'loaded', settings: DEFAULT_SETTINGS },
  { id: 'loading', settings: { ...DEFAULT_SETTINGS, latencyMs: 2_000 } },
  { id: 'slow', settings: { ...DEFAULT_SETTINGS, latencyMs: 12_000 } },
  { id: 'empty', settings: { ...DEFAULT_SETTINGS, plan: 'legacy' } },
  { id: 'error', settings: { ...DEFAULT_SETTINGS, latencyMs: 1_200, failure: 'once' } },
  { id: 'restricted', settings: { ...DEFAULT_SETTINGS, role: 'none' } },
];

export const SCENARIO_IDS: readonly ScenarioId[] = SCENARIOS.map(
  (scenario) => scenario.id,
);

export function getScenario(id: ScenarioId): Scenario {
  const scenario = SCENARIOS.find((candidate) => candidate.id === id);
  if (!scenario) throw new Error(`Unknown scenario: ${id}`);
  return scenario;
}

export function isScenarioId(value: string): value is ScenarioId {
  return (SCENARIO_IDS as readonly string[]).includes(value);
}

export function settingsEqual(a: LabSettings, b: LabSettings): boolean {
  return (
    a.latencyMs === b.latencyMs &&
    a.failure === b.failure &&
    a.role === b.role &&
    a.plan === b.plan
  );
}

/** The preset these settings match exactly, or `null` for a custom combination. */
export function matchScenario(settings: LabSettings): ScenarioId | null {
  return (
    SCENARIOS.find((scenario) => settingsEqual(scenario.settings, settings))?.id ?? null
  );
}
