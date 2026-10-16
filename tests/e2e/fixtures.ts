import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/**
 * Fake time that moves only when the test says so. `clock.install()` alone keeps
 * time flowing in real time, so on a busy CI runner a 300ms boundary can pass
 * before the test looks. Call before `page.goto`.
 */
export async function freezeClock(page: Page): Promise<void> {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
}

export const dashboard = (page: Page) =>
  page.locator('section.dash[data-implementation]');

export async function waitForView(page: Page, view: string): Promise<void> {
  await expect(dashboard(page)).toHaveAttribute('data-view', view);
}

/** The last thing the dashboard said through either live region. */
export async function lastAnnouncement(page: Page): Promise<string> {
  const polite = (await page.getByTestId('live-polite').textContent()) ?? '';
  const assertive = (await page.getByTestId('live-assertive').textContent()) ?? '';
  return `${polite}${assertive}`.trim();
}

/** Announcements are debounced (TIMING.announceDebounceMs), so wait for the final text. */
export async function expectAnnouncement(page: Page, text: string): Promise<void> {
  await expect.poll(() => lastAnnouncement(page)).toBe(text);
}

/** Zero serious/critical axe violations. Automated checks are a floor, not proof. */
export async function expectNoSeriousA11yViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(
    serious.map(
      (v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`,
    ),
  ).toEqual([]);
}

/**
 * Advance the fake clock in slices, and after each one let the page finish the
 * work it queued. React schedules renders through a MessageChannel, which the fake
 * clock does not control: under load that task can still be queued when the next
 * slice starts, and the render (with its telemetry timestamp) lands a slice late.
 * A MessageChannel round trip in the page runs after React's queued task (same task
 * source, first in, first out), and the clock is paused meanwhile, so timings stay
 * exact whatever the slice size.
 */
const SLICE_MS = 100;
export async function settlePage(page: Page): Promise<void> {
  for (let round = 0; round < 2; round += 1) {
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          const channel = new MessageChannel();
          channel.port1.onmessage = () => {
            resolve();
          };
          channel.port2.postMessage(null);
        }),
    );
  }
}
export async function advance(page: Page, ms: number): Promise<void> {
  for (let elapsed = 0; elapsed < ms; elapsed += SLICE_MS) {
    await page.clock.runFor(Math.min(SLICE_MS, ms - elapsed));
    await settlePage(page);
  }
}
