import type { LabTelemetry } from '../../spec/protocol';

/**
 * Do the two builds behave the same? A run is the list of observable steps a
 * build emits after a shared command: requests, state transitions, loading
 * phases, announcements and programmatic focus moves. Timestamps are dropped
 * (two builds never tick in lockstep); order and content are what must agree.
 *
 * `ready` and `settings` are not behaviour of a run: `ready` names the build,
 * and `settings` means someone changed that one build from inside it.
 */
export function stepOf(telemetry: LabTelemetry): string | null {
  switch (telemetry.type) {
    case 'ready':
    case 'settings':
      return null;
    case 'request':
      return `request ${telemetry.phase} #${String(telemetry.attempt)}`;
    case 'state':
      return `state ${telemetry.from} → ${telemetry.to}`;
    case 'phase':
      return `phase ${telemetry.phase}`;
    case 'announce':
      return `${telemetry.politeness} “${telemetry.message}”`;
    case 'focus':
      return `focus ${telemetry.target} (${telemetry.reason})`;
  }
}

export type Agreement =
  /** Nothing to compare yet. */
  | { readonly kind: 'waiting' }
  /** Every step both builds have emitted agrees; `ahead` is how far one leads. */
  | { readonly kind: 'agree'; readonly steps: number; readonly ahead: number }
  /** First disagreement, 0-based; a side is `undefined` when it emitted fewer steps. */
  | {
      readonly kind: 'differ';
      readonly index: number;
      readonly a: string | undefined;
      readonly b: string | undefined;
    };

/**
 * @param final  both builds have gone quiet, so a missing step is a difference,
 *               not a step still on its way.
 */
export function compareRuns(
  a: readonly string[],
  b: readonly string[],
  final = false,
): Agreement {
  const shared = Math.min(a.length, b.length);
  for (let index = 0; index < shared; index += 1) {
    if (a[index] !== b[index]) return { kind: 'differ', index, a: a[index], b: b[index] };
  }
  if (final && a.length !== b.length) {
    return { kind: 'differ', index: shared, a: a[shared], b: b[shared] };
  }
  if (shared === 0 && a.length === 0 && b.length === 0) return { kind: 'waiting' };
  return { kind: 'agree', steps: shared, ahead: Math.abs(a.length - b.length) };
}
