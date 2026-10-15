/**
 * The shared contract. Both implementations consume these types; neither owns them.
 *
 * Rule for everything in src/spec/: data and pure functions only. No DOM rendering,
 * no framework imports, no module-level side effects. ESLint enforces the imports;
 * code review enforces the rest.
 */

/* ── Lab settings (what a visitor can change) ─────────────────────────────── */

/** Who is looking at the dashboard. Drives page-level and widget-level access. */
export type Role = 'none' | 'viewer' | 'analyst';

/** How the mock backend fails. `once` fails the first attempt and recovers on retry. */
export type FailureMode = 'never' | 'once' | 'always';

/** Subscription plans present in the dataset. */
export type Plan = 'starter' | 'growth' | 'enterprise' | 'legacy';

/** The dashboard's own filter. `legacy` has no accounts, which is how "empty" is produced. */
export type PlanFilter = 'all' | Plan;

export interface LabSettings {
  /** Simulated server latency in milliseconds. */
  readonly latencyMs: number;
  readonly failure: FailureMode;
  readonly role: Role;
  readonly plan: PlanFilter;
}

export type ScenarioId = 'loaded' | 'loading' | 'slow' | 'empty' | 'error' | 'restricted';

export type ImplementationId = 'react' | 'vanilla';

/* ── Domain data ──────────────────────────────────────────────────────────── */

export type AccountStatus = 'active' | 'trial' | 'past_due' | 'churned';

export interface Account {
  readonly id: string;
  readonly name: string;
  readonly plan: Plan;
  readonly seats: number;
  /** Monthly recurring revenue in whole US dollars. */
  readonly mrr: number;
  readonly status: AccountStatus;
  /** ISO date (YYYY-MM-DD) of the next renewal. */
  readonly renewsOn: string;
}

export type KpiId = 'mrr' | 'activeAccounts' | 'arpa' | 'churnRate';
export type ValueFormat = 'currency' | 'count' | 'percent';

export interface Kpi {
  readonly id: KpiId;
  readonly value: number;
  /** Same metric one month earlier, for the delta. `null` when there is no prior value. */
  readonly previous: number | null;
  readonly format: ValueFormat;
  /** Which direction counts as an improvement (churn: down is good). */
  readonly better: 'up' | 'down';
}

export interface RevenuePoint {
  /** ISO month, YYYY-MM. */
  readonly month: string;
  readonly mrr: number;
}

/**
 * Widget-level permission. A widget can be denied while the rest of the dashboard
 * loads, which is how real products behave and why "restricted" is not only a
 * page-level state.
 */
export type Gated<T> =
  | { readonly access: 'granted'; readonly value: T }
  | { readonly access: 'denied'; readonly requiredRole: Role };

export interface DashboardData {
  readonly plan: PlanFilter;
  readonly kpis: readonly Kpi[];
  readonly revenue: readonly RevenuePoint[];
  readonly accounts: Gated<readonly Account[]>;
}

/* ── Transport ────────────────────────────────────────────────────────────── */

export interface DashboardError {
  readonly kind: 'server' | 'forbidden';
  /** Shown to the user so a support conversation has something concrete to reference. */
  readonly requestId: string;
  readonly status: 403 | 503;
}

/** Errors are values. Only cancellation rejects (with a standard AbortError). */
export type FetchOutcome =
  | { readonly ok: true; readonly data: DashboardData }
  | { readonly ok: false; readonly error: DashboardError };

/* ── Request lifecycle (each implementation manages its own transitions) ──── */

export type RequestState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading'; readonly attempt: number; readonly startedAt: number }
  | { readonly status: 'success'; readonly data: DashboardData; readonly attempt: number }
  | { readonly status: 'error'; readonly error: DashboardError; readonly attempt: number }
  | { readonly status: 'forbidden'; readonly error: DashboardError }
  | { readonly status: 'cancelled'; readonly attempt: number };

export type RequestStatus = RequestState['status'];

/**
 * How long a request has been pending, as the UI should present it.
 * `slow` is deliberately not a RequestStatus: it is the same request, observed later.
 */
export type LoadingPhase = 'pending' | 'skeleton' | 'slow' | 'stalled';
