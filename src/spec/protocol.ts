import type { ImplementationId, LabSettings, LoadingPhase, RequestStatus } from './types';

/**
 * The lab protocol: how the playground chrome (controls + inspector) talks to an
 * implementation without either importing the other.
 *
 *   chrome ──command──▶ implementation      (apply settings, replay)
 *   chrome ◀─telemetry── implementation      (state, announcements, focus, settings)
 *
 * Events travel as `CustomEvent`s on an `EventTarget` the caller injects (the page's
 * `window` in production, a fresh `EventTarget` in tests). The comparison page
 * forwards the same messages between frames with `postMessage` (end of file).
 *
 * Implementations must work without the chrome: they read the URL on start and
 * only treat commands as an optional extra.
 */

export const COMMAND_EVENT = 'dux:command';
export const TELEMETRY_EVENT = 'dux:telemetry';

export type LabCommand =
  | { readonly type: 'apply'; readonly settings: LabSettings }
  | { readonly type: 'replay' };

export type Politeness = 'polite' | 'assertive';

export type LabTelemetry =
  | {
      readonly type: 'ready';
      readonly implementation: ImplementationId;
      readonly at: number;
    }
  | {
      readonly type: 'request';
      readonly phase: 'start' | 'settled' | 'aborted';
      readonly attempt: number;
      readonly at: number;
    }
  | {
      readonly type: 'state';
      readonly from: RequestStatus;
      readonly to: RequestStatus;
      readonly at: number;
    }
  | { readonly type: 'phase'; readonly phase: LoadingPhase; readonly at: number }
  | {
      readonly type: 'announce';
      readonly message: string;
      readonly politeness: Politeness;
      readonly at: number;
    }
  | {
      readonly type: 'focus';
      readonly target: string;
      readonly reason: string;
      readonly at: number;
    }
  /** The implementation changed settings itself (e.g. the in-dashboard plan filter). */
  | { readonly type: 'settings'; readonly settings: LabSettings; readonly at: number };

/** Telemetry without the timestamp; the channel stamps it. */
export type TelemetryInput = LabTelemetry extends infer T
  ? T extends { at: number }
    ? Omit<T, 'at'>
    : never
  : never;

export interface LabChannel {
  sendCommand(command: LabCommand): void;
  onCommand(handler: (command: LabCommand) => void): () => void;
  emit(telemetry: TelemetryInput): void;
  onTelemetry(handler: (telemetry: LabTelemetry) => void): () => void;
}

function listen(
  target: EventTarget,
  type: string,
  handler: (detail: unknown) => void,
): () => void {
  const listener = (event: Event): void => {
    if (event instanceof CustomEvent) handler(event.detail);
  };
  target.addEventListener(type, listener);
  return () => {
    target.removeEventListener(type, listener);
  };
}

/**
 * @param target  where events travel (usually `window`)
 * @param now     clock for timestamps (injectable for deterministic tests)
 */
export function createLabChannel(
  target: EventTarget,
  now: () => number = () => performance.now(),
): LabChannel {
  return {
    sendCommand(command) {
      target.dispatchEvent(
        new CustomEvent<LabCommand>(COMMAND_EVENT, { detail: command }),
      );
    },
    onCommand(handler) {
      return listen(target, COMMAND_EVENT, (detail) => {
        handler(detail as LabCommand);
      });
    },
    emit(telemetry) {
      const detail = { ...telemetry, at: now() } as LabTelemetry;
      target.dispatchEvent(new CustomEvent<LabTelemetry>(TELEMETRY_EVENT, { detail }));
    },
    onTelemetry(handler) {
      return listen(target, TELEMETRY_EVENT, (detail) => {
        handler(detail as LabTelemetry);
      });
    },
  };
}

/* ── Across frames: the side-by-side comparison ─────────────────────────────
 *
 *   host page ──HostMessage──▶ iframe (bridge)   commands for its lab channel, theme
 *   host page ◀─FrameMessage── iframe (bridge)   telemetry, content height, metrics
 *
 * Both ends check the origin and the sending window before trusting a message;
 * the guards below then check its shape, because postMessage data is untyped.
 */

export const FRAME_SOURCE = 'dux-frame';
export const HOST_SOURCE = 'dux-host';

export type ThemeChoice = 'light' | 'dark' | null;

/** Measured in the iframe's own document, from its navigation start. */
export interface FrameMetrics {
  /** When the implementation reported `ready`, in ms. */
  readonly readyMs: number;
  /** JavaScript the build downloaded, as transferred (compressed if the server compresses). */
  readonly scriptBytes: number;
  readonly scriptCount: number;
}

export type FrameMessage =
  | {
      readonly source: typeof FRAME_SOURCE;
      readonly type: 'telemetry';
      readonly telemetry: LabTelemetry;
    }
  | {
      readonly source: typeof FRAME_SOURCE;
      readonly type: 'size';
      readonly height: number;
    }
  | {
      readonly source: typeof FRAME_SOURCE;
      readonly type: 'metrics';
      readonly metrics: FrameMetrics;
    };

export type HostMessage =
  | {
      readonly source: typeof HOST_SOURCE;
      readonly type: 'command';
      readonly command: LabCommand;
    }
  | {
      readonly source: typeof HOST_SOURCE;
      readonly type: 'theme';
      readonly theme: ThemeChoice;
    };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;
const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export function isFrameMessage(value: unknown): value is FrameMessage {
  if (!isRecord(value) || value.source !== FRAME_SOURCE) return false;
  switch (value.type) {
    case 'telemetry':
      return isRecord(value.telemetry) && typeof value.telemetry.type === 'string';
    case 'size':
      return isFiniteNumber(value.height) && value.height >= 0;
    case 'metrics': {
      const metrics = value.metrics;
      return (
        isRecord(metrics) &&
        isFiniteNumber(metrics.readyMs) &&
        isFiniteNumber(metrics.scriptBytes) &&
        isFiniteNumber(metrics.scriptCount)
      );
    }
    default:
      return false;
  }
}

export function isHostMessage(value: unknown): value is HostMessage {
  if (!isRecord(value) || value.source !== HOST_SOURCE) return false;
  switch (value.type) {
    case 'command':
      return (
        isRecord(value.command) &&
        (value.command.type === 'replay' ||
          (value.command.type === 'apply' && isRecord(value.command.settings)))
      );
    case 'theme':
      return value.theme === 'light' || value.theme === 'dark' || value.theme === null;
    default:
      return false;
  }
}
