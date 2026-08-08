/**
 * MSW Handlers Index
 * Aggregates all mock handlers for testing
 *
 * Usage:
 * - Import `handlers` for default test setup
 * - Import specific handler arrays for targeted testing
 */

import { unitEconomicsHandlers } from './unit-economics'
import { supplyPlanningHandlers } from './supply-planning'
import { liquidityHandlers } from './liquidity'
import { advertisingHandlers } from './advertising'
import { financesHandlers } from './finances'

/**
 * Default handlers for all API endpoints
 * Used in test setup for comprehensive mocking
 */
export const handlers = [
  ...unitEconomicsHandlers,
  ...supplyPlanningHandlers,
  ...liquidityHandlers,
  ...advertisingHandlers,
  ...financesHandlers,
]

// Re-export individual handlers for selective use
export * from './unit-economics'
export * from './supply-planning'
export * from './liquidity'
export * from './advertising'
export * from './finances'
