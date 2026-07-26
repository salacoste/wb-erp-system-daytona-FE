import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'
import {
  loadBoundMutationContext,
  resolveTier0ProjectCapabilities,
  shouldIncludeTier0MutationProject,
} from './e2e/fixtures/tier0-mutation'

const STATIC_LIST = process.env.TIER0_STATIC_LIST === '1'
const FRONTEND_ORIGIN = 'http://127.0.0.1:3100'
const USER_STORAGE_STATE = process.env.TIER0_USER_STORAGE_STATE
const MANAGER_STORAGE_STATE = process.env.TIER0_MANAGER_STORAGE_STATE
const PRIVATE_ROOT = process.env.TIER0_PLAYWRIGHT_PRIVATE_ROOT
const RAW_OUTPUT_DIR = process.env.TIER0_PLAYWRIGHT_OUTPUT_DIR
const RAW_JSON_REPORT = process.env.TIER0_PLAYWRIGHT_JSON

function isInsidePrivateRoot(candidate: string | undefined): boolean {
  if (!candidate || !PRIVATE_ROOT) return false
  const relative = path.relative(path.resolve(PRIVATE_ROOT), path.resolve(candidate))
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative)
}

function preflightContext(): {
  receipt: Parameters<typeof shouldIncludeTier0MutationProject>[1]
  descriptor: Parameters<typeof shouldIncludeTier0MutationProject>[2]
} {
  if (!process.env.TIER0_PREFLIGHT_RECEIPT) return { receipt: undefined, descriptor: undefined }
  const context = loadBoundMutationContext(process.env)
  return { receipt: context.receipt, descriptor: context.descriptor }
}

const PREFLIGHT = STATIC_LIST ? { receipt: undefined, descriptor: undefined } : preflightContext()
const PROJECT_CAPABILITIES =
  STATIC_LIST || !PREFLIGHT.receipt || !PREFLIGHT.descriptor
    ? { P_USER: false, P_MANAGER: false, P_MUTATION: false }
    : resolveTier0ProjectCapabilities(process.env, PREFLIGHT.receipt, PREFLIGHT.descriptor)
const HAS_USER_AUTHORITY = PROJECT_CAPABILITIES.P_USER
const HAS_MANAGER_AUTHORITY = PROJECT_CAPABILITIES.P_MANAGER
const HAS_MUTATION_AUTHORITY = PROJECT_CAPABILITIES.P_MUTATION

const SERVER_ENV = {
  PATH: process.env.PATH || '',
  HOME: process.env.HOME || '',
  NODE_ENV: 'production',
  NEXT_TELEMETRY_DISABLED: '1',
  TIER0_PREFLIGHT_RECEIPT: process.env.TIER0_PREFLIGHT_RECEIPT || '',
  TIER0_SERVER_IDENTITY: process.env.TIER0_SERVER_IDENTITY || '',
  TIER0_SERVER_LOG: process.env.TIER0_SERVER_LOG || '',
  TIER0_TRUSTED_DESCRIPTOR_ISSUER: process.env.TIER0_TRUSTED_DESCRIPTOR_ISSUER || '',
  TIER0_TRUSTED_DESCRIPTOR_PUBLIC_KEY_SHA256:
    process.env.TIER0_TRUSTED_DESCRIPTOR_PUBLIC_KEY_SHA256 || '',
  TIER0_EXPECTED_PREFLIGHT_RECEIPT_SHA256:
    process.env.TIER0_EXPECTED_PREFLIGHT_RECEIPT_SHA256 || '',
}

if (STATIC_LIST && !process.argv.includes('--list')) {
  throw new Error(
    'TIER0_STATIC_LIST is valid only with Playwright --list; it cannot bypass preflight.'
  )
}

if (
  !STATIC_LIST &&
  (!process.env.TIER0_PREFLIGHT_RECEIPT ||
    !process.env.TIER0_SERVER_IDENTITY ||
    !isInsidePrivateRoot(RAW_OUTPUT_DIR) ||
    !isInsidePrivateRoot(RAW_JSON_REPORT) ||
    (HAS_USER_AUTHORITY && !USER_STORAGE_STATE) ||
    (HAS_MANAGER_AUTHORITY && !MANAGER_STORAGE_STATE))
) {
  throw new Error(
    'Tier-0 is fail-closed: provide fresh preflight receipt and owned-server identity path.'
  )
}

export default defineConfig({
  testDir: './e2e',
  testMatch: /(runtime-certification|orders-integrity)\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  timeout: 45_000,
  outputDir: RAW_OUTPUT_DIR || 'test-results/tier0-static-list',
  reporter: STATIC_LIST
    ? [['list']]
    : [
        ['list'],
        ['json', { outputFile: RAW_JSON_REPORT || 'test-results/tier0-static-list/results.json' }],
      ],
  globalSetup: STATIC_LIST ? undefined : './e2e/tier0/global-setup.ts',
  use: {
    baseURL: FRONTEND_ORIGIN,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    serviceWorkers: 'block',
  },
  projects: STATIC_LIST
    ? [
        {
          name: 'tier0-static',
          testMatch: /(runtime-certification|orders-integrity)\.spec\.ts/,
        },
      ]
    : [
        {
          name: 'tier0-public',
          testMatch: /(runtime-certification|orders-integrity)\.spec\.ts/,
          grep: /\[(?:RT-E(?:01|02|04|13)|OI-E02)\]/,
          use: { ...devices['Desktop Chrome'] },
        },
        ...(HAS_USER_AUTHORITY
          ? [
              {
                name: 'tier0-user-auth',
                testMatch: /tier0\/auth-user\.setup\.ts/,
                use: { ...devices['Desktop Chrome'] },
              },
              ...(HAS_MANAGER_AUTHORITY
                ? [
                    {
                      name: 'tier0-manager-auth',
                      testMatch: /tier0\/auth-manager\.setup\.ts/,
                      use: { ...devices['Desktop Chrome'] },
                    },
                  ]
                : []),
              {
                name: 'tier0-authenticated',
                testMatch: /(runtime-certification|orders-integrity)\.spec\.ts/,
                grep: /\[(?:RT-E(?:03|05|06|08|09|10|11|12)|OI-E(?:01|03|04|05|06|07|08|09|10))\]/,
                use: { ...devices['Desktop Chrome'], storageState: USER_STORAGE_STATE },
                dependencies: ['tier0-user-auth'],
              },
              ...(HAS_MANAGER_AUTHORITY
                ? [
                    {
                      name: 'tier0-manager-boundary',
                      testMatch: /runtime-certification\.spec\.ts/,
                      grep: /\[RT-E07\]/,
                      use: { ...devices['Desktop Chrome'], storageState: USER_STORAGE_STATE },
                      dependencies: ['tier0-user-auth', 'tier0-manager-auth'],
                    },
                  ]
                : []),
              ...(HAS_MUTATION_AUTHORITY
                ? [
                    {
                      name: 'tier0-mutation',
                      testMatch: /runtime-certification\.spec\.ts/,
                      grep: /\[RT-E14\]/,
                      use: { ...devices['Desktop Chrome'], storageState: USER_STORAGE_STATE },
                      dependencies: ['tier0-user-auth'],
                    },
                  ]
                : []),
            ]
          : []),
      ],
  webServer: STATIC_LIST
    ? undefined
    : {
        command: 'node scripts/tier0/start-bound-server.mjs',
        url: FRONTEND_ORIGIN,
        reuseExistingServer: false,
        timeout: 120_000,
        stdout: 'pipe',
        stderr: 'pipe',
        env: SERVER_ENV,
      },
})
