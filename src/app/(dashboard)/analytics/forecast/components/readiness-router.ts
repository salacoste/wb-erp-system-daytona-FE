/**
 * Readiness route resolver — pure function extracted for testability.
 * Determines which UI state to render based on AI readiness level.
 *
 * Story 108.3-FE: State machine routing for AI Dashboard.
 * Pure functions over hook mocking (CLAUDE.md discipline).
 */
import type { ReadinessLevel } from '@/types/ai/status'

export type ReadinessRoute = 'collecting' | 'sneak_preview' | 'ready'

/**
 * Determine which readiness-state UI to render.
 * Defaults to 'ready' on loading/error to avoid blanking the page.
 * (Pattern 1, Epic 92-FE: independent state-machine orchestration —
 * supplementary fetch failure must NOT blank the existing forecast UI.)
 */
export function resolveReadinessRoute(
  level: ReadinessLevel | undefined,
  isError: boolean
): ReadinessRoute {
  if (isError || level === undefined) return 'ready'
  return level
}
