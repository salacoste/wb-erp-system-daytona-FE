import { defineConfig } from 'vitest/config'
import path from 'path'

export const VITEST_SETUP_FILES = [
  './src/test/network-guard-bootstrap.ts',
  './src/test/fixtures/module-evaluation-network-attempt.ts',
  './src/test/localStorage-polyfill.ts',
  './src/test/setup.ts',
] as const

export default defineConfig({
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        // Enable localStorage for MSW v2
        storageQuota: 10000000,
      },
    },
    // Sequence is explicit: the guard must precede every general/MSW import.
    setupFiles: [...VITEST_SETUP_FILES],
    sequence: {
      setupFiles: 'list',
    },
    testTimeout: 10000, // 10 seconds timeout for all tests
    hookTimeout: 10000, // 10 seconds timeout for hooks
    // Vitest 4 preserves spies between tests unless explicitly restored. The
    // suite creates DOM spies in beforeEach hooks and expects the real method
    // to be restored before the next hook captures it.
    restoreMocks: true,
    // Configure fake timers to work with waitFor and MSW
    // Story 44.44: Required for PresetIndicator auto-hide tests
    fakeTimers: {
      // Automatically advance time when real time passes
      // This helps waitFor work with fake timers
      shouldAdvanceTime: true,
      advanceTimeDelta: 10,
      // Don't mock queueMicrotask (needed for MSW v2 and React concurrent mode)
      toFake: [
        'setTimeout',
        'clearTimeout',
        'setInterval',
        'clearInterval',
        'setImmediate',
        'clearImmediate',
        'Date',
      ],
    },
    exclude: [
      'node_modules/**',
      'e2e/**', // Exclude E2E tests from Vitest
      'tests/e2e/**', // Exclude E2E tests in tests/ directory
      'scripts/check-privacy-console.test.mjs', // Runs separately with node:test
      'scripts/check-e2e-bare-skips.test.mjs', // Runs separately with node:test (Story 162.9 bare-skip scanner)
      'scripts/e2e-preflight.test.mjs', // Runs separately with node:test
      'scripts/privacy/diagnostic-capture-policy.test.mjs', // Runs separately with node:test
      'scripts/story-128-10/verify-frontend.test.mjs', // Runs separately with node:test
      // CARRY-IN FIX (174.1 → 174.2): node:test suite fails under vitest with
      // 'URL must be of scheme file' (root cause of the main-RED 19873/1 run).
      'scripts/__tests__/check-shadcn-migration-parity.test.mjs', // Runs separately with node:test
      'scripts/__tests__/check-shadcn-ui-boundary.test.mjs', // Runs separately with node:test (Story 174.2, same node:test pattern)
      'dist/**',
      '**/*.config.*',
      // Exclude OMC agent worktrees (stale full-repo copies under
      // .claude/worktrees/**) — they hold duplicate test files that vitest's
      // default include would otherwise discover and run, causing spurious
      // failures. .claude/ is agent operational state, never testable source.
      '.claude/**',
    ],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage/local',
      reporter: ['text', 'json', 'json-summary', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/**',
        'src/test/**',
        'src/**/*.test.{ts,tsx}',
        'src/**/__tests__/**',
        'e2e/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
      ],
    },
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
