import { CURRENT_MONTH, PLAN_FILTERS } from '../spec/data';
import {
  focusTargetFor,
  phaseAnnouncement,
  screenFor,
  statusAnnouncement,
  type FocusIntent,
  type Screen,
} from '../spec/dashboard-rules';
import {
  dashboardReducer,
  initialState,
  type ActiveRequest,
  type DashboardAction,
  type DashboardState,
} from '../spec/dashboard-state';
import { getFormatter } from '../spec/format';
import { getMessages, type Locale } from '../spec/i18n';
import { fetchDashboard, isAbortError } from '../spec/mock-api';
import { createLabChannel, type Politeness } from '../spec/protocol';
import { DEFAULT_SORT } from '../spec/table';
import { loadingPhase, msUntilNextPhase, TIMING } from '../spec/timing';
import type {
  DashboardData,
  LabSettings,
  LoadingPhase,
  PlanFilter,
  RequestStatus,
} from '../spec/types';
import { hrefFor, parseSettings } from '../spec/url';
import { revenueChart } from './chart';
import { h, uid } from './dom';
import { accountsTable } from './table';
import {
  cancelledPanel,
  emptyPanel,
  errorPanel,
  FOCUS_KEY,
  forbiddenPanel,
  kpiGrid,
  restrictedWidget,
  skeletonContent,
  slowNotice,
  widget,
  type Ctx,
  type ErrorPanel,
  type ViewMemory,
} from './views';

/**
 * The framework-free implementation.
 *
 * One controller owns everything that changes: the shared reducer (spec), the
 * phase timers, the request and the DOM. Rendering is by region rather than by
 * diffing: the shell (title, filter, live regions) is built once; the notice and
 * the body are replaced only when what they show changes, and the error panel is
 * updated in place. Nothing focused is ever replaced needlessly, which is most of
 * what an accessible dashboard asks of its renderer.
 *
 * All decisions (what to show, what to announce, where focus goes) come from
 * spec/dashboard-rules.ts, the same functions the React build calls.
 */
