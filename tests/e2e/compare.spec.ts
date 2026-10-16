import '../../src/spec/i18n/all';
import { expect, test, type Page } from '@playwright/test';
import { getMessages, LOCALES, localizePath } from '../../src/spec/i18n';
import { expectNoSeriousA11yViolations } from './fixtures';

const BUILDS = ['react', 'vanilla'] as const;
const card = (page: Page, build: (typeof BUILDS)[number]) =>
  page.locator(`[data-build="${build}"]`);
const frameDash = (page: Page, build: (typeof BUILDS)[number]) =>
  page
    .frameLocator(`[data-build="${build}"] iframe`)
    .locator('section.dash[data-implementation]');
const root = (page: Page) => page.locator('[data-compare]');
/** The verdict of a finished run, not a passing state mid-run. */
const expectFinalAgreement = async (page: Page) => {
  await expect(root(page)).toHaveAttribute('data-run', 'final');
  await expect(root(page)).toHaveAttribute('data-agreement', 'agree');
};

for (const locale of LOCALES) {
  const t = getMessages(locale);
  const c = t.compare;
  const path = (query = '') => `${localizePath(locale, '/compare/')}${query}`;

  test.describe(`${locale}: compare`, () => {
    test('both builds start, measure themselves and agree on first load', async ({
      page,
    }) => {
      await page.goto(path());
      for (const build of BUILDS) {
        await expect(frameDash(page, build)).toHaveAttribute('data-view', 'success');
        await expect(card(page, build).locator('[data-metric="ready"]')).not.toHaveText(
          c.metrics.measuring,
        );
        await expect(card(page, build).locator('[data-metric="script"]')).not.toHaveText(
          c.metrics.measuring,
        );
      }
      await expectFinalAgreement(page);
      // The finished run is spoken once, through the status region.
      await expect(page.locator('[data-verdict-live]')).not.toBeEmpty();
    });

    test('one set of controls drives both builds', async ({ page }) => {
      await page.goto(path());
      await expectFinalAgreement(page);
      await page
        .getByRole('radio', { name: t.scenarios.error.title, exact: true })
        .check();
      for (const build of BUILDS) {
        await expect(frameDash(page, build)).toHaveAttribute('data-view', 'error');
      }
      await expect(page).toHaveURL(/scenario=error/);
      await expectFinalAgreement(page);
      await page.getByRole('button', { name: c.replay }).click();
      await expectFinalAgreement(page);
    });

    test('switching while one build is busy is not reported as a difference', async ({
      page,
    }) => {
      await page.goto(path('?scenario=slow'));
      await expect(card(page, 'react').locator('[data-metric="ready"]')).not.toHaveText(
        c.metrics.measuring,
      );
      // Both are mid-request on a slow response; switch straight away.
      await page
        .getByRole('radio', { name: t.scenarios.error.title, exact: true })
        .check();
      await expectFinalAgreement(page);
      for (const build of BUILDS) {
        await expect(frameDash(page, build)).toHaveAttribute('data-view', 'error');
      }
    });

    test('a shared link opens both builds on the same scenario', async ({ page }) => {
      await page.goto(path('?scenario=restricted'));
      await expect(
        page.getByRole('radio', { name: t.scenarios.restricted.title, exact: true }),
      ).toBeChecked();
      for (const build of BUILDS) {
        await expect(frameDash(page, build)).toHaveAttribute('data-view', 'forbidden');
      }
    });

    test('keyboard and screen reader reach one build at a time', async ({ page }) => {
      await page.goto(path());
      const frame = (build: (typeof BUILDS)[number]) =>
        card(page, build).locator('iframe');
      await expect
        .poll(() => frame('vanilla').evaluate((el) => (el as HTMLIFrameElement).inert))
        .toBe(true);
      expect(await frame('react').evaluate((el) => (el as HTMLIFrameElement).inert)).toBe(
        false,
      );

      await card(page, 'vanilla').getByRole('button', { name: c.useThis }).click();
      expect(
        await frame('vanilla').evaluate((el) => (el as HTMLIFrameElement).inert),
      ).toBe(false);
      expect(await frame('react').evaluate((el) => (el as HTMLIFrameElement).inert)).toBe(
        true,
      );
      await expect(
        page.getByRole('radio', { name: c.builds.vanilla.name, exact: true }),
      ).toBeChecked();
    });

    test('axe: no serious violations', async ({ page }) => {
      await page.goto(path());
      await expectFinalAgreement(page);
      await expectNoSeriousA11yViolations(page);
    });

    test('embedded builds are bare and never indexed', async ({ page }) => {
      for (const build of BUILDS) {
        await page.goto(localizePath(locale, `/embed/${build}/`));
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
          'content',
          'noindex',
        );
        await expect(page.locator('.site-header')).toHaveCount(0);
        await expect(page.locator('section.dash[data-implementation]')).toHaveAttribute(
          'data-view',
          'success',
        );
      }
    });
  });
}

test('compare: dark theme passes axe too', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/compare/');
  await expectFinalAgreement(page);
  await expectNoSeriousA11yViolations(page);
});
