/**
 * Vitest Test Setup - Unit Tests ONLY (No MSW)
 *
 * Use this setup for pure unit tests that don't need API mocking.
 * This avoids localStorage issues with MSW v2.
 *
 * For tests that need MSW, use the default setup.ts
 */

import '@testing-library/jest-dom'

// Mock ResizeObserver for Radix UI components
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock

// Mock pointer capture methods for Radix UI components
Element.prototype.hasPointerCapture = () => false
Element.prototype.setPointerCapture = () => {}
Element.prototype.releasePointerCapture = () => {}

// Mock scrollIntoView for Radix UI components
Element.prototype.scrollIntoView = () => {}
