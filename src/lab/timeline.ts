import type { Formatter } from '../spec/format';
import type { Messages } from '../spec/i18n';
import type { LabChannel, LabTelemetry } from '../spec/protocol';
import {
  appendEvent,
  lanesFor,
  snapshotAt,
  type Lanes,
  type Recording,
  type Snapshot,
} from '../spec/recording';
import { PHASE_BOUNDARIES_MS } from '../spec/timing';
import type { LabSettings } from '../spec/types';
import { takeEarlyTelemetry } from './early-telemetry';

/**
 * The lab's request timeline: records what the build on the page reports through
 * the lab channel, draws it as lanes (what was on screen, what was heard, where
 * focus moved), and lets the visitor scrub to any moment of the run.
 *
 * All answers come from spec/recording.ts; this file only draws them.
 * Performance: the lanes are rebuilt only when the recording or the axis length
 * changes. While live, each frame sets two CSS variables (the playhead and the
 * growing end of the run), and the text updates only when its content changes.
 */

/** A run is over once nothing is in flight and this long has passed quietly. */
const TAIL_MS = 1_200;

// The type parameter mirrors querySelector<T>: callers name the element type they expect.
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
function must<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Timeline markup is missing ${selector}`);
  return element;
}

const pct = (fraction: number): string => `${(fraction * 100).toFixed(3)}%`;

export interface TimelineOptions {
  readonly channel: LabChannel;
  readonly t: Messages;
  readonly fmt: Formatter;
  readonly initialSettings: LabSettings;
  readonly now?: () => number;
}

export function initTimeline(root: HTMLElement, options: TimelineOptions): void {
  const { channel, t, fmt } = options;
  const now = options.now ?? (() => performance.now());
  const tt = t.timeline;

  const plot = must<HTMLElement>(root, '[data-tl-plot]');
  const axis = must<HTMLElement>(root, '[data-tl-axis]');
  const tracks = {
    screen: must<HTMLElement>(root, '[data-tl-track="screen"]'),
    heard: must<HTMLElement>(root, '[data-tl-track="heard"]'),
    focus: must<HTMLElement>(root, '[data-tl-track="focus"]'),
  };
  const range = must<HTMLInputElement>(root, '[data-tl-range]');
  const liveButton = must<HTMLButtonElement>(root, '[data-tl-live]');
  const nowLabel = must<HTMLElement>(root, '[data-tl-now]');
  const facts = {
    screen: must<HTMLElement>(root, '[data-tl-fact="screen"]'),
    heard: must<HTMLElement>(root, '[data-tl-fact="heard"]'),
    focus: must<HTMLElement>(root, '[data-tl-fact="focus"]'),
    request: must<HTMLElement>(root, '[data-tl-fact="request"]'),
  };

  let settings = options.initialSettings;
  let recording: Recording | null = null;
  let startedAt = 0;
  let lastEventAt = 0;
  let inFlight = false;
  let live = true;
  let positionMs = 0;
  let endMs = 0;
  let lanes: Lanes | null = null;
  let drawnKey = '';
  let spokenKey = '';
  let frame = 0;

  /* ── Recording ─────────────────────────────────────────────────────────── */

  const start = (at: number): void => {
    recording = { settings, events: [] };
    startedAt = at;
    lastEventAt = at;
    endMs = 0;
    positionMs = 0;
    setLive(true);
  };

  const record = (telemetry: LabTelemetry): void => {
    if (telemetry.type === 'settings') {
      settings = telemetry.settings;
      // Changed from inside the dashboard: a new story starts here.
      start(telemetry.at);
    }
    if (!recording) start(telemetry.at);
    if (!recording) return;
    if (telemetry.type === 'request') inFlight = telemetry.phase === 'start';
    lastEventAt = Math.max(lastEventAt, telemetry.at);
    recording = appendEvent(recording, { ...telemetry, atMs: telemetry.at - startedAt });
    tick();
  };

  channel.onTelemetry(record);
  channel.onCommand((command) => {
    if (command.type === 'apply') settings = command.settings;
    // Lab controls start a new run. The build may have answered the command
    // before this listener ran (listeners run in subscription order): carry
    // anything stamped at or after the command into the new run.
    const at = now();
    const carried = (recording?.events ?? []).filter((event) => event.at >= at);
    start(at);
    for (const event of carried) {
      const { atMs: _previous, ...telemetry } = event;
      record(telemetry);
    }
    tick();
  });

  /* ── Drawing ───────────────────────────────────────────────────────────── */

  const runEnd = (): number => {
    const elapsed = now() - startedAt;
    if (inFlight) return elapsed;
    return Math.min(elapsed, lastEventAt - startedAt + TAIL_MS);
  };

  function drawLanes(current: Lanes): void {
    const { scale } = current;
    // Axis: the spec's boundaries that fit, and the end.
    const ticks = [
      0,
      ...PHASE_BOUNDARIES_MS.filter((ms) => ms < scale.maxMs * 0.92),
      scale.maxMs,
    ];
    axis.replaceChildren(
      ...ticks.map((ms, index) => {
        const tick = document.createElement('span');
        tick.className = 'tl__tick';
        if (index === ticks.length - 1) tick.classList.add('tl__tick--end');
        tick.style.setProperty('--x', pct(scale.position(ms)));
        const label = document.createElement('span');
        // The axis starts at zero by definition; its label would only crowd 300 ms.
        if (index > 0) label.textContent = fmt.duration(ms);
        tick.append(label);
        return tick;
      }),
    );

    tracks.screen.replaceChildren(
      ...current.screen.map((span, index) => {
        const element = document.createElement('span');
        element.className = 'tl__span';
        element.dataset.screen = span.screen;
        element.style.setProperty('--a', pct(scale.position(span.fromMs)));
        // The last span grows with the run: it ends wherever --end says, live.
        element.style.setProperty(
          '--b',
          index === current.screen.length - 1
            ? 'var(--end)'
            : pct(scale.position(span.toMs)),
        );
        const label = document.createElement('span');
        label.className = 'tl__span-label';
        label.textContent = tt.screens[span.screen];
        element.append(label);
        return element;
      }),
    );

    const marks = (list: Lanes['heard'], kind: 'heard' | 'focus'): HTMLElement[] =>
      list.map((mark) => {
        const element = document.createElement('span');
        element.className = 'tl__anchor tl__mark';
        element.style.setProperty('--x', pct(scale.position(mark.atMs)));
        const dot = document.createElement('span');
        dot.className = `tl__dot tl__dot--${kind}`;
        if (mark.kind === 'speech') dot.dataset.politeness = mark.politeness;
        element.append(dot);
        return element;
      });
    tracks.heard.replaceChildren(...marks(current.heard, 'heard'));
    tracks.focus.replaceChildren(...marks(current.focus, 'focus'));
    fit();
  }

  /**
   * Text that does not fit is hidden, never cut: a span label wider than its
   * span, an axis label that would touch its neighbour (the end label is kept).
   * Runs after drawing, on resize, and each frame for the one span still growing.
   */
  function fitSpan(span: Element): void {
    const label = span.firstElementChild;
    if (!(span instanceof HTMLElement) || !(label instanceof HTMLElement)) return;
    label.hidden = false;
    label.hidden = label.offsetWidth > span.clientWidth - 12;
  }
  function fit(): void {
    for (const span of tracks.screen.children) fitSpan(span);
    const labels = [...axis.querySelectorAll<HTMLElement>('.tl__tick > span')];
    for (const label of labels) label.hidden = false;
    const end = labels.at(-1);
    let previous: DOMRect | null = null;
    for (const label of labels) {
      if (!label.textContent) continue;
      const box = label.getBoundingClientRect();
      const endBox = end && label !== end ? end.getBoundingClientRect() : null;
      const overlaps = (other: DOMRect | null): boolean =>
        other !== null && box.left < other.right + 6 && other.left < box.right + 6;
      if (overlaps(previous) || overlaps(endBox)) {
        label.hidden = true;
      } else {
        previous = box;
      }
    }
  }
  new ResizeObserver(() => {
    fit();
  }).observe(plot);

  function describe(snapshot: Snapshot): void {
    const time = fmt.duration(snapshot.atMs);
    const screen = tt.screens[snapshot.screen];
    const key = JSON.stringify([
      time,
      snapshot.screen,
      snapshot.heard,
      snapshot.focus,
      snapshot.inFlight,
    ]);
    if (key === spokenKey) return;
    spokenKey = key;
    nowLabel.textContent = tt.at(time);
    facts.screen.textContent = screen;
    if (snapshot.heard) {
      facts.heard.replaceChildren(
        Object.assign(document.createElement('q'), {
          textContent: snapshot.heard.message,
        }),
        ' ',
        Object.assign(document.createElement('small'), {
          textContent: tt.heardAt(
            fmt.duration(snapshot.heard.atMs),
            t.screenReaders.politeness[snapshot.heard.politeness],
          ),
        }),
      );
    } else {
      facts.heard.textContent = tt.nothingHeard;
    }
    if (snapshot.focus) {
      facts.focus.replaceChildren(
        snapshot.focus.target,
        ' ',
        Object.assign(document.createElement('small'), {
          textContent: tt.focusAt(fmt.duration(snapshot.focus.atMs)),
        }),
      );
    } else {
      facts.focus.textContent = tt.focusUntouched;
    }
    facts.request.textContent =
      snapshot.inFlight === null ? tt.requestIdle : tt.requestInFlight(snapshot.inFlight);
    range.setAttribute('aria-valuetext', tt.valueText(time, screen));
  }

  function render(): void {
    if (!recording) return;
    endMs = Math.max(0, runEnd());
    if (live) positionMs = endMs;
    const current = lanesFor(recording, endMs);
    const key = `${String(recording.events.length)}|${String(current.scale.maxMs)}|${String(startedAt)}`;
    if (key !== drawnKey) {
      drawnKey = key;
      drawLanes(current);
    }
    lanes = current;
    plot.style.setProperty('--end', pct(current.scale.position(endMs)));
    const growing = tracks.screen.lastElementChild;
    if (growing) fitSpan(growing);
    plot.style.setProperty('--p', pct(current.scale.position(positionMs)));
    range.value = String(Math.round(current.scale.position(positionMs) * 1000));
    root.dataset.state = 'recording';
    describe(snapshotAt(recording, positionMs));
  }

  /** Draws now, and keeps drawing each frame while the run is still unfolding. */
  function tick(): void {
    cancelAnimationFrame(frame);
    render();
    if (recording && (inFlight || now() - lastEventAt < TAIL_MS)) {
      frame = requestAnimationFrame(tick);
    }
  }

  /* ── Scrubbing ─────────────────────────────────────────────────────────── */

  function setLive(next: boolean): void {
    live = next;
    liveButton.setAttribute('aria-pressed', String(next));
  }

  range.addEventListener('input', () => {
    if (!lanes) return;
    setLive(false);
    positionMs = Math.min(lanes.scale.timeAt(Number(range.value) / 1000), endMs);
    render();
  });

  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-tl-step]')) {
    button.addEventListener('click', () => {
      if (!lanes) return;
      setLive(false);
      const forward = button.dataset.tlStep === '1';
      const changes = lanes.changes;
      const target = forward
        ? changes.find((ms) => ms > positionMs + 0.5)
        : [...changes].reverse().find((ms) => ms < positionMs - 0.5);
      positionMs = target ?? (forward ? endMs : 0);
      render();
    });
  }

  liveButton.addEventListener('click', () => {
    setLive(liveButton.getAttribute('aria-pressed') !== 'true');
    tick();
  });

  // Last, once everything above exists: replay what the build said before the
  // lab's script ran (the vanilla build starts first on its page).
  for (const telemetry of takeEarlyTelemetry()) record(telemetry);
}
