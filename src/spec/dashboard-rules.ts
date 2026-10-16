import { isEmptyDashboard } from './data';
import type { DashboardState } from './dashboard-state';
import type { Messages } from './i18n';
import type { Politeness } from './protocol';
import type {
  DashboardData,
  DashboardError,
  LoadingPhase,
  PlanFilter,
  RequestStatus,
  RequestState,
} from './types';

/**
 * The decisions every implementation must make the same way, as pure functions:
 * what to show (spec §4), what to announce (§5) and where focus goes (§6).
 * Implementations only draw the result; they never re-derive these rules.
 */

type DashboardCopy = Messages['dashboard'];

/* ── What to show ─────────────────────────────────────────────────────────── */

export type Screen =
  /** A failure, or a retry of one: the panel (and its focused button) stays put. */
  | { readonly kind: 'error'; readonly error: DashboardError; readonly retrying: boolean }
  /** Reload under 300ms: keep the previous data on screen, unchanged. */
  | { readonly kind: 'stale'; readonly data: DashboardData }
  /** Placeholders. `reserveOnly` while pending on first load: space held, nothing drawn. */
  | { readonly kind: 'skeleton'; readonly reserveOnly: boolean }
  | { readonly kind: 'loaded'; readonly data: DashboardData }
  | { readonly kind: 'empty'; readonly plan: PlanFilter }
  | { readonly kind: 'forbidden'; readonly error: DashboardError }
  | { readonly kind: 'cancelled' }
  | { readonly kind: 'idle' };

export interface ScreenModel {
  readonly screen: Screen;
  /** The escalation banner shown above the content while waiting. */
  readonly notice: 'slow' | 'stalled' | null;
  readonly busy: boolean;
}

export function screenFor(
  state: DashboardState,
  phase: LoadingPhase | null,
): ScreenModel {
  const { view, retryingFrom, lastData } = state;
  const busy = view.status === 'loading';

  if (busy) {
    if (retryingFrom) {
      return {
        screen: { kind: 'error', error: retryingFrom, retrying: true },
        notice: null,
        busy,
      };
    }
    const notice = phase === 'slow' || phase === 'stalled' ? phase : null;
    if (phase === 'pending' && lastData) {
      return { screen: { kind: 'stale', data: lastData }, notice, busy };
    }
    return {
      screen: { kind: 'skeleton', reserveOnly: phase === 'pending' },
      notice,
      busy,
    };
  }

  return { screen: settledScreen(view), notice: null, busy };
}

function settledScreen(view: RequestState): Screen {
  switch (view.status) {
    case 'success':
      return isEmptyDashboard(view.data)
        ? { kind: 'empty', plan: view.data.plan }
        : { kind: 'loaded', data: view.data };
    case 'error':
      return { kind: 'error', error: view.error, retrying: false };
    case 'forbidden':
      return { kind: 'forbidden', error: view.error };
    case 'cancelled':
      return { kind: 'cancelled' };
    case 'idle':
    case 'loading':
      return { kind: 'idle' };
  }
}

/* ── What to announce ─────────────────────────────────────────────────────── */

export interface Announcement {
  readonly message: string;
  readonly politeness: Politeness;
}

/**
 * Announcement for a change of request status, or null for silence. Initial page
 * loads stay quiet unless the result needs explaining (an empty dashboard).
 */
export function statusAnnouncement(
  state: DashboardState,
  copy: DashboardCopy,
): Announcement | null {
  const { view, request } = state;
  const plan = copy.plans[request.settings.plan];
  switch (view.status) {
    case 'success':
      if (isEmptyDashboard(view.data))
        return { message: copy.empty.announce(plan), politeness: 'polite' };
      return request.userInitiated
        ? { message: copy.loaded.announce(plan), politeness: 'polite' }
        : null;
    case 'error':
      // A repeated failure interrupts: the visitor is waiting on that retry.
      return {
        message: copy.error.announce,
        politeness: view.attempt > 1 ? 'assertive' : 'polite',
      };
    case 'forbidden':
      return request.userInitiated
        ? { message: copy.forbidden.announce, politeness: 'polite' }
        : null;
    case 'cancelled':
      return { message: copy.cancelled.announce, politeness: 'polite' };
    case 'loading':
    case 'idle':
      return null;
  }
}

/** Announcement when the loading phase changes, or null for silence. */
export function phaseAnnouncement(
  phase: LoadingPhase,
  state: DashboardState,
  copy: DashboardCopy,
): Announcement | null {
  if (!state.request.userInitiated && phase === 'skeleton') return null;
  switch (phase) {
    case 'skeleton':
      // During a retry the error panel says "Trying again…" already.
      return state.retryingFrom
        ? null
        : { message: copy.loading.announce, politeness: 'polite' };
    case 'slow':
      return { message: copy.loading.slowTitle, politeness: 'polite' };
    case 'stalled':
      return {
        message: `${copy.loading.stalledTitle} ${copy.loading.stalledBody}`,
        politeness: 'polite',
      };
    case 'pending':
      return null;
  }
}

/* ── Where focus goes ─────────────────────────────────────────────────────── */

/** Set by an action whose control is about to disappear. */
export type FocusIntent = 'title' | 'reload' | null;

/**
 * Focus moves only when the focused control disappeared and only to a place that
 * exists in the new state: Cancel → "Load again"; Retry or "Show all plans" → the
 * dashboard title (unless the retry failed again, where Retry is still there).
 */
export function focusTargetFor(
  intent: FocusIntent,
  status: RequestStatus,
): 'title' | 'reload' | null {
  if (intent === 'reload' && status === 'cancelled') return 'reload';
  if (intent === 'title' && status !== 'error' && status !== 'loading') return 'title';
  return null;
}
