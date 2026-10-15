import { PLAN_FILTERS } from './data';
import { DEFAULT_SETTINGS, getScenario, isScenarioId, matchScenario } from './scenarios';
import { clampLatency } from './timing';
import type { FailureMode, LabSettings, PlanFilter, Role } from './types';

/**
 * The URL is the source of truth for lab settings: shareable, bookmarkable and
 * testable without any UI. Unknown or malformed values fall back silently, because
 * a hand-edited link should still open a working dashboard.
 *
 *   ?scenario=slow                     a preset
 *   ?scenario=slow&role=viewer         a preset with overrides
 *   ?latency=4000&failure=always       explicit settings (preset defaults to `loaded`)
 */
export const PARAM = {
  scenario: 'scenario',
  latency: 'latency',
  failure: 'failure',
  role: 'role',
  plan: 'plan',
} as const;

const ROLES: readonly Role[] = ['none', 'viewer', 'analyst'];
const FAILURES: readonly FailureMode[] = ['never', 'once', 'always'];

function oneOf<T extends string>(
  options: readonly T[],
  value: string | null,
): T | undefined {
  return value !== null && (options as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
}

export function parseSettings(params: URLSearchParams): LabSettings {
  const scenarioParam = params.get(PARAM.scenario);
  const base =
    scenarioParam !== null && isScenarioId(scenarioParam)
      ? getScenario(scenarioParam).settings
      : DEFAULT_SETTINGS;

  const latencyParam = params.get(PARAM.latency);
  const latency =
    latencyParam === null || latencyParam === '' ? NaN : Number(latencyParam);

  return {
    latencyMs: Number.isFinite(latency) ? clampLatency(latency) : base.latencyMs,
    failure: oneOf(FAILURES, params.get(PARAM.failure)) ?? base.failure,
    role: oneOf(ROLES, params.get(PARAM.role)) ?? base.role,
    plan: oneOf<PlanFilter>(PLAN_FILTERS, params.get(PARAM.plan)) ?? base.plan,
  };
}

/** Shortest canonical query string for these settings (no leading `?`). */
export function serializeSettings(settings: LabSettings): string {
  const preset = matchScenario(settings);
  if (preset === 'loaded') return '';
  if (preset) return new URLSearchParams({ [PARAM.scenario]: preset }).toString();

  const params = new URLSearchParams();
  const d = DEFAULT_SETTINGS;
  if (settings.latencyMs !== d.latencyMs)
    params.set(PARAM.latency, String(settings.latencyMs));
  if (settings.failure !== d.failure) params.set(PARAM.failure, settings.failure);
  if (settings.role !== d.role) params.set(PARAM.role, settings.role);
  if (settings.plan !== d.plan) params.set(PARAM.plan, settings.plan);
  return params.toString();
}

/** `pathname` + canonical query, ready for `history.replaceState`. */
export function hrefFor(pathname: string, settings: LabSettings): string {
  const query = serializeSettings(settings);
  return query ? `${pathname}?${query}` : pathname;
}
