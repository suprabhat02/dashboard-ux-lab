import type { LabSettings, ScenarioId } from './types';

export interface ScenarioExplanation {
  /** What the visitor is looking at, in plain language. */
  readonly what: string;
  /** The design rule behind the behaviour. */
  readonly why: string;
  /** What assistive technology users get. */
  readonly accessibility: string;
}

export interface Scenario {
  readonly id: ScenarioId;
  readonly title: string;
  /** One line for cards and control labels. */
  readonly summary: string;
  readonly settings: LabSettings;
  readonly explanation: ScenarioExplanation;
  /** Longer guidance for the scenario's documentation page. */
  readonly guidance: readonly string[];
  /** Mistakes this scenario is designed to expose. */
  readonly antiPatterns: readonly string[];
}

export const DEFAULT_SETTINGS: LabSettings = {
  latencyMs: 700,
  failure: 'never',
  role: 'analyst',
  plan: 'all',
};

export const SCENARIOS: readonly Scenario[] = [
  {
    id: 'loaded',
    title: 'Loaded',
    summary: 'A normal, fast response with full access.',
    settings: DEFAULT_SETTINGS,
    explanation: {
      what: 'Data arrives in about 0.7 seconds. Skeletons appear after 300ms and are replaced by content of exactly the same size.',
      why: 'The happy path is the baseline every other state is measured against. Reserving final dimensions keeps layout shift near zero.',
      accessibility:
        'The dashboard region is marked busy while loading. Nothing is announced on first load; a change you trigger is announced once when it completes.',
    },
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
  {
    id: 'loading',
    title: 'Loading',
    summary: 'A two-second response: long enough to notice, short enough to wait.',
    settings: { ...DEFAULT_SETTINGS, latencyMs: 2_000 },
    explanation: {
      what: 'For the first 300ms nothing changes. Then skeletons hold the shape of each widget until the data arrives.',
      why: 'Most responses finish quickly. Delaying the skeleton avoids a flash of placeholder content on fast requests while still giving feedback on slower ones.',
      accessibility:
        '“Loading dashboard data” is announced once, and the region carries aria-busy so screen readers do not read half-rendered content.',
    },
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
  {
    id: 'slow',
    title: 'Slow response',
    summary: 'Twelve seconds. The interface escalates instead of spinning forever.',
    settings: { ...DEFAULT_SETTINGS, latencyMs: 12_000 },
    explanation: {
      what: 'Skeletons at 300ms, a “taking longer than usual” message at 3 seconds, and a Cancel option at 8 seconds.',
      why: 'An unchanged spinner gives no information after a few seconds. Escalating the message tells people the system is still working and lets them decide to stop waiting.',
      accessibility:
        'Each escalation is announced once. Cancel is a real button that receives focus only when you move to it; the interface never moves focus on its own while you wait.',
    },
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
  {
    id: 'empty',
    title: 'Empty results',
    summary: 'The request succeeds but nothing matches the filter.',
    settings: { ...DEFAULT_SETTINGS, plan: 'legacy' },
    explanation: {
      what: 'The Legacy plan has no accounts. The dashboard explains why it is empty and offers a next step.',
      why: 'Empty is a successful answer, not an error. It should say what was searched, why nothing matched, and how to get to useful data.',
      accessibility:
        'The empty message is announced once, and the recovery action is a regular button that is reachable straight after the filter.',
    },
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
  {
    id: 'error',
    title: 'Error with retry',
    summary: 'The first request fails with a 503. Retrying recovers.',
    settings: { ...DEFAULT_SETTINGS, latencyMs: 1_200, failure: 'once' },
    explanation: {
      what: 'The server responds with a temporary failure. The dashboard explains it in plain language, shows a request ID, and offers Retry.',
      why: 'Temporary failures are common and usually recoverable. A clear message and a single obvious action recover most sessions without support.',
      accessibility:
        'The failure is announced. While retrying, focus stays on the Retry button; when it succeeds and the button disappears, focus moves to the dashboard heading so it is never lost.',
    },
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
  {
    id: 'restricted',
    title: 'Restricted access',
    summary: 'The visitor has no access to this dashboard.',
    settings: { ...DEFAULT_SETTINGS, role: 'none' },
    explanation: {
      what: 'The server responds with 403. Instead of an error, the dashboard explains who can grant access. There is no Retry, because retrying cannot help.',
      why: 'Permission problems are not failures. Treating them as errors invites pointless retries; explaining the route to access resolves them. Try the “Viewer” role to see a single restricted widget instead.',
      accessibility:
        'The restriction is announced once and the explanation is plain text, not an alert. Headings stay in place so the page structure is still navigable.',
    },
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
];

export const SCENARIO_IDS: readonly ScenarioId[] = SCENARIOS.map(
  (scenario) => scenario.id,
);

export function getScenario(id: ScenarioId): Scenario {
  const scenario = SCENARIOS.find((candidate) => candidate.id === id);
  if (!scenario) throw new Error(`Unknown scenario: ${id}`);
  return scenario;
}

export function isScenarioId(value: string): value is ScenarioId {
  return (SCENARIO_IDS as readonly string[]).includes(value);
}

export function settingsEqual(a: LabSettings, b: LabSettings): boolean {
  return (
    a.latencyMs === b.latencyMs &&
    a.failure === b.failure &&
    a.role === b.role &&
    a.plan === b.plan
  );
}

/** The preset these settings match exactly, or `null` for a custom combination. */
export function matchScenario(settings: LabSettings): ScenarioId | null {
  return (
    SCENARIOS.find((scenario) => settingsEqual(scenario.settings, settings))?.id ?? null
  );
}
