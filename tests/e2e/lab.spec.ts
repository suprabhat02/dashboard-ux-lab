import { expect, test } from '@playwright/test';
import { LOCALE_META, LOCALES, localizePath } from '../../src/spec/i18n';
import {
  dashboard,
  expectAnnouncement,
  expectNoSeriousA11yViolations,
  waitForView,
} from './fixtures';
import { contains, labPath, startsWith, VARIANTS } from './implementations';

for (const v of VARIANTS) {
  const d = v.t.dashboard;
  const s = v.t.scenarios;

  test.describe(`${v.name}: lab interactions`, () => {
    test('presets update the URL, the dashboard and the implementation switch', async ({
      page,
    }) => {
      await page.goto(labPath(v));
      await waitForView(page, 'success');
      await page.getByRole('radio', { name: startsWith(s.error.title) }).check();
      await expect(page).toHaveURL(/\?scenario=error$/);
      await waitForView(page, 'error');
      await expect(page.locator('[data-impl-link="vanilla"]').first()).toHaveAttribute(
        'href',
        `${localizePath(v.locale, '/lab/vanilla/')}?scenario=error`,
      );
    });

    test('rapid switching only ever renders the last request', async ({ page }) => {
      await page.goto(labPath(v));
      await waitForView(page, 'success');
      for (const id of ['slow', 'error', 'restricted', 'loading', 'empty'] as const) {
        await page.getByRole('radio', { name: startsWith(s[id].title) }).check();
      }
      await waitForView(page, 'success');
      const emptyHeading = page.getByRole('heading', {
        name: d.empty.title(d.plans.legacy),
      });
      await expect(emptyHeading).toBeVisible();
      await page.waitForTimeout(3_000); // let any stale timers fire; nothing may change
      await expect(emptyHeading).toBeVisible();
      await expectAnnouncement(page, d.empty.announce(d.plans.legacy));
    });

    test('keyboard: arrow keys move through presets and re-run the request', async ({
      page,
    }) => {
      await page.goto(labPath(v));
      await waitForView(page, 'success');
      await page.getByRole('radio', { name: startsWith(s.loaded.title) }).focus();
      await page.keyboard.press('ArrowDown');
      await expect(
        page.getByRole('radio', { name: startsWith(s.loading.title) }),
      ).toBeChecked();
      await expect(page).toHaveURL(/scenario=loading/);
    });

    test('the in-dashboard filter updates the URL and the chrome', async ({ page }) => {
      await page.goto(labPath(v));
      await waitForView(page, 'success');
      await dashboard(page)
        .getByRole('combobox', { name: d.filterLabel })
        .selectOption('enterprise');
      await expect(page).toHaveURL(/plan=enterprise/);
      await expect(page.locator('select[name="plan"]')).toHaveValue('enterprise');
      await expect(
        page.getByRole('table', { name: contains(d.plans.enterprise) }),
      ).toBeVisible();
      await expectAnnouncement(page, d.loaded.announce(d.plans.enterprise));
    });

    test('sortable table exposes aria-sort on the sorted column only', async ({
      page,
    }) => {
      await page.goto(labPath(v));
      await waitForView(page, 'success');
      const table = dashboard(page).locator('.table-scroll--fixed table');
      await expect(table.locator('th[aria-sort]')).toHaveCount(1);
      await expect(
        table.getByRole('columnheader', { name: d.columns.mrr }),
      ).toHaveAttribute('aria-sort', 'descending');
      await table.getByRole('button', { name: d.columns.name }).click();
      await expect(
        table.getByRole('columnheader', { name: d.columns.name }),
      ).toHaveAttribute('aria-sort', 'ascending');
      await expect(table.locator('th[aria-sort]')).toHaveCount(1);
    });

    test('chart data is available as a table behind a disclosure', async ({ page }) => {
      await page.goto(labPath(v));
      await waitForView(page, 'success');
      const toggle = page.getByRole('button', { name: d.showTable });
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await toggle.click();
      await expect(page.getByRole('button', { name: d.hideTable })).toHaveAttribute(
        'aria-expanded',
        'true',
      );
      await expect(page.getByRole('table', { name: d.revenueCaption })).toBeVisible();
    });

    test('inspector records transitions and announcements; tabs follow APG keys', async ({
      page,
    }) => {
      await page.goto(labPath(v));
      await waitForView(page, 'success');
      await page.getByRole('button', { name: startsWith(v.t.lab.replay) }).click();
      await waitForView(page, 'success');
      await expect(page.locator('[data-log="timeline"]')).toContainText(
        'loading → success',
      );

      const timelineTab = page.getByRole('tab', {
        name: startsWith(v.t.inspector.tabs.timeline),
      });
      await timelineTab.focus();
      // APG tabs: ArrowRight moves to the next tab in LTR and the previous one in RTL.
      await page.keyboard.press(
        LOCALE_META[v.locale].dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight',
      );
      const srTab = page.getByRole('tab', {
        name: startsWith(v.t.inspector.tabs.announce),
      });
      await expect(srTab).toBeFocused();
      await expect(srTab).toHaveAttribute('aria-selected', 'true');
      await expect(page.locator('[data-log="announce"]')).toContainText(
        d.loaded.announce(d.plans.all),
      );
    });

    test('@responsive mobile: controls collapse behind a disclosure', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      await page.goto(labPath(v));
      const toggle = page.getByRole('button', { name: startsWith(v.t.lab.railToggle) });
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await expect(
        page.getByRole('radio', { name: startsWith(s.loaded.title) }),
      ).toBeHidden();
      await toggle.click();
      await expect(
        page.getByRole('radio', { name: startsWith(s.loaded.title) }),
      ).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  });
}

test.describe('internationalisation', () => {
  for (const locale of LOCALES) {
    const meta = LOCALE_META[locale];

    test(`${locale}: document language, direction and hreflang alternates`, async ({
      page,
    }) => {
      await page.goto(localizePath(locale, '/lab/react/'));
      await expect(page.locator('html')).toHaveAttribute('lang', meta.htmlLang);
      await expect(page.locator('html')).toHaveAttribute('dir', meta.dir);
      await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(
        LOCALES.length + 1,
      );
    });

    test(`${locale}: content pages have one h1 and no serious axe violations`, async ({
      page,
    }) => {
      for (const path of [
        '/',
        '/scenarios/',
        '/scenarios/slow/',
        '/accessibility/',
        '/lab/vanilla/',
      ]) {
        await page.goto(localizePath(locale, path));
        await expect(page.locator('html')).toHaveAttribute('lang', meta.htmlLang);
        await expect(page.locator('h1')).toHaveCount(1);
        await expectNoSeriousA11yViolations(page);
      }
    });
  }

  test('@responsive no page scrolls sideways at 320px, in any language', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    for (const locale of LOCALES) {
      for (const path of ['/', '/lab/react/', '/scenarios/slow/', '/accessibility/']) {
        await page.goto(localizePath(locale, path));
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(overflow, `${locale} ${path}`).toBeLessThanOrEqual(0);
      }
    }
  });

  test('@responsive the header stays on one row at 320px in every language', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    for (const locale of LOCALES) {
      await page.goto(localizePath(locale, '/lab/react/'));
      const header = await page.locator('.site-header__inner').boundingBox();
      expect(header?.height, locale).toBeLessThanOrEqual(64);
    }
  });

  test('header dropdowns: theme choice applies and Escape returns focus', async ({
    page,
  }) => {
    await page.goto('/');
    const trigger = page.locator('[aria-controls="menu-theme"]');
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await page.locator('[data-theme-option="dark"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('[data-theme-option="dark"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.keyboard.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();
    // The choice survives navigation.
    await page.goto('/scenarios/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('switching language keeps the page and the lab settings', async ({ page }) => {
    await page.goto(`${localizePath('en', '/lab/react/')}?scenario=empty`);
    await page.locator('[aria-controls="menu-language"]').click();
    await page.locator('[data-locale-link][hreflang="ar"]').click();
    await expect(page).toHaveURL(/\/ar\/lab\/react\/\?scenario=empty$/);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('section.dash[data-implementation]')).toHaveAttribute(
      'data-view',
      'success',
    );
  });

  test('ar: the chart mirrors (newest month on the left)', async ({ page }) => {
    await page.goto(`${localizePath('ar', '/lab/react/')}?latency=0`);
    const bars = dashboard(page).locator('.chart__bar');
    await expect(bars).toHaveCount(12);
    const first = Number(await bars.first().getAttribute('x'));
    const latest = Number(await bars.last().getAttribute('x'));
    expect(latest).toBeLessThan(first);
  });
});
