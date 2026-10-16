import { describe, expect, it } from 'vitest';
import { dashboardReducer, initialState } from '../../src/spec/dashboard-state';
import {
  focusTargetFor,
  phaseAnnouncement,
  screenFor,
  statusAnnouncement,
} from '../../src/spec/dashboard-rules';
import { buildDashboard } from '../../src/spec/data';
import { getMessages } from '../../src/spec/i18n';
import { DEFAULT_SETTINGS } from '../../src/spec/scenarios';
import type { FetchOutcome } from '../../src/spec/types';

const copy = getMessages('en').dashboard;
const data = buildDashboard('all', 'analyst');
const ok: FetchOutcome = { ok: true, data };
const fail: FetchOutcome = {
  ok: false,
  error: { kind: 'server', status: 503, requestId: 'req_x' },
};

const settle = (outcome: FetchOutcome) => {
  const start = initialState(DEFAULT_SETTINGS, 0);
  return dashboardReducer(start, { type: 'settled', id: start.request.id, outcome });
};

describe('screenFor', () => {
  it('holds space without drawing placeholders while a first load is pending', () => {
    const model = screenFor(initialState(DEFAULT_SETTINGS, 0), 'pending');
    expect(model).toEqual({
      screen: { kind: 'skeleton', reserveOnly: true },
      notice: null,
      busy: true,
    });
  });

  it('keeps the previous data on screen for the first 300ms of a reload', () => {
    const reloading = dashboardReducer(settle(ok), {
      type: 'load',
      settings: DEFAULT_SETTINGS,
      now: 5,
    });
    expect(screenFor(reloading, 'pending').screen).toEqual({ kind: 'stale', data });
    expect(screenFor(reloading, 'skeleton').screen.kind).toBe('skeleton');
  });

  it('escalates with a notice, then offers Cancel', () => {
    const loading = initialState(DEFAULT_SETTINGS, 0);
    expect(screenFor(loading, 'slow').notice).toBe('slow');
    expect(screenFor(loading, 'stalled').notice).toBe('stalled');
  });

  it('keeps the error panel in place while its retry runs', () => {
    const retrying = dashboardReducer(settle(fail), { type: 'retry', now: 5 });
    const model = screenFor(retrying, 'skeleton');
    expect(model.screen).toMatchObject({ kind: 'error', retrying: true });
    expect(model.notice).toBeNull();
  });
});

describe('announcements', () => {
  it('stays quiet on the first successful load and speaks on a user change', () => {
    expect(statusAnnouncement(settle(ok), copy)).toBeNull();
    const changed = dashboardReducer(settle(ok), {
      type: 'load',
      settings: DEFAULT_SETTINGS,
      now: 5,
    });
    const done = dashboardReducer(changed, {
      type: 'settled',
      id: changed.request.id,
      outcome: ok,
    });
    expect(statusAnnouncement(done, copy)?.message).toBe(
      copy.loaded.announce(copy.plans.all),
    );
  });

  it('interrupts only when a retry fails again', () => {
    const first = settle(fail);
    expect(statusAnnouncement(first, copy)?.politeness).toBe('polite');
    const retried = dashboardReducer(first, { type: 'retry', now: 5 });
    const again = dashboardReducer(retried, {
      type: 'settled',
      id: retried.request.id,
      outcome: fail,
    });
    expect(statusAnnouncement(again, copy)?.politeness).toBe('assertive');
  });

  it('does not announce placeholders on first load, or during a retry', () => {
    expect(
      phaseAnnouncement('skeleton', initialState(DEFAULT_SETTINGS, 0), copy),
    ).toBeNull();
    const retrying = dashboardReducer(settle(fail), { type: 'retry', now: 5 });
    expect(phaseAnnouncement('skeleton', retrying, copy)).toBeNull();
    expect(phaseAnnouncement('slow', retrying, copy)?.message).toBe(
      copy.loading.slowTitle,
    );
  });
});

describe('focusTargetFor', () => {
  it('moves focus only to a control that exists in the new state', () => {
    expect(focusTargetFor('reload', 'cancelled')).toBe('reload');
    expect(focusTargetFor('title', 'success')).toBe('title');
    expect(focusTargetFor('title', 'error')).toBeNull();
    expect(focusTargetFor('title', 'loading')).toBeNull();
    expect(focusTargetFor(null, 'success')).toBeNull();
  });
});
