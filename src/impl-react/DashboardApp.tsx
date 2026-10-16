import {
  useCallback,
  useEffect,
  useId,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { CURRENT_MONTH, PLAN_FILTERS } from '../spec/data';
import { dashboardReducer, initialState } from '../spec/dashboard-state';
import {
  focusTargetFor,
  phaseAnnouncement,
  screenFor,
  statusAnnouncement,
  type FocusIntent,
} from '../spec/dashboard-rules';
import type { Locale } from '../spec/i18n';
import { fetchDashboard, isAbortError } from '../spec/mock-api';
import { createLabChannel, type LabChannel } from '../spec/protocol';
import type {
  DashboardData,
  LabSettings,
  LoadingPhase,
  PlanFilter,
  RequestStatus,
} from '../spec/types';
import { hrefFor, parseSettings } from '../spec/url';
import { AccountsTable } from './components/AccountsTable';
import { KpiGrid } from './components/KpiGrid';
import { RevenueChart } from './components/RevenueChart';
import { ChartSkeleton, KpiSkeletons, TableSkeleton } from './components/Skeletons';
import {
  CancelledState,
  EmptyState,
  ErrorState,
  ForbiddenState,
  RestrictedWidget,
  SlowNotice,
} from './components/StatePanels';
import { useAnnouncer } from './hooks/useAnnouncer';
import { useLabSettingsSync } from './hooks/useLabSettingsSync';
import { useLoadingPhase } from './hooks/useLoadingPhase';
import { I18nProvider, useI18n } from './i18n';

function Widget({
  title,
  meta,
  children,
}: {
  readonly title: string;
  readonly meta?: string;
  readonly children: ReactNode;
}) {
  const id = useId();
  return (
    <section className="widget" aria-labelledby={id}>
      <div className="widget__header">
        <h3 className="widget__title" id={id}>
          {title}
        </h3>
        {meta && <span className="widget__meta">{meta}</span>}
      </div>
      <div className="widget__body">{children}</div>
    </section>
  );
}

function LoadedContent({
  data,
  settings,
}: {
  readonly data: DashboardData;
  readonly settings: LabSettings;
}) {
  const { t } = useI18n();
  return (
    <div className="dash__grid">
      <KpiGrid kpis={data.kpis} />
      <Widget title={t.dashboard.revenue} meta={t.dashboard.revenueMeta}>
        <RevenueChart points={data.revenue} />
      </Widget>
      <Widget title={t.dashboard.accounts} meta={t.dashboard.plans[data.plan]}>
        {data.accounts.access === 'granted' ? (
          <AccountsTable accounts={data.accounts.value} plan={data.plan} />
        ) : (
          <RestrictedWidget
            role={settings.role}
            requiredRole={data.accounts.requiredRole}
          />
        )}
      </Widget>
    </div>
  );
}

function SkeletonContent() {
  const { t } = useI18n();
  return (
    <div className="dash__grid" aria-hidden="true">
      <KpiSkeletons />
      <Widget title={t.dashboard.revenue} meta={t.dashboard.revenueMeta}>
        <ChartSkeleton />
      </Widget>
      <Widget title={t.dashboard.accounts}>
        <TableSkeleton />
      </Widget>
    </div>
  );
}

/**
 * React implementation root. The locale comes from the page (one URL per
 * locale), so it is a prop, not state.
 */
export default function DashboardApp({ locale }: { readonly locale: Locale }) {
  return (
    <I18nProvider locale={locale}>
      <Dashboard />
    </I18nProvider>
  );
}

/**
 * Owns the request lifecycle; renders one of the states defined in the spec;
 * reports what it does over the lab channel.
 */
function Dashboard() {
  const { t, fmt } = useI18n();
  const copy = t.dashboard;
  const [channel] = useState<LabChannel>(() => createLabChannel(window));
  const [state, dispatch] = useReducer(dashboardReducer, undefined, () =>
    initialState(
      parseSettings(new URLSearchParams(window.location.search)),
      performance.now(),
    ),
  );
  const { request, view } = state;
  const isLoading = view.status === 'loading';
  const phase = useLoadingPhase(isLoading ? view.startedAt : null);
  const { politeRef, assertiveRef, announce } = useAnnouncer(channel);

  const titleId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const retryRef = useRef<HTMLButtonElement>(null);
  const reloadRef = useRef<HTMLButtonElement>(null);
  const focusIntent = useRef<FocusIntent>(null);

  /* ── Actions (event handlers; the only place requests start) ─────────── */

  const load = useCallback((settings: LabSettings) => {
    dispatch({ type: 'load', settings, now: performance.now() });
  }, []);
  const replay = useCallback(() => {
    dispatch({ type: 'replay', now: performance.now() });
  }, []);
  const retry = useCallback(() => {
    focusIntent.current = 'title';
    dispatch({ type: 'retry', now: performance.now() });
  }, []);
  const cancel = useCallback(() => {
    focusIntent.current = 'reload';
    dispatch({ type: 'cancel' });
  }, []);

  const changePlan = useCallback(
    (plan: PlanFilter, intent: FocusIntent = null) => {
      const settings = { ...request.settings, plan };
      focusIntent.current = intent;
      window.history.replaceState(
        window.history.state,
        '',
        hrefFor(window.location.pathname, settings),
      );
      channel.emit({ type: 'settings', settings });
      load(settings);
    },
    [channel, load, request.settings],
  );

  useLabSettingsSync(channel, { onApply: load, onReplay: replay });

  useEffect(() => {
    channel.emit({ type: 'ready', implementation: 'react' });
  }, [channel]);

  /* ── The request itself ──────────────────────────────────────────────── */

  const activeRequest = isLoading ? request : null;
  useEffect(() => {
    if (!activeRequest) return undefined;
    const controller = new AbortController();
    const { id, settings, attempt } = activeRequest;
    channel.emit({ type: 'request', phase: 'start', attempt });

    fetchDashboard(settings, { attempt, signal: controller.signal }).then(
      (outcome) => {
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
    // Superseded, cancelled or unmounted: abort. A late response can never render.
    return () => {
      controller.abort();
    };
  }, [activeRequest, channel]);

  /* ── Telemetry + announcements for status changes ────────────────────── */

  const previousStatus = useRef<RequestStatus>('idle');
  useEffect(() => {
    const from = previousStatus.current;
    if (from === state.view.status) return;
    previousStatus.current = state.view.status;
    channel.emit({ type: 'state', from, to: state.view.status });
    const said = statusAnnouncement(state, copy);
    if (said) announce(said.message, said.politeness);
  }, [state, channel, announce, copy]);

  const previousPhase = useRef<LoadingPhase | null>(null);
  useEffect(() => {
    if (phase === previousPhase.current) return;
    previousPhase.current = phase;
    if (phase === null) return;
    channel.emit({ type: 'phase', phase });
    const said = phaseAnnouncement(phase, state, copy);
    if (said) announce(said.message, said.politeness);
  }, [phase, state, channel, announce, copy]);

  /* ── Focus management: only when the focused control disappeared ─────── */

  useEffect(() => {
    const intent = focusIntent.current;
    if (!intent || view.status === 'loading') return;
    focusIntent.current = null;

    const active = document.activeElement;
    const focusWasLost = !active || active === document.body || !active.isConnected;
    const focusInDashboard = sectionRef.current?.contains(active) ?? false;
    if (!focusWasLost && !focusInDashboard) return; // the user moved on; don't steal focus

    const target = focusTargetFor(intent, view.status);
    if (target === 'reload' && reloadRef.current) {
      reloadRef.current.focus();
      channel.emit({
        type: 'focus',
        target: copy.focus.button(copy.cancelled.action),
        reason: copy.focus.cancelRemoved,
      });
    } else if (target === 'title' && titleRef.current) {
      titleRef.current.focus();
      channel.emit({
        type: 'focus',
        target: copy.focus.heading(copy.title),
        reason: copy.focus.actionRemoved,
      });
    }
  }, [view.status, channel, copy]);

  /* ── Render ──────────────────────────────────────────────────────────── */

  const { screen, notice, busy } = screenFor(state, phase);
  let body: ReactNode = null;
  switch (screen.kind) {
    case 'error':
      body = (
        <ErrorState
          error={screen.error}
          retrying={screen.retrying}
          onRetry={retry}
          retryRef={retryRef}
        />
      );
      break;
    case 'stale':
    case 'loaded':
      body = <LoadedContent data={screen.data} settings={request.settings} />;
      break;
    case 'skeleton':
      body = <SkeletonContent />;
      break;
    case 'empty':
      body = (
        <EmptyState
          plan={screen.plan}
          onReset={() => {
            changePlan('all', 'title');
          }}
        />
      );
      break;
    case 'forbidden':
      body = <ForbiddenState error={screen.error} />;
      break;
    case 'cancelled':
      body = <CancelledState onReload={replay} reloadRef={reloadRef} />;
      break;
    case 'idle':
      break;
  }
  const reserveOnly = screen.kind === 'skeleton' && screen.reserveOnly;

  return (
    <section
      ref={sectionRef}
      className="dash"
      aria-labelledby={titleId}
      data-implementation="react"
      data-view={view.status}
      data-phase={phase ?? undefined}
    >
      <header className="dash__header">
        <div>
          <p className="dash__company">{copy.company}</p>
          <h2 className="dash__title" id={titleId} ref={titleRef} tabIndex={-1}>
            {copy.title}
          </h2>
          <p className="dash__subtitle">{copy.subtitle(fmt.monthLong(CURRENT_MONTH))}</p>
        </div>
        {view.status !== 'forbidden' && (
          <label className="dash__filter">
            {copy.filterLabel}
            <select
              className="select"
              value={request.settings.plan}
              onChange={(event) => {
                changePlan(event.currentTarget.value as PlanFilter);
              }}
            >
              {PLAN_FILTERS.map((plan) => (
                <option key={plan} value={plan}>
                  {copy.plans[plan]}
                </option>
              ))}
            </select>
          </label>
        )}
      </header>

      <div
        className="dash__content"
        aria-busy={busy}
        data-reserve={reserveOnly || undefined}
      >
        {notice && <SlowNotice stalled={notice === 'stalled'} onCancel={cancel} />}
        {body}
      </div>

      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
        ref={politeRef}
        data-testid="live-polite"
      />
      <div
        className="sr-only"
        aria-live="assertive"
        aria-atomic="true"
        ref={assertiveRef}
        data-testid="live-assertive"
      />
    </section>
  );
}
