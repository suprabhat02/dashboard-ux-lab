import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

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
