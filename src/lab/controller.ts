import { getFormatter, type Formatter } from '../spec/format';
import {
  getMessages,
  isLocale,
  DEFAULT_LOCALE,
  localizePath,
  type Locale,
  type Messages,
} from '../spec/i18n';
import { createLabChannel, type LabChannel, type LabTelemetry } from '../spec/protocol';
import { getScenario, isScenarioId, matchScenario } from '../spec/scenarios';
import { clampLatency } from '../spec/timing';
import type { FailureMode, LabSettings, PlanFilter, Role } from '../spec/types';
import { hrefFor, parseSettings, serializeSettings } from '../spec/url';
import { initInspector } from './inspector';

/**
 * Lab chrome controller (framework-free, shared by both lab pages).
 *
 * Owns the controls, the URL and the explanation panel. Talks to whichever
 * implementation is on the page only through the lab channel. The locale is
 * read from <html data-locale>; every visible string comes from the catalogue.
 */

// The type parameter mirrors querySelector<T>: callers name the element type they expect.
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
function must<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Lab markup is missing ${selector}`);
  return element;
}

function pageLocale(): Locale {
  const value = document.documentElement.dataset.locale;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

function describeCustom(
  settings: LabSettings,
  t: Messages,
  fmt: Formatter,
): { what: string; why: string; a11y: string } {
  return {
    what: t.lab.customWhat(
      t.lab.ms(fmt.integer(settings.latencyMs)),
      t.lab.customFailure[settings.failure],
      t.dashboard.roles[settings.role],
      t.dashboard.plans[settings.plan],
    ),
    why: t.lab.customWhy,
    a11y: t.lab.customA11y,
  };
}

export function initLab(target: EventTarget = window): LabChannel {
  const channel = createLabChannel(target);
  const locale = pageLocale();
  const t = getMessages(locale);
  const fmt = getFormatter(locale);
  const ms = (value: number): string => t.lab.ms(fmt.integer(value));
  const form = must<HTMLFormElement>(document, '[data-controls]');
  const latency = must<HTMLInputElement>(form, 'input[name="latency"]');
  const latencyOutput = must<HTMLOutputElement>(form, '[data-latency-output]');
  const role = must<HTMLSelectElement>(form, 'select[name="role"]');
  const plan = must<HTMLSelectElement>(form, 'select[name="plan"]');
  const customBadge = must<HTMLElement>(form, '[data-custom-badge]');
  const status = must<HTMLElement>(form, '[data-chrome-status]');
  const currentScenario = must<HTMLElement>(document, '[data-current-scenario]');

  let settings = parseSettings(new URLSearchParams(window.location.search));

  /* ── Rendering the chrome from settings ──────────────────────────────── */

  const render = (): void => {
    const preset = matchScenario(settings);
    for (const radio of form.querySelectorAll<HTMLInputElement>(
      'input[name="scenario"]',
    )) {
      radio.checked = radio.value === preset;
    }
    for (const radio of form.querySelectorAll<HTMLInputElement>(
      'input[name="failure"]',
    )) {
      radio.checked = radio.value === settings.failure;
    }
    latency.value = String(settings.latencyMs);
    latencyOutput.textContent = ms(settings.latencyMs);
    role.value = settings.role;
    plan.value = settings.plan;
    customBadge.hidden = preset !== null;
    currentScenario.textContent = preset ? t.scenarios[preset].title : t.lab.custom;

    const explanation = preset ? t.scenarios[preset] : null;
    const custom = describeCustom(settings, t, fmt);
    must<HTMLElement>(document, '[data-explain-what]').textContent =
      explanation?.what ?? custom.what;
    must<HTMLElement>(document, '[data-explain-why]').textContent =
      explanation?.why ?? custom.why;
    must<HTMLElement>(document, '[data-explain-a11y]').textContent =
      explanation?.accessibility ?? custom.a11y;
    const link = must<HTMLAnchorElement>(document, '[data-explain-link]');
    link.hidden = preset === null;
    if (preset) {
      link.href = localizePath(locale, `/scenarios/${preset}/`);
      link.textContent = t.lab.readGuide(t.scenarios[preset].title);
    }

    // Keep the implementation switch on the same scenario.
    const query = serializeSettings(settings);
    for (const anchor of document.querySelectorAll<HTMLAnchorElement>(
      '[data-impl-link]',
    )) {
      const implementation = anchor.dataset.implLink ?? 'react';
      anchor.setAttribute(
        'href',
        `${localizePath(locale, `/lab/${implementation}/`)}${query ? `?${query}` : ''}`,
      );
    }
  };

  const apply = (next: LabSettings): void => {
    settings = next;
    window.history.replaceState(
      window.history.state,
      '',
      hrefFor(window.location.pathname, settings),
    );
    render();
    channel.sendCommand({ type: 'apply', settings });
  };

  /* ── Control events ──────────────────────────────────────────────────── */

  form.addEventListener('change', (event) => {
    const control = event.target;
    if (
      control instanceof HTMLInputElement &&
      control.name === 'scenario' &&
      isScenarioId(control.value)
    ) {
      apply(getScenario(control.value).settings);
    } else if (control instanceof HTMLInputElement && control.name === 'failure') {
      apply({ ...settings, failure: control.value as FailureMode });
    } else if (control === latency) {
      apply({ ...settings, latencyMs: clampLatency(Number(latency.value)) });
    } else if (control === role) {
      apply({ ...settings, role: role.value as Role });
    } else if (control === plan) {
      apply({ ...settings, plan: plan.value as PlanFilter });
    }
  });
  // Live readout while dragging; the request itself only re-runs on release (`change`).
  latency.addEventListener('input', () => {
    latencyOutput.textContent = ms(Number(latency.value));
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
  });

  must<HTMLButtonElement>(form, '[data-replay]').addEventListener('click', () => {
    channel.sendCommand({ type: 'replay' });
  });

  const copyButton = must<HTMLButtonElement>(form, '[data-copy-link]');
  copyButton.addEventListener('click', () => {
    void navigator.clipboard.writeText(window.location.href).then(
      () => {
        status.textContent = t.lab.linkCopied;
        copyButton.textContent = t.lab.copied;
        setTimeout(() => {
          copyButton.textContent = t.lab.copyLink;
          status.textContent = '';
        }, 2000);
      },
      () => {
        status.textContent = t.lab.copyFailed;
      },
    );
  });

  /* ── Mobile disclosure for the rail (APG Disclosure) ─────────────────── */

  const railToggle = must<HTMLButtonElement>(document, '[data-rail-toggle]');
  const railBody = must<HTMLElement>(document, '[data-rail-body]');
  railToggle.addEventListener('click', () => {
    const open = railToggle.getAttribute('aria-expanded') !== 'true';
    railToggle.setAttribute('aria-expanded', String(open));
    railBody.dataset.open = String(open);
  });

  /* ── Implementation → chrome ─────────────────────────────────────────── */

  channel.onTelemetry((telemetry: LabTelemetry) => {
    if (telemetry.type === 'settings') {
      settings = telemetry.settings;
      render();
    }
  });
  window.addEventListener('popstate', () => {
    settings = parseSettings(new URLSearchParams(window.location.search));
    render();
  });

  initInspector(channel, t);
  render();
  return channel;
}
