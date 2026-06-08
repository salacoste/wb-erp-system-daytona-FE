/**
 * Orders Integrity — TypeScript types
 *
 * Corresponds to backend endpoints:
 *   GET /health/orders-integrity?cabinet_id={id}
 *   GET /v1/orders/reconciliation?cabinet_id={id}&from={YYYY-MM-DD}&to={YYYY-MM-DD}
 *
 * Backend may deliver snake_case; the Boundary Normalizer
 * (orders-integrity-normalizer.ts) bridges to camelCase at the API boundary.
 * NEVER use raw backend shapes in components or hooks.
 *
 * @see src/lib/api/orders-integrity-normalizer.ts
 * @see CLAUDE.md § Boundary Normalizer Pattern
 */

// ---------------------------------------------------------------------------
// Integrity health check types
// ---------------------------------------------------------------------------

/** Overall health status from /health/orders-integrity */
export type IntegrityCheckStatus = 'healthy' | 'warning' | 'unhealthy'

/** Individual check result status */
export type CheckPassStatus = 'pass' | 'warn' | 'fail'

/** One integrity check result */
export interface CheckResult {
  status: CheckPassStatus
  count: number
}

/** Normalized response for GET /health/orders-integrity */
export interface OrdersIntegrityResponse {
  status: IntegrityCheckStatus
  checks: Record<string, CheckResult>
  lastCheck: string
  durationMs: number
}

// ---------------------------------------------------------------------------
// Reconciliation report types
// ---------------------------------------------------------------------------

/** One row in the by_status breakdown */
export interface ReconciliationByStatus {
  status: string
  localCount: number
  expectedCount: number
  variance: number
  variancePercent: number | null
}

/** One row in the by_date breakdown */
export interface ReconciliationByDate {
  date: string
  localCount: number
  expectedCount: number
  variance: number
  variancePercent: number | null
}

/** Normalized response for GET /v1/orders/reconciliation */
export interface ReconciliationReport {
  totalCount: number
  localCount: number
  expectedCount: number
  variance: number
  variancePercent: number | null
  byStatus: ReconciliationByStatus[]
  byDate: ReconciliationByDate[]
}

// ---------------------------------------------------------------------------
// Param shape
// ---------------------------------------------------------------------------

export interface ReconciliationParams {
  cabinetId: string
  from: string // YYYY-MM-DD
  to: string // YYYY-MM-DD
}
