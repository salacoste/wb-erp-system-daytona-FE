import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()] as any,
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 10000, // 10 seconds timeout for all tests
    hookTimeout: 10000, // 10 seconds timeout for hooks
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

