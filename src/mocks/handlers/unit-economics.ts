/**
 * MSW Handlers for Unit Economics API - Barrel Re-export
 * Epic 5 - Unit Economics Analytics
 *
 * Splits:
 * - unit-economics-queries.ts: mock data generators, fixtures, GET query handlers
 * - unit-economics-mutations.ts: error and slow-response handlers
 */

// Re-export query handlers and mock data
export {
  generateMockSummary,
  mockUnitEconomicsItems,
  mockUnitEconomicsSummary,
  mockUnitEconomicsResponse,
  mockEmptyUnitEconomicsResponse,
  unitEconomicsQueryHandlers,
} from './unit-economics-queries'

// Re-export error/slow handlers
export { unitEconomicsErrorHandlers, unitEconomicsSlowHandlers } from './unit-economics-mutations'

/**
 * Combined unit economics handlers for MSW setup
 */
import { unitEconomicsQueryHandlers } from './unit-economics-queries'

export const unitEconomicsHandlers = [...unitEconomicsQueryHandlers]
