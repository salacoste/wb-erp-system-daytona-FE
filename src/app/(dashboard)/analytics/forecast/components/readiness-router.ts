/**
 * Readiness route resolver — pure function extracted for testability.
 * Determines which UI state to render based on AI readiness level.
 *
 * Story 108.3-FE: State machine routing for AI Dashboard.
 * Pure functions over hook mocking (CLAUDE.md discipline).
 */
import type { ReadinessLevel } from '@/types/ai/status'

/**
 * Determine which readiness-state UI to render.
 *
 * Defensive fallback to 'ready' for both undefined (loading/error) AND isError states.
 * Layer 2 of 2: normalizer (src/lib/api/ai/status.ts) guards backend enum drift;
 * this guards TanStack Query loading/error states where data is undefined.
 * Per epic spec — "don't blank the page on status failures" (Pattern 1, Epic 92-FE:
 * supplementary fetch failure must NOT blank the existing forecast UI).
 */
export function resolveReadinessRoute(
  level: ReadinessLevel | undefined,
  isError: boolean
): ReadinessLevel {
  if (isError || level === undefined) return 'ready'
  return level
}
