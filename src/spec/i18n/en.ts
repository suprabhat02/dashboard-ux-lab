import type { AccountStatus, KpiId, PlanFilter, Role, ScenarioId } from '../types';

/** Where a phase of the home page's roadmap stands. */
export type RoadmapStage = 'done' | 'now' | 'next' | 'later';
interface RoadmapPhase {
  readonly stage: RoadmapStage;
  readonly title: string;
  readonly items: readonly string[];
  /** Where to see a finished phase; a path inside the site, localised at render. */
  readonly link?: { readonly label: string; readonly path: string };
}

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
    homeTitle: 'Dashboard UX Lab: loading, empty and error states done right',
    homeDescription:
      'Trigger loading, slow, empty, error and restricted states on a live dashboard and see how each should look, sound to a screen reader and handle focus.',
    labReactTitle: 'React implementation',
    labReactDescription:
      'Play with a React dashboard under real-world conditions: loading, slow responses, empty results, failures with retry and restricted access.',
    labVanillaTitle: 'Vanilla TypeScript implementation',
    labVanillaDescription:
      'The framework-free implementation of the Dashboard UX Lab, built from the same spec as the React version.',
    scenariosTitle: 'Scenario guides',
    scenariosDescription:
      'How a dashboard should behave in six real-world scenarios: loaded, loading, slow, empty, error with retry, and restricted access.',
    guideTitle: (scenario: string) => `${scenario}: dashboard scenario guide`,
    guideDescription: (summary: string) =>
      `${summary} Expected behaviour, accessibility and the mistakes it exposes.`,
    ogImageAlt:
      'Dashboard UX Lab: a dashboard request drawn as a timeline from 0 to 12 seconds, with placeholders at 300 ms, a slow notice at 3 s and Cancel at 8 s.',
    accessibilityTitle: 'Accessibility',
    accessibilityDescription:
      'What has and hasn’t been tested in the Dashboard UX Lab, how, and the known issues.',
    compareTitle: 'React and framework-free, side by side',
    compareDescription:
      'The same dashboard built with React and with no framework, run side by side: one set of controls, start-up time, download size and whether both behave alike.',
    embedTitle: (build: string) => `${build} build, embedded`,
    screenReadersTitle: 'Screen reader test script',
    screenReadersDescription:
      'What a screen reader should say in each dashboard scenario, computed from the spec and checked against both builds, with results from real NVDA, VoiceOver and TalkBack runs.',
    notFoundTitle: 'Page not found',
    notFoundDescription: 'This page doesn’t exist.',
  },

  nav: {
    skip: 'Skip to content',
    homeLabel: 'Dashboard UX Lab, home',
    main: 'Main',
    lab: 'Lab',
    scenarios: 'Scenarios',
    accessibility: 'Accessibility',
    compare: 'Compare',
    github: 'GitHub',
    language: 'Language',
    menu: 'Menu',
    theme: 'Theme',
    themes: { light: 'Light', dark: 'Dark', system: 'System' },
  },

  author: {
    title: 'About the author',
    name: 'Suprabhat Kumar',
    role: 'Senior front-end engineer',
    bio: 'I believe the web belongs to everyone. I build interfaces that still work on a slow connection, with a screen reader, from the keyboard and in any language, because the person on the other side might be using any of them.',
    bio2: 'This lab is free and open source, my small contribution to an open internet that works for all.',
    portraitAlt: 'Portrait of Suprabhat Kumar',
    links: 'Find me on',
    portfolio: 'Portfolio',
  },
  footer: {
    illustrations: 'Illustrations by Storyset',
    note: 'Mock data only; no tracking.',
    source: 'Source on GitHub',
    report: 'Report an issue',
  },

  home: {
    hero: {
      title: 'Design the dashboard states nobody screenshots',
      lede: 'Real dashboards spend much of their time loading, waiting on slow services, showing nothing, failing or hiding data a viewer isn’t allowed to see. This lab lets you trigger each of those states on purpose and see exactly how a well-built dashboard should respond: on screen, to a screen reader and to keyboard focus.',
      facts:
        'Six scenarios, three languages and two independent builds of one spec, tested in Chromium, Firefox and WebKit on every change.',
      openLab: 'Open the lab',
      readGuides: 'Read the scenario guides',
    },
    problem: {
      title: 'The problem',
      intro:
        'Dashboard designs and demos almost always show the happy path: data arrives instantly, every filter returns results and every viewer may see everything. In production, the other states are common, and they are where trust is won or lost.',
      symptomsTitle: 'What users actually run into',
      symptoms: [
        'A spinner that never changes, with no sign of whether anything is still happening.',
        'Content that jumps around as each widget finishes loading at a different time.',
        'A blank chart for a filter that simply matched nothing, with no explanation.',
        '“Something went wrong” for a permissions problem, with a Retry button that can never help.',
        'Retry buttons that send the same request twice, and late responses that overwrite newer data.',
        'Screen reader users who hear nothing when data changes, or hear a queue of stale announcements.',
        'Keyboard focus that jumps to the top of the page when a button disappears.',
      ],
    },
    traditional: {
      title: 'How it is usually handled',
      intro: 'Most teams reach these states the same way, one shortcut at a time:',
      steps: [
        {
          title: 'The design covers the loaded state',
          body: 'Mock-ups show full data. Loading, empty and error states are left for later, or reduced to a single generic spinner and message.',
        },
        {
          title: 'Each component improvises',
          body: 'Every widget adds its own spinner and error text, so timing, wording and recovery differ across the same page.',
        },
        {
          title: 'Testing relies on slowing the network by hand',
          body: 'Someone throttles the browser’s network once, glances at the result and moves on. The behaviour is never written down, so it drifts.',
        },
        {
          title: 'Accessibility is checked at the end',
          body: 'Announcements and focus behaviour are reviewed in a late audit, when changing them is expensive.',
        },
      ],
      why: 'None of these steps is wrong on its own. Together, they mean nobody owns the states users see most often under real conditions.',
    },
    approach: {
      title: 'How this lab helps',
      intro:
        'The lab treats every state as a first-class, specified behaviour, and makes the invisible parts of that behaviour visible.',
      points: [
        {
          title: 'A written behaviour specification',
          body: 'Timings (nothing for 300 ms, skeletons until 3 s, an explanation at 3 s, Cancel at 8 s), copy, announcements and focus rules are documented, so they can be reviewed and argued with.',
        },
        {
          title: 'Reproducible scenarios',
          body: 'Every combination of latency, failure, role and filter is a link. A designer, developer and tester can all look at exactly the same state.',
        },
        {
          title: 'An inspector for what screenshots miss',
          body: 'A live timeline shows each request and state change, every message sent to screen readers and every programmatic focus move.',
        },
        {
          title: 'One specification, two implementations',
          body: 'The same behaviour is built in React and in plain TypeScript, and one shared test suite checks both, so the comparison is fair.',
        },
        {
          title: 'Three languages, including right-to-left',
          body: 'Everything works in English, Spanish and Arabic, including mirrored layouts, local number formats and plural rules.',
        },
      ],
    },
    comparison: {
      title: 'How it compares with tools you may already use',
      intro:
        'The lab is a reference, not a replacement. These tools are excellent at what they do; the table shows where each one stops.',
      caption:
        'Common tools for building and testing dashboard states, and what each covers',
      columns: { tool: 'Tool', strength: 'Good for', gap: 'What it does not give you' },
      rows: [
        {
          tool: 'Browser developer tools (network throttling)',
          strength: 'Slowing or blocking real requests to see what happens.',
          gap: 'A definition of what should happen, repeatable states you can share, or a view of announcements and focus.',
        },
        {
          tool: 'Mock Service Worker (MSW)',
          strength:
            'Mocking API responses, delays and errors in the browser and in tests.',
          gap: 'Guidance on how the interface should respond to those responses.',
        },
        {
          tool: 'Storybook',
          strength:
            'Building and documenting components in isolation, one story per state.',
          gap: 'Transitions between states over time, such as a slow request becoming an error and then a retry.',
        },
        {
          tool: 'Component libraries (skeleton, empty and result components)',
          strength: 'Ready-made building blocks for each state.',
          gap: 'When to show which one, for how long, and what to announce.',
        },
        {
          tool: 'Data-fetching libraries (TanStack Query, SWR)',
          strength: 'Request status, caching, retries and cancellation in code.',
          gap: 'The user-facing design of each status.',
        },
        {
          tool: 'Dashboard UX Lab',
          strength:
            'A specified, inspectable, testable reference for the behaviour of each state, in three languages.',
          gap: 'Production components or a library to install. Use it alongside the tools above.',
        },
      ],
    },
    audience: {
      title: 'Who it is for',
      groups: [
        {
          title: 'Front-end developers',
          body: 'See request handling, cancellation, announcements and focus management working together, and read the code behind them.',
        },
        {
          title: 'Designers and product managers',
          body: 'Use the scenarios and guides as a checklist and a shared vocabulary for specifying the states beyond the happy path.',
        },
        {
          title: 'Accessibility reviewers and testers',
          body: 'Reproduce any state from a link and see exactly what was announced and where focus went.',
        },
      ],
    },
    demo: {
      controlsLabel: 'Preview state',
      play: 'Play the preview',
      pause: 'Pause the preview',
      openInLab: 'Open this state in the lab',
      ruler: {
        label: 'Time since the request was sent',
        waiting: 'Shows nothing yet',
        skeleton: 'Placeholders',
        slow: 'Says it is slow',
        cancel: 'Offers Cancel',
        response: 'Response',
      },
      captions: {
        loaded:
          'Data arrives in under a second, and content replaces placeholders of exactly the same size.',
        loading:
          'For the first 300 ms nothing changes. Then skeletons hold the shape of what is coming.',
        slow: 'At 3 seconds the interface says so, instead of spinning in silence.',
        empty: 'Nothing matched the filter. The dashboard says why and offers a way out.',
        error:
          'A temporary failure, explained in plain words, with a request ID and a single Retry.',
        restricted: 'No access is not an error: no Retry, just who can grant access.',
      },
    },
    stack: {
      title: 'Built and tested with',
      pause: 'Pause the moving list',
      play: 'Play the moving list',
    },
    statement:
      'A dashboard is judged less by how it looks with perfect data than by how it behaves while that data is late, missing, failing or off-limits.',
    cta: {
      title: 'Break a dashboard on purpose',
      body: 'Slow it down, make it fail, take away access, and watch what a well-built interface does about it.',
      primary: 'Open the lab',
      secondary: 'Read the spec on GitHub',
      actionsTitle: 'Three ways to break it',
      actions: [
        {
          label: 'Slow it down',
          detail: 'A 12-second response. Watch the interface say so, then offer Cancel.',
        },
        {
          label: 'Make it fail',
          detail: 'A 503 on the first try. One clear message, one Retry, no lost state.',
        },
        {
          label: 'Take away access',
          detail: 'A viewer without permission. No Retry, just who can grant access.',
        },
      ],
    },
    scenariosTitle: 'Six scenarios to explore',
    scenariosIntro:
      'Each one opens the lab in that state. Every scenario also has a written guide.',
    rulesTitle: 'Six rules the lab follows',
    rules: [
      {
        lead: 'No skeleton for fast responses.',
        body: 'Placeholders appear only after 300 ms.',
      },
      {
        lead: 'Slow is time, not a state.',
        body: 'The message changes at 3 s; Cancel appears at 8 s.',
      },
      {
        lead: 'Empty is an answer, not an error.',
        body: 'It names the filter and offers a way out.',
      },
      {
        lead: 'Failures are explained and recoverable.',
        body: 'A request ID, one Retry, no double submission.',
      },
      {
        lead: 'Forbidden is not failed.',
        body: 'No Retry for a 403; explain who can grant access.',
      },
      {
        lead: 'Announce once, move focus rarely.',
        body: 'Only when the focused control disappears.',
      },
    ],
    roadmap: {
      title: 'Where the project stands',
      goal: 'The goal: make a dashboard’s behaviour easier to see, hear and test than any browser developer tool does today.',
      goalBody:
        'Developer tools show requests and the DOM. They do not show what a person waits through, what a screen reader says, or where keyboard focus lands. This lab is built in the open to show exactly that, one phase at a time.',
      here: 'You are here',
      stages: {
        done: 'Done',
        now: 'Now',
        next: 'Next',
        later: 'Exploring',
      } satisfies Record<RoadmapStage, string>,
      phases: [
        {
          stage: 'done',
          link: { label: 'Open the lab', path: '/lab/react/' },
          title: 'Foundations',
          items: [
            'A written specification of six dashboard states, with timings',
            'React and framework-free TypeScript builds of it, pixel-identical',
            'English, Spanish and right-to-left Arabic',
            'Automated tests in Chromium, Firefox and WebKit',
          ],
        },
        {
          stage: 'done',
          link: { label: 'See them side by side', path: '/compare/' },
          title: 'Side-by-side comparison',
          items: [
            'Both builds in one view, driven by one set of controls',
            'Start-up time and download size, measured in your own browser',
          ],
        },
        {
          stage: 'done',
          link: { label: 'Run the test script', path: '/accessibility/screen-readers/' },
          title: 'Real assistive technology',
          items: [
            'A screen reader script computed from the spec, checked against both builds on every commit',
            'Results table and form, open to anyone testing with NVDA, VoiceOver or TalkBack',
            'Native-speaker review skipped for now: no reviewer is available yet; suggestions stay open',
          ],
        },
        {
          stage: 'done',
          link: { label: 'Scrub a request in the lab', path: '/lab/react/' },
          title: 'See time, not just state',
          items: [
            'A request timeline in the lab you can scrub: what was on screen, what was heard and where focus was at any moment',
            'Any scenario, or any custom settings, exported as a ready-made Playwright test; CI runs every published one',
          ],
        },
        {
          stage: 'next',
          title: 'Bring your own',
          items: [
            'Paste your own API response and see how each state handles it',
            'More components: forms, lists and infinite scroll',
          ],
        },
      ] satisfies readonly RoadmapPhase[],
      a11yLink: 'Read the accessibility status',
      feedback: 'The most useful contribution is feedback on the specification:',
      issueLink: 'open an issue on GitHub',
    },
  },

  lab: {
    title: 'The dashboard, when things go wrong',
    lede: 'Pick a scenario or tune the request. Then watch the state timeline and what a screen reader would hear.',
    implNav: 'Implementation',
    impl: {
      react: { label: 'React', note: 'React 19 · hooks + reducer' },
      vanilla: { label: 'Vanilla', note: 'No framework · TypeScript' },
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
    noscript:
      'This interactive dashboard needs JavaScript. The scenario guides work without it.',
  },

  compare: {
    title: 'Two builds, one behaviour',
    lede: 'The same dashboard, written twice from one spec: once with React, once with no framework at all. Pick a scenario and both run it at the same moment, here in your browser.',
    controlsHeading: 'Scenario for both builds',
    replay: 'Replay both',
    listenLegend: 'Screen reader and keyboard go to',
    listenHint:
      'Both builds announce changes through live regions, so a screen reader would hear every message twice. One build at a time is reachable by keyboard and assistive technology; the other stays visible.',
    builds: {
      react: {
        name: 'React',
        note: 'React 19, hooks and a reducer',
        frameTitle: 'Dashboard built with React',
      },
      vanilla: {
        name: 'Framework-free TypeScript',
        note: 'No framework, no runtime dependencies',
        frameTitle: 'Dashboard built with framework-free TypeScript',
      },
    },
    active: 'Keyboard and screen reader are on this build.',
    muted: 'Visible only: not reachable by keyboard or screen reader right now.',
    useThis: 'Use this build',
    metrics: {
      label: (build: string) => `${build}: measurements`,
      ready: 'Ready in',
      script: 'JavaScript downloaded',
      steps: 'Steps this run',
      measuring: 'Measuring…',
      kb: (value: string) => `${value} KB`,
      files: (count: number) =>
        `${count} ${plural.select(count) === 'one' ? 'file' : 'files'}`,
    },
    lastHeard: 'Last announcement:',
    nothingHeard: 'none yet',
    agreement: {
      heading: 'Do they behave the same?',
      waiting: 'Waiting for both builds to start.',
      agree: (steps: number) =>
        `Same ${steps} ${plural.select(steps) === 'one' ? 'step' : 'steps'}, in the same order.`,
      catching: (steps: number) =>
        `Agree on ${steps} ${plural.select(steps) === 'one' ? 'step' : 'steps'} so far. One build is still running.`,
      differ: (step: number) => `They differ at step ${step}.`,
      nothing: 'nothing',
      uneven:
        'One build was still loading when this run began, so the two started from different states. Replaying both from the same point…',
      interacted:
        'You changed one build from inside it, so the two runs no longer share a starting point. Replay both to compare again.',
      explain:
        'A step is anything a person could notice: a request, a state change, a loading phase, an announcement or a focus move. Timing is left out; order and content must match.',
    },
    measuredNote:
      'Measured in your browser for this visit, with both builds loading at the same time. Numbers change with device, network and cache; reload to measure again.',
    facts: {
      heading: 'At build time',
      caption:
        'Source size and dependencies of each build, counted when this page was built.',
      measure: 'Measure',
      source: 'Source lines (non-blank)',
      files: 'Source files',
      deps: 'Runtime dependencies',
      none: 'None',
      shared: (lines: string) =>
        `Both builds also use the shared spec: ${lines} lines of data, rules, formatting and text that neither build repeats.`,
    },
    harder: {
      heading: 'Where each build was harder to write',
      topic: 'Topic',
      caption: 'What one build gets for free and the other had to do by hand.',
      items: [
        {
          topic: 'Keeping sort order and view toggles',
          react: 'Free: component state survives a data update.',
          vanilla: 'A small memory object keeps them while the body is rebuilt.',
        },
        {
          topic: 'Keeping keyboard focus',
          react: 'Free: a re-rendered button is the same element.',
          vanilla:
            'Rebuildable controls carry a key; focus is restored to the matching one.',
        },
        {
          topic: 'Arming the loading timers on time',
          react: 'Needs useLayoutEffect, or the 300 ms timer starts a frame late.',
          vanilla: 'Armed directly in the same task as the render.',
        },
        {
          topic: 'Download size',
          react: 'The React runtime is most of the bundle.',
          vanilla: 'Only the dashboard itself is shipped.',
        },
      ],
      logLink: 'Read the full divergence log',
    },
  },
  timeline: {
    heading: 'Request timeline',
    hint: 'Drag along the request, or step from change to change, to see what was on screen, what a screen reader had just heard, and where focus was at that moment.',
    waiting: 'Waiting for the dashboard to start.',
    live: 'Follow live',
    lanes: { screen: 'On screen', heard: 'Heard', focus: 'Focus moved' },
    scrubLabel: 'Moment in the request',
    previous: 'Previous change',
    next: 'Next change',
    at: (time: string) => `At ${time}`,
    fields: {
      screen: 'On screen',
      heard: 'Last heard',
      focus: 'Focus',
      request: 'Request',
    },
    heardAt: (time: string, politeness: string) => `${politeness}, at ${time}`,
    nothingHeard: 'Nothing yet',
    focusAt: (time: string) => `moved here at ${time}`,
    focusUntouched: 'Not moved by the dashboard',
    requestIdle: 'None in flight',
    requestInFlight: (attempt: number) => `Attempt ${attempt} in flight`,
    valueText: (time: string, screen: string) => `${time}: ${screen}`,
    screens: {
      nothing: 'Nothing yet',
      reserved: 'Space held, nothing drawn yet',
      previous: 'The previous data, dimmed',
      placeholders: 'Placeholders',
      slowNotice: 'Placeholders and a “taking longer” notice',
      cancelOffered: 'Placeholders and a Cancel button',
      retrying: 'The error panel, trying again',
      dashboard: 'The dashboard',
      empty: 'No results, with “Show all plans”',
      error: 'The error panel, with Try again',
      forbidden: 'The no-access message',
      cancelled: 'Request cancelled, with Load again',
    },
  },

  exportTest: {
    button: 'Export as Playwright test',
    title: 'A Playwright test for these settings',
    body: 'It repeats the screen reader script for this scenario and asserts every announcement and focus move at the moment the spec gives. It runs against this site, or any copy of the lab via LAB_URL.',
    codeLabel: 'Test source',
    copy: 'Copy',
    copied: 'Copied to the clipboard.',
    copyFailed: 'Couldn’t copy. Select the code and copy it instead.',
    download: 'Download',
    close: 'Close',
    custom: 'Custom settings',
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
    readGuide: 'Read the guide',
    position: (index: number, total: number) => `Scenario ${index} of ${total}`,
    settingsTitle: 'Lab settings',
    allScenarios: 'All scenarios',
    previous: 'Previous',
    next: 'Next',
    more: 'More scenarios',
  },

  accessibilityPage: {
    title: 'Accessibility',
    lede: 'This page says what has been tested and how. Automated checks catch only part of what matters, so nothing here is called “accessible” until it has been tested with real assistive technology.',
    scriptBody:
      'For the manual tests below there is a step-by-step script with the exact words each scenario should produce.',
    scriptLink: 'Open the screen reader test script',
    matrixTitle: 'Testing matrix',
    updated: (date: string) => `Last updated ${date}`,
    check: 'Check',
    status: 'Status',
    rows: [
      {
        check: 'axe-core in every scenario, all three languages (automated)',
        status: 'Automated in CI',
      },
      {
        check:
          'Expected screen reader speech, both builds, all three languages (automated)',
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
      'On narrow screens the chart scales down and its axis labels become small; the “Show data as table” view is the readable alternative until a narrow-screen chart layout lands.',
      'Spanish and Arabic translations were drafted by the author. Native-speaker review is skipped for now, as no reviewer is available; corrections are welcome through the translation form.',
    ],
    reportTitle: 'Report a problem',
    reportBody:
      'If something doesn’t work with your setup, please open an issue and include your browser, language and assistive technology.',
    reportLink: 'Open an issue',
  },

  screenReaders: {
    title: 'Screen reader test script',
    lede: 'Automated checks prove the dashboard says what the spec says. Only a person with a real screen reader can tell whether that is pleasant and clear to hear. This is the script for that test: what to do, what you should hear, and the results so far.',
    verified:
      'The expected speech on this page is computed from the spec, not written by hand. On every commit, both builds are checked against it in Chromium, Firefox and WebKit, in all three languages, timing included.',
    howTitle: 'How to run it',
    how: [
      'Open a scenario link below and turn on your screen reader.',
      'Move to the dashboard heading, then do each step without moving focus yourself.',
      'Listen for the same words in the same order. Screen readers add roles and states, such as “heading level 2”; that is expected.',
      '“Polite” messages wait until the screen reader finishes what it is saying. “Assertive” messages interrupt it.',
      'Record what you heard with the result form, including when everything passed.',
    ],
    setupsTitle: 'Setups to cover',
    setups: {
      nvdaFirefox: 'NVDA with Firefox on Windows',
      voiceoverMac: 'VoiceOver with Safari on macOS',
      voiceoverIos: 'VoiceOver with Safari on iPhone',
      talkback: 'TalkBack with Chrome on Android',
    },
    scenariosTitle: 'The script',
    openIn: 'Open in:',
    testIn: 'Playwright test:',
    testFile: (build: string) => `${build} (.spec.ts)`,
    stepLabel: (step: number) => `Step ${step}`,
    actions: {
      open: 'Open the link and wait.',
      replay: (label: string) => `Press “${label}” in the lab controls.`,
      retry: (label: string) => `Press “${label}”.`,
      cancel: (label: string) => `When “${label}” appears, press it.`,
      showAllPlans: (label: string) => `Press “${label}”.`,
    },
    expectLabel: 'You should hear:',
    silence: 'Nothing. Silence is correct here.',
    after: (time: string) => `after ${time}`,
    politeness: { polite: 'polite', assertive: 'assertive' },
    focusMoves: (target: string) => `Focus moves to ${target}.`,
    resultsTitle: 'Results so far',
    resultsCaption:
      'Latest result for each setup and scenario. Each run is recorded in the repository with versions and notes.',
    setupColumn: 'Setup',
    outcomes: {
      pass: 'Pass',
      partial: 'Partly',
      fail: 'Fail',
      untested: 'Not tested yet',
    },
    noRuns:
      'Nobody has run the script with a real screen reader yet. Runs are welcome at any time through the form below.',
    submit: 'Submit a result',
    reviewTitle: 'Spanish and Arabic review',
    reviewBody:
      'The Spanish and Arabic text was drafted by the author. A native-speaker review is skipped for now because no reviewer is available, so both stay marked as unreviewed. If something reads wrong, suggest better wording; every accepted suggestion is credited.',
    reviewLink: 'Suggest a translation fix',
  },
  notFound: {
    eyebrow: '404',
    title: 'An empty state of our own',
    lede: 'The request worked, but nothing lives at this address.',
    back: 'Back to the lab',
  },
};

export type Messages = typeof en;
