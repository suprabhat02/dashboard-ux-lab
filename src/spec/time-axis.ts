import { PHASE_BOUNDARIES_MS } from './timing';
import type { LoadingPhase } from './types';

/**
 * Where a moment of a request sits on a drawn time axis. Pure geometry shared by
 * every timeline on the site (the home page ribbon, the scenario index, the lab's
 * request timeline), so a mark drawn by one always lines up with another.
 *
 * Positions are fractions of the axis (0 → 1) along the inline direction; the
 * drawing code turns them into logical CSS, so right-to-left needs no special case.
 */

export interface TimeScale {
  readonly maxMs: number;
  /** 0 → 1 for a time, clamped to the axis. */
  position(ms: number): number;
  /** The inverse: the time at a position, for scrubbing. */
  timeAt(position: number): number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/**
 * Square-root scale: the first second, where most of the spec's rules live, gets
 * room, while long waits still fit. On a 12 s axis: 300 ms → 16 %, 3 s → 50 %,
 * 8 s → 82 %.
 */
export function sqrtScale(maxMs: number): TimeScale {
  if (!(maxMs > 0) || !Number.isFinite(maxMs)) {
    throw new RangeError(`A time axis needs a positive length, got ${String(maxMs)}`);
  }
  return {
    maxMs,
    position: (ms) => Math.sqrt(clamp(ms, 0, maxMs) / maxMs),
    timeAt: (position) => clamp(position, 0, 1) ** 2 * maxMs,
  };
}

/** The axis every scenario fits on: the slow preset's 12 s response. */
export const REQUEST_AXIS_MS = 12_000;

/** A stretch of the axis during which the loading experience shows one phase. */
export interface Zone {
  readonly phase: LoadingPhase;
  readonly startMs: number;
  readonly endMs: number;
  /** Where the zone starts, and how much of the axis it covers (both 0 → 1). */
  readonly start: number;
  readonly size: number;
}

const PHASES_IN_ORDER: readonly LoadingPhase[] = [
  'pending',
  'skeleton',
  'slow',
  'stalled',
];

/**
 * The loading phases as consecutive zones, cut at the spec's boundaries (300 ms,
 * 3 s, 8 s) and clipped to the axis. Zones that would start past its end are left
 * out, so a short axis shows only the phases a request could reach on it.
 */
export function phaseZones(scale: TimeScale): readonly Zone[] {
  const edges = [0, ...PHASE_BOUNDARIES_MS, Number.POSITIVE_INFINITY];
  const zones: Zone[] = [];
  PHASES_IN_ORDER.forEach((phase, index) => {
    const startMs = edges[index] ?? 0;
    if (startMs >= scale.maxMs) return;
    const endMs = Math.min(edges[index + 1] ?? scale.maxMs, scale.maxMs);
    const start = scale.position(startMs);
    zones.push({ phase, startMs, endMs, start, size: scale.position(endMs) - start });
  });
  return zones;
}

/** CSS grid columns for the zones: their sizes as `fr`, which mirror in RTL for free. */
export function zoneColumns(zones: readonly Zone[]): string {
  return zones.map((zone) => `${zone.size.toFixed(5)}fr`).join(' ');
}
