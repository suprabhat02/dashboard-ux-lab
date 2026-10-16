import { CHART } from '../spec/chart';
import { PREVIOUS_MONTH } from '../spec/data';
import type { Formatter } from '../spec/format';
import type { Locale, Messages } from '../spec/i18n';
import type { SortState } from '../spec/table';
import type { DashboardError, Kpi, PlanFilter, Role } from '../spec/types';
import { h, icon, uid } from './dom';

/** What every view needs: the page's catalogue, formatter and locale. */
export interface Ctx {
  readonly t: Messages;
  readonly fmt: Formatter;
  readonly locale: Locale;
}

/**
 * View state the dashboard keeps across re-renders, so a refresh of the data
 * does not reset what the visitor chose (React gets this from reconciliation).
 */
export interface ViewMemory {
  sort: SortState;
  chartTableOpen: boolean;
}

/**
 * Controls that may be rebuilt while focused carry a stable key; after a rebuild
 * the dashboard moves focus to the control with the same key.
 */
export const FOCUS_KEY = 'data-focus-key';

/* ── Building blocks ─────────────────────────────────────────────────────── */

/** A dashboard card: a section named by its heading. */
export function widget(title: string, meta: string | undefined, body: Node): HTMLElement {
  const id = uid('widget');
  return h(
    'section',
    { class: 'widget', 'aria-labelledby': id },
    h(
      'div',
      { class: 'widget__header' },
      h('h3', { class: 'widget__title', id }, title),
      meta ? h('span', { class: 'widget__meta' }, meta) : null,
    ),
    h('div', { class: 'widget__body' }, body),
  );
}

/** Request IDs are machine strings: always left-to-right, even in Arabic. */
const code = (text: string): HTMLElement => h('code', { dir: 'ltr' }, text);

/* ── KPIs ────────────────────────────────────────────────────────────────── */

function kpiCard(kpi: Kpi, { t, fmt }: Ctx): HTMLElement {
  const delta = fmt.delta(kpi, fmt.monthName(PREVIOUS_MONTH));
  return h(
    'li',
    { class: 'kpi', 'data-kpi': kpi.id },
    h('p', { class: 'kpi__label' }, t.dashboard.kpi[kpi.id]),
    h('p', { class: 'kpi__value' }, fmt.value(kpi.value, kpi.format)),
    delta &&
      h(
        'p',
        { class: 'kpi__delta', 'data-tone': delta.tone },
        icon(delta.direction, 14),
        h('span', { 'aria-hidden': 'true' }, delta.label),
        h('span', { class: 'sr-only' }, delta.description),
      ),
  );
}

export function kpiGrid(kpis: readonly Kpi[], ctx: Ctx): HTMLElement {
  return h(
    'ul',
    { class: 'kpis', role: 'list', 'aria-label': ctx.t.dashboard.kpisLabel },
    ...kpis.map((kpi) => kpiCard(kpi, ctx)),
  );
}

/* ── Placeholders ────────────────────────────────────────────────────────── */

/** Fixed rhythm (never random, so nothing flickers between renders). */
const BAR_HEIGHTS = [48, 52, 55, 55, 62, 64, 62, 82, 80, 81, 82, 80] as const;

const bone = (className: string, vars: Readonly<Record<string, string>> = {}) =>
  h('span', { class: `skeleton ${className}`.trim(), style: vars });

export function skeletonContent({ t }: Ctx): HTMLElement {
  const kpis = h(
    'ul',
    { class: 'kpis', role: 'list' },
    ...[62, 48, 58, 44].map((width) =>
      h(
        'li',
        { class: 'kpi' },
        bone('skeleton--text', { '--w': `${String(width)}%` }),
        bone('skeleton--value'),
        bone('skeleton--pill'),
      ),
    ),
  );
  const chart = h(
    'div',
    {
      class: 'skeleton-chart',
      style: { 'aspect-ratio': `${String(CHART.width)} / ${String(CHART.height)}` },
    },
    ...BAR_HEIGHTS.map((height) => bone('', { '--h': `${String(height)}%` })),
  );
  const table = h(
    'div',
    { class: 'table-scroll table-scroll--fixed' },
    ...Array.from({ length: 6 }, () =>
      h(
        'div',
        { class: 'skeleton-row' },
        ...[80, 50, 40, 60, 55, 70].map((width) =>
          bone('skeleton--text', { '--w': `${String(width)}%` }),
        ),
      ),
    ),
  );
  return h(
    'div',
    { class: 'dash__grid', 'aria-hidden': 'true' },
    kpis,
    widget(t.dashboard.revenue, t.dashboard.revenueMeta, chart),
    widget(t.dashboard.accounts, undefined, table),
  );
}

/* ── States: each one its own view, with its own copy and actions ────────── */

