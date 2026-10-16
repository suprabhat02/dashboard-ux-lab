import type { LabTelemetry } from '../spec/protocol';

declare global {
  interface Window {
    /** Filled by components/EarlyTelemetry.astro until a consumer takes it. */
    __duxEarly?: { readonly events: unknown[]; readonly stop: () => void };
  }
}

/**
 * Stops the early buffer and returns what it caught, oldest first. Only the first
 * caller gets the events; the buffer is single-use, like the moment it covers.
 */
export function takeEarlyTelemetry(): readonly LabTelemetry[] {
  const early = window.__duxEarly;
  if (!early) return [];
  early.stop();
  delete window.__duxEarly;
  // Each entry is the detail of a dux:telemetry CustomEvent, emitted by createLabChannel.
  return early.events as LabTelemetry[];
}
