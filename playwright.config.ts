import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config — smoke tests on key public pages.
 *
 * Auth/checkout flows (signup → trial → Stripe checkout → tier change) are NOT covered
 * here: they need a dedicated test environment (test Supabase project + Stripe test mode +
 * seeded fixtures). Add an `e2e/auth-flow.spec.ts` once that infra is ready.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
