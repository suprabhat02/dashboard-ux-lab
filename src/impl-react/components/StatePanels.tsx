import type { Ref } from 'react';
import type { DashboardError, PlanFilter, Role } from '../../spec/types';
import { useI18n } from '../i18n';
import { Icon } from './Icons';

/*
 * Each state is a distinct component with distinct copy and actions. They are
 * intentionally not one generic <StatePanel kind=…>: an empty result, a failure
 * and a permission problem ask different things of the user.
 */

/** Request IDs are machine strings: always left-to-right, even in Arabic. */
function Code({ children }: { readonly children: string }) {
  return <code dir="ltr">{children}</code>;
}

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
  const { t } = useI18n();
  return (
    <div className="state state--error" data-state="error">
      <span className="state__icon">
        <Icon name="error" size={28} />
      </span>
      <h3 className="state__title">{t.dashboard.error.title}</h3>
      <p className="state__body">{t.dashboard.error.body}</p>
      <p className="state__meta">
        {t.dashboard.error.requestIdLabel} <Code>{error.requestId}</Code>
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
          <Icon name="retry" size={16} />
          {retrying ? t.dashboard.error.retrying : t.dashboard.error.retry}
        </button>
      </div>
    </div>
  );
}

export function ForbiddenState({ error }: { readonly error: DashboardError }) {
  const { t } = useI18n();
  return (
    <div className="state state--forbidden" data-state="forbidden">
      <span className="state__icon">
        <Icon name="forbidden" size={28} />
      </span>
      <h3 className="state__title">{t.dashboard.forbidden.title}</h3>
      <p className="state__body">{t.dashboard.forbidden.body}</p>
      <p className="state__meta">
        {t.dashboard.forbidden.requestIdLabel} <Code>{error.requestId}</Code>
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
  const { t } = useI18n();
  return (
    <div className="state state--empty" data-state="empty">
      <span className="state__icon">
        <Icon name="empty" size={28} />
      </span>
      <h3 className="state__title">{t.dashboard.empty.title(t.dashboard.plans[plan])}</h3>
      <p className="state__body">{t.dashboard.empty.body}</p>
      <div className="state__actions">
        <button type="button" className="btn btn--primary" onClick={onReset}>
          {t.dashboard.empty.action}
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
  const { t } = useI18n();
  return (
    <div className="state state--cancelled" data-state="cancelled">
      <span className="state__icon">
        <Icon name="cancel" size={28} />
      </span>
      <h3 className="state__title">{t.dashboard.cancelled.title}</h3>
      <p className="state__body">{t.dashboard.cancelled.body}</p>
      <div className="state__actions">
        <button
          ref={reloadRef}
          type="button"
          className="btn btn--primary"
          onClick={onReload}
        >
          <Icon name="retry" size={16} />
          {t.dashboard.cancelled.action}
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
  const { t } = useI18n();
  const roles = t.dashboard.roles;
  return (
    <div className="restricted" data-state="widget-restricted">
      <p className="restricted__title">
        <Icon name="restricted" size={18} />
        {t.dashboard.widgetRestricted.title}
      </p>
      <p className="restricted__body">
        {t.dashboard.widgetRestricted.body(roles[role], roles[requiredRole])}
      </p>
      <p className="restricted__role">
        {t.dashboard.widgetRestricted.currentRole(roles[role])}
      </p>
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
  const { t } = useI18n();
  const copy = t.dashboard.loading;
  return (
    <div className="notice" data-state={stalled ? 'stalled' : 'slow'}>
      <Icon name="slow" className="notice__icon" />
      <div className="notice__text">
        <p className="notice__title">{stalled ? copy.stalledTitle : copy.slowTitle}</p>
        <p className="notice__body">{stalled ? copy.stalledBody : copy.slowBody}</p>
      </div>
      {stalled && (
        <button type="button" className="btn btn--sm" onClick={onCancel}>
          <Icon name="cancel" size={14} />
          {copy.cancel}
        </button>
      )}
    </div>
  );
}
