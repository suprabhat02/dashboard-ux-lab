/**
 * The home page's request ruler: shared by the server-rendered markup and the
 * client script, so a mark and the playhead always agree on where a moment sits.
 */
import { REQUEST_AXIS_MS, sqrtScale } from '../spec/time-axis';
import { TIMING } from '../spec/timing';
import type { LoadingPhase, ScenarioId } from '../spec/types';

/** The ruler ends at the slow preset: the longest scenario the lab ships. */
export const RULER_MAX_MS = REQUEST_AXIS_MS;
export const RULER_SCALE = sqrtScale(RULER_MAX_MS);

/** 0 → 1 along the ruler, on the shared square-root scale (spec/time-axis.ts). */
export function rulerPosition(ms: number): number {
  return RULER_SCALE.position(ms);
}

/** What the dashboard is showing at a moment of the request. */
export type DemoPhase = 'waiting' | 'skeleton' | 'slow' | 'cancel' | 'done';

/** The ribbon zone a demo frame belongs to; `null` once the response has landed. */
export function zoneOf(phase: DemoPhase): LoadingPhase | null {
  switch (phase) {
    case 'waiting':
      return 'pending';
    case 'skeleton':
      return 'skeleton';
    case 'slow':
      return 'slow';
    case 'cancel':
      return 'stalled';
    case 'done':
      return null;
  }
}

export function phaseAt(elapsedMs: number, latencyMs: number): DemoPhase {
  if (elapsedMs >= latencyMs) return 'done';
  if (elapsedMs >= TIMING.stalledAfterMs) return 'cancel';
  if (elapsedMs >= TIMING.slowAfterMs) return 'slow';
  if (elapsedMs >= TIMING.skeletonDelayMs) return 'skeleton';
  return 'waiting';
}

/**
 * The single frame that best explains a scenario when nothing animates (reduced
 * motion, no script): loading is shown mid-wait, slow at the point it offers
 * Cancel, everything else once its response has arrived.
 */
export const REPRESENTATIVE: Readonly<
  Record<ScenarioId, { readonly phase: DemoPhase; readonly atMs: number }>
> = {
  loaded: { phase: 'done', atMs: 700 },
  loading: { phase: 'skeleton', atMs: 1_000 },
  slow: { phase: 'cancel', atMs: 9_000 },
  empty: { phase: 'done', atMs: 700 },
  error: { phase: 'done', atMs: 1_200 },
  restricted: { phase: 'done', atMs: 700 },
};
