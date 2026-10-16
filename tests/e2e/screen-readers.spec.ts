import '../../src/spec/i18n/all';
import { expect, test } from '@playwright/test';
import { getMessages, LOCALES, localizePath } from '../../src/spec/i18n';
import { SCENARIOS } from '../../src/spec/scenarios';
import { AT_SETUPS } from '../../src/site/at-results';
import { expectNoSeriousA11yViolations } from './fixtures';

for (const locale of LOCALES) {
  const t = getMessages(locale);
  const s = t.screenReaders;

  test.describe(`${locale}: screen reader script page`, () => {
    test('one script per scenario, each opening both builds on that scenario', async ({
      page,
    }) => {
      await page.goto(localizePath(locale, '/accessibility/screen-readers/'));
      await expect(page.getByRole('heading', { level: 1, name: s.title })).toBeVisible();
      for (const scenario of SCENARIOS) {
        const section = page.getByRole('region', {
          name: t.scenarios[scenario.id].title,
        });
        await expect(section).toBeVisible();
        for (const build of ['react', 'vanilla'] as const) {
          await expect(
            section.getByRole('link', {
              name: t.compare.builds[build].name,
              exact: true,
            }),
          ).toHaveAttribute(
            'href',
            `${localizePath(locale, `/lab/${build}/`)}?scenario=${scenario.id}`,
          );
        }
      }
    });

    test('results: every setup and scenario, nothing claimed that was not tested', async ({
      page,
    }) => {
      await page.goto(localizePath(locale, '/accessibility/screen-readers/'));
      const table = page.getByRole('table');
      await expect(table.locator('tbody tr')).toHaveCount(AT_SETUPS.length);
      await expect(table.locator('thead th')).toHaveCount(SCENARIOS.length + 1);
      await expect(page.getByRole('link', { name: s.submit })).toHaveAttribute(
        'href',
        /issues\/new\?template=screen-reader-result\.yml$/,
      );
    });

    test('axe: no serious violations', async ({ page }) => {
      await page.goto(localizePath(locale, '/accessibility/screen-readers/'));
      await expectNoSeriousA11yViolations(page);
    });
  });
}
