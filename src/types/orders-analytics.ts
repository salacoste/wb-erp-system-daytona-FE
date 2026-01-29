/**
 * Orders Analytics Types
 * Story 40.1-FE: TypeScript Types & API Client Foundation
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Types for order velocity, SLA compliance, and volume analytics.
 */

// ============================================================================
// Velocity Metrics Types (GET /v1/analytics/orders/velocity)
// ============================================================================

/**
 * Velocity breakdown by dimension (warehouse or delivery type)
 * Скорость обработки по измерению
 */
export interface VelocityBreakdown {
  avgConfirmation: number
  avgCompletion: number
}

/**
 * Response from GET /v1/analytics/orders/velocity
 * Метрики скорости обработки заказов
 */
export interface VelocityMetricsResponse {
  /** Average confirmation time (minutes) */
  avgConfirmationTimeMinutes: number
  /** Average completion time (minutes) */
  avgCompletionTimeMinutes: number
  /** 50th percentile confirmation (minutes) */
  p50ConfirmationMinutes: number
  /** 95th percentile confirmation (minutes) */
  p95ConfirmationMinutes: number
  /** 99th percentile confirmation (minutes) */
  p99ConfirmationMinutes: number
  /** 50th percentile completion (minutes) */
  p50CompletionMinutes: number
  /** 95th percentile completion (minutes) */
  p95CompletionMinutes: number
  /** 99th percentile completion (minutes) */
  p99CompletionMinutes: number
  /** Breakdown by warehouse ID */
  byWarehouse: Record<string, VelocityBreakdown>
  /** Breakdown by delivery type */
  byDeliveryType: Record<string, VelocityBreakdown>
  /** Total orders in period */
  totalOrders: number
  /** Query period info */
  period: {
    from: string
    to: string
  }
}

/**
 * Parameters for GET /v1/analytics/orders/velocity
 */
export interface VelocityMetricsParams {
  from: string
  to: string
}

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

// ============================================================================
// Volume Metrics Types (GET /v1/analytics/orders/volume)
// ============================================================================

/**
 * Hourly trend point
 * Почасовой тренд заказов
 */
export interface HourlyTrend {
  hour: number
  count: number
}

/**
 * Daily trend point
 * Дневной тренд заказов
 */
export interface DailyTrend {
  date: string
  count: number
}

/**
 * Status breakdown item
 * Распределение по статусам
 */
export interface StatusBreakdown {
  status: string
  count: number
  percentage: number
}

/**
 * Response from GET /v1/analytics/orders/volume
 * Метрики объёма заказов
 */
export interface VolumeMetricsResponse {
  /** Hourly order distribution */
  hourlyTrend: HourlyTrend[]
  /** Daily order volumes */
  dailyTrend: DailyTrend[]
  /** Top 3 peak hours */
  peakHours: number[]
  /** Cancellation rate percentage */
  cancellationRate: number
  /** B2B orders percentage */
  b2bPercentage: number
  /** Total orders in period */
  totalOrders: number
  /** Status breakdown */
  statusBreakdown: StatusBreakdown[]
  /** Query period info */
  period: {
    from: string
    to: string
  }
}

/**
 * Parameters for GET /v1/analytics/orders/volume
 */
export interface VolumeMetricsParams {
  from: string
  to: string
}
