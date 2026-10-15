import type { AccountStatus, KpiId, PlanFilter, Role, ScenarioId } from '../types';

/**
 * English catalogue. Its shape IS the `Messages` type: every other locale must
 * provide exactly these keys (missing or extra keys fail type-checking), so a
 * feature cannot ship in one language only.
 *
 * Conventions
 * - Interpolation is done with functions, never string concatenation at call sites,
 *   so word order can differ per language.
 * - Plurals use Intl.PluralRules inside the catalogue (Arabic has six forms).
 * - Numbers, currency and dates are formatted by spec/format.ts and passed in.
 */

export interface ScenarioCopy {
  readonly title: string;
  readonly summary: string;
  readonly what: string;
  readonly why: string;
  readonly accessibility: string;
  readonly guidance: readonly string[];
  readonly antiPatterns: readonly string[];
}

const plural = new Intl.PluralRules('en-US');

export const en = {
  meta: {
    siteName: 'Dashboard UX Lab',
    homeTitle: 'Dashboard UX Lab — how dashboards should behave when data isn’t perfect',
    homeDescription:
      'An interactive lab for dashboard states: loading, slow responses, empty results, failures with retry and restricted access. Built in React and framework-free TypeScript from one shared spec.',
    labReactTitle: 'React implementation',
    labReactDescription:
      'Play with a React dashboard under real-world conditions: loading, slow responses, empty results, failures with retry and restricted access.',
    labVanillaTitle: 'Vanilla implementation (in progress)',
    labVanillaDescription:
      'The framework-free implementation of the Dashboard UX Lab, built from the same spec as the React version.',
    scenariosTitle: 'Scenario guides',
    scenariosDescription:
      'How a dashboard should behave in six real-world scenarios: loaded, loading, slow, empty, error with retry, and restricted access.',
    guideTitle: (scenario: string) => `${scenario}: dashboard scenario guide`,
    accessibilityTitle: 'Accessibility',
    accessibilityDescription:
      'What has and hasn’t been tested in the Dashboard UX Lab, how, and the known issues.',
    notFoundTitle: 'Page not found',
    notFoundDescription: 'This page doesn’t exist.',
  },

  nav: {
    skip: 'Skip to content',
    homeLabel: 'Dashboard UX Lab, home',
    by: 'by Suprabhat',
    main: 'Main',
    lab: 'Lab',
    scenarios: 'Scenarios',
    accessibility: 'Accessibility',
    github: 'GitHub',
    language: 'Language',
    themeTo: (theme: 'dark' | 'light'): string =>
      theme === 'dark' ? 'Switch to dark theme' : 'Switch to light theme',
  },

  footer: {
    builtBy: 'Built by',
    note: 'Mock data only; no tracking.',
    source: 'Source on GitHub',
    report: 'Report an issue',
  },

  home: {
    pill: 'Open source · React now, vanilla next',
    titleLead: 'Dashboards spend half their life',
    titleAccent: 'not loaded.',
    lede: 'An interactive lab for the states most demos skip: loading, slow, empty, failed and forbidden. Break the dashboard on purpose, then see exactly what changed, what a screen reader heard and where focus went.',
    openLab: 'Open the lab',
    readGuides: 'Read the scenario guides',
    stripLabel: 'The six scenarios',
    howEyebrow: 'How it works',
    howTitle: 'A playground, not a screenshot',
    features: [
      {
        title: 'Break it on purpose',
        body: 'Drag server latency from 0 to 15 seconds, make the API fail once or forever, switch the visitor’s role. Every combination follows the same written rules.',
      },
      {
        title: 'See the invisible parts',
        body: 'The inspector shows each state transition, every live-region announcement and every programmatic focus move: the behaviour that never appears in screenshots.',
      },
      {
        title: 'Compare two builds fairly',
        body: 'The same spec, mock API, copy and CSS, implemented separately in React and in framework-free TypeScript, checked by one shared test suite. The vanilla build is the next milestone.',
      },
    ],
    rulesEyebrow: 'The rules',
    rulesTitle: 'Six decisions the lab makes visible',
    rules: [
      {
        lead: 'No skeleton for fast responses.',
        body: 'Placeholders appear only after 300ms.',
      },
      {
        lead: 'Slow is time, not a state.',
        body: 'The message escalates at 3s; cancel appears at 8s.',
      },
      {
        lead: 'Empty is an answer, not an error.',
        body: 'It names the filter and offers a way out.',
      },
      {
        lead: 'Failures are explained and recoverable.',
        body: 'Request ID, one Retry, no double submit.',
      },
      {
        lead: 'Forbidden is not failed.',
        body: 'No retry for a 403; say who can grant access.',
      },
      {
        lead: 'Announce once, move focus rarely.',
        body: 'Only when the focused control disappears.',
      },
    ],
    statusTitle: 'Where the project stands',
    statusBody:
      'The React implementation, shared spec and automated tests are in place. Manual screen reader and real-device testing is in progress and will be published on the accessibility page, including known issues.',
    statusA11yLink: 'Read the accessibility status',
    statusFeedback: 'Feedback on the spec is the most useful thing you can give:',
    statusIssueLink: 'open an issue',
  },

  lab: {
    eyebrow: 'Playground',
    titleLead: 'The dashboard,',
    titleAccent: 'when things go wrong',
    lede: 'Pick a scenario or tune the request. Then watch the state timeline and what a screen reader would hear.',
    implNav: 'Implementation',
    impl: {
      react: { label: 'React', note: 'React 19 · hooks + reducer' },
      vanilla: { label: 'Vanilla', note: 'No framework · in progress' },
    },
    controlsLabel: 'Lab controls',
    railToggle: 'Scenario:',
    scenarioHeading: 'Scenario',
    presetsLegend: 'Preset scenarios',
    tune: 'Tune the request',
    custom: 'Custom',
    latency: 'Server latency',
    ms: (value: string) => `${value} ms`,
    latencyHint: (skeletonMs: string, slowS: string, stalledS: string) =>
      `Skeleton after ${skeletonMs} ms · notice at ${slowS} s · cancel at ${stalledS} s`,
    failureLegend: 'Server failure',
    failure: { never: 'Never', once: 'Fail once', always: 'Always' },
    role: 'Visitor role',
    planFilter: 'Plan filter',
    replay: 'Replay request',
    copyLink: 'Copy link',
    copied: 'Copied',
    linkCopied: 'Link copied to clipboard.',
    copyFailed: 'Couldn’t copy. Copy the address bar instead.',
    explainHeading: 'What you’re seeing',
    explainWhat: 'What happens',
    explainWhy: 'Why',
    explainA11y: 'Accessibility',
    readGuide: (title: string) => `Read the full “${title}” guide`,
    customWhat: (latency: string, failure: string, role: string, plan: string) =>
      `Custom: ${latency} latency, server ${failure}, ${role} role, ${plan}.`,
    customFailure: { never: 'never fails', once: 'fails once', always: 'always fails' },
    customWhy:
      'Mix the knobs to find edge cases: a slow request that then fails, a viewer on an empty filter, a retry that keeps failing. The dashboard follows the same rules for every combination.',
    customA11y:
      'Watch the Screen reader tab: every change you trigger produces at most one announcement per state, never a queue.',
    vanilla: {
      pill: 'Next milestone',
      title: 'The vanilla implementation is being built',
      body: 'It will be written from the written spec, not ported from the React code, and must pass the same end-to-end test suite before it ships here. Until then, the controls on this page only update the URL.',
      openReact: 'Open the React version',
      readSpec: 'Read the spec',
    },
    noscript:
      'This interactive dashboard needs JavaScript. The scenario guides work without it.',
  },

  inspector: {
    heading: 'Inspector',
    tablist: 'Inspector views',
    tabs: { timeline: 'State timeline', announce: 'Screen reader', focus: 'Focus' },
    clear: 'Clear',
    hints: {
      timeline: 'Every request, state transition and loading phase, in order.',
      announce:
        'Exactly what the dashboard sent to its live regions: what a screen reader user hears without moving.',
      focus:
        'Programmatic focus moves (rare by design) and where keyboard focus is right now.',
    },
    logLabels: {
      timeline: 'State timeline log',
      announce: 'Announcements log',
      focus: 'Focus moves log',
    },
    focusNow: 'Focused now:',
    focusLost: 'page body (focus lost)',
    empty: 'Nothing yet. Change a scenario or replay the request.',
    kinds: {
      ready: 'ready',
      request: 'request',
      state: 'state',
      phase: 'phase',
      polite: 'polite',
      assertive: 'assertive',
      moved: 'moved',
      filter: 'filter',
    },
    entries: {
      ready: (implementation: string) => `${implementation} implementation mounted`,
      requestStart: (attempt: number) => `request #${attempt} sent`,
      requestSettled: (attempt: number) => `response #${attempt} received`,
      requestAborted: (attempt: number) =>
        `request #${attempt} aborted (superseded or cancelled)`,
      phase: (phase: string) => `loading phase: ${phase}`,
      filter: 'settings changed from inside the dashboard',
    },
  },

  dashboard: {
    company: 'Northstar Cloud',
    title: 'Revenue overview',
    subtitle: (month: string) => `Subscription metrics · ${month}`,
    filterLabel: 'Plan',
    kpisLabel: 'Key metrics',
    kpi: {
      mrr: 'Monthly recurring revenue',
      activeAccounts: 'Active accounts',
      arpa: 'Avg. revenue per account',
      churnRate: 'Monthly churn',
    } satisfies Record<KpiId, string>,
    delta: (
      direction: 'up' | 'down',
      magnitude: string,
      isRate: boolean,
      month: string,
    ) =>
      `${direction === 'up' ? 'Up' : 'Down'} ${magnitude}${isRate ? ' percentage points' : '%'} from ${month}`,
    deltaFlat: (month: string) => `Unchanged from ${month}`,
    pointsUnit: 'pts',
    revenue: 'Monthly recurring revenue',
    revenueMeta: 'Last 12 months · USD',
    revenueCaption: 'Monthly recurring revenue by month, last 12 months',
    accounts: 'Accounts',
    accountsCaption: (count: number, plan: string) =>
      `${count} ${plural.select(count) === 'one' ? 'account' : 'accounts'} · ${plan}. Select a column header to sort.`,
    showTable: 'Show data as table',
    hideTable: 'Hide data table',
    monthHeader: 'Month',
    columns: {
      name: 'Account',
      plan: 'Plan',
      seats: 'Seats',
      mrr: 'MRR',
      status: 'Status',
      renewsOn: 'Renews',
    },
    plans: {
      all: 'All plans',
      starter: 'Starter',
      growth: 'Growth',
      enterprise: 'Enterprise',
      legacy: 'Legacy',
    } satisfies Record<PlanFilter, string>,
    statuses: {
      active: 'Active',
      trial: 'Trial',
      past_due: 'Past due',
      churned: 'Churned',
    } satisfies Record<AccountStatus, string>,
    roles: { none: 'No access', viewer: 'Viewer', analyst: 'Analyst' } satisfies Record<
      Role,
      string
    >,
    chart: {
      summary: (
        trend: 'rose' | 'fell' | 'flat',
        from: string,
        fromMonth: string,
        to: string,
        toMonth: string,
        peak: string,
        peakMonth: string,
      ) =>
        `Bar chart. Monthly recurring revenue ${trend === 'flat' ? 'was flat' : trend} from ${from} in ${fromMonth} to ${to} in ${toMonth}, peaking at ${peak} in ${peakMonth}.`,
      noData: 'No revenue data.',
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
      title: (plan: string) => `No accounts on the ${plan} plan`,
      body: 'The request worked, but nothing matched this filter. Legacy plans were retired, so no customers are on them.',
      action: 'Show all plans',
      announce: (plan: string) => `No results for ${plan}.`,
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
      body: (current: string, required: string) =>
        `Your ${current} role can see totals and trends. Account-level revenue needs the ${required} role.`,
      currentRole: (role: string) => `Current role: ${role}`,
    },
    loaded: { announce: (plan: string) => `Dashboard updated: ${plan}.` },
    focus: {
      heading: (text: string) => `heading “${text}”`,
      button: (text: string) => `button “${text}”`,
      cancelRemoved: 'Cancel button was removed',
      actionRemoved: 'Action button was removed',
    },
  },

  scenarios: {
    loaded: {
      title: 'Loaded',
      summary: 'A normal, fast response with full access.',
      what: 'Data arrives in about 0.7 seconds. Skeletons appear after 300ms and are replaced by content of exactly the same size.',
      why: 'The happy path is the baseline every other state is measured against. Reserving final dimensions keeps layout shift near zero.',
      accessibility:
        'The dashboard region is marked busy while loading. Nothing is announced on first load; a change you trigger is announced once when it completes.',
      guidance: [
        'Reserve the final size of every widget before data arrives, so content replaces placeholders instead of pushing the page around.',
        'Only announce updates the user caused. Announcing the initial load competes with the screen reader reading the page.',
        'Format numbers for the reader: currency with units, deltas with a direction in words, not just colour or an arrow.',
      ],
      antiPatterns: [
        'Spinners that shift the layout when content arrives.',
        'Deltas conveyed only by red and green.',
      ],
    },
    loading: {
      title: 'Loading',
      summary: 'A two-second response: long enough to notice, short enough to wait.',
      what: 'For the first 300ms nothing changes. Then skeletons hold the shape of each widget until the data arrives.',
      why: 'Most responses finish quickly. Delaying the skeleton avoids a flash of placeholder content on fast requests while still giving feedback on slower ones.',
      accessibility:
        '“Loading dashboard data” is announced once, and the region carries aria-busy so screen readers do not read half-rendered content.',
      guidance: [
        'Delay skeletons by about 300ms. Under that, a placeholder reads as a glitch rather than as progress.',
        'Skeletons should mirror the real layout (card count, chart height, table rows), not a generic shimmer block.',
        'Mark the updating region with aria-busy and announce the loading state once, politely.',
      ],
      antiPatterns: [
        'A full-page spinner that hides content the user could already read.',
        'Announcing “loading” repeatedly on every re-render.',
      ],
    },
    slow: {
      title: 'Slow response',
      summary: 'Twelve seconds. The interface escalates instead of spinning forever.',
      what: 'Skeletons at 300ms, a “taking longer than usual” message at 3 seconds, and a Cancel option at 8 seconds.',
      why: 'An unchanged spinner gives no information after a few seconds. Escalating the message tells people the system is still working and lets them decide to stop waiting.',
      accessibility:
        'Each escalation is announced once. Cancel is a real button that receives focus only when you move to it; the interface never moves focus on its own while you wait.',
      guidance: [
        '“Slow” is not a separate state. It is the same request observed later, so model it as time elapsed rather than as a status.',
        'Escalate in steps: acknowledge the delay, then offer a way out.',
        'Cancelling must leave the interface in a clear, recoverable state with a way to try again.',
      ],
      antiPatterns: [
        'Infinite spinners with no message and no way out.',
        'Cancelling a request but still rendering its response when it arrives late.',
      ],
    },
    empty: {
      title: 'Empty results',
      summary: 'The request succeeds but nothing matches the filter.',
      what: 'The Legacy plan has no accounts. The dashboard explains why it is empty and offers a next step.',
      why: 'Empty is a successful answer, not an error. It should say what was searched, why nothing matched, and how to get to useful data.',
      accessibility:
        'The empty message is announced once, and the recovery action is a regular button that is reachable straight after the filter.',
      guidance: [
        'Derive “empty” from the data, never from a flag. Real APIs return empty arrays, not empty states.',
        'Name the filter that produced the empty result and offer to clear it.',
        'Keep the empty state visually distinct from an error so people do not retry something that worked.',
      ],
      antiPatterns: [
        'A blank chart with axes and no explanation.',
        '“Something went wrong” for a query that simply matched nothing.',
      ],
    },
    error: {
      title: 'Error with retry',
      summary: 'The first request fails with a 503. Retrying recovers.',
      what: 'The server responds with a temporary failure. The dashboard explains it in plain language, shows a request ID, and offers Retry.',
      why: 'Temporary failures are common and usually recoverable. A clear message and a single obvious action recover most sessions without support.',
      accessibility:
        'The failure is announced. While retrying, focus stays on the Retry button; when it succeeds and the button disappears, focus moves to the dashboard heading so it is never lost.',
      guidance: [
        'Say what failed and what the user can do, not just a status code.',
        'Show a request ID people can quote to support.',
        'Prevent double submissions while a retry is in flight.',
        'If the control that had focus disappears, move focus somewhere meaningful.',
      ],
      antiPatterns: [
        'Retry buttons that can be triggered twice.',
        'Focus dropping to the top of the page after a successful retry.',
      ],
    },
    restricted: {
      title: 'Restricted access',
      summary: 'The visitor has no access to this dashboard.',
      what: 'The server responds with 403. Instead of an error, the dashboard explains who can grant access. There is no Retry, because retrying cannot help.',
      why: 'Permission problems are not failures. Treating them as errors invites pointless retries; explaining the route to access resolves them. Try the “Viewer” role to see a single restricted widget instead.',
      accessibility:
        'The restriction is announced once and the explanation is plain text, not an alert. Headings stay in place so the page structure is still navigable.',
      guidance: [
        'Distinguish “you can’t see this” from “this failed”. They need different copy and different actions.',
        'Restrict at the smallest useful scope. A viewer who cannot see account revenue can still see the trend.',
        'Say who can grant access rather than just denying it.',
      ],
      antiPatterns: [
        'A generic error with a Retry button for a 403.',
        'Hiding restricted widgets entirely, so people do not know the data exists.',
      ],
    },
  } satisfies Record<ScenarioId, ScenarioCopy>,

  guides: {
    eyebrow: 'Guides',
    title: 'Scenario guides',
    lede: 'Each guide explains one state: what should happen, why, how it is announced, and the mistakes it is designed to expose. Every guide links to the live lab with that scenario preselected.',
    breadcrumb: 'Breadcrumb',
    tryIt: 'Try it in the lab',
    behaviour: 'Expected behaviour',
    why: 'Why it behaves this way',
    accessibility: 'Accessibility',
    antiPatterns: 'Mistakes this scenario exposes',
    settings: {
      latency: 'Server latency',
      failure: 'Server failure',
      role: 'Visitor role',
      plan: 'Plan filter',
    },
    failureValues: {
      never: 'Never',
      once: 'First attempt only',
      always: 'Every attempt',
    },
    more: 'More scenarios',
  },

  accessibilityPage: {
    eyebrow: 'Testing status',
    title: 'Accessibility',
    lede: 'This page says what has been tested and how. Automated checks catch only part of what matters, so nothing here is called “accessible” until it has been tested with real assistive technology.',
    matrixTitle: 'Testing matrix',
    caption: (date: string) => `Last updated ${date}`,
    check: 'Check',
    status: 'Status',
    rows: [
      {
        check: 'axe-core in every scenario, all three languages (automated)',
        status: 'Automated in CI',
      },
      {
        check: 'Keyboard-only walkthrough of every scenario',
        status: 'Automated in CI; manual pass pending',
      },
      { check: 'NVDA + Firefox (Windows)', status: 'Not yet tested' },
      { check: 'VoiceOver + Safari (macOS)', status: 'Not yet tested' },
      { check: 'VoiceOver + Safari (iOS)', status: 'Not yet tested' },
      { check: 'TalkBack + Chrome (Android)', status: 'Not yet tested' },
      { check: 'Arabic (right-to-left) with a screen reader', status: 'Not yet tested' },
      { check: '400% zoom / 320px reflow', status: 'Not yet tested' },
      { check: 'Windows forced colours', status: 'Styles written; not yet verified' },
    ],
    knownTitle: 'Known issues',
    known: [
      'Individual chart bars are not keyboard-focusable by design; the data is available as a table.',
      'The vanilla implementation is not built yet.',
      'On narrow screens the chart scales down and its axis labels become small; the “Show data as table” view is the readable alternative until a narrow-screen chart layout lands.',
      'Spanish and Arabic translations were drafted by the author and have not yet been reviewed by native speakers.',
    ],
    reportTitle: 'Report a problem',
    reportBody:
      'If something doesn’t work with your setup, please open an issue and include your browser, language and assistive technology.',
    reportLink: 'Open an issue',
  },

  notFound: {
    eyebrow: '404',
    title: 'An empty state of our own',
    lede: 'The request worked, but nothing lives at this address.',
    back: 'Back to the lab',
  },
};

export type Messages = typeof en;