const stateIcon = (name: 'error' | 'forbidden' | 'empty' | 'cancel') =>
  h('span', { class: 'state__icon' }, icon(name, 28));

export interface ErrorPanel {
  readonly el: HTMLElement;
  readonly button: HTMLButtonElement;
  /**
   * Update in place: "Try again" ↔ "Trying again…", and the request ID of a
   * repeated failure, without replacing the focused button.
   */
  update(error: DashboardError, retrying: boolean): void;
}

export function errorPanel(
  error: DashboardError,
  onRetry: () => void,
  { t }: Ctx,
): ErrorPanel {
  const copy = t.dashboard.error;
  const label = h('span', {}, copy.retry);
  let retrying = false;
  // aria-disabled (not disabled) keeps focus on the button while the retry runs.
  const button = h(
    'button',
    {
      type: 'button',
      class: 'btn btn--primary',
      onclick: () => {
        if (!retrying) onRetry();
      },
    },
    icon('retry', 16),
    label,
  );
  const requestId = code(error.requestId);
  const el = h(
    'div',
    { class: 'state state--error', 'data-state': 'error' },
    stateIcon('error'),
    h('h3', { class: 'state__title' }, copy.title),
    h('p', { class: 'state__body' }, copy.body),
    h('p', { class: 'state__meta' }, `${copy.requestIdLabel} `, requestId),
    h('div', { class: 'state__actions' }, button),
  );
  return {
    el,
    button,
    update(nextError, next) {
      requestId.textContent = nextError.requestId;
      retrying = next;
      label.textContent = next ? copy.retrying : copy.retry;
      if (next) button.setAttribute('aria-disabled', 'true');
      else button.removeAttribute('aria-disabled');
    },
  };
}

export function forbiddenPanel(error: DashboardError, { t }: Ctx): HTMLElement {
  const copy = t.dashboard.forbidden;
  return h(
    'div',
    { class: 'state state--forbidden', 'data-state': 'forbidden' },
    stateIcon('forbidden'),
    h('h3', { class: 'state__title' }, copy.title),
    h('p', { class: 'state__body' }, copy.body),
    h('p', { class: 'state__meta' }, `${copy.requestIdLabel} `, code(error.requestId)),
  );
}

export function emptyPanel(
  plan: PlanFilter,
  onReset: () => void,
  { t }: Ctx,
): HTMLElement {
  const copy = t.dashboard.empty;
  return h(
    'div',
    { class: 'state state--empty', 'data-state': 'empty' },
    stateIcon('empty'),
    h('h3', { class: 'state__title' }, copy.title(t.dashboard.plans[plan])),
    h('p', { class: 'state__body' }, copy.body),
    h(
      'div',
      { class: 'state__actions' },
      h(
        'button',
        { type: 'button', class: 'btn btn--primary', onclick: onReset },
        copy.action,
      ),
    ),
  );
}

export function cancelledPanel(
  onReload: () => void,
  { t }: Ctx,
): { el: HTMLElement; button: HTMLButtonElement } {
  const copy = t.dashboard.cancelled;
  const button = h(
    'button',
    { type: 'button', class: 'btn btn--primary', onclick: onReload },
    icon('retry', 16),
    copy.action,
  );
  const el = h(
    'div',
    { class: 'state state--cancelled', 'data-state': 'cancelled' },
    stateIcon('cancel'),
    h('h3', { class: 'state__title' }, copy.title),
    h('p', { class: 'state__body' }, copy.body),
    h('div', { class: 'state__actions' }, button),
  );
  return { el, button };
}

export function restrictedWidget(
  role: Role,
  requiredRole: Role,
  { t }: Ctx,
): HTMLElement {
  const copy = t.dashboard.widgetRestricted;
  const roles = t.dashboard.roles;
  return h(
    'div',
    { class: 'restricted', 'data-state': 'widget-restricted' },
    h('p', { class: 'restricted__title' }, icon('restricted', 18), copy.title),
    h('p', { class: 'restricted__body' }, copy.body(roles[role], roles[requiredRole])),
    h('p', { class: 'restricted__role' }, copy.currentRole(roles[role])),
  );
}

export function slowNotice(
  stalled: boolean,
  onCancel: () => void,
  { t }: Ctx,
): HTMLElement {
  const copy = t.dashboard.loading;
  return h(
    'div',
    { class: 'notice', 'data-state': stalled ? 'stalled' : 'slow' },
    icon('slow', 20, 'notice__icon'),
    h(
      'div',
      { class: 'notice__text' },
      h('p', { class: 'notice__title' }, stalled ? copy.stalledTitle : copy.slowTitle),
      h('p', { class: 'notice__body' }, stalled ? copy.stalledBody : copy.slowBody),
    ),
    stalled &&
      h(
        'button',
        { type: 'button', class: 'btn btn--sm', onclick: onCancel },
        icon('cancel', 14),
        copy.cancel,
      ),
  );
}
