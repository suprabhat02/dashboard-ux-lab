import { buildDashboard } from './data';
import type { DashboardError, FetchOutcome, LabSettings } from './types';

export interface FetchOptions {
  /** Cancels the request. Rejects with a standard `AbortError` DOMException. */
  readonly signal?: AbortSignal;
  /** 1-based attempt number for this settings combination; drives `failure: 'once'`. */
  readonly attempt: number;
}

/** A stable, readable request ID: same inputs, same ID, so screenshots and tests agree. */
export function requestIdFor(settings: LabSettings, attempt: number): string {
  const key = `${settings.role}|${settings.plan}|${settings.failure}|${attempt}`;
  let hash = 2_166_136_261;
  for (const char of key) hash = Math.imul(hash ^ char.charCodeAt(0), 16_777_619) >>> 0;
  return `req_${hash.toString(36).padStart(7, '0').slice(0, 7)}`;
}

function abortError(signal: AbortSignal): Error {
  return signal.reason instanceof Error
    ? signal.reason
    : new DOMException('The request was cancelled.', 'AbortError');
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!signal) {
      setTimeout(resolve, ms);
      return;
    }
    if (signal.aborted) {
      reject(abortError(signal));
      return;
    }
    const onAbort = (): void => {
      clearTimeout(timer);
      reject(abortError(signal));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * The only "backend" in the project. Both implementations call it exactly as they
 * would call `fetch()`, which keeps the swap to a real API a one-file change.
 *
 * Contract:
 * - Resolves after `settings.latencyMs`, even for failures (servers are slow to fail too).
 * - Business and transport errors resolve as `{ ok: false }`; they are expected states.
 * - Only cancellation rejects, with an `AbortError`, mirroring `fetch()`.
 */
export async function fetchDashboard(
  settings: LabSettings,
  { signal, attempt }: FetchOptions,
): Promise<FetchOutcome> {
  await wait(settings.latencyMs, signal);

  const requestId = requestIdFor(settings, attempt);

  if (settings.role === 'none') {
    const error: DashboardError = { kind: 'forbidden', status: 403, requestId };
    return { ok: false, error };
  }

  const fails =
    settings.failure === 'always' || (settings.failure === 'once' && attempt === 1);
  if (fails) {
    const error: DashboardError = { kind: 'server', status: 503, requestId };
    return { ok: false, error };
  }

  return { ok: true, data: buildDashboard(settings.plan, settings.role) };
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}
