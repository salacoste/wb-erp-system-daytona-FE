import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E Test Configuration
 * WB Repricer System Frontend
 *
 * Run with: npm run test:e2e
 * UI mode: npm run test:e2e:ui
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3100',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Setup project for authentication
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // Desktop Chrome (primary)
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    // Mobile viewport - disabled due to responsive design differences
    // Sidebar is hidden on mobile, navigation tests fail expectedly
    // Uncomment when mobile-specific test logic is added
    // {
    //   name: 'mobile',
    //   use: {
    //     ...devices['iPhone 14'],
    //     storageState: 'e2e/.auth/user.json',
    //   },
    //   dependencies: ['setup'],
    // },
  ],

  // Web server configuration
  // Comment out if frontend is already running (e.g., via pm2)
  webServer: process.env.CI
    ? {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: false,
        timeout: 120 * 1000,
      }
    : undefined, // Use existing server in development
})
