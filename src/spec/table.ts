import type { Account, AccountStatus } from './types';

export type SortKey = 'name' | 'plan' | 'seats' | 'mrr' | 'status' | 'renewsOn';
export type SortDirection = 'ascending' | 'descending';

export interface SortState {
  readonly key: SortKey;
  readonly direction: SortDirection;
}

export const DEFAULT_SORT: SortState = { key: 'mrr', direction: 'descending' };

/** Columns in display order. `numeric` aligns right and sorts descending first. */
export const COLUMNS: readonly { readonly key: SortKey; readonly numeric: boolean }[] = [
  { key: 'name', numeric: false },
  { key: 'plan', numeric: false },
  { key: 'seats', numeric: true },
  { key: 'mrr', numeric: true },
  { key: 'status', numeric: false },
  { key: 'renewsOn', numeric: false },
];

const PLAN_ORDER = { starter: 0, growth: 1, enterprise: 2, legacy: 3 } as const;
const STATUS_ORDER: Record<AccountStatus, number> = {
  active: 0,
  trial: 1,
  past_due: 2,
  churned: 3,
};
const collator = new Intl.Collator('en-US', { sensitivity: 'base', numeric: true });

function compareBy(key: SortKey, a: Account, b: Account): number {
  switch (key) {
    case 'name':
      return collator.compare(a.name, b.name);
    case 'plan':
      return PLAN_ORDER[a.plan] - PLAN_ORDER[b.plan];
    case 'seats':
      return a.seats - b.seats;
    case 'mrr':
      return a.mrr - b.mrr;
    case 'status':
      return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    case 'renewsOn':
      return a.renewsOn.localeCompare(b.renewsOn);
  }
}

/** Stable sort with a deterministic tie-break (by name, then id). Returns a new array. */
export function sortAccounts(
  accounts: readonly Account[],
  sort: SortState,
): readonly Account[] {
  const factor = sort.direction === 'ascending' ? 1 : -1;
  return [...accounts].sort(
    (a, b) =>
      factor * compareBy(sort.key, a, b) ||
      collator.compare(a.name, b.name) ||
      a.id.localeCompare(b.id),
  );
}

/** Clicking the active column flips direction; a new column starts at its natural order. */
export function nextSort(current: SortState, key: SortKey): SortState {
  if (current.key === key) {
    return {
      key,
      direction: current.direction === 'ascending' ? 'descending' : 'ascending',
    };
  }
  const numeric = COLUMNS.find((column) => column.key === key)?.numeric ?? false;
  return { key, direction: numeric ? 'descending' : 'ascending' };
}
