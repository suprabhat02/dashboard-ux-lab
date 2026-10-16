import { expect, test, type Page } from '@playwright/test';
import { LOCALES, localizePath } from '../../src/spec/i18n';
import { SCENARIO_IDS } from '../../src/spec/scenarios';
import { phaseZones, REQUEST_AXIS_MS, sqrtScale } from '../../src/spec/time-axis';

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

test('logo strip: static under reduced motion, pausable otherwise (WCAG 2.2.2)', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const strip = page.locator('[data-marquee]');
  await expect(strip).not.toHaveAttribute('data-moving');
  await expect(strip.locator('[data-marquee-toggle]')).toBeHidden();
  // One readable list; the duplicate exists only for the visual loop.
  await expect(strip.getByRole('listitem')).toHaveCount(12);

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.reload();
  const toggle = strip.locator('[data-marquee-toggle]');
  await expect(strip).toHaveAttribute('data-moving', '');
  await expect(strip.getByRole('listitem')).toHaveCount(12);
  await expect(toggle).toHaveAccessibleName('Pause the moving list');
  await toggle.click();
  await expect(strip).toHaveAttribute('data-paused', '');
  await expect(toggle).toHaveAccessibleName('Play the moving list');
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

  test('the scenario index marks where each response lands', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.index__ruler')).toHaveCount(SCENARIO_IDS.length);
  });
});

test.describe('home: request ribbon @responsive', () => {
  const zones = phaseZones(sqrtScale(REQUEST_AXIS_MS)).map((zone) => zone.phase);

  for (const width of [320, 390, 768, 1280]) {
    test(`fits ${String(width)} px with nothing cut or overlapping`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      const ribbon = page.locator('.ribbon');
      await expect(ribbon.locator('.ribbon__zone')).toHaveCount(zones.length);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      ).toBe(true);
      // The component answers to its own width: a legend when narrow, labels when wide.
      const narrow = ((await ribbon.boundingBox())?.width ?? 0) < 34 * 16;
      await expect(ribbon.locator('.ribbon__legend')).toBeVisible({ visible: narrow });
      await expect(ribbon.locator('.ribbon__meanings')).toBeVisible({ visible: !narrow });
      // Time labels never touch each other.
      const boxes = (
        await ribbon.locator('.ribbon__time:not(:empty)').evaluateAll((nodes) =>
          nodes
            .filter((node) => (node as HTMLElement).offsetParent !== null)
            .map((node) => {
              // The text itself, not its grid cell: cells tile the row by design.
              const range = document.createRange();
              range.selectNodeContents(node);
              const box = range.getBoundingClientRect();
              return { left: box.left, right: box.right };
            }),
        )
      ).sort((a, b) => a.left - b.left);
      boxes.slice(1).forEach((box, index) => {
        expect(box.left).toBeGreaterThanOrEqual((boxes[index]?.right ?? 0) - 0.5);
      });
    });
  }

  test('runs right to left in Arabic', async ({ page }) => {
    await page.goto('/ar/');
    const first = await page.locator('.ribbon__zone[data-zone="pending"]').boundingBox();
    const last = await page.locator('.ribbon__zone[data-zone="stalled"]').boundingBox();
    expect(first?.x ?? 0).toBeGreaterThan(last?.x ?? 0);
  });

  test('says when the selected scenario’s response arrives', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const slow = demo(page).getByRole('tab').nth(2);
    await slow.click();
    await expect(page.locator('[data-ribbon-response]')).toHaveText(
      (await slow.locator('.demo__tab-time').textContent()) ?? '',
    );
    await expect(demo(page)).toHaveAttribute('data-zone', 'stalled');
  });
});
