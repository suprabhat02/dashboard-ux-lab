import { roleLabel } from '../spec/copy';
import { PLAN_LABEL } from '../spec/format';
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
 * implementation is on the page only through the lab channel.
 */

// The type parameter mirrors querySelector<T>: callers name the element type they expect.
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
function must<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Lab markup is missing ${selector}`);
  return element;
}

const FAILURE_LABEL: Record<FailureMode, string> = {
  never: 'never fails',
  once: 'fails once',
  always: 'always fails',
};

function describeCustom(settings: LabSettings): {
  what: string;
  why: string;
  a11y: string;
} {
  return {
    what:
      `Custom: ${settings.latencyMs} ms latency, server ${FAILURE_LABEL[settings.failure]}, ` +
      `${roleLabel(settings.role)} role, ${PLAN_LABEL[settings.plan]}.`,
    why: 'Mix the knobs to find edge cases: a slow request that then fails, a viewer on an empty filter, a retry that keeps failing. The dashboard follows the same rules for every combination.',
    a11y: 'Watch the Screen reader tab: every change you trigger produces at most one announcement per state, never a queue.',
  };
}

export function initLab(target: EventTarget = window): LabChannel {
  const channel = createLabChannel(target);
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
    latencyOutput.textContent = `${settings.latencyMs} ms`;
    role.value = settings.role;
    plan.value = settings.plan;
    customBadge.hidden = preset !== null;
    currentScenario.textContent = preset ? getScenario(preset).title : 'Custom';

    const explanation = preset ? getScenario(preset).explanation : null;
    const custom = describeCustom(settings);
    must<HTMLElement>(document, '[data-explain-what]').textContent =
      explanation?.what ?? custom.what;
    must<HTMLElement>(document, '[data-explain-why]').textContent =
      explanation?.why ?? custom.why;
    must<HTMLElement>(document, '[data-explain-a11y]').textContent =
      explanation?.accessibility ?? custom.a11y;
    const link = must<HTMLAnchorElement>(document, '[data-explain-link]');
    link.hidden = preset === null;
    if (preset) {
      link.href = `/scenarios/${preset}/`;
      link.textContent = `Read the full “${getScenario(preset).title}” guide`;
    }

    // Keep the implementation switch on the same scenario.
    const query = serializeSettings(settings);
    for (const anchor of document.querySelectorAll<HTMLAnchorElement>(
      '[data-impl-link]',
    )) {
      const implementation = anchor.dataset.implLink ?? 'react';
      anchor.setAttribute('href', `/lab/${implementation}/${query ? `?${query}` : ''}`);
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
    latencyOutput.textContent = `${latency.value} ms`;
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
        status.textContent = 'Link copied to clipboard.';
        copyButton.textContent = 'Copied';
        setTimeout(() => {
          copyButton.textContent = 'Copy link';
          status.textContent = '';
        }, 2000);
      },
      () => {
        status.textContent = 'Couldn’t copy. Copy the address bar instead.';
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

  initInspector(channel);
  render();
  return channel;
}
