import { useId, useMemo, useState } from 'react';
import {
  COLUMNS,
  DEFAULT_SORT,
  nextSort,
  sortAccounts,
  type SortKey,
  type SortState,
} from '../../spec/table';
import type { Account, PlanFilter } from '../../spec/types';
import { useI18n } from '../i18n';
import { SortIcon } from './Icons';

/**
 * Sortable table following the APG "Sortable Table" example: native table
 * semantics, a <button> in each header, and aria-sort only on the sorted column.
 */
export function AccountsTable({
  accounts,
  plan,
}: {
  readonly accounts: readonly Account[];
  readonly plan: PlanFilter;
}) {
  const { t, fmt, locale } = useI18n();
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);
  const rows = useMemo(
    () => sortAccounts(accounts, sort, locale),
    [accounts, sort, locale],
  );
  const captionId = useId();

  const cell = (account: Account, key: SortKey) => {
    switch (key) {
      case 'name':
        // Company names are Latin-script proper nouns; isolate them inside RTL text.
        return <bdi>{account.name}</bdi>;
      case 'plan':
        return <span className="plan-tag">{t.dashboard.plans[account.plan]}</span>;
      case 'seats':
        return fmt.value(account.seats, 'count');
      case 'mrr':
        return fmt.value(account.mrr, 'currency');
      case 'status':
        return (
          <span className="status" data-status={account.status}>
            {t.dashboard.statuses[account.status]}
          </span>
        );
      case 'renewsOn':
        return fmt.date(account.renewsOn);
    }
  };

  return (
    <div
      className="table-scroll table-scroll--fixed"
      role="region"
      aria-labelledby={captionId}
      tabIndex={0}
    >
      <table className="table">
        <caption id={captionId}>
          {t.dashboard.accountsCaption(accounts.length, t.dashboard.plans[plan])}
        </caption>
        <thead>
          <tr>
            {COLUMNS.map((column) => (
              <th
                key={column.key}
                scope="col"
                aria-sort={sort.key === column.key ? sort.direction : undefined}
                data-numeric={column.numeric || undefined}
              >
                <button
                  type="button"
                  className="sort-btn"
                  onClick={() => {
                    setSort((current) => nextSort(current, column.key));
                  }}
                >
                  {t.dashboard.columns[column.key]}
                  <SortIcon className="sort-btn__icon" />
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((account) => (
            <tr key={account.id}>
              {COLUMNS.map((column) =>
                column.key === 'name' ? (
                  <th key={column.key} scope="row">
                    {cell(account, column.key)}
                  </th>
                ) : (
                  <td key={column.key} data-numeric={column.numeric || undefined}>
                    {cell(account, column.key)}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
