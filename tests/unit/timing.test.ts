import { describe, expect, it } from 'vitest';
import {
  clampLatency,
  loadingPhase,
  msUntilNextPhase,
  TIMING,
} from '../../src/spec/timing';

describe('loadingPhase', () => {
  it.each([
    [0, 'pending'],
    [TIMING.skeletonDelayMs - 1, 'pending'],
    [TIMING.skeletonDelayMs, 'skeleton'],
    [TIMING.slowAfterMs, 'slow'],
    [TIMING.stalledAfterMs, 'stalled'],
    [60_000, 'stalled'],
  ] as const)('%ims → %s', (elapsed, phase) => {
    expect(loadingPhase(elapsed)).toBe(phase);
  });

  it('reports time until the next boundary, then null', () => {
    expect(msUntilNextPhase(0)).toBe(TIMING.skeletonDelayMs);
    expect(msUntilNextPhase(1_000)).toBe(TIMING.slowAfterMs - 1_000);
    expect(msUntilNextPhase(TIMING.stalledAfterMs)).toBeNull();
  });

  it('clamps latency to the slider range', () => {
    expect(clampLatency(-5)).toBe(0);
    expect(clampLatency(99_999)).toBe(TIMING.maxLatencyMs);
    expect(clampLatency(Number.NaN)).toBe(0);
    expect(clampLatency(1234.6)).toBe(1235);
  });
});
