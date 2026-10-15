import type { LoadingPhase } from './types';

/**
 * Timing rules for the loading experience. Numbers are product decisions, not
 * implementation details, so both implementations read them from here.
 * See docs/spec.md § Loading for the reasoning behind each value.
 */
export const TIMING = {
  /** Below this, show nothing: a skeleton that flashes for 120ms reads as a glitch. */
  skeletonDelayMs: 300,
  /** After this, tell the user it is taking longer than usual. */
  slowAfterMs: 3_000,
  /** After this, offer to cancel. */
  stalledAfterMs: 8_000,
  /** Collapse bursts of status changes into one announcement. */
  announceDebounceMs: 150,
  /** Slider bounds for simulated latency. */
  minLatencyMs: 0,
  maxLatencyMs: 15_000,
} as const;

/** Thresholds at which the loading phase can change, in ascending order. */
export const PHASE_BOUNDARIES_MS = [
  TIMING.skeletonDelayMs,
  TIMING.slowAfterMs,
  TIMING.stalledAfterMs,
] as const;

export function loadingPhase(elapsedMs: number): LoadingPhase {
  if (elapsedMs >= TIMING.stalledAfterMs) return 'stalled';
  if (elapsedMs >= TIMING.slowAfterMs) return 'slow';
  if (elapsedMs >= TIMING.skeletonDelayMs) return 'skeleton';
  return 'pending';
}

/** Milliseconds until the next phase change, or `null` once stalled. */
export function msUntilNextPhase(elapsedMs: number): number | null {
  const next = PHASE_BOUNDARIES_MS.find((boundary) => boundary > elapsedMs);
  return next === undefined ? null : next - elapsedMs;
}

export function clampLatency(ms: number): number {
  if (!Number.isFinite(ms)) return TIMING.minLatencyMs;
  return Math.min(TIMING.maxLatencyMs, Math.max(TIMING.minLatencyMs, Math.round(ms)));
}
