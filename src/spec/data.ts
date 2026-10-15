import type {
  Account,
  AccountStatus,
  DashboardData,
  Kpi,
  Plan,
  PlanFilter,
  RevenuePoint,
  Role,
} from './types';

/**
 * Deterministic mock dataset for a fictional B2B SaaS company.
 *
 * Generated from a fixed seed so every visitor, test run and screenshot sees the
 * same numbers. Months are fixed too (no `Date.now()`), so the demo never drifts.
 */

export const MONTHS = [
  '2025-11',
  '2025-12',
  '2026-01',
  '2026-02',
  '2026-03',
  '2026-04',
  '2026-05',
  '2026-06',
  '2026-07',
  '2026-08',
  '2026-09',
  '2026-10',
] as const;

const LAST = MONTHS.length - 1;

export const PLANS: readonly Plan[] = ['starter', 'growth', 'enterprise', 'legacy'];

/** Plans that can be chosen in the dashboard filter, in display order. */
export const PLAN_FILTERS: readonly PlanFilter[] = ['all', ...PLANS];

/** mulberry32: tiny, fast, good enough for mock data, and fully reproducible. */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

const PREFIXES = [
  'Northwind',
  'Bluefin',
  'Kestrel',
  'Lumen',
  'Orbital',
  'Pinecrest',
  'Quarry',
  'Redwood',
  'Saltmarsh',
  'Tidewater',
  'Umbra',
  'Vantage',
  'Willow',
  'Zephyr',
  'Arcadia',
  'Basalt',
] as const;
const SUFFIXES = [
  'Labs',
  'Logistics',
  'Health',
  'Studio',
  'Systems',
  'Foods',
  'Energy',
  'Capital',
] as const;

const PLAN_PRICING: Record<
  Exclude<Plan, 'legacy'>,
  { seatPrice: number; seats: [number, number] }
> = {
  starter: { seatPrice: 12, seats: [3, 20] },
  growth: { seatPrice: 29, seats: [15, 80] },
  enterprise: { seatPrice: 54, seats: [60, 400] },
};

interface AccountRecord extends Account {
  /** Month index the account started paying. */
  readonly startMonth: number;
  /** Month index the account churned, or null if still a customer. */
  readonly churnMonth: number | null;
}

