import { useId, useMemo, useState } from 'react';
import { COPY } from '../../spec/copy';
import { formatDate, formatValue, PLAN_LABEL, STATUS_LABEL } from '../../spec/format';
import {
  COLUMNS,
  DEFAULT_SORT,
  nextSort,
  sortAccounts,
  type SortKey,
  type SortState,
} from '../../spec/table';
import type { Account, PlanFilter } from '../../spec/types';
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
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);
  const rows = useMemo(() => sortAccounts(accounts, sort), [accounts, sort]);
  const captionId = useId();

  const cell = (account: Account, key: SortKey) => {
    switch (key) {
      case 'name':
        return account.name;
      case 'plan':
        return <span className="plan-tag">{PLAN_LABEL[account.plan]}</span>;
      case 'seats':
        return formatValue(account.seats, 'count');
      case 'mrr':
        return formatValue(account.mrr, 'currency');
      case 'status':
        return (
          <span className="status" data-status={account.status}>
            {STATUS_LABEL[account.status]}
          </span>
        );
      case 'renewsOn':
        return formatDate(account.renewsOn);
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
          {COPY.widgets.accountsCaption(accounts.length, plan)}
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
                  {COPY.table[column.key]}
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
