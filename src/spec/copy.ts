import { formatMonthLong, planLabel } from './format';
import { MONTHS } from './data';
import type { PlanFilter, Role } from './types';

/**
 * Every user-facing string in the dashboard. Both implementations render these,
 * which keeps copy identical and lets e2e tests assert on text, not markup.
 */

export const CURRENT_MONTH = MONTHS[MONTHS.length - 1] ?? '2026-10';
export const PREVIOUS_MONTH = MONTHS[MONTHS.length - 2] ?? '2026-09';

const ROLE_LABEL: Record<Role, string> = {
  none: 'No access',
  viewer: 'Viewer',
  analyst: 'Analyst',
};

export const COPY = {
  company: 'Northstar Cloud',
  dashboardTitle: 'Revenue overview',
  dashboardSubtitle: `Subscription metrics · ${formatMonthLong(CURRENT_MONTH)}`,
  previousMonthLabel: formatMonthLong(PREVIOUS_MONTH).split(' ')[0] ?? 'last month',

  filter: { label: 'Plan' },

  widgets: {
    kpis: 'Key metrics',
    revenue: 'Monthly recurring revenue',
    revenueCaption: 'Monthly recurring revenue by month, last 12 months',
    accounts: 'Accounts',
    accountsCaption: (count: number, plan: PlanFilter) =>
      `${count} ${count === 1 ? 'account' : 'accounts'} · ${planLabel(plan)}. Select a column header to sort.`,
    showTable: 'Show data as table',
    hideTable: 'Hide data table',
  },

  table: {
    name: 'Account',
    plan: 'Plan',
    seats: 'Seats',
    mrr: 'MRR',
    status: 'Status',
    renewsOn: 'Renews',
  },

  loading: {
    announce: 'Loading dashboard data.',
    slowTitle: 'This is taking longer than usual.',
    slowBody: 'The server is still working. You don’t need to reload.',
    stalledTitle: 'Still waiting for the server.',
    stalledBody: 'You can keep waiting or cancel this request.',
    cancel: 'Cancel request',
  },

  cancelled: {
    title: 'Request cancelled',
    body: 'The dashboard wasn’t updated. Load it again whenever you’re ready.',
    action: 'Load again',
    announce: 'Request cancelled.',
  },

  empty: {
    title: (plan: PlanFilter) => `No accounts on the ${planLabel(plan)} plan`,
    body: 'The request worked, but nothing matched this filter. Legacy plans were retired, so no customers are on them.',
    action: 'Show all plans',
    announce: (plan: PlanFilter) => `No results for ${planLabel(plan)}.`,
  },

  error: {
    title: 'We couldn’t load this dashboard',
    body: 'The analytics service is temporarily unavailable (503). This is usually resolved by trying again.',
    requestIdLabel: 'Request ID',
    retry: 'Try again',
    retrying: 'Trying again…',
    announce: 'The dashboard failed to load. Try again is available.',
  },

  forbidden: {
    title: 'You don’t have access to this dashboard',
    body: 'Revenue dashboards are limited to finance and leadership roles. Ask a workspace admin to grant you the Viewer or Analyst role.',
    requestIdLabel: 'Reference',
    announce: 'You don’t have access to this dashboard.',
  },

  widgetRestricted: {
    title: 'Account details are restricted',
    body: (current: Role, required: Role) =>
      `Your ${ROLE_LABEL[current]} role can see totals and trends. Account-level revenue needs the ${ROLE_LABEL[required]} role.`,
  },

  loaded: {
    announce: (plan: PlanFilter) => `Dashboard updated: ${planLabel(plan)}.`,
  },
} as const;

export function roleLabel(role: Role): string {
  return ROLE_LABEL[role];
}
