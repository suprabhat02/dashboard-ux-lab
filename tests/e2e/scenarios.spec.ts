import { expect, test } from '@playwright/test';
import { COPY } from '../../src/spec/copy';
import { SCENARIOS } from '../../src/spec/scenarios';
import { TIMING } from '../../src/spec/timing';
import {
  dashboard,
  expectNoSeriousA11yViolations,
  lastAnnouncement,
  waitForView,
} from './fixtures';
import { IMPLEMENTATIONS, labPath } from './implementations';

for (const impl of IMPLEMENTATIONS) {
  test.describe(`${impl}: scenarios`, () => {
    test('loaded: shows KPIs, chart and table; announces nothing on first load', async ({
      page,
    }) => {
      await page.goto(labPath(impl));
      await waitForView(page, 'success');
      await expect(dashboard(page).locator('.kpi')).toHaveCount(4);
      await expect(
        page.getByRole('img', { name: /^Bar chart\. Monthly recurring revenue/ }),
      ).toBeVisible();
      await expect(
        page.getByRole('table', { name: /accounts · All plans/ }),
      ).toBeVisible();
      await page.waitForTimeout(TIMING.announceDebounceMs + 100);
      expect(await lastAnnouncement(page)).toBe('');
    });

    test('loading: no skeleton before 300ms, skeleton after, then content', async ({
      page,
    }) => {
      await page.clock.install();
      await page.goto(labPath(impl, 'scenario=loading'));
      // The request starts when the implementation mounts; advance time only after that.
      await expect(dashboard(page)).toHaveAttribute('data-phase', 'pending');
      await expect(dashboard(page).locator('.dash__content')).toHaveAttribute(
        'data-reserve',
      );
      await page.clock.runFor(TIMING.skeletonDelayMs + 20);
      await expect(dashboard(page)).toHaveAttribute('data-phase', 'skeleton');
      await expect(dashboard(page).locator('.dash__content')).toHaveAttribute(
        'aria-busy',
        'true',
      );
      await page.clock.runFor(2_000);
      await waitForView(page, 'success');
      await expect(dashboard(page).locator('.dash__content')).toHaveAttribute(
        'aria-busy',
        'false',
      );
    });

    test('slow: escalates at 3s, offers cancel at 8s, cancel recovers focus', async ({
      page,
    }) => {
      await page.clock.install();
      await page.goto(labPath(impl, 'scenario=slow'));
      await expect(dashboard(page)).toHaveAttribute('data-view', 'loading');
      await page.clock.runFor(TIMING.slowAfterMs + 20);
      await expect(page.getByText(COPY.loading.slowTitle)).toBeVisible();
      await expect(page.getByRole('button', { name: COPY.loading.cancel })).toHaveCount(
        0,
      );

      await page.clock.runFor(TIMING.stalledAfterMs - TIMING.slowAfterMs);
      const cancel = page.getByRole('button', { name: COPY.loading.cancel });
      await expect(cancel).toBeVisible();
      await cancel.focus();
      await page.keyboard.press('Enter');

      await waitForView(page, 'cancelled');
      await expect(
        page.getByRole('button', { name: COPY.cancelled.action }),
      ).toBeFocused();
      // The cancelled request must never render, even when its timer would have fired.
      await page.clock.runFor(5_000);
      await waitForView(page, 'cancelled');
    });

    test('error: explains, shows request ID, retry keeps focus, success moves focus to heading', async ({
      page,
    }) => {
      await page.goto(labPath(impl, 'scenario=error'));
      await waitForView(page, 'error');
      await expect(page.getByRole('heading', { name: COPY.error.title })).toBeVisible();
      await expect(dashboard(page).locator('.state__meta code')).toHaveText(/^req_/);

      const retry = page.getByRole('button', { name: COPY.error.retry });
      await retry.focus();
      await page.keyboard.press('Enter');
      const retrying = page.getByRole('button', { name: COPY.error.retrying });
      await expect(retrying).toBeFocused();
      await expect(retrying).toHaveAttribute('aria-disabled', 'true');

      await waitForView(page, 'success');
      await expect(
        page.getByRole('heading', { level: 2, name: COPY.dashboardTitle }),
      ).toBeFocused();
    });

    test('error: a second retry press while retrying sends no extra request', async ({
      page,
    }) => {
      await page.goto(labPath(impl, 'latency=1500&failure=always'));
      await waitForView(page, 'error');
      // Three activations in the same task: only the first may start a request.
      await dashboard(page)
        .locator('.state--error button')
        .evaluate((button: HTMLButtonElement) => {
          button.click();
          button.click();
          button.click();
        });
      await waitForView(page, 'loading');
      await waitForView(page, 'error');
      const timeline = page.locator('[data-log="timeline"]');
      await expect(timeline).toContainText('request #2 sent');
      await expect(timeline).not.toContainText('request #3');
    });

    test('restricted: explains access, offers no retry', async ({ page }) => {
      await page.goto(labPath(impl, 'scenario=restricted'));
      await waitForView(page, 'forbidden');
      await expect(
        page.getByRole('heading', { name: COPY.forbidden.title }),
      ).toBeVisible();
      await expect(dashboard(page).getByRole('button')).toHaveCount(0);
    });

    test('viewer role: totals visible, account table restricted in place', async ({
      page,
    }) => {
      await page.goto(labPath(impl, 'role=viewer'));
      await waitForView(page, 'success');
      await expect(dashboard(page).locator('.kpi')).toHaveCount(4);
      await expect(page.getByText(COPY.widgetRestricted.title)).toBeVisible();
      await expect(page.getByRole('table', { name: /accounts ·/ })).toHaveCount(0);
    });

    test('empty: explains the filter and recovers to all plans', async ({ page }) => {
      await page.goto(labPath(impl, 'scenario=empty'));
      await waitForView(page, 'success');
      await expect(
        page.getByRole('heading', { name: COPY.empty.title('legacy') }),
      ).toBeVisible();
      await page.getByRole('button', { name: COPY.empty.action }).click();
      await expect(dashboard(page).locator('.kpi')).toHaveCount(4);
      await expect(page).toHaveURL(new RegExp(`${labPath(impl)}$`));
      await expect(
        page.getByRole('heading', { level: 2, name: COPY.dashboardTitle }),
      ).toBeFocused();
    });

    for (const scenario of SCENARIOS) {
      test(`axe: no serious violations in "${scenario.id}"`, async ({ page }) => {
        await page.goto(labPath(impl, `scenario=${scenario.id}&latency=0`));
        await expect(dashboard(page)).not.toHaveAttribute('data-view', 'loading');
        await expectNoSeriousA11yViolations(page);
      });
    }
  });
}

test.describe('dark theme', () => {
  test.use({ colorScheme: 'dark' });
  for (const impl of IMPLEMENTATIONS) {
    for (const id of ['loaded', 'error', 'restricted', 'slow'] as const) {
      test(`${impl}: axe in dark theme, "${id}"`, async ({ page }) => {
        await page.goto(labPath(impl, `scenario=${id}&latency=0`));
        await expect(dashboard(page)).not.toHaveAttribute('data-view', 'loading');
        await expectNoSeriousA11yViolations(page);
      });
    }
  }
});
