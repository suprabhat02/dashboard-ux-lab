import { defineConfig, devices } from '@playwright/test';

/**
 * One suite, run against every implementation (see tests/e2e/implementations.ts)
 * and, in CI, every browser engine. Locally, CHROMIUM_PATH can point at any
 * Chromium binary when Playwright's own download is not available.
 */
const isCI = Boolean(process.env.CI);
const chromiumPath = process.env.CHROMIUM_PATH;
const chromiumArgs = process.env.CHROMIUM_ARGS?.split(' ').filter(Boolean);

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  ...(isCI ? { workers: 2 } : {}),
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://localhost:4321',
    // Tracing records screenshots per action; worth it in CI, too slow on software-rendered local runs.
    trace: isCI ? 'retain-on-failure' : 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(chromiumPath
          ? { launchOptions: { executablePath: chromiumPath, args: chromiumArgs ?? [] } }
          : {}),
      },
    },
    ...(isCI
      ? [
          { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
          { name: 'webkit', use: { ...devices['Desktop Safari'] } },
          {
            name: 'mobile-chromium',
            use: { ...devices['Pixel 7'] },
            grep: /@responsive/,
          },
        ]
      : []),
  ],
  webServer: {
    command: 'npx astro preview --port 4321 --ignore-lock',
    url: 'http://localhost:4321',
    reuseExistingServer: !isCI,
    timeout: 60_000,
  },
});
