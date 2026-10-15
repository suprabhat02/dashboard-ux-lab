import type { Messages } from '../spec/i18n';
import type { LabChannel, LabTelemetry } from '../spec/protocol';

/**
 * Inspector: renders lab telemetry into three logs, behind an APG Tabs widget
 * (automatic activation, arrow keys, Home/End).
 *
 * The logs use role="log" with aria-live="off": they are a visual debugging aid,
 * and announcing them would compete with the dashboard's own announcements,
 * which is the very thing the lab teaches people to avoid.
 *
 * State and phase names are code identifiers (they match the spec and the
 * source), so they stay untranslated and are isolated left-to-right in Arabic.
 */

/** Wrap a code identifier so it reads left-to-right inside right-to-left text. */
const ltr = (text: string): string => `\u2066${text}\u2069`;

type LogName = 'timeline' | 'announce' | 'focus';
const MAX_ENTRIES = 60;

interface Entry {
  readonly kind: string;
  readonly text: string;
  readonly tone?: 'info' | 'good' | 'warn' | 'bad';
}

function describe(
  telemetry: LabTelemetry,
  t: Messages,
): { log: LogName; entry: Entry } | null {
  const { kinds, entries } = t.inspector;
  switch (telemetry.type) {
    case 'ready':
      return {
        log: 'timeline',
        entry: {
          kind: kinds.ready,
          text: entries.ready(telemetry.implementation),
        },
      };
    case 'request': {
      const text = {
        start: entries.requestStart(telemetry.attempt),
        settled: entries.requestSettled(telemetry.attempt),
        aborted: entries.requestAborted(telemetry.attempt),
      }[telemetry.phase];
      return {
        log: 'timeline',
        entry: {
          kind: kinds.request,
          text,
          tone: telemetry.phase === 'aborted' ? 'warn' : 'info',
        },
      };
    }
    case 'state': {
      const tone = (
        {
          success: 'good',
          error: 'bad',
          forbidden: 'warn',
          cancelled: 'warn',
          loading: 'info',
          idle: 'info',
        } as const
      )[telemetry.to];
      return {
        log: 'timeline',
        entry: {
          kind: kinds.state,
          text: ltr(`${telemetry.from} → ${telemetry.to}`),
          tone,
        },
      };
    }
    case 'phase':
      return {
        log: 'timeline',
        entry: { kind: kinds.phase, text: entries.phase(ltr(telemetry.phase)) },
      };
    case 'announce':
      return {
        log: 'announce',
        entry: {
          kind: kinds[telemetry.politeness],
          text: `“${telemetry.message}”`,
          tone: telemetry.politeness === 'assertive' ? 'warn' : 'info',
        },
      };
    case 'focus':
      return {
        log: 'focus',
        entry: { kind: kinds.moved, text: `${telemetry.target} — ${telemetry.reason}` },
      };
    case 'settings':
      return {
        log: 'timeline',
        entry: { kind: kinds.filter, text: entries.filter },
      };
  }
}

function describeElement(element: Element | null, lostLabel: string): string {
  if (!element || element === document.body) return lostLabel;
  const role = element.getAttribute('role') ?? element.tagName.toLowerCase();
  const fieldLabel =
    element instanceof HTMLInputElement || element instanceof HTMLSelectElement
      ? (element.labels?.[0]?.textContent ?? null)
      : null;
  const label = element.getAttribute('aria-label') ?? fieldLabel ?? element.textContent;
  const text = label.replace(/\s+/g, ' ').trim().slice(0, 48);
  return text ? `${role} “${text}”` : role;
}

export function initInspector(channel: LabChannel, t: Messages): void {
  const root = document.querySelector<HTMLElement>('[data-inspector]');
  if (!root) return;
  const startedAt = performance.now();
  const counts: Record<LogName, number> = { timeline: 0, announce: 0, focus: 0 };

  const logs = {
    timeline: root.querySelector<HTMLOListElement>('[data-log="timeline"]'),
    announce: root.querySelector<HTMLOListElement>('[data-log="announce"]'),
    focus: root.querySelector<HTMLOListElement>('[data-log="focus"]'),
  };

  const setCount = (log: LogName): void => {
    const badge = root.querySelector(`[data-count="${log}"]`);
    if (badge) badge.textContent = String(counts[log]);
  };

  const append = (log: LogName, entry: Entry, at: number): void => {
    const list = logs[log];
    if (!list) return;
    const item = document.createElement('li');
    item.className = 'log__entry';
    if (entry.tone) item.dataset.tone = entry.tone;

    const time = document.createElement('span');
    time.className = 'log__time';
    time.textContent = `${((at - startedAt) / 1000).toFixed(2)}s`;
    const kind = document.createElement('span');
    kind.className = 'log__kind';
    kind.textContent = entry.kind;
    const text = document.createElement('span');
    text.className = 'log__text';
    text.textContent = entry.text;

    item.append(time, kind, text);
    list.prepend(item);
    while (list.children.length > MAX_ENTRIES) list.lastElementChild?.remove();
    counts[log] += 1;
    setCount(log);
  };

  channel.onTelemetry((telemetry) => {
    const described = describe(telemetry, t);
    if (described) append(described.log, described.entry, telemetry.at);
  });

  root.querySelector('[data-clear-log]')?.addEventListener('click', () => {
    for (const name of Object.keys(logs) as LogName[]) {
      logs[name]?.replaceChildren();
      counts[name] = 0;
      setCount(name);
    }
  });

  /* Live "focused now" readout. */
  const focusNow = root.querySelector('[data-focus-now]');
  document.addEventListener('focusin', () => {
    if (focusNow)
      focusNow.textContent = describeElement(
        document.activeElement,
        t.inspector.focusLost,
      );
  });

  /* APG Tabs: automatic activation. */
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const select = (tab: HTMLButtonElement, moveFocus: boolean): void => {
    for (const candidate of tabs) {
      const selected = candidate === tab;
      candidate.setAttribute('aria-selected', String(selected));
      candidate.tabIndex = selected ? 0 : -1;
      const panelId = candidate.getAttribute('aria-controls');
      const panel = panelId ? document.getElementById(panelId) : null;
      if (panel) panel.hidden = !selected;
    }
    if (moveFocus) tab.focus();
  };
  for (const [index, tab] of tabs.entries()) {
    tab.addEventListener('click', () => {
      select(tab, false);
    });
    tab.addEventListener('keydown', (event) => {
      const last = tabs.length - 1;
      // In right-to-left layouts the next tab sits to the left (APG Tabs, RTL note).
      const rtl = getComputedStyle(tab).direction === 'rtl';
      const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
      const backward = rtl ? 'ArrowRight' : 'ArrowLeft';
      const target =
        event.key === forward
          ? tabs[index === last ? 0 : index + 1]
          : event.key === backward
            ? tabs[index === 0 ? last : index - 1]
            : event.key === 'Home'
              ? tabs[0]
              : event.key === 'End'
                ? tabs[last]
                : undefined;
      if (!target) return;
      event.preventDefault();
      select(target, true);
    });
  }
}
