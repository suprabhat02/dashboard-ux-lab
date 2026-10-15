import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchDashboard, isAbortError, requestIdFor } from '../../src/spec/mock-api';
import { DEFAULT_SETTINGS } from '../../src/spec/scenarios';

describe('fetchDashboard', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('resolves after the configured latency', async () => {
    const settled = vi.fn();
    void fetchDashboard({ ...DEFAULT_SETTINGS, latencyMs: 1_000 }, { attempt: 1 }).then(
      settled,
    );
    await vi.advanceTimersByTimeAsync(999);
    expect(settled).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(settled).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
  });

  it('fails once, then recovers', async () => {
    const settings = { ...DEFAULT_SETTINGS, latencyMs: 0, failure: 'once' } as const;
    const first = fetchDashboard(settings, { attempt: 1 });
    await vi.runAllTimersAsync();
    await expect(first).resolves.toMatchObject({
      ok: false,
      error: { kind: 'server', status: 503 },
    });
    const second = fetchDashboard(settings, { attempt: 2 });
    await vi.runAllTimersAsync();
    await expect(second).resolves.toMatchObject({ ok: true });
  });

  it('always fails when asked to', async () => {
    const settings = { ...DEFAULT_SETTINGS, latencyMs: 0, failure: 'always' } as const;
    const third = fetchDashboard(settings, { attempt: 3 });
    await vi.runAllTimersAsync();
    await expect(third).resolves.toMatchObject({ ok: false });
  });

  it('returns forbidden (not an error) for role none, regardless of failure mode', async () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      latencyMs: 0,
      role: 'none',
      failure: 'always',
    } as const;
    const outcome = fetchDashboard(settings, { attempt: 1 });
    await vi.runAllTimersAsync();
    await expect(outcome).resolves.toMatchObject({
      ok: false,
      error: { kind: 'forbidden', status: 403 },
    });
  });

  it('rejects with AbortError when cancelled', async () => {
    const controller = new AbortController();
    const pending = fetchDashboard(
      { ...DEFAULT_SETTINGS, latencyMs: 5_000 },
      { attempt: 1, signal: controller.signal },
    );
    controller.abort();
    await expect(pending).rejects.toSatisfy(isAbortError);
  });

  it('rejects immediately for an already-aborted signal', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      fetchDashboard(DEFAULT_SETTINGS, { attempt: 1, signal: controller.signal }),
    ).rejects.toSatisfy(isAbortError);
  });

  it('produces stable request IDs', () => {
    expect(requestIdFor(DEFAULT_SETTINGS, 1)).toBe(requestIdFor(DEFAULT_SETTINGS, 1));
    expect(requestIdFor(DEFAULT_SETTINGS, 1)).not.toBe(requestIdFor(DEFAULT_SETTINGS, 2));
    expect(requestIdFor(DEFAULT_SETTINGS, 1)).toMatch(/^req_[0-9a-z]{7}$/);
  });
});
