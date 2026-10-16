import { buildDashboard, isEmptyDashboard } from './data';
import type { LabTelemetry, Politeness } from './protocol';
import { sqrtScale, type TimeScale } from './time-axis';
import type { LabSettings, LoadingPhase, RequestStatus } from './types';

/**
 * A recording of one request's story, built from lab telemetry, and the pure
 * functions that answer "what was true at this moment?" for the lab's scrubbable
 * timeline. Nothing here touches the DOM, so the same answers back the visible
 * lanes, the scrubber's spoken value and the unit tests.
 */

/** One telemetry event, timed from the start of the recording. */
export type Recorded = LabTelemetry & { readonly atMs: number };

export interface Recording {
  /** The settings the run started with; `settings` events inside it update them. */
  readonly settings: LabSettings;
  readonly events: readonly Recorded[];
}

/** What the visitor sees: a plain-language summary of the dashboard area. */
export type ScreenKind =
  | 'nothing'
  | 'reserved'
  | 'previous'
  | 'placeholders'
  | 'slowNotice'
  | 'cancelOffered'
  | 'retrying'
  | 'dashboard'
  | 'empty'
  | 'error'
  | 'forbidden'
  | 'cancelled';

export interface Snapshot {
  readonly atMs: number;
  readonly status: RequestStatus;
  readonly phase: LoadingPhase | null;
  readonly screen: ScreenKind;
  /** Attempt number of the request in flight, or `null` when none is. */
  readonly inFlight: number | null;
  readonly heard: {
    readonly message: string;
    readonly politeness: Politeness;
    readonly atMs: number;
  } | null;
  readonly focus: { readonly target: string; readonly atMs: number } | null;
}

/** At most this many events per recording: the lab never grows without bound. */
export const RECORDING_LIMIT = 500;

export function appendEvent(recording: Recording, event: Recorded): Recording {
  if (recording.events.length >= RECORDING_LIMIT) return recording;
  return { ...recording, events: [...recording.events, event] };
}

/** Without access there is no data at all, so nothing to be empty. */
const emptyFor = (settings: LabSettings): boolean =>
  settings.role !== 'none' &&
  isEmptyDashboard(buildDashboard(settings.plan, settings.role));

/** Replays the recording up to `atMs` (inclusive) and describes that moment. */
export function snapshotAt(recording: Recording, atMs: number): Snapshot {
  let settings = recording.settings;
  let status: RequestStatus = 'idle';
  let phase: LoadingPhase | null = null;
  let inFlight: number | null = null;
  let retrying = false;
  let hadData = false;
  let heard: Snapshot['heard'] = null;
  let focus: Snapshot['focus'] = null;

  for (const event of recording.events) {
    if (event.atMs > atMs) break;
    switch (event.type) {
      case 'settings':
        settings = event.settings;
        break;
      case 'request':
        inFlight = event.phase === 'start' ? event.attempt : null;
        break;
      case 'state':
        if (event.from === 'success') hadData = true;
        retrying = event.to === 'loading' && event.from === 'error';
        status = event.to;
        if (status !== 'loading') phase = null;
        break;
      case 'phase':
        phase = event.phase;
        break;
      case 'announce':
        heard = {
          message: event.message,
          politeness: event.politeness,
          atMs: event.atMs,
        };
        break;
      case 'focus':
        focus = { target: event.target, atMs: event.atMs };
        break;
      case 'ready':
        break;
    }
  }

  return {
    atMs,
    status,
    phase,
    screen: screenOf(status, phase, { retrying, hadData, empty: emptyFor(settings) }),
    inFlight,
    heard,
    focus,
  };
}

function screenOf(
  status: RequestStatus,
  phase: LoadingPhase | null,
  context: { retrying: boolean; hadData: boolean; empty: boolean },
): ScreenKind {
  switch (status) {
    case 'idle':
      return 'nothing';
    case 'loading':
      return loadingScreen(phase, context);
    case 'success':
      return context.empty ? 'empty' : 'dashboard';
    case 'error':
      return 'error';
    case 'forbidden':
      return 'forbidden';
    case 'cancelled':
      return 'cancelled';
  }
}

function loadingScreen(
  phase: LoadingPhase | null,
  context: { retrying: boolean; hadData: boolean },
): ScreenKind {
  // A retry keeps the error panel (and its focused button) in place.
  if (context.retrying) return 'retrying';
  switch (phase) {
    case 'skeleton':
      return 'placeholders';
    case 'slow':
      return 'slowNotice';
    case 'stalled':
      return 'cancelOffered';
    case 'pending':
    case null:
      // Under 300 ms: a reload keeps the previous data, a first load holds space.
      return context.hadData ? 'previous' : 'reserved';
  }
}

/* ── Lanes: the recording as drawable spans and marks ─────────────────────── */

export interface Span {
  readonly screen: ScreenKind;
  readonly fromMs: number;
  readonly toMs: number;
}

export type Mark =
  | {
      readonly kind: 'speech';
      readonly atMs: number;
      readonly message: string;
      readonly politeness: Politeness;
    }
  | { readonly kind: 'focus'; readonly atMs: number; readonly target: string };

export interface Lanes {
  readonly scale: TimeScale;
  /** What was on screen, as consecutive spans covering 0 → `endMs`. */
  readonly screen: readonly Span[];
  readonly heard: readonly Mark[];
  readonly focus: readonly Mark[];
  /** Every moment something changed, for "previous / next change". */
  readonly changes: readonly number[];
}

/** Axis lengths that read well; the timeline grows through them as time passes. */
const AXIS_STEPS_MS = [
  1_000, 2_000, 3_000, 5_000, 8_000, 12_000, 15_000, 20_000, 30_000, 60_000,
];

export function axisLengthFor(endMs: number): number {
  const wanted = Math.max(endMs * 1.08, 1);
  return (
    AXIS_STEPS_MS.find((step) => step >= wanted) ?? Math.ceil(wanted / 10_000) * 10_000
  );
}

export function lanesFor(recording: Recording, endMs: number): Lanes {
  const scale = sqrtScale(axisLengthFor(endMs));
  const changes = [
    ...new Set([
      0,
      ...recording.events.map((event) => event.atMs).filter((ms) => ms <= endMs),
    ]),
  ].sort((a, b) => a - b);

  const screen: Span[] = [];
  for (const [index, fromMs] of changes.entries()) {
    const kind = snapshotAt(recording, fromMs).screen;
    const toMs = changes[index + 1] ?? endMs;
    const last = screen.at(-1);
    if (last?.screen === kind) {
      screen[screen.length - 1] = { ...last, toMs };
    } else if (toMs > fromMs || index === changes.length - 1) {
      screen.push({ screen: kind, fromMs, toMs });
    }
  }

  const heard: Mark[] = [];
  const focus: Mark[] = [];
  for (const event of recording.events) {
    if (event.atMs > endMs) break;
    if (event.type === 'announce') {
      heard.push({
        kind: 'speech',
        atMs: event.atMs,
        message: event.message,
        politeness: event.politeness,
      });
    } else if (event.type === 'focus') {
      focus.push({ kind: 'focus', atMs: event.atMs, target: event.target });
    }
  }
  return { scale, screen, heard, focus, changes };
}
