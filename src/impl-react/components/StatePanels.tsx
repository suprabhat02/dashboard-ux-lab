import type { Ref } from 'react';
import { COPY, roleLabel } from '../../spec/copy';
import type { DashboardError, PlanFilter, Role } from '../../spec/types';
import {
  AlertIcon,
  ClockIcon,
  LockIcon,
  RefreshIcon,
  SearchIcon,
  StopIcon,
} from './Icons';

/*
 * Each state is a distinct component with distinct copy and actions. They are
 * intentionally not one generic <StatePanel kind=…>: an empty result, a failure
 * and a permission problem ask different things of the user.
 */

export function ErrorState({
  error,
  retrying,
  onRetry,
  retryRef,
}: {
  readonly error: DashboardError;
  readonly retrying: boolean;
  readonly onRetry: () => void;
  readonly retryRef: Ref<HTMLButtonElement>;
}) {
  return (
    <div className="state state--error" data-state="error">
      <span className="state__icon">
        <AlertIcon />
      </span>
      <h3 className="state__title">{COPY.error.title}</h3>
      <p className="state__body">{COPY.error.body}</p>
      <p className="state__meta">
        {COPY.error.requestIdLabel} <code>{error.requestId}</code>
      </p>
      <div className="state__actions">
        {/* aria-disabled (not disabled) keeps focus on the button while the retry runs. */}
        <button
          ref={retryRef}
          type="button"
          className="btn btn--primary"
          aria-disabled={retrying || undefined}
          onClick={() => {
            if (!retrying) onRetry();
          }}
        >
          <RefreshIcon size={16} />
          {retrying ? COPY.error.retrying : COPY.error.retry}
        </button>
      </div>
    </div>
  );
}

export function ForbiddenState({ error }: { readonly error: DashboardError }) {
  return (
    <div className="state state--forbidden" data-state="forbidden">
      <span className="state__icon">
        <LockIcon />
      </span>
      <h3 className="state__title">{COPY.forbidden.title}</h3>
      <p className="state__body">{COPY.forbidden.body}</p>
      <p className="state__meta">
        {COPY.forbidden.requestIdLabel} <code>{error.requestId}</code>
      </p>
    </div>
  );
}

export function EmptyState({
  plan,
  onReset,
}: {
  readonly plan: PlanFilter;
  readonly onReset: () => void;
}) {
  return (
    <div className="state state--empty" data-state="empty">
      <span className="state__icon">
        <SearchIcon />
      </span>
      <h3 className="state__title">{COPY.empty.title(plan)}</h3>
      <p className="state__body">{COPY.empty.body}</p>
      <div className="state__actions">
        <button type="button" className="btn btn--primary" onClick={onReset}>
          {COPY.empty.action}
        </button>
      </div>
    </div>
  );
}

export function CancelledState({
  onReload,
  reloadRef,
}: {
  readonly onReload: () => void;
  readonly reloadRef: Ref<HTMLButtonElement>;
}) {
  return (
    <div className="state state--cancelled" data-state="cancelled">
      <span className="state__icon">
        <StopIcon />
      </span>
      <h3 className="state__title">{COPY.cancelled.title}</h3>
      <p className="state__body">{COPY.cancelled.body}</p>
      <div className="state__actions">
        <button
          ref={reloadRef}
          type="button"
          className="btn btn--primary"
          onClick={onReload}
        >
          <RefreshIcon size={16} />
          {COPY.cancelled.action}
        </button>
      </div>
    </div>
  );
}

export function RestrictedWidget({
  role,
  requiredRole,
}: {
  readonly role: Role;
  readonly requiredRole: Role;
}) {
  return (
    <div className="restricted" data-state="widget-restricted">
      <p className="restricted__title">
        <LockIcon size={18} />
        {COPY.widgetRestricted.title}
      </p>
      <p className="restricted__body">{COPY.widgetRestricted.body(role, requiredRole)}</p>
      <p className="pill pill--muted">Current role: {roleLabel(role)}</p>
    </div>
  );
}

export function SlowNotice({
  stalled,
  onCancel,
}: {
  readonly stalled: boolean;
  readonly onCancel: () => void;
}) {
  return (
    <div className="notice" data-state={stalled ? 'stalled' : 'slow'}>
      <ClockIcon className="notice__icon" />
      <div className="notice__text">
        <p className="notice__title">
          {stalled ? COPY.loading.stalledTitle : COPY.loading.slowTitle}
        </p>
        <p className="notice__body">
          {stalled ? COPY.loading.stalledBody : COPY.loading.slowBody}
        </p>
      </div>
      {stalled && (
        <button type="button" className="btn btn--sm" onClick={onCancel}>
          <StopIcon size={14} />
          {COPY.loading.cancel}
        </button>
      )}
    </div>
  );
}