export function mountDashboard(host: HTMLElement, locale: Locale): () => void {
  const t = getMessages(locale);
  const fmt = getFormatter(locale);
  const ctx: Ctx = { t, fmt, locale };
  const copy = t.dashboard;
  const channel = createLabChannel(window);

  let state: DashboardState = initialState(
    parseSettings(new URLSearchParams(window.location.search)),
    performance.now(),
  );
  let phase: LoadingPhase | null = null;
  let phaseStartedAt: number | null = null;
  let phaseTimer: ReturnType<typeof setTimeout> | undefined;
  let previousStatus: RequestStatus = 'idle';
  let previousPhase: LoadingPhase | null = null;
  let focusIntent: FocusIntent = null;
  let inFlight: { readonly id: number; readonly controller: AbortController } | null =
    null;
  const memory: ViewMemory = { sort: DEFAULT_SORT, chartTableOpen: false };

  /* ── Shell: built once ──────────────────────────────────────────────── */

  const titleId = uid('dash-title');
  const title = h('h2', { class: 'dash__title', id: titleId, tabindex: -1 }, copy.title);
  const select = h(
    'select',
    {
      class: 'select',
      onchange: () => {
        changePlan(select.value as PlanFilter);
      },
    },
    ...PLAN_FILTERS.map((plan) => h('option', { value: plan }, copy.plans[plan])),
  );
  const filter = h('label', { class: 'dash__filter' }, copy.filterLabel, select);
  const header = h(
    'header',
    { class: 'dash__header' },
    h(
      'div',
      {},
      h('p', { class: 'dash__company' }, copy.company),
      title,
      h('p', { class: 'dash__subtitle' }, copy.subtitle(fmt.monthLong(CURRENT_MONTH))),
    ),
    filter,
  );
  const content = h('div', { class: 'dash__content' });
  const polite = h('div', {
    class: 'sr-only',
    'aria-live': 'polite',
    'aria-atomic': 'true',
    'data-testid': 'live-polite',
  });
  const assertive = h('div', {
    class: 'sr-only',
    'aria-live': 'assertive',
    'aria-atomic': 'true',
    'data-testid': 'live-assertive',
  });
  const section = h(
    'section',
    { class: 'dash', 'aria-labelledby': titleId, 'data-implementation': 'vanilla' },
    header,
    content,
    polite,
    assertive,
  );

  /* ── Announcer: live regions written directly, debounced (spec §5) ──── */

  let announceTimer: ReturnType<typeof setTimeout> | undefined;
  function announce(message: string, politeness: Politeness): void {
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => {
      const target = politeness === 'assertive' ? assertive : polite;
      const other = politeness === 'assertive' ? polite : assertive;
      other.textContent = '';
      // Clear, then write on the next frame, so a repeated message is announced again.
      target.textContent = '';
      requestAnimationFrame(() => {
        target.textContent = message;
      });
      channel.emit({ type: 'announce', message, politeness });
    }, TIMING.announceDebounceMs);
  }

  /* ── Actions: the only places requests start ────────────────────────── */

  function dispatch(action: DashboardAction): void {
    state = dashboardReducer(state, action);
    update();
  }
  const load = (settings: LabSettings): void => {
    dispatch({ type: 'load', settings, now: performance.now() });
  };
  const replay = (): void => {
    dispatch({ type: 'replay', now: performance.now() });
  };
  const retry = (): void => {
    focusIntent = 'title';
    dispatch({ type: 'retry', now: performance.now() });
  };
  const cancel = (): void => {
    focusIntent = 'reload';
    dispatch({ type: 'cancel' });
  };
  function changePlan(plan: PlanFilter, intent: FocusIntent = null): void {
    const settings = { ...state.request.settings, plan };
    focusIntent = intent;
    window.history.replaceState(
      window.history.state,
      '',
      hrefFor(window.location.pathname, settings),
    );
    channel.emit({ type: 'settings', settings });
    load(settings);
  }

  /* ── Loading phase: timers armed only at boundaries (300ms, 3s, 8s) ─── */

  function armPhase(): void {
    if (phaseStartedAt === null) return;
    const elapsed = performance.now() - phaseStartedAt;
    phase = loadingPhase(elapsed);
    const wait = msUntilNextPhase(elapsed);
    if (wait !== null) {
      phaseTimer = setTimeout(() => {
        armPhase();
        update();
      }, wait + 1);
    }
  }

  function syncPhase(): void {
    if (state.view.status !== 'loading') {
      clearTimeout(phaseTimer);
      phase = null;
      phaseStartedAt = null;
      return;
    }
    if (phaseStartedAt === state.view.startedAt) return;
    clearTimeout(phaseTimer);
    phaseStartedAt = state.view.startedAt;
    armPhase();
  }

  /* ── Rendering by region ────────────────────────────────────────────── */

  let noticeKey: string | null = null;
  let noticeEl: HTMLElement | null = null;
  let bodyKey = '';
  let bodyEl: Element | null = null;
  let errorView: ErrorPanel | null = null;
  let reloadButton: HTMLButtonElement | null = null;
  const dataKeys = new WeakMap<DashboardData, number>();
  let dataCount = 0;
  const dataKey = (data: DashboardData): number => {
    let key = dataKeys.get(data);
    if (key === undefined) {
      dataCount += 1;
      key = dataCount;
      dataKeys.set(data, key);
    }
    return key;
  };

  function loadedContent(data: DashboardData, settings: LabSettings): HTMLElement {
    const accounts =
      data.accounts.access === 'granted'
        ? accountsTable(data.accounts.value, data.plan, ctx, memory)
        : restrictedWidget(settings.role, data.accounts.requiredRole, ctx);
    return h(
      'div',
      { class: 'dash__grid' },
      kpiGrid(data.kpis, ctx),
      widget(copy.revenue, copy.revenueMeta, revenueChart(data.revenue, ctx, memory)),
      widget(copy.accounts, copy.plans[data.plan], accounts),
    );
  }

  function keyFor(screen: Screen): string {
    switch (screen.kind) {
      case 'error':
        return 'error'; // one panel for the failure and its retries
      case 'stale':
      case 'loaded':
        return `data:${String(dataKey(screen.data))}`;
      case 'skeleton':
        return 'skeleton';
      case 'empty':
        return `empty:${screen.plan}`;
      case 'forbidden':
        return `forbidden:${screen.error.requestId}`;
      case 'cancelled':
        return 'cancelled';
      case 'idle':
        return '';
    }
  }

  function build(screen: Screen): Element | null {
    errorView = null;
    reloadButton = null;
    switch (screen.kind) {
      case 'error':
        errorView = errorPanel(screen.error, retry, ctx);
        errorView.update(screen.error, screen.retrying);
        return errorView.el;
      case 'stale':
      case 'loaded':
        return loadedContent(screen.data, state.request.settings);
      case 'skeleton':
        return skeletonContent(ctx);
      case 'empty':
        return emptyPanel(
          screen.plan,
          () => {
            changePlan('all', 'title');
          },
          ctx,
        );
      case 'forbidden':
        return forbiddenPanel(screen.error, ctx);
      case 'cancelled': {
        const panel = cancelledPanel(replay, ctx);
        reloadButton = panel.button;
        return panel.el;
      }
      case 'idle':
        return null;
    }
  }

  function renderBody(screen: Screen): void {
    const key = keyFor(screen);
    if (key === bodyKey) {
      if (screen.kind === 'error') errorView?.update(screen.error, screen.retrying);
      return;
    }
    // Like an unmount in React: view state resets once the data leaves the screen.
    if (screen.kind !== 'loaded' && screen.kind !== 'stale') {
      memory.sort = DEFAULT_SORT;
      memory.chartTableOpen = false;
    }
    const active = document.activeElement;
    const focusKey =
      bodyEl && active && bodyEl.contains(active) ? active.getAttribute(FOCUS_KEY) : null;
    const next = build(screen);
    if (bodyEl) bodyEl.replaceWith(...(next ? [next] : []));
    else if (next) content.append(next);
    bodyEl = next;
    bodyKey = key;
    // A rebuilt control that had focus gets it back (same key, new node).
    if (focusKey && next) {
      next.querySelector<HTMLElement>(`[${FOCUS_KEY}="${focusKey}"]`)?.focus();
    }
  }

  function renderNotice(notice: 'slow' | 'stalled' | null): void {
    if (notice === noticeKey) return;
    noticeEl?.remove();
    noticeEl = notice ? slowNotice(notice === 'stalled', cancel, ctx) : null;
    if (noticeEl) content.prepend(noticeEl);
    noticeKey = notice;
  }

  function render(): void {
    syncPhase();
    const { screen, notice, busy } = screenFor(state, phase);
    section.dataset.view = state.view.status;
    if (phase) section.dataset.phase = phase;
    else delete section.dataset.phase;
    content.setAttribute('aria-busy', String(busy));
    if (screen.kind === 'skeleton' && screen.reserveOnly) content.dataset.reserve = '';
    else delete content.dataset.reserve;

    if (state.view.status === 'forbidden') filter.remove();
    else if (!filter.isConnected) header.append(filter);
    select.value = state.request.settings.plan;

    renderNotice(notice);
    renderBody(screen);
  }

  /* ── Side effects, in the same order as the React build ─────────────── */

  function startRequest(active: ActiveRequest): void {
    inFlight?.controller.abort();
    const controller = new AbortController();
    const { id, settings, attempt } = active;
    inFlight = { id, controller };
    channel.emit({ type: 'request', phase: 'start', attempt });
    fetchDashboard(settings, { attempt, signal: controller.signal }).then(
      (outcome) => {
        if (inFlight?.id === id) inFlight = null;
        channel.emit({ type: 'request', phase: 'settled', attempt });
        dispatch({ type: 'settled', id, outcome });
      },
      (error: unknown) => {
        if (isAbortError(error)) {
          channel.emit({ type: 'request', phase: 'aborted', attempt });
          return;
        }
        throw error;
      },
    );
  }

  function effects(): void {
    // The request: superseded, cancelled or settled requests are aborted.
    const active = state.view.status === 'loading' ? state.request : null;
    if (active && inFlight?.id !== active.id) startRequest(active);
    else if (!active && inFlight) {
      inFlight.controller.abort();
      inFlight = null;
    }

    // Status change: telemetry, then the announcement the spec asks for.
    const status = state.view.status;
    if (status !== previousStatus) {
      channel.emit({ type: 'state', from: previousStatus, to: status });
      previousStatus = status;
      const said = statusAnnouncement(state, copy);
      if (said) announce(said.message, said.politeness);
    }

    // Phase change.
    if (phase !== previousPhase) {
      previousPhase = phase;
      if (phase !== null) {
        channel.emit({ type: 'phase', phase });
        const said = phaseAnnouncement(phase, state, copy);
        if (said) announce(said.message, said.politeness);
      }
    }

    // Focus: only when the focused control disappeared (spec §6).
    if (focusIntent && status !== 'loading') {
      const intent = focusIntent;
      focusIntent = null;
      const active = document.activeElement;
      const focusWasLost = !active || active === document.body || !active.isConnected;
      if (focusWasLost || section.contains(active)) {
        const target = focusTargetFor(intent, status);
        if (target === 'reload' && reloadButton) {
          reloadButton.focus();
          channel.emit({
            type: 'focus',
            target: copy.focus.button(copy.cancelled.action),
            reason: copy.focus.cancelRemoved,
          });
        } else if (target === 'title') {
          title.focus();
          channel.emit({
            type: 'focus',
            target: copy.focus.heading(copy.title),
            reason: copy.focus.actionRemoved,
          });
        }
      }
    }
  }

  function update(): void {
    render();
    effects();
  }

  /* ── Mount ──────────────────────────────────────────────────────────── */

  render();
  host.replaceChildren(section);
  channel.emit({ type: 'ready', implementation: 'vanilla' });
  effects();

  // The lab chrome is optional: the dashboard reads the URL and works alone.
  const offCommand = channel.onCommand((command) => {
    if (command.type === 'apply') load(command.settings);
    else replay();
  });
  const onPopState = (): void => {
    load(parseSettings(new URLSearchParams(window.location.search)));
  };
  window.addEventListener('popstate', onPopState);

  return () => {
    offCommand();
    window.removeEventListener('popstate', onPopState);
    clearTimeout(phaseTimer);
    clearTimeout(announceTimer);
    inFlight?.controller.abort();
  };
}
