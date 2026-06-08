/**
 * MSW Handlers for Supply Planning API - Barrel Re-export
 * Epic 6 - Supply Planning & Stockout Prevention
 *
 * Splits:
 * - supply-planning-queries.ts: mock data generators, fixtures, GET query handlers
 * - supply-planning-mutations.ts: error/edge-case handlers
 */

// Re-export query handlers and mock data
export {
  generateMockSupplyPlanningItem,
  generateMockSupplyPlanningSummary,
  mockSupplyPlanningItems,
  mockSupplyPlanningResponse,
  mockEmptySupplyPlanningResponse,
  supplyPlanningQueryHandlers,
} from './supply-planning-queries'

// Re-export error/edge-case handlers
export {
  slowSupplyPlanningHandler,
  unauthorizedSupplyPlanningHandler,
  forbiddenSupplyPlanningHandler,
  notFoundSupplyPlanningHandler,
  networkErrorSupplyPlanningHandler,
} from './supply-planning-mutations'

/**
 * Combined supply planning handlers for MSW setup
 */
import { supplyPlanningQueryHandlers } from './supply-planning-queries'

export const supplyPlanningHandlers = [...supplyPlanningQueryHandlers]
