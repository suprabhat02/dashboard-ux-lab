import {
  createLabChannel,
  FRAME_SOURCE,
  isHostMessage,
  type FrameMessage,
  type FrameMetrics,
  type LabTelemetry,
} from '../../spec/protocol';
import { takeEarlyTelemetry } from '../early-telemetry';

/**
 * Runs inside an embedded build (/embed/<build>/) and connects its lab channel to
 * the comparison page around it:
 *
 * - forwards every telemetry event to the parent, unchanged;
 * - turns the parent's commands into lab-channel commands, so the build cannot
 *   tell the comparison page from the regular lab chrome;
 * - reports its content height, so the parent can size the iframe to fit;
 * - after `ready`, reports how long start-up took and how much JavaScript the
 *   build downloaded, measured here with Resource Timing.
 *
 * Events the build emitted before this module ran are replayed from the inline
 * buffer (components/EarlyTelemetry.astro), so none is missed whatever loads first.
 */

/** The bridge's own file is measurement overhead, not part of either build. */
const OWN_SCRIPT = new URL(import.meta.url).pathname;

function scriptTotals(): Pick<FrameMetrics, 'scriptBytes' | 'scriptCount'> {
  let scriptBytes = 0;
  let scriptCount = 0;
  for (const entry of performance.getEntriesByType('resource')) {
    if (!(entry instanceof PerformanceResourceTiming)) continue;
    const path = new URL(entry.name, window.location.href).pathname;
    if (!path.endsWith('.js') || path === OWN_SCRIPT) continue;
    // encodedBodySize is the body as sent (compressed when the server compresses),
    // and stays set for files served from the HTTP cache, unlike transferSize.
    scriptBytes += entry.encodedBodySize || entry.transferSize;
    scriptCount += 1;
  }
  return { scriptBytes, scriptCount };
}

export function initBridge(): void {
  const parent = window.parent;
  // Opened on its own, an embed is just a bare dashboard: nothing to connect to.
  if (parent === window) {
    takeEarlyTelemetry();
    return;
  }

  const origin = window.location.origin;
  const post = (message: FrameMessage): void => {
    parent.postMessage(message, origin);
  };
  const channel = createLabChannel(window);

  const forward = (telemetry: LabTelemetry): void => {
    post({ source: FRAME_SOURCE, type: 'telemetry', telemetry });
    if (telemetry.type !== 'ready') return;
    const readyMs = telemetry.at;
    // Wait for the load event, so late chunks are counted too.
    const report = (): void => {
      post({
        source: FRAME_SOURCE,
        type: 'metrics',
        metrics: { readyMs, ...scriptTotals() },
      });
    };
    if (document.readyState === 'complete') report();
    else window.addEventListener('load', report, { once: true });
  };
  for (const event of takeEarlyTelemetry()) forward(event);
  channel.onTelemetry(forward);

  window.addEventListener('message', (event) => {
    if (event.source !== parent || event.origin !== origin) return;
    const message: unknown = event.data;
    if (!isHostMessage(message)) return;
    if (message.type === 'command') {
      channel.sendCommand(message.command);
    } else if (message.theme) {
      document.documentElement.dataset.theme = message.theme;
    } else {
      delete document.documentElement.dataset.theme;
    }
  });

  let lastHeight = -1;
  new ResizeObserver(() => {
    const height = Math.ceil(document.documentElement.getBoundingClientRect().height);
    if (height === lastHeight) return;
    lastHeight = height;
    post({ source: FRAME_SOURCE, type: 'size', height });
  }).observe(document.documentElement);
}
