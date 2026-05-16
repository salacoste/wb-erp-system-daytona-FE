/**
 * AI Readiness Status types — frontend-canonical shapes
 * Endpoint: GET /v1/ai/status
 * Source: docs/AI-FRONTEND-INTEGRATION-GUIDE.md § State: collecting/sneak_preview/ready
 */

/**
 * Readiness level determines which UI state to render on the AI Dashboard.
 * - collecting: <12 weeks of data — show progress tracker
 * - sneak_preview: 6-11 weeks — show low-confidence forecasts with disclaimer
 * - ready: full AI active — show full forecast dashboard
 */
export type ReadinessLevel = 'collecting' | 'sneak_preview' | 'ready'

export const READINESS_LEVELS: readonly ReadinessLevel[] = [
  'collecting',
  'sneak_preview',
  'ready',
] as const

export function isReadinessLevel(value: string): value is ReadinessLevel {
  return (READINESS_LEVELS as readonly string[]).includes(value)
}

export interface AiStatusResponse {
  /** Current data accumulation state — drives 3-state UI routing */
  readinessLevel: ReadinessLevel
  /** Weeks of data collected so far — count, semantic-zero OK */
  weeksCollected: number
  /**
   * Weeks required before AI activates — null when backend omits the field.
   * Render defensively: show collected count only when this is null.
   * See docs/request-backend/174-ai-status-weeks-required-missing.md
   */
  weeksRequired: number | null
  /** Progress 0-100 — ratio field, null when backend omits */
  progressPct: number | null
  /** Human-readable list of unmet prerequisites e.g. "COGS coverage < 90%" */
  missingRequirements: string[]
  /** ISO date string when AI expected to activate — null until calculable */
  estimatedActivationDate: string | null
  /** COGS coverage percentage 0-100 — ratio field, null when backend omits */
  cogsCoveragePct: number | null
  /** Number of SKUs being tracked — count, semantic-zero OK */
  skuCount: number
  /** Number of orders recorded — count, semantic-zero OK */
  orderCount: number
}
