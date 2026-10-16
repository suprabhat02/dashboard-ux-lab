import type { Messages } from './i18n';
import { SITE_ORIGIN } from './site';
import {
  scriptFor,
  simulateSession,
  type Heard,
  type TesterAction,
} from './speech-script';
import type { ImplementationId, LabSettings } from './types';

/**
 * Turns any lab settings into a ready-made Playwright test: the tester's session
 * from spec/speech-script.ts, with every announcement and focus move asserted at
 * the moment the spec says it happens. Pure: the lab calls it to offer a download,
 * the build calls it to publish one file per scenario, build and language, and CI
 * runs those published files against both builds.
 *
 * Every string from the catalogues goes through JSON.stringify, so quotes,
 * backticks or right-to-left text can never break the generated source.
 */

export interface ExportRequest {
  readonly settings: LabSettings;
  readonly implementation: ImplementationId;
  readonly messages: Messages;
  /** The lab page this test opens, path and query, e.g. "/es/lab/react/?scenario=slow". */
  readonly labPath: string;
  /** What the test is about: a scenario title, or a description of custom settings. */
  readonly title: string;
  /** A file-name-safe slug, e.g. "slow-react-es". */
  readonly slug: string;
}

export interface ExportedTest {
  readonly fileName: string;
  readonly source: string;
}

/** Room after a scripted moment for the build to write its live region. */
const SETTLE_MS = 60;
/** How long a silent step is watched before asserting that nothing was said. */
const QUIET_MS = 2_000;

const str = (value: string): string => JSON.stringify(value);
const num = (value: number): string =>
  Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '_');

function actionCode(action: TesterAction, t: Messages): string {
  const d = t.dashboard;
  const press = (name: string): string =>
    `await page.getByRole('button', { name: ${str(name)}, exact: true }).click();`;
  switch (action) {
    case 'open':
      return 'await open(page);';
    case 'replay':
      return press(t.lab.replay);
    case 'retry':
      return press(d.error.retry);
    case 'cancel':
      return press(d.loading.cancel);
    case 'showAllPlans':
      return press(d.empty.action);
  }
}

function assertionCode(item: Heard, t: Messages): string {
  const d = t.dashboard;
  if (item.kind === 'speech') {
    const region = item.politeness === 'assertive' ? 'assertive' : 'polite';
    return `await expect(${region}).toHaveText(${str(item.message)});`;
  }
  return item.target === 'title'
    ? `await expect(page.getByRole('heading', { level: 2, name: ${str(d.title)} })).toBeFocused();`
    : `await expect(page.getByRole('button', { name: ${str(d.cancelled.action)} })).toBeFocused();`;
}

function describeAction(action: TesterAction, t: Messages): string {
  const s = t.screenReaders.actions;
  const d = t.dashboard;
  switch (action) {
    case 'open':
      return s.open;
    case 'replay':
      return s.replay(t.lab.replay);
    case 'retry':
      return s.retry(d.error.retry);
    case 'cancel':
      return s.cancel(d.loading.cancel);
    case 'showAllPlans':
      return s.showAllPlans(d.empty.action);
  }
}

/** A line comment that cannot end early or smuggle a newline into code. */
const comment = (text: string): string => `// ${text.replace(/[\r\n]+/g, ' ')}`;

export function exportPlaywrightTest(request: ExportRequest): ExportedTest {
  const { settings, messages: t, labPath, title, implementation } = request;
  const steps = scriptFor(settings);
  const transcript = simulateSession(settings, steps, t.dashboard);
  const build = t.compare.builds[implementation].name;

  const body: string[] = [];
  steps.forEach((step, index) => {
    const heard = transcript[index]?.heard ?? [];
    const next = steps[index + 1];
    body.push(
      '',
      `  ${comment(`${t.screenReaders.stepLabel(index + 1)}: ${describeAction(step.action, t)}`)}`,
    );
    body.push(`  ${actionCode(step.action, t)}`);
    body.push('  await settle(page);');
    let elapsed = 0;
    for (const item of heard) {
      const until = item.atMs + SETTLE_MS;
      if (next?.afterMs !== undefined && until > next.afterMs) break;
      body.push(`  await advance(page, ${num(until - elapsed)});`);
      body.push(`  ${assertionCode(item, t)}`);
      elapsed = until;
    }
    if (heard.length === 0 && index === 0) {
      body.push(`  await advance(page, ${num(QUIET_MS)});`);
      body.push(`  await expect(polite).toHaveText('');`);
      body.push(`  await expect(assertive).toHaveText('');`);
      elapsed = QUIET_MS;
    }
    if (next?.afterMs !== undefined && next.afterMs > elapsed) {
      body.push(`  await advance(page, ${num(next.afterMs - elapsed)});`);
    }
  });

  // Declare only the live regions this test reads, so the file has no unused names.
  const code = body.join('\n');
  const regions = (['polite', 'assertive'] as const)
    .filter((region) => new RegExp(`expect\\(${region}\\)`).test(code))
    .map((region) => `  const ${region} = page.getByTestId('live-${region}');\n`)
    .join('');

  const source = `${comment(`${title} · ${build}`)}
${comment(`What a screen reader should hear, computed from the Dashboard UX Lab spec.`)}
${comment(`Generated from ${SITE_ORIGIN}${labPath}`)}
${comment('Run against another copy of the lab with LAB_URL=http://localhost:4321')}
import { expect, test, type Page } from '@playwright/test';

const LAB_URL = process.env.LAB_URL ?? ${str(SITE_ORIGIN)};
const PATH = ${str(labPath)};

/** Freeze time, so every assertion lands at the moment the spec gives. */
async function open(page: Page): Promise<void> {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
  await page.goto(\`\${LAB_URL}\${PATH}\`);
  await expect(page.getByTestId('live-polite')).toBeAttached();
}

/** Let the page finish queued work (React renders through a MessageChannel). */
async function settle(page: Page): Promise<void> {
  for (let round = 0; round < 2; round += 1) {
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          const channel = new MessageChannel();
          channel.port1.onmessage = () => resolve();
          channel.port2.postMessage(null);
        }),
    );
  }
}

/** Move fake time forward in slices, settling the page after each. */
async function advance(page: Page, ms: number): Promise<void> {
  for (let elapsed = 0; elapsed < ms; elapsed += 100) {
    await page.clock.runFor(Math.min(100, ms - elapsed));
    await settle(page);
  }
}

test(${str(`${title} (${build}): what a screen reader hears`)}, async ({ page }) => {
  test.setTimeout(120_000);
${regions}${body.join('\n')}
});
`;
  return { fileName: `${request.slug}.spec.ts`, source };
}
