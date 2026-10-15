import { expect, test } from '@playwright/test';
import { COPY } from '../../src/spec/copy';
import { dashboard, expectAnnouncement, waitForView } from './fixtures';
import { IMPLEMENTATIONS, labPath } from './implementations';

for (const impl of IMPLEMENTATIONS) {
  test.describe(`${impl}: lab interactions`, () => {
    test('presets update the URL, the dashboard and the implementation switch', async ({
      page,
    }) => {
      await page.goto(labPath(impl));
      await waitForView(page, 'success');
      await page.getByRole('radio', { name: /Error with retry/ }).check();
      await expect(page).toHaveURL(/\?scenario=error$/);
      await waitForView(page, 'error');
      await expect(page.getByRole('link', { name: /^Vanilla/ })).toHaveAttribute(
        'href',
        '/lab/vanilla/?scenario=error',
      );
    });

    test('rapid switching only ever renders the last request', async ({ page }) => {
      await page.goto(labPath(impl));
      await waitForView(page, 'success');
      for (const name of [
        /Slow response/,
        /Error with retry/,
        /Restricted access/,
        /Loading/,
        /Empty results/,
      ]) {
        await page.getByRole('radio', { name }).check();
      }
      await waitForView(page, 'success');
      await expect(
        page.getByRole('heading', { name: COPY.empty.title('legacy') }),
      ).toBeVisible();
      await page.waitForTimeout(3_000); // let any stale timers fire; nothing may change
      await expect(
        page.getByRole('heading', { name: COPY.empty.title('legacy') }),
      ).toBeVisible();
      await expectAnnouncement(page, COPY.empty.announce('legacy'));
    });

    test('keyboard: arrow keys move through presets and re-run the request', async ({
      page,
    }) => {
      await page.goto(labPath(impl));
      await waitForView(page, 'success');
      await page.getByRole('radio', { name: /^Loaded/ }).focus();
      await page.keyboard.press('ArrowDown');
      await expect(page.getByRole('radio', { name: /^Loading/ })).toBeChecked();
      await expect(page).toHaveURL(/scenario=loading/);
    });

    test('the in-dashboard filter updates the URL and the chrome', async ({ page }) => {
      await page.goto(labPath(impl));
      await waitForView(page, 'success');
      await dashboard(page)
        .getByRole('combobox', { name: 'Plan' })
        .selectOption('enterprise');
      await expect(page).toHaveURL(/plan=enterprise/);
      await expect(page.locator('select[name="plan"]')).toHaveValue('enterprise');
      await expect(page.getByRole('table', { name: /Enterprise/ })).toBeVisible();
      await expectAnnouncement(page, COPY.loaded.announce('enterprise'));
    });

    test('sortable table exposes aria-sort on the sorted column only', async ({
      page,
    }) => {
      await page.goto(labPath(impl));
      await waitForView(page, 'success');
      const table = page.getByRole('table', { name: /accounts ·/ });
      await expect(table.locator('th[aria-sort]')).toHaveCount(1);
      await expect(table.getByRole('columnheader', { name: 'MRR' })).toHaveAttribute(
        'aria-sort',
        'descending',
      );
      await table.getByRole('button', { name: 'Account' }).click();
      await expect(table.getByRole('columnheader', { name: 'Account' })).toHaveAttribute(
        'aria-sort',
        'ascending',
      );
      await expect(table.locator('th[aria-sort]')).toHaveCount(1);
    });

    test('chart data is available as a table behind a disclosure', async ({ page }) => {
      await page.goto(labPath(impl));
      await waitForView(page, 'success');
      const toggle = page.getByRole('button', { name: COPY.widgets.showTable });
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await toggle.click();
      await expect(
        page.getByRole('button', { name: COPY.widgets.hideTable }),
      ).toHaveAttribute('aria-expanded', 'true');
      await expect(
        page.getByRole('table', { name: COPY.widgets.revenueCaption }),
      ).toBeVisible();
    });

    test('inspector records transitions and announcements; tabs follow APG keys', async ({
      page,
    }) => {
      await page.goto(labPath(impl));
      await waitForView(page, 'success');
      await page.getByRole('button', { name: /Replay request/ }).click();
      await waitForView(page, 'success');
      await expect(page.locator('[data-log="timeline"]')).toContainText(
        'loading → success',
      );

      const timelineTab = page.getByRole('tab', { name: /State timeline/ });
      await timelineTab.focus();
      await page.keyboard.press('ArrowRight');
      const srTab = page.getByRole('tab', { name: /Screen reader/ });
      await expect(srTab).toBeFocused();
      await expect(srTab).toHaveAttribute('aria-selected', 'true');
      await expect(page.locator('[data-log="announce"]')).toContainText(
        COPY.loaded.announce('all'),
      );
    });

    test('@responsive mobile: controls collapse behind a disclosure', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      await page.goto(labPath(impl));
      const toggle = page.getByRole('button', { name: /Scenario:/ });
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await expect(page.getByRole('radio', { name: /^Loaded/ })).toBeHidden();
      await toggle.click();
      await expect(page.getByRole('radio', { name: /^Loaded/ })).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  });
}

test('content pages have a single h1 and no serious axe violations', async ({ page }) => {
  const { expectNoSeriousA11yViolations } = await import('./fixtures');
  for (const path of [
    '/',
    '/scenarios/',
    '/scenarios/slow/',
    '/accessibility/',
    '/lab/vanilla/',
  ]) {
    await page.goto(path);
    await expect(page.locator('h1')).toHaveCount(1);
    await expectNoSeriousA11yViolations(page);
  }
});
