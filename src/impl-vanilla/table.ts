import { COLUMNS, nextSort, sortAccounts, type SortKey } from '../spec/table';
import type { Account, PlanFilter } from '../spec/types';
import { h, icon, uid } from './dom';
import { FOCUS_KEY, type Ctx, type ViewMemory } from './views';

/**
 * Sortable table following the APG "Sortable Table" example: native table
 * semantics, a <button> in each header, aria-sort only on the sorted column.
 *
 * Sorting rewrites the body rows and the header attributes only; the header
 * buttons are never replaced, so keyboard focus stays on the one just pressed.
 */
export function accountsTable(
  accounts: readonly Account[],
  plan: PlanFilter,
  ctx: Ctx,
  memory: ViewMemory,
): HTMLElement {
  const { t, fmt, locale } = ctx;
  const captionId = uid('accounts-caption');

  const cell = (account: Account, key: SortKey): Node | string => {
    switch (key) {
      case 'name':
        // Company names are Latin-script proper nouns; isolate them inside RTL text.
        return h('bdi', {}, account.name);
      case 'plan':
        return h('span', { class: 'plan-tag' }, t.dashboard.plans[account.plan]);
      case 'seats':
        return fmt.value(account.seats, 'count');
      case 'mrr':
        return fmt.value(account.mrr, 'currency');
      case 'status':
        return h(
          'span',
          { class: 'status', 'data-status': account.status },
          t.dashboard.statuses[account.status],
        );
      case 'renewsOn':
        return fmt.date(account.renewsOn);
    }
  };

  const tbody = h('tbody');
  const headers = COLUMNS.map((column) => {
    const th = h(
      'th',
      { scope: 'col', 'data-numeric': column.numeric },
      h(
        'button',
        {
          type: 'button',
          class: 'sort-btn',
          [FOCUS_KEY]: `sort:${column.key}`,
          onclick: () => {
            memory.sort = nextSort(memory.sort, column.key);
            render();
          },
        },
        t.dashboard.columns[column.key],
        icon('sort', 14, 'sort-btn__icon'),
      ),
    );
    return { key: column.key, th };
  });

  function render(): void {
    const { sort } = memory;
    for (const { key, th } of headers) {
      if (sort.key === key) th.setAttribute('aria-sort', sort.direction);
      else th.removeAttribute('aria-sort');
    }
    tbody.replaceChildren(
      ...sortAccounts(accounts, sort, locale).map((account) =>
        h(
          'tr',
          {},
          ...COLUMNS.map((column) =>
            column.key === 'name'
              ? h('th', { scope: 'row' }, cell(account, column.key))
              : h('td', { 'data-numeric': column.numeric }, cell(account, column.key)),
          ),
        ),
      ),
    );
  }
  render();

  return h(
    'div',
    {
      class: 'table-scroll table-scroll--fixed',
      role: 'region',
      'aria-labelledby': captionId,
      tabindex: 0,
      [FOCUS_KEY]: 'accounts-region',
    },
    h(
      'table',
      { class: 'table' },
      h(
        'caption',
        { id: captionId },
        t.dashboard.accountsCaption(accounts.length, t.dashboard.plans[plan]),
      ),
      h('thead', {}, h('tr', {}, ...headers.map(({ th }) => th))),
      tbody,
    ),
  );
}
