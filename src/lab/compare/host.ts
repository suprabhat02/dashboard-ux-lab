import { getFormatter } from '../../spec/format';
import { DEFAULT_LOCALE, getMessages, isLocale, type Locale } from '../../spec/i18n';
import {
  HOST_SOURCE,
  isFrameMessage,
  type FrameMetrics,
  type HostMessage,
  type LabCommand,
  type LabTelemetry,
  type ThemeChoice,
} from '../../spec/protocol';
import { getScenario, isScenarioId, matchScenario } from '../../spec/scenarios';
import type { ImplementationId, LabSettings } from '../../spec/types';
import { hrefFor, parseSettings, serializeSettings } from '../../spec/url';
import { compareRuns, stepOf, type Agreement } from './sequence';

/**
 * The comparison page (/compare/): one set of controls driving both builds, each
 * in its own iframe so neither can touch the other's globals, styles or focus.
 *
 * The page never reaches into a frame. It talks to the bridge in each one
 * (bridge.ts) with postMessage, and only trusts messages that come from that
 * frame's window and this origin.
 */

const BUILDS = ['react', 'vanilla'] as const satisfies readonly ImplementationId[];
/** A run is over once neither build has a request in flight and both are quiet this long. */
const QUIET_MS = 600;

interface BuildView {
  readonly id: ImplementationId;
  readonly card: HTMLElement;
  readonly frame: HTMLIFrameElement;
  readonly ready: HTMLElement;
  readonly script: HTMLElement;
  readonly steps: HTMLElement;
  readonly heard: HTMLElement;
  /** Settings the frame was loaded with (its URL), to catch up if they changed before `ready`. */
  loadedWith: string;
  started: boolean;
  inFlight: number;
  run: string[];
}

