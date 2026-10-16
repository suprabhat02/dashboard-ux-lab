import {
  focusTargetFor,
  phaseAnnouncement,
  statusAnnouncement,
  type FocusIntent,
} from './dashboard-rules';
import {
  dashboardReducer,
  initialState,
  type DashboardAction,
  type DashboardState,
} from './dashboard-state';
import type { Messages } from './i18n';
import { outcomeFor } from './mock-api';
import type { Politeness } from './protocol';
import { getScenario } from './scenarios';
import { loadingPhase, PHASE_BOUNDARIES_MS, TIMING } from './timing';
import type { LoadingPhase, RequestStatus, ScenarioId } from './types';

/**
 * The screen reader test script, computed rather than written by hand.
 *
 * For each scenario, a short session a tester performs (open the link, press a
 * button, wait) and, for every step, exactly what a screen reader should say and
 * where focus should go. It runs the same reducer, rules and timings the builds
 * run, with a simulated clock, so the published script cannot drift from the code.
 * The e2e suite then checks that both builds produce this transcript.
 */

type DashboardCopy = Messages['dashboard'];

/** What a tester does. `open` is loading the scenario's link; the rest are buttons. */
export type TesterAction = 'open' | 'replay' | 'retry' | 'cancel' | 'showAllPlans';

export interface ScriptStep {
  readonly action: TesterAction;
  /**
   * Act this long after the previous step began. Omitted: once the previous step
   * has finished speaking (the usual case; a tester waits for silence).
   */
  readonly afterMs?: number;
}

export type Heard =
  | {
      readonly kind: 'speech';
      /** From the start of the step. */
      readonly atMs: number;
      readonly message: string;
      readonly politeness: Politeness;
    }
  | {
      readonly kind: 'focus';
      readonly atMs: number;
      readonly target: 'title' | 'reload';
    };

export interface StepTranscript {
  readonly action: TesterAction;
  readonly heard: readonly Heard[];
}

/**
 * One session per scenario: the first step shows what loading the link does on
 * its own (initial loads are quiet by design), the second what happens when the
 * visitor acts, which is where most announcements and focus moves live.
 */
export const SPEECH_SCRIPTS: Readonly<Record<ScenarioId, readonly ScriptStep[]>> = {
  loaded: [{ action: 'open' }, { action: 'replay' }],
  loading: [{ action: 'open' }, { action: 'replay' }],
  // Cancel appears at 8 s; the tester presses it a second later.
  slow: [{ action: 'open' }, { action: 'replay' }, { action: 'cancel', afterMs: 9_000 }],
  empty: [{ action: 'open' }, { action: 'showAllPlans' }],
  error: [{ action: 'open' }, { action: 'retry' }],
  restricted: [{ action: 'open' }, { action: 'replay' }],
};

/** Upper bound for one step; only reached if something never settles. */
const STEP_LIMIT_MS = 60_000;

export function speechScript(
  scenario: ScenarioId,
  copy: DashboardCopy,
): readonly StepTranscript[] {
  const settings = getScenario(scenario).settings;
  const steps = SPEECH_SCRIPTS[scenario];

  let now = 0;
  let state: DashboardState | null = null;
  let intent: FocusIntent = null;
  let shownStatus: RequestStatus = 'idle';
  let shownPhase: LoadingPhase | null = null;
  let pending: { message: string; politeness: Politeness; due: number } | null = null;
  let stepStart = 0;
  let heard: Heard[] = [];
  const transcript: StepTranscript[] = [];

  const announce = (said: { message: string; politeness: Politeness } | null): void => {
    // Debounced exactly like the builds: a newer message replaces one not yet spoken.
    if (said) pending = { ...said, due: now + TIMING.announceDebounceMs };
  };

  const phaseOf = (current: DashboardState): LoadingPhase | null =>
    current.view.status === 'loading'
      ? loadingPhase(now - current.request.startedAt)
      : null;

  /** What the builds do after each render: status first, then phase, then focus. */
  const afterRender = (): void => {
    if (!state) return;
    const status = state.view.status;
    if (status !== shownStatus) {
      shownStatus = status;
      announce(statusAnnouncement(state, copy));
    }
    const phase = phaseOf(state);
    if (phase !== shownPhase) {
      shownPhase = phase;
      if (phase !== null) announce(phaseAnnouncement(phase, state, copy));
    }
    if (intent && status !== 'loading') {
      const target = focusTargetFor(intent, status);
      intent = null;
      if (target) heard.push({ kind: 'focus', atMs: now - stepStart, target });
    }
  };

  const dispatch = (action: DashboardAction): void => {
    if (!state) return;
    state = dashboardReducer(state, action);
    afterRender();
  };

  /** The next moment something happens on its own: a response, a phase, speech. */
  const nextEvent = (): number | null => {
    const times: number[] = [];
    if (pending) times.push(pending.due);
    if (state?.view.status === 'loading') {
      const { startedAt } = state.request;
      times.push(startedAt + state.request.settings.latencyMs);
      const boundary = PHASE_BOUNDARIES_MS.find((ms) => startedAt + ms > now);
      if (boundary !== undefined) times.push(startedAt + boundary);
    }
    return times.length ? Math.min(...times) : null;
  };

  const advanceTo = (until: number): void => {
    for (;;) {
      const next = nextEvent();
      if (next === null || next > until) break;
      now = next;
      if (pending?.due === now) {
        heard.push({
          kind: 'speech',
          atMs: now - stepStart,
          message: pending.message,
          politeness: pending.politeness,
        });
        pending = null;
      }
      if (state?.view.status === 'loading') {
        const { startedAt, id, settings: sent, attempt } = state.request;
        // A response that lands at a phase boundary wins, as in the builds,
        // whose phase timers fire just after the boundary.
        if (startedAt + sent.latencyMs === now) {
          dispatch({ type: 'settled', id, outcome: outcomeFor(sent, attempt) });
        } else {
          afterRender();
        }
      }
    }
    now = until;
  };

  steps.forEach((step, index) => {
    if (index > 0) {
      // Wait for silence, or for the step's own moment.
      advanceTo(
        step.afterMs === undefined ? now + STEP_LIMIT_MS : stepStart + step.afterMs,
      );
      transcript.push({ action: steps[index - 1]?.action ?? 'open', heard });
      heard = [];
    }
    stepStart = now;
    switch (step.action) {
      case 'open':
        state = initialState(settings, now);
        afterRender();
        break;
      case 'replay':
        dispatch({ type: 'replay', now });
        break;
      case 'retry':
        intent = 'title';
        dispatch({ type: 'retry', now });
        break;
      case 'cancel':
        intent = 'reload';
        dispatch({ type: 'cancel' });
        break;
      case 'showAllPlans':
        intent = 'title';
        if (state)
          dispatch({
            type: 'load',
            settings: { ...state.request.settings, plan: 'all' },
            now,
          });
        break;
    }
  });
  advanceTo(now + STEP_LIMIT_MS);
  transcript.push({ action: steps.at(-1)?.action ?? 'open', heard });
  return transcript;
}
