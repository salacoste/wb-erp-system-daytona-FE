/**
 * Orders Analytics Types
 * Story 40.1-FE: TypeScript Types & API Client Foundation
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Types for order velocity and volume analytics.
 * SLA types live in orders-analytics-sla-types.ts.
 */

// Re-export SLA types for backward compatibility
export type {
  AtRiskOrder,
  SlaMetricsResponse,
  SlaMetricsParams,
} from './orders-analytics-sla-types'

// ============================================================================
// Velocity Metrics Types (GET /v1/analytics/orders/velocity)
// ============================================================================

/**
 * Velocity breakdown by dimension (warehouse or delivery type)
 * Скорость обработки по измерению
 */
export interface VelocityBreakdown {
  /** null = "no data", NOT 0 minutes (iter-90). */
  avgConfirmation: number | null
  avgCompletion: number | null
}

/**
 * Response from GET /v1/analytics/orders/velocity
 * Метрики скорости обработки заказов
 */
export interface VelocityMetricsResponse {
  /** Average confirmation time (minutes). null — render "—". */
  avgConfirmationTimeMinutes: number | null
  /** Average completion time (minutes). null — render "—". */
  avgCompletionTimeMinutes: number | null
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
