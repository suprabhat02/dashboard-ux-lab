import { describe, expect, it } from 'vitest';
import { dashboardReducer, initialState } from '../../src/spec/dashboard-state';
import { buildDashboard } from '../../src/spec/data';
import { DEFAULT_SETTINGS } from '../../src/spec/scenarios';
import type { FetchOutcome } from '../../src/spec/types';

const data = buildDashboard('all', 'analyst');
const ok: FetchOutcome = { ok: true, data };
const fail: FetchOutcome = {
  ok: false,
  error: { kind: 'server', status: 503, requestId: 'req_x' },
};

describe('dashboard reducer (shared by every implementation)', () => {
  it('ignores responses for superseded requests', () => {
    let state = initialState(DEFAULT_SETTINGS, 0);
    const staleId = state.request.id;
    state = dashboardReducer(state, {
      type: 'load',
      settings: { ...DEFAULT_SETTINGS, plan: 'growth' },
      now: 10,
    });
    state = dashboardReducer(state, { type: 'settled', id: staleId, outcome: ok });
    expect(state.view.status).toBe('loading');
  });

  it('ignores a response that arrives after cancel', () => {
    let state = initialState(DEFAULT_SETTINGS, 0);
    state = dashboardReducer(state, { type: 'cancel' });
    state = dashboardReducer(state, {
      type: 'settled',
      id: state.request.id,
      outcome: ok,
    });
    expect(state.view.status).toBe('cancelled');
  });

  it('retries only from error, once at a time, keeping the error for the panel', () => {
    let state = initialState(DEFAULT_SETTINGS, 0);
    state = dashboardReducer(state, {
      type: 'settled',
      id: state.request.id,
      outcome: fail,
    });
    state = dashboardReducer(state, { type: 'retry', now: 5 });
    const afterFirst = state;
    state = dashboardReducer(state, { type: 'retry', now: 6 });
    expect(state).toBe(afterFirst);
    expect(state.request.attempt).toBe(2);
    expect(state.retryingFrom?.requestId).toBe('req_x');
  });

  it('maps 403 to forbidden, not error', () => {
    let state = initialState(DEFAULT_SETTINGS, 0);
    state = dashboardReducer(state, {
      type: 'settled',
      id: state.request.id,
      outcome: { ok: false, error: { kind: 'forbidden', status: 403, requestId: 'r' } },
    });
    expect(state.view.status).toBe('forbidden');
  });

  it('keeps the last good payload for the pending phase of the next request', () => {
    let state = initialState(DEFAULT_SETTINGS, 0);
    state = dashboardReducer(state, {
      type: 'settled',
      id: state.request.id,
      outcome: ok,
    });
    state = dashboardReducer(state, { type: 'replay', now: 20 });
    expect(state.view.status).toBe('loading');
    expect(state.lastData).toBe(data);
  });
});
