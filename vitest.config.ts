import { defineConfig } from 'vitest/config'
import path from 'path'
import coveragePolicy from './quality/coverage-policy.v1.json'
import coverageScope from './quality/coverage-scope.v1.json'

export default defineConfig({
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        // Enable localStorage for MSW v2
        storageQuota: 10000000,
      },
    },
    // Polyfill localStorage before MSW loads
    setupFiles: ['./src/test/localStorage-polyfill.ts', './src/test/setup.ts'],
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
      'scripts/tier0/**/*.test.mjs', // Tier-0 safety tests run under node:test, never Vitest
      'scripts/certification/**/*.test.mjs', // Coverage governance tests run under node:test
      'dist/**',
      '**/*.config.*',
      // Exclude OMC agent worktrees (stale full-repo copies under
      // .claude/worktrees/**) — they hold duplicate test files that vitest's
      // default include would otherwise discover and run, causing spurious
      // failures. .claude/ is agent operational state, never testable source.
      '.claude/**',
    ],
    coverage: {
      provider: coverageScope.provider as 'v8',
      reporter: coverageScope.reporter,
      include: coverageScope.include,
      exclude: coverageScope.exclude,
      thresholds:
        process.env.COVERAGE_GOVERNANCE_MODE === 'threshold'
          ? coveragePolicy.vitestThresholds
          : undefined,
    },
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
