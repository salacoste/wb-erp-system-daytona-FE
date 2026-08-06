import './src/test/network-guard-bootstrap'

import { defineConfig, devices } from '@playwright/test'
import { shouldSkipMutatingE2E } from './e2e/fixtures/mutation-guard'
import {
  assertLocalE2EPreflightHandshake,
  assertPlaywrightDependenciesEnabled,
  establishHistoricalSppExecution,
  isCIEnvironment,
  requiresLocalE2EPreflight,
} from './scripts/e2e-preflight-handshake.mjs'
import { assertAllowedTestUrl } from './test-utils/outbound-network-policy'

const isHistoricalSppTarget = establishHistoricalSppExecution(process.argv, process.env)
assertPlaywrightDependenciesEnabled(process.argv)
const isCI = isCIEnvironment(process.env)
if (requiresLocalE2EPreflight(process.argv, process.env)) assertLocalE2EPreflightHandshake()

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
  globalSetup: isHistoricalSppTarget ? './scripts/historical-spp-global-setup.ts' : undefined,
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
    // Mobile (iPhone 14) — Story 162.10. Restored with mobile-specific locators
    // and a bounded critical-route smoke (e2e/mobile-critical-routes.spec.ts).
    // The desktop Sidebar is hidden below `lg`; mobile navigation is owned by
    // MobileSidebarSheet (hamburger trigger `button[aria-label="Open menu"]`),
    // so the mobile project does NOT reuse desktop sidebar selectors. It shares
    // the same reproducible localhost preflight + auth setup as the desktop
    // projects (the per-run preflight in scripts/e2e-preflight.mjs is
    // project-agnostic; this project depends on the same `setup` project).
    {
      name: 'mobile',
      testMatch: /mobile-critical-routes\.spec\.ts/,
      use: {
        ...devices['iPhone 14'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
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
