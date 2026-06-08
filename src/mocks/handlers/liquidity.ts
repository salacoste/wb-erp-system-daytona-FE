/**
 * MSW Handlers for Liquidity Analysis API - Barrel Re-export
 * Epic 7 - Liquidity Analysis (Ликвидность товаров)
 *
 * Splits:
 * - liquidity-queries.ts: mock data generators + GET query handlers
 * - liquidity-mutations.ts: error/edge-case handlers
 */

// Re-export query handlers and generators
export {
  generateMockLiquidityItem,
  generateMockDistribution,
  generateMockBenchmarks,
  generateMockLiquiditySummary,
  generateMockTrends,
  generateMockInsights,
  liquidityQueryHandlers,
} from './liquidity-queries'

// Re-export error handlers
export { liquidityErrorHandlers } from './liquidity-mutations'

/**
 * Combined liquidity handlers for MSW setup
 */
import { liquidityQueryHandlers } from './liquidity-queries'

export const liquidityHandlers = [...liquidityQueryHandlers]
