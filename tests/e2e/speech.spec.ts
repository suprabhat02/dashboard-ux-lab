import { expect, test, type Page } from '@playwright/test';
import { SCENARIO_IDS } from '../../src/spec/scenarios';
import {
  SPEECH_SCRIPTS,
  speechScript,
  type TesterAction,
} from '../../src/spec/speech-script';
import { advance, dashboard, freezeClock, settlePage } from './fixtures';
import { labPath, VARIANTS, type Variant } from './implementations';

/**
 * The published screen reader script (/accessibility/screen-readers/) is computed
 * from the spec. This suite holds both builds to it: for every scenario, in every
 * language, the tester's steps produce exactly the scripted announcements (words,
 * politeness, order, and timing within a tolerance) and focus moves.
 */

/** Timers in the builds fire within a few ms of the simulated ones. */
const TOLERANCE_MS = 100;
/** Long enough for any scripted step to fall silent (the slow request is 12 s). */
const SILENCE_MS = 20_000;

interface Observed {
  readonly kind: 'speech' | 'focus';
  readonly atMs: number;
  readonly text: string;
  readonly politeness?: string;
}

async function recordTelemetry(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const log: { kind: string; at: number; text?: string; politeness?: string }[] = [];
    Object.assign(window, { __heard: log });
    window.addEventListener('dux:telemetry', (event) => {
      const detail = (event as CustomEvent<Record<string, unknown>>).detail;
      if (detail.type === 'announce') {
        log.push({
          kind: 'speech',
          at: detail.at as number,
          text: detail.message as string,
          politeness: detail.politeness as string,
        });
      } else if (detail.type === 'focus') {
        log.push({
          kind: 'focus',
          at: detail.at as number,
          text: detail.target as string,
        });
      }
    });
  });
}

/** Everything heard since `since` (page time), relative to it. */
async function heardSince(page: Page, since: number): Promise<Observed[]> {
  return page.evaluate((start) => {
    const log = (
      window as unknown as {
        __heard: { kind: string; at: number; text: string; politeness?: string }[];
      }
    ).__heard;
    return log
      .filter((item) => item.at >= start)
      .map((item) => ({
        kind: item.kind as 'speech' | 'focus',
        atMs: item.at - start,
        text: item.text,
        ...(item.politeness ? { politeness: item.politeness } : {}),
      }));
  }, since);
}

async function act(page: Page, v: Variant, action: TesterAction): Promise<void> {
  const d = v.t.dashboard;
  const names: Record<Exclude<TesterAction, 'open'>, string> = {
    replay: v.t.lab.replay,
    retry: d.error.retry,
    cancel: d.loading.cancel,
    showAllPlans: d.empty.action,
  };
  if (action === 'open') return;
  await page.getByRole('button', { name: names[action], exact: true }).click();
}

for (const v of VARIANTS) {
  const d = v.t.dashboard;
  const focusName = {
    title: d.focus.heading(d.title),
    reload: d.focus.button(d.cancelled.action),
  };

  test.describe(`${v.name}: screen reader script`, () => {
    // Each test walks up to ~40 s of scripted time, slice by slice.
    test.describe.configure({ timeout: 120_000 });
    for (const scenario of SCENARIO_IDS) {
      test(`${scenario}: says exactly what the script says`, async ({ page }) => {
        const steps = SPEECH_SCRIPTS[scenario];
        const expected = speechScript(scenario, d);
        await recordTelemetry(page);
        await freezeClock(page);
        await page.goto(labPath(v, `scenario=${scenario}`));
        await expect(dashboard(page)).toHaveAttribute('data-view', 'loading');

        for (const [index, step] of steps.entries()) {
          const start = await page.evaluate(() => performance.now());
          await act(page, v, step.action);
          await settlePage(page);
          const next = steps[index + 1];
          await advance(page, next?.afterMs ?? SILENCE_MS);

          const observed = await heardSince(page, start);
          const until = next?.afterMs ?? SILENCE_MS;
          const want = (expected[index]?.heard ?? []).filter(
            (item) => item.atMs <= until,
          );
          // Words, politeness and order must match exactly.
          expect(
            observed.map((item) => [item.kind, item.text, item.politeness ?? null]),
            `step ${String(index + 1)} (${step.action})`,
          ).toEqual(
            want.map((item) =>
              item.kind === 'speech'
                ? [item.kind, item.message, item.politeness]
                : [item.kind, focusName[item.target], null],
            ),
          );
          // And each happens when the script says, within a few timer ticks.
          observed.forEach((item, position) => {
            const target = want[position]?.atMs ?? Number.NaN;
            expect(
              Math.abs(item.atMs - target),
              `${item.text} at ${String(item.atMs)} ms`,
            ).toBeLessThanOrEqual(TOLERANCE_MS);
          });
          // Next step starts from where this one stopped.
          await page.evaluate(() => {
            const log = (window as unknown as { __heard: unknown[] }).__heard;
            log.length = 0;
          });
        }
      });
    }
  });
}
