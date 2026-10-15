import {
  useCallback,
  useEffect,
  useId,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { COPY } from '../spec/copy';
import { isEmptyDashboard, PLAN_FILTERS } from '../spec/data';
import { PLAN_LABEL } from '../spec/format';
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
import { dashboardReducer, initialState } from './state';

type FocusIntent = 'title' | 'reload' | null;

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
  return (
    <div className="dash__grid">
      <KpiGrid kpis={data.kpis} />
      <Widget title={COPY.widgets.revenue} meta="Last 12 months">
        <RevenueChart points={data.revenue} />
      </Widget>
      <Widget title={COPY.widgets.accounts} meta={PLAN_LABEL[data.plan]}>
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
  return (
    <div className="dash__grid" aria-hidden="true">
      <KpiSkeletons />
      <Widget title={COPY.widgets.revenue} meta="Last 12 months">
        <ChartSkeleton />
      </Widget>
      <Widget title={COPY.widgets.accounts}>
        <TableSkeleton />
      </Widget>
    </div>
  );
}

/**
 * React implementation root. Owns the request lifecycle; renders one of the
 * states defined in the spec; reports what it does over the lab channel.
 */
export default function DashboardApp() {
  const [channel] = useState<LabChannel>(() => createLabChannel(window));
  const [state, dispatch] = useReducer(dashboardReducer, undefined, () =>
    initialState(
      parseSettings(new URLSearchParams(window.location.search)),
      performance.now(),
    ),
  );
  const { request, view, retryingFrom, lastData } = state;
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
    if (from === view.status) return;
    previousStatus.current = view.status;
    channel.emit({ type: 'state', from, to: view.status });

    const { userInitiated, settings } = request;
    switch (view.status) {
      case 'success':
        if (isEmptyDashboard(view.data)) announce(COPY.empty.announce(settings.plan));
        else if (userInitiated) announce(COPY.loaded.announce(settings.plan));
        break;
      case 'error':
        announce(COPY.error.announce, view.attempt > 1 ? 'assertive' : 'polite');
        break;
      case 'forbidden':
        if (userInitiated) announce(COPY.forbidden.announce);
        break;
      case 'cancelled':
        announce(COPY.cancelled.announce);
        break;
      case 'loading':
      case 'idle':
        break;
    }
  }, [view, request, channel, announce]);

  const previousPhase = useRef<LoadingPhase | null>(null);
  useEffect(() => {
    if (phase === previousPhase.current) return;
    previousPhase.current = phase;
    if (phase === null) return;
    channel.emit({ type: 'phase', phase });
    if (!request.userInitiated && phase === 'skeleton') return;
    switch (phase) {
      case 'skeleton':
        if (!retryingFrom) announce(COPY.loading.announce);
        break;
      case 'slow':
        announce(COPY.loading.slowTitle);
        break;
      case 'stalled':
        announce(`${COPY.loading.stalledTitle} ${COPY.loading.stalledBody}`);
        break;
      case 'pending':
        break;
    }
  }, [phase, request.userInitiated, retryingFrom, channel, announce]);

  /* ── Focus management: only when the focused control disappeared ─────── */

  useEffect(() => {
    const intent = focusIntent.current;
    if (!intent || view.status === 'loading') return;
    focusIntent.current = null;

    const active = document.activeElement;
    const focusWasLost = !active || active === document.body || !active.isConnected;
    const focusInDashboard = sectionRef.current?.contains(active) ?? false;
    if (!focusWasLost && !focusInDashboard) return; // the user moved on; don't steal focus

    if (intent === 'reload' && view.status === 'cancelled' && reloadRef.current) {
      reloadRef.current.focus();
      channel.emit({
        type: 'focus',
        target: `button “${COPY.cancelled.action}”`,
        reason: 'Cancel button was removed',
      });
    } else if (intent === 'title' && view.status !== 'error' && titleRef.current) {
      titleRef.current.focus();
      channel.emit({
        type: 'focus',
        target: `heading “${COPY.dashboardTitle}”`,
        reason: 'Action button was removed',
      });
    }
  }, [view.status, channel]);

  /* ── Render ──────────────────────────────────────────────────────────── */

  let body: ReactNode;
  let reserveOnly = false;
  if (isLoading && retryingFrom) {
    body = (
      <ErrorState error={retryingFrom} retrying onRetry={retry} retryRef={retryRef} />
    );
  } else if (isLoading) {
    if (phase === 'pending' && lastData)
      body = <LoadedContent data={lastData} settings={request.settings} />;
    else {
      reserveOnly = phase === 'pending';
      body = <SkeletonContent />;
    }
  } else {
    switch (view.status) {
      case 'success':
        body = isEmptyDashboard(view.data) ? (
          <EmptyState
            plan={view.data.plan}
            onReset={() => {
              changePlan('all', 'title');
            }}
          />
        ) : (
          <LoadedContent data={view.data} settings={request.settings} />
        );
        break;
      case 'error':
        body = (
          <ErrorState
            error={view.error}
            retrying={false}
            onRetry={retry}
            retryRef={retryRef}
          />
        );
        break;
      case 'forbidden':
        body = <ForbiddenState error={view.error} />;
        break;
      case 'cancelled':
        body = <CancelledState onReload={replay} reloadRef={reloadRef} />;
        break;
      case 'idle':
        body = null;
        break;
    }
  }

  const showNotice =
    isLoading && !retryingFrom && (phase === 'slow' || phase === 'stalled');

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
          <p className="dash__company">{COPY.company}</p>
          <h2 className="dash__title" id={titleId} ref={titleRef} tabIndex={-1}>
            {COPY.dashboardTitle}
          </h2>
          <p className="dash__subtitle">{COPY.dashboardSubtitle}</p>
        </div>
        {view.status !== 'forbidden' && (
          <label className="dash__filter">
            {COPY.filter.label}
            <select
              className="select"
              value={request.settings.plan}
              onChange={(event) => {
                changePlan(event.currentTarget.value as PlanFilter);
              }}
            >
              {PLAN_FILTERS.map((plan) => (
                <option key={plan} value={plan}>
                  {PLAN_LABEL[plan]}
                </option>
              ))}
            </select>
          </label>
        )}
      </header>

      <div
        className="dash__content"
        aria-busy={isLoading}
        data-reserve={reserveOnly || undefined}
      >
        {showNotice && <SlowNotice stalled={phase === 'stalled'} onCancel={cancel} />}
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
