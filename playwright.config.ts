import './src/test/network-guard-bootstrap'

import { defineConfig, devices } from '@playwright/test'
import { shouldSkipMutatingE2E } from './e2e/fixtures/mutation-guard'
import {
  assertLocalE2EPreflightHandshake,
  assertPlaywrightDependenciesEnabled,
  isCIEnvironment,
} from './scripts/e2e-preflight-handshake.mjs'
import { assertAllowedTestUrl } from './test-utils/outbound-network-policy'

const isHistoricalSppTarget = process.argv.some(argument =>
  argument.endsWith('historical-spp-analytics.spec.ts')
)
assertPlaywrightDependenciesEnabled(process.argv)
const isCI = isCIEnvironment(process.env)
if (!isCI && !isHistoricalSppTarget) assertLocalE2EPreflightHandshake()

// Load E2E environment variables
try {
  process.loadEnvFile('.env.e2e')
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
}

const e2eBaseUrl =
  process.env.E2E_BASE_URL || (isHistoricalSppTarget ? 'http://localhost:3100' : undefined)
if (!e2eBaseUrl) {
  throw new Error('E2E_BASE_URL is required. Run npm run test:e2e:preflight for setup guidance.')
}
assertAllowedTestUrl(e2eBaseUrl)

/**
 * Playwright E2E Test Configuration
 * WB Repricer System Frontend
 *
 * Run with: npm run test:e2e
 * UI mode: npm run test:e2e:ui
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: isHistoricalSppTarget ? './e2e/historical-spp-global-setup.ts' : undefined,
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  grepInvert: shouldSkipMutatingE2E() ? /@mutating/ : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: e2eBaseUrl,
    // Story 128.10: raw browser diagnostics can retain URLs, storage, headers,
    // or bodies, so ordinary suites keep every raw capture channel disabled.
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    // BrowserContext routing does not intercept service-worker-owned traffic.
    serviceWorkers: 'block',
  },

  projects: [
    // Setup project for authentication. The self-contained Story 128.27 command
    // deliberately skips credentialed setup so it remains fully mocked.
    {
      name: 'setup',
      testMatch: isHistoricalSppTarget ? /$^/ : /.*\.setup\.ts/,
    },
    {
      name: 'historical-spp',
      testMatch: /historical-spp-analytics\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: { cookies: [], origins: [] },
      },
    },
    // Desktop Chrome (primary)
    {
      name: 'chromium',
      testIgnore: /historical-spp-analytics\.spec\.ts/,
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

  // The historical-SPP spec owns a guarded local server lifecycle in globalSetup;
  // ordinary CI suites keep their established Playwright web-server flow.
  webServer:
    isCI && !isHistoricalSppTarget
      ? {
          command: 'npm run dev',
          url: e2eBaseUrl,
          reuseExistingServer: false,
          timeout: 120 * 1000,
        }
      : undefined,
})
