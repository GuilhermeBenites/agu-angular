import { defineConfig } from '@playwright/test';
if (!process.env['API_BASE_URL'])
  throw new Error('API_BASE_URL must point to an isolated test API. Prefer scripts/e2e.sh.');
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30000,
  expect: { timeout: 10000 },
  reporter:
    process.env['GITHUB_ACTIONS'] === 'true'
      ? [['list'], ['github'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
      : [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  outputDir: 'test-results',
  use: {
    baseURL: process.env['E2E_BASE_URL'] ?? 'http://localhost:4200',
    browserName: 'chromium',
    launchOptions: {
      executablePath: process.env['CHROME_BIN'],
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 960 } } },
    {
      name: 'mobile',
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 1,
      },
    },
  ],
});
