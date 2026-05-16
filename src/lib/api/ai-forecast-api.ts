/**
 * AI Forecast API — backward-compatible re-export barrel.
 * Story 108.1-FE: Implementation moved to src/lib/api/ai/ subdirectory.
 * Existing consumers (Epic 103/104 hooks + components) continue to import from here.
 */

export { normalizeAiForecastResponse, getAiForecast } from './ai/forecast'
