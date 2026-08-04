/**
 * Vitest Test Setup
 *
 * Configures:
 * - Testing Library jest-dom matchers
 * - MSW server for API mocking
 * - Browser API mocks (ResizeObserver, etc.)
 *
 * Note: localStorage is mocked in globalSetup.ts to support MSW v2
 */

import '@testing-library/jest-dom'
import { afterEach, afterAll } from 'vitest'
import { server } from '@/mocks/server'

server.listen({ onUnhandledRequest: 'error' })

// Mock ResizeObserver for Radix UI components
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock

// Mock pointer capture methods for Radix UI components (AlertDialog, Select, etc.)
Element.prototype.hasPointerCapture = () => false
Element.prototype.setPointerCapture = () => {}
Element.prototype.releasePointerCapture = () => {}

// Mock scrollIntoView for Radix UI components
Element.prototype.scrollIntoView = () => {}

// Reset handlers after each test (important for test isolation)
afterEach(() => {
  server.resetHandlers()
})

// Close server after all tests
afterAll(() => {
  server.close()
})
