import type {
  DashboardData,
  DashboardError,
  FetchOutcome,
  LabSettings,
  RequestState,
} from './types';

/**
 * The request lifecycle, as a pure reducer shared by every implementation.
 *
 * React drives it with useReducer; the vanilla build calls it directly. Keeping
 * the transitions here (stale responses, retries, cancellation) means the two
 * builds cannot disagree about what happens, only about how it is drawn.
 *
 * Why a reducer and not a data-fetching library: the lab is about making each
 * transition visible and deliberate. A library would hide exactly the decisions
 * this project exists to explain. See docs/decisions/0003-react-state-model.md.
 */

export interface ActiveRequest {
  /** Monotonic id; responses for any other id are stale and ignored. */
  readonly id: number;
  readonly settings: LabSettings;
  readonly attempt: number;
  readonly startedAt: number;
  /** Initial page loads are not announced; changes the user caused are. */
  readonly userInitiated: boolean;
}

export interface DashboardState {
  readonly request: ActiveRequest;
  readonly view: RequestState;
  /** Set while a retry is in flight, so the error panel (and its focused button) stays put. */
  readonly retryingFrom: DashboardError | null;
  /** The last successful payload, shown dimmed during the first 300ms of a reload. */
  readonly lastData: DashboardData | null;
}

export type DashboardAction =
  | { readonly type: 'load'; readonly settings: LabSettings; readonly now: number }
  | { readonly type: 'replay'; readonly now: number }
  | { readonly type: 'retry'; readonly now: number }
  | { readonly type: 'cancel' }
  | { readonly type: 'settled'; readonly id: number; readonly outcome: FetchOutcome };

export function initialState(settings: LabSettings, now: number): DashboardState {
  return {
    request: { id: 1, settings, attempt: 1, startedAt: now, userInitiated: false },
    view: { status: 'loading', attempt: 1, startedAt: now },
    retryingFrom: null,
    lastData: null,
  };
}

function startRequest(
  state: DashboardState,
  settings: LabSettings,
  attempt: number,
  now: number,
  retryingFrom: DashboardError | null,
): DashboardState {
  return {
    ...state,
    request: {
      id: state.request.id + 1,
      settings,
      attempt,
      startedAt: now,
      userInitiated: true,
    },
    view: { status: 'loading', attempt, startedAt: now },
    retryingFrom,
  };
}

export function dashboardReducer(
  state: DashboardState,
  action: DashboardAction,
): DashboardState {
  switch (action.type) {
    case 'load':
      return startRequest(state, action.settings, 1, action.now, null);

    case 'replay':
      return startRequest(state, state.request.settings, 1, action.now, null);

    case 'retry': {
      // Ignore double activation: only an error can be retried, and only once at a time.
      if (state.view.status !== 'error') return state;
      return startRequest(
        state,
        state.request.settings,
        state.view.attempt + 1,
        action.now,
        state.view.error,
      );
    }

    case 'cancel':
      if (state.view.status !== 'loading') return state;
      return {
        ...state,
        view: { status: 'cancelled', attempt: state.view.attempt },
        retryingFrom: null,
      };

    case 'settled': {
      // Stale or already-cancelled responses never reach the screen.
      if (action.id !== state.request.id || state.view.status !== 'loading') return state;
      const { attempt } = state.view;
      if (action.outcome.ok) {
        return {
          ...state,
          view: { status: 'success', data: action.outcome.data, attempt },
          retryingFrom: null,
          lastData: action.outcome.data,
        };
      }
      const { error } = action.outcome;
      return {
        ...state,
        view:
          error.kind === 'forbidden'
            ? { status: 'forbidden', error }
            : { status: 'error', error, attempt },
        retryingFrom: null,
      };
    }
  }
}