function pick<T>(items: readonly T[], random: () => number): T {
  const item = items[Math.floor(random() * items.length)];
  if (item === undefined) throw new Error('pick() called with an empty list');
  return item;
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function generateAccounts(count: number, seed: number): readonly AccountRecord[] {
  const random = createRandom(seed);
  const usedNames = new Set<string>();
  const accounts: AccountRecord[] = [];

  for (let index = 0; accounts.length < count; index += 1) {
    const name = `${pick(PREFIXES, random)} ${pick(SUFFIXES, random)}`;
    if (usedNames.has(name)) continue;
    usedNames.add(name);

    const roll = random();
    const plan: Exclude<Plan, 'legacy'> =
      roll < 0.45 ? 'starter' : roll < 0.82 ? 'growth' : 'enterprise';
    const pricing = PLAN_PRICING[plan];
    const [minSeats, maxSeats] = pricing.seats;
    const seats = Math.round(minSeats + random() * (maxSeats - minSeats));
    // Just over half the base predates the 12-month window; the rest arrives steadily.
    const startMonth = random() < 0.55 ? 0 : 1 + Math.floor(random() * (LAST - 1));
    const churns = random() < 0.14;
    const churnMonth = churns
      ? Math.min(LAST, startMonth + 1 + Math.floor(random() * (LAST - startMonth)))
      : null;

    let status: AccountStatus = 'active';
    if (churnMonth !== null) status = 'churned';
    else if (startMonth >= LAST - 1) status = 'trial';
    else if (random() < 0.09) status = 'past_due';

    accounts.push({
      id: `acc_${String(index + 1).padStart(3, '0')}`,
      name,
      plan,
      seats,
      mrr: seats * pricing.seatPrice,
      status,
      renewsOn: addDays('2026-10-01', 7 + Math.floor(random() * 330)),
      startMonth,
      churnMonth,
    });
  }
  return accounts;
}

/** The full dataset. Frozen at module load; generation is pure and cheap. */
const RECORDS = generateAccounts(56, 20_261_015);

function isLiveIn(account: AccountRecord, month: number): boolean {
  return (
    account.startMonth <= month &&
    (account.churnMonth === null || account.churnMonth > month)
  );
}

/** Trials are live customers that do not pay yet. */
function payingIn(account: AccountRecord, month: number): boolean {
  return isLiveIn(account, month) && account.status !== 'trial';
}

function mrrIn(records: readonly AccountRecord[], month: number): number {
  return records.reduce(
    (sum, account) => (payingIn(account, month) ? sum + account.mrr : sum),
    0,
  );
}

function activeIn(records: readonly AccountRecord[], month: number): number {
  return records.filter((account) => isLiveIn(account, month)).length;
}

/** Churned during `month` ÷ live at the start of `month`, as a percentage. */
function churnRateIn(records: readonly AccountRecord[], month: number): number | null {
  if (month === 0) return null;
  const liveAtStart = activeIn(records, month - 1);
  if (liveAtStart === 0) return null;
  const churned = records.filter((account) => account.churnMonth === month).length;
  return (churned / liveAtStart) * 100;
}

function arpaIn(records: readonly AccountRecord[], month: number): number | null {
  const paying = records.filter((account) => payingIn(account, month)).length;
  return paying === 0 ? null : mrrIn(records, month) / paying;
}

function buildKpis(records: readonly AccountRecord[]): readonly Kpi[] {
  const prev = LAST - 1;
  return [
    {
      id: 'mrr',
      label: 'Monthly recurring revenue',
      value: mrrIn(records, LAST),
      previous: mrrIn(records, prev),
      format: 'currency',
      better: 'up',
    },
    {
      id: 'activeAccounts',
      label: 'Active accounts',
      value: activeIn(records, LAST),
      previous: activeIn(records, prev),
      format: 'count',
      better: 'up',
    },
    {
      id: 'arpa',
      label: 'Avg. revenue per account',
      value: arpaIn(records, LAST) ?? 0,
      previous: arpaIn(records, prev),
      format: 'currency',
      better: 'up',
    },
    {
      id: 'churnRate',
      label: 'Monthly churn',
      value: churnRateIn(records, LAST) ?? 0,
      previous: churnRateIn(records, prev),
      format: 'percent',
      better: 'down',
    },
  ];
}

const toAccount = ({
  startMonth: _start,
  churnMonth: _churn,
  ...account
}: AccountRecord): Account => account;

/** Minimum role allowed to see account-level revenue. */
export const ACCOUNTS_REQUIRED_ROLE: Role = 'analyst';

/**
 * Build the dashboard payload exactly as a server would. Emptiness is a property
 * of the data (no accounts match the filter), never a flag set by the scenario.
 */
export function buildDashboard(
  plan: PlanFilter,
  role: Exclude<Role, 'none'>,
): DashboardData {
  const records =
    plan === 'all' ? RECORDS : RECORDS.filter((account) => account.plan === plan);
  const hasData = records.length > 0;

  return {
    plan,
    kpis: hasData ? buildKpis(records) : [],
    revenue: hasData
      ? MONTHS.map((month, index): RevenuePoint => ({
          month,
          mrr: mrrIn(records, index),
        }))
      : [],
    accounts:
      role === 'analyst'
        ? { access: 'granted', value: records.map(toAccount) }
        : { access: 'denied', requiredRole: ACCOUNTS_REQUIRED_ROLE },
  };
}

/** A dashboard is empty when the filter matched nothing, regardless of permissions. */
export function isEmptyDashboard(data: DashboardData): boolean {
  return data.kpis.length === 0 && data.revenue.length === 0;
}
