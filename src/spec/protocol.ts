import type { ImplementationId, LabSettings, LoadingPhase, RequestStatus } from './types';

/**
 * The lab protocol: how the playground chrome (controls + inspector) talks to an
 * implementation without either importing the other.
 *
 *   chrome ──command──▶ implementation      (apply settings, replay)
 *   chrome ◀─telemetry── implementation      (state, announcements, focus, settings)
 *
 * Events travel as `CustomEvent`s on an `EventTarget` the caller injects (the page's
 * `window` in production, a fresh `EventTarget` in tests). The same messages can
 * be forwarded through `postMessage` for the side-by-side iframe mode later.
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
