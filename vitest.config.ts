import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()] as any,
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
      'dist/**',
      '**/*.config.*',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        'e2e/', // Exclude E2E tests from coverage
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
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

