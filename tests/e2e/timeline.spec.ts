import { expect, test, type Page } from '@playwright/test';
import {
  advance,
  expectNoSeriousA11yViolations,
  freezeClock,
  settlePage,
} from './fixtures';
import { labPath, VARIANTS } from './implementations';

/**
 * The lab's request timeline (Phase 4): it records the build on the page, says
 * what was true at any moment, and exports the session as a Playwright test.
 * Run on a fake clock, so every moment is exact.
 */

const fact = (page: Page, name: 'screen' | 'heard' | 'focus' | 'request') =>
  page.locator(`[data-tl-fact="${name}"]`);

for (const v of VARIANTS) {
  const tt = v.t.timeline;
  const d = v.t.dashboard;

  test.describe(`${v.name}: request timeline`, () => {
    test('follows the run live, then answers for any earlier moment', async ({
      page,
    }) => {
      await freezeClock(page);
      await page.goto(labPath(v, 'scenario=slow'));
      await expect(page.getByTestId('live-polite')).toBeAttached();
      await settlePage(page);
      await advance(page, 3_500);

      // Live: the latest moment, with the slow notice just announced.
      const live = page.getByRole('button', { name: tt.live });
      await expect(live).toHaveAttribute('aria-pressed', 'true');
      await expect(fact(page, 'screen')).toHaveText(tt.screens.slowNotice);
      await expect(fact(page, 'heard')).toContainText(d.loading.slowTitle);
      await expect(fact(page, 'request')).toHaveText(tt.requestInFlight(1));

      // Step back past the announcement and the 3 s boundary: placeholders, unheard.
      const previous = page.getByRole('button', { name: tt.previous });
      await previous.click();
      await previous.click();
      await previous.click();
      await expect(live).toHaveAttribute('aria-pressed', 'false');
      await expect(fact(page, 'screen')).toHaveText(tt.screens.placeholders);
      await expect(fact(page, 'heard')).toHaveText(tt.nothingHeard);

      // The scrubber says the same in words, for keyboard and screen reader users.
      const scrubber = page.getByRole('slider', { name: tt.scrubLabel });
      await scrubber.focus();
      await page.keyboard.press('Home');
      await expect(scrubber).toHaveAttribute('aria-valuetext', /./);
      await page.keyboard.press('End');
      await expect(scrubber).toHaveAttribute(
        'aria-valuetext',
        new RegExp(tt.screens.slowNotice.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );

      // Following live again picks the run back up.
      await live.click();
      await expect(live).toHaveAttribute('aria-pressed', 'true');
    });

    test('a focus move and its announcement land on the timeline', async ({ page }) => {
      await freezeClock(page);
      await page.goto(labPath(v, 'scenario=error'));
      await expect(page.getByTestId('live-polite')).toBeAttached();
      await settlePage(page);
      await advance(page, 1_500);
      await page.getByRole('button', { name: d.error.retry, exact: true }).click();
      await settlePage(page);
      await advance(page, 1_500);
      await expect(fact(page, 'screen')).toHaveText(tt.screens.dashboard);
      await expect(fact(page, 'focus')).toContainText(d.focus.heading(d.title));
      await expect(fact(page, 'heard')).toContainText(d.loaded.announce(d.plans.all));
    });

    test('exports the session as a Playwright test', async ({ page }) => {
      await page.goto(labPath(v, 'scenario=empty'));
      const opener = page.getByRole('button', { name: v.t.exportTest.button });
      await opener.click();
      const dialog = page.getByRole('dialog', { name: v.t.exportTest.title });
      await expect(dialog).toBeVisible();
      await expect(
        dialog.getByRole('link', { name: v.t.exportTest.download }),
      ).toHaveAttribute('download', `empty-${v.impl}-${v.locale}.spec.ts`);
      await expect(dialog.locator('[data-export-code]')).toContainText(
        JSON.stringify(labPath(v, 'scenario=empty')),
      );
      await expectNoSeriousA11yViolations(page);
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(opener).toBeFocused();
    });
  });
}
