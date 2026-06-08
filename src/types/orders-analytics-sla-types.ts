/**
 * Orders Analytics SLA Types
 * Extracted from orders-analytics.ts for file-size compliance.
 *
 * @see orders-analytics.ts for velocity and volume types
 */

// ============================================================================
// SLA Metrics Types (GET /v1/analytics/orders/sla)
// ============================================================================

/**
 * At-risk order info
 * Заказ с риском нарушения SLA
 */
export interface AtRiskOrder {
  orderId: string
  createdAt: string
  currentStatus: string
  /** Minutes remaining before SLA breach */
  minutesRemaining: number
  /** Type of risk: confirmation or completion */
  riskType: 'confirmation' | 'completion'
  /** True if SLA already breached */
  isBreached: boolean
}

/**
 * Response from GET /v1/analytics/orders/sla
 * Метрики соблюдения SLA
 */
export interface SlaMetricsResponse {
  /** Confirmation SLA threshold (hours) */
  confirmationSlaHours: number
  /** Completion SLA threshold (hours) */
  completionSlaHours: number
  /** Confirmation compliance percentage */
  confirmationCompliancePercent: number
  /** Completion compliance percentage */
  completionCompliancePercent: number
  /** Number of pending orders */
  pendingOrdersCount: number
  /** Total at-risk orders (before pagination) */
  atRiskTotal: number
  /** At-risk orders list (paginated) */
  atRiskOrders: AtRiskOrder[]
  /** Number of breached orders */
  breachedCount: number
}

/**
 * Parameters for GET /v1/analytics/orders/sla
 */
export interface SlaMetricsParams {
  /** SLA threshold for confirmation (hours, default 2) */
  confirmationSlaHours?: number
  /** SLA threshold for completion (hours, default 24) */
  completionSlaHours?: number
  /** Max at-risk orders to return (default 20, max 100) */
  atRiskLimit?: number
  /** Offset for at-risk pagination */
  atRiskOffset?: number
}