// The type parameter mirrors querySelector<T>: callers name the element type they expect.
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
function must<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Compare markup is missing ${selector}`);
  return element;
}

function pageLocale(): Locale {
  const value = document.documentElement.dataset.locale;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

function currentTheme(): ThemeChoice {
  const value = document.documentElement.dataset.theme;
  return value === 'light' || value === 'dark' ? value : null;
}

export function initCompare(): void {
  const root = must<HTMLElement>(document, '[data-compare]');
  const locale = pageLocale();
  const t = getMessages(locale);
  const c = t.compare;
  const fmt = getFormatter(locale);
  const origin = window.location.origin;

  const form = must<HTMLFormElement>(root, '[data-compare-controls]');
  const verdict = must<HTMLElement>(root, '[data-verdict]');
  const verdictLive = must<HTMLElement>(root, '[data-verdict-live]');
  const diff = must<HTMLElement>(root, '[data-diff]');

  const views = BUILDS.map((id): BuildView => {
    const card = must<HTMLElement>(root, `[data-build="${id}"]`);
    return {
      id,
      card,
      frame: must<HTMLIFrameElement>(card, 'iframe'),
      ready: must<HTMLElement>(card, '[data-metric="ready"]'),
      script: must<HTMLElement>(card, '[data-metric="script"]'),
      steps: must<HTMLElement>(card, '[data-metric="steps"]'),
      heard: must<HTMLElement>(card, '[data-heard]'),
      loadedWith: '',
      started: false,
      inFlight: 0,
      run: [],
    };
  });

  let settings: LabSettings = parseSettings(new URLSearchParams(window.location.search));
  let interacted = false;
  let quiet: ReturnType<typeof setTimeout> | undefined;
  let lastSpoken = '';
  /**
   * A run is only comparable if both builds received the command from the same
   * state. Switch while one is still loading and the other has finished, and the
   * first goes loading → loading (no state change) while the second goes
   * success → loading: a difference in timing, not in behaviour. Such a run is
   * flagged, and replayed for both once both are idle.
   */
  let uneven = false;
  const busy = (): boolean => views.some((view) => !view.started || view.inFlight > 0);

  /* ── Talking to the frames ─────────────────────────────────────────────── */

  const post = (view: BuildView, message: HostMessage): void => {
    view.frame.contentWindow?.postMessage(message, origin);
  };
  const command = (view: BuildView, next: LabCommand): void => {
    if (view.started) post(view, { source: HOST_SOURCE, type: 'command', command: next });
  };
  const sendTheme = (view: BuildView): void => {
    post(view, { source: HOST_SOURCE, type: 'theme', theme: currentTheme() });
  };

  for (const view of views) {
    view.loadedWith = serializeSettings(settings);
    const query = view.loadedWith;
    // The src is set here, not in the markup, so the frames load the settings in
    // this page's URL (a shared link opens both builds on the same scenario).
    const base = view.frame.dataset.src ?? '';
    view.frame.src = query ? `${base}?${query}` : base;
  }

  /* ── Rendering ─────────────────────────────────────────────────────────── */

  const renderMetrics = (view: BuildView, metrics: FrameMetrics): void => {
    view.ready.textContent = t.lab.ms(fmt.integer(metrics.readyMs));
    const size = document.createElement('span');
    size.textContent = c.metrics.kb(fmt.decimal(metrics.scriptBytes / 1024));
    // "10.2 KB" is a Latin unit after a number: isolate it, or RTL reorders it.
    size.dir = 'ltr';
    const files = document.createElement('small');
    files.textContent = c.metrics.files(metrics.scriptCount);
    view.script.replaceChildren(size, ' ', files);
  };

  const describe = (agreement: Agreement): string => {
    if (interacted) return c.agreement.interacted;
    if (uneven) return c.agreement.uneven;
    switch (agreement.kind) {
      case 'waiting':
        return c.agreement.waiting;
      case 'agree':
        return agreement.ahead === 0
          ? c.agreement.agree(agreement.steps)
          : c.agreement.catching(agreement.steps);
      case 'differ':
        return c.agreement.differ(agreement.index + 1);
    }
  };

  const renderAgreement = (final: boolean): void => {
    const [react, vanilla] = views as [BuildView, BuildView];
    const agreement = compareRuns(react.run, vanilla.run, final);
    const text = describe(agreement);
    verdict.textContent = text;
    root.dataset.agreement = interacted
      ? 'interacted'
      : uneven
        ? 'uneven'
        : agreement.kind;
    root.dataset.run = final ? 'final' : 'running';
    for (const view of views) view.steps.textContent = fmt.integer(view.run.length);

    diff.hidden = agreement.kind !== 'differ' || interacted || uneven;
    if (agreement.kind === 'differ') {
      must<HTMLElement>(diff, '[data-diff-step="react"]').textContent =
        agreement.a ?? c.agreement.nothing;
      must<HTMLElement>(diff, '[data-diff-step="vanilla"]').textContent =
        agreement.b ?? c.agreement.nothing;
    }
    // Speak only the outcome of a finished run, once: steps arrive many times a
    // second, and a live region that chatters is worse than none.
    if (final && text !== lastSpoken) {
      lastSpoken = text;
      verdictLive.textContent = text;
    }
  };

  const settle = (): void => {
    clearTimeout(quiet);
    renderAgreement(false);
    if (views.every((view) => view.started && view.inFlight === 0)) {
      quiet = setTimeout(() => {
        if (!uneven) {
          renderAgreement(true);
          return;
        }
        // Both idle now, on the same scenario: run it again from a shared start.
        startRun();
        for (const view of views) command(view, { type: 'replay' });
      }, QUIET_MS);
    }
  };

  const startRun = (): void => {
    clearTimeout(quiet);
    interacted = false;
    lastSpoken = '';
    // In-flight counts carry over: a request still running will report its abort.
    uneven = busy();
    for (const view of views) view.run = [];
    renderAgreement(false);
  };

  /* ── Frame → page ──────────────────────────────────────────────────────── */

  const onTelemetry = (view: BuildView, telemetry: LabTelemetry): void => {
    switch (telemetry.type) {
      case 'ready': {
        view.started = true;
        sendTheme(view);
        // The controls changed while this frame was still loading: catch it up.
        if (serializeSettings(settings) !== view.loadedWith) {
          view.run = [];
          command(view, { type: 'apply', settings });
        }
        break;
      }
      case 'settings':
        interacted = true;
        break;
      case 'request':
        view.inFlight = Math.max(
          0,
          view.inFlight + (telemetry.phase === 'start' ? 1 : -1),
        );
        break;
      case 'announce':
        view.heard.textContent = telemetry.message;
        break;
      case 'state':
      case 'phase':
      case 'focus':
        break;
    }
    const step = stepOf(telemetry);
    if (step !== null) view.run.push(step);
    settle();
  };

  window.addEventListener('message', (event) => {
    if (event.origin !== origin) return;
    const view = views.find(
      (candidate) => candidate.frame.contentWindow === event.source,
    );
    const message: unknown = event.data;
    if (!view || !isFrameMessage(message)) return;
    switch (message.type) {
      case 'size':
        view.frame.style.blockSize = `${String(message.height)}px`;
        break;
      case 'metrics':
        renderMetrics(view, message.metrics);
        break;
      case 'telemetry':
        onTelemetry(view, message.telemetry);
        break;
    }
  });

  /* ── Page → frames ─────────────────────────────────────────────────────── */

  form.addEventListener('change', (event) => {
    const control = event.target;
    if (!(control instanceof HTMLInputElement)) return;
    if (control.name === 'scenario' && isScenarioId(control.value)) {
      settings = getScenario(control.value).settings;
      window.history.replaceState(
        window.history.state,
        '',
        hrefFor(window.location.pathname, settings),
      );
      startRun();
      for (const view of views) command(view, { type: 'apply', settings });
    } else if (
      control.name === 'listen' &&
      (BUILDS as readonly string[]).includes(control.value)
    ) {
      setActive(control.value as ImplementationId);
    }
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
  });
  must<HTMLButtonElement>(form, '[data-replay-both]').addEventListener('click', () => {
    startRun();
    for (const view of views) command(view, { type: 'replay' });
  });

  // Follow the site's theme menu into both frames.
  new MutationObserver(() => {
    for (const view of views) sendTheme(view);
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });

  /* ── One build at a time for keyboard and assistive technology ─────────── */

  const listenRadios = form.querySelectorAll<HTMLInputElement>('input[name="listen"]');
  function setActive(active: ImplementationId): void {
    for (const view of views) {
      const muted = view.id !== active;
      // inert takes the whole frame out of the tab order and the accessibility
      // tree, so its live regions stop speaking too. It stays on screen.
      view.frame.inert = muted;
      view.card.toggleAttribute('data-muted', muted);
      must<HTMLElement>(view.card, '[data-access-on]').hidden = muted;
      must<HTMLElement>(view.card, '[data-access-off]').hidden = !muted;
      must<HTMLElement>(view.card, '[data-use-build]').hidden = !muted;
    }
    for (const radio of listenRadios) radio.checked = radio.value === active;
  }
  for (const view of views) {
    must<HTMLButtonElement>(view.card, '[data-use-build]').addEventListener(
      'click',
      () => {
        setActive(view.id);
        view.frame.focus();
      },
    );
  }
  setActive(
    [...listenRadios].find((radio) => radio.checked)?.value === 'vanilla'
      ? 'vanilla'
      : 'react',
  );

  // A shared link may open on any scenario; reflect it in the controls.
  const preset = matchScenario(settings);
  for (const radio of form.querySelectorAll<HTMLInputElement>('input[name="scenario"]')) {
    radio.checked = radio.value === preset;
  }

  root.dataset.ready = '';
  renderAgreement(false);
}
