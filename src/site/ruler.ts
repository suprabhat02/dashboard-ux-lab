/**
 * The home page's request ruler: shared by the server-rendered markup and the
 * client script, so a mark and the playhead always agree on where a moment sits.
 */
import { TIMING } from '../spec/timing';
import type { ScenarioId } from '../spec/types';

/** The ruler ends at the slow preset: the longest scenario the lab ships. */
export const RULER_MAX_MS = 12_000;

/**
 * Square-root scale: the first second (where most rules live) gets room, while
 * 12 s still fits. 300 ms → 16 %, 3 s → 50 %, 8 s → 82 %.
 */
export function rulerPosition(ms: number): number {
  const clamped = Math.min(Math.max(ms, 0), RULER_MAX_MS);
  return Math.sqrt(clamped / RULER_MAX_MS);
}

/** What the dashboard is showing at a moment of the request. */
export type DemoPhase = 'waiting' | 'skeleton' | 'slow' | 'cancel' | 'done';

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
