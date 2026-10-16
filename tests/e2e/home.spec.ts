import { expect, test, type Page } from '@playwright/test';
import { LOCALES, localizePath } from '../../src/spec/i18n';
import { SCENARIO_IDS } from '../../src/spec/scenarios';

const demo = (page: Page) => page.locator('[data-demo]');
const mock = (page: Page) => page.locator('[data-demo-mock]');
const toggle = (page: Page) => page.locator('[data-demo-toggle]');

test.describe('home: live state preview', () => {
  test('tabs follow the APG pattern and pick a state for good', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const tabs = demo(page).getByRole('tab');
    await expect(tabs).toHaveCount(SCENARIO_IDS.length);
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel')).toHaveCount(1);

    await tabs.first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(1)).toBeFocused();
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(mock(page)).toHaveAttribute('data-state', SCENARIO_IDS[1] ?? '');

    await page.keyboard.press('End');
    await expect(tabs.last()).toBeFocused();
    await expect(mock(page)).toHaveAttribute('data-state', SCENARIO_IDS.at(-1) ?? '');

    await page.keyboard.press('Home');
    await expect(tabs.first()).toBeFocused();

    // The visible panel links to the matching scenario in the lab.
    await tabs.nth(4).click();
    const link = page.getByRole('tabpanel').getByRole('link');
    await expect(link).toHaveAttribute(
      'href',
      `/lab/react/?scenario=${SCENARIO_IDS[4] ?? ''}`,
    );
  });

  test('reduced motion: never rotates on its own', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await demo(page).scrollIntoViewIfNeeded();
    await expect(toggle(page)).toHaveAttribute('data-playing', 'false');
    await expect(toggle(page)).toHaveAccessibleName('Play the preview');
    await page.waitForTimeout(5000);
    await expect(mock(page)).toHaveAttribute('data-state', 'loaded');
  });

  test('rotates when visible, and Pause stops it (WCAG 2.2.2)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    await demo(page).locator('.demo__layout').scrollIntoViewIfNeeded();
    // Move the pointer away so hover does not hold the rotation.
    await page.mouse.move(0, 0);
    await expect(toggle(page)).toHaveAccessibleName('Pause the preview');
    await expect(mock(page)).not.toHaveAttribute('data-state', 'loaded', {
      timeout: 8000,
    });

    await toggle(page).click();
    await expect(toggle(page)).toHaveAccessibleName('Play the preview');
    const held = await mock(page).getAttribute('data-state');
    await page.waitForTimeout(5000);
    await expect(mock(page)).toHaveAttribute('data-state', held ?? '');
    // While paused, panel changes are announced.
    await expect(page.locator('[data-demo-panels]')).toHaveAttribute(
      'aria-live',
      'polite',
    );
  });

  for (const locale of LOCALES) {
    test(`${locale}: arrow keys follow the reading direction`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(localizePath(locale, '/'));
      const tabs = demo(page).getByRole('tab');
      await tabs.first().focus();
      const forward = locale === 'ar' ? 'ArrowLeft' : 'ArrowRight';
      await page.keyboard.press(forward);
      await expect(tabs.nth(1)).toBeFocused();
    });
  }
});

test('home: section headings form one outline', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  // Every h2 sits in a section labelled by it.
  const unlabelled = await page.evaluate(
    () =>
      [...document.querySelectorAll('main section[aria-labelledby]')].filter(
        (section) =>
          !document.getElementById(section.getAttribute('aria-labelledby') ?? ''),
      ).length,
  );
  expect(unlabelled).toBe(0);
});

test.describe('home: request console', () => {
  test('reduced motion: each scenario shows its key frame, nothing plays', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const tabs = demo(page).getByRole('tab');
    await tabs.nth(2).click(); // slow
    await expect(mock(page)).toHaveAttribute('data-state', 'slow');
    // The slow scenario is explained at the moment it offers Cancel.
    await expect(mock(page)).toHaveAttribute('data-phase', 'cancel');
    await tabs.nth(1).click(); // loading
    await expect(mock(page)).toHaveAttribute('data-phase', 'skeleton');
    await tabs.nth(4).click(); // error
    await expect(mock(page)).toHaveAttribute('data-phase', 'done');
  });

  test('a picked scenario replays its request in real time', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    await demo(page).getByRole('tab').nth(1).click(); // loading: 2 s
    // Nothing for 300 ms, then placeholders, then the data.
    await expect(mock(page)).toHaveAttribute('data-phase', 'skeleton');
    await expect(mock(page)).toHaveAttribute('data-phase', 'done', { timeout: 5000 });
  });

  test('the ruler marks where each response lands', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.ruler__mark')).toHaveCount(5);
    await expect(page.locator('.index__ruler')).toHaveCount(SCENARIO_IDS.length);
  });
});
