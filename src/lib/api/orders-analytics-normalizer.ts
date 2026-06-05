/**
 * Orders Analytics — Boundary Normalizer
 *
 * Normalizes raw backend responses from order velocity, SLA, and volume
 * endpoints into frontend-canonical shapes (src/types/orders-analytics.ts).
 *
 * AP#8 split: counts/percentiles → toCount (0), time averages → toNullableNumber (null).
 *
 * @see src/types/orders-analytics.ts
 * @see CLAUDE.md § Boundary Normalizer Pattern
 */

import type {
  VelocityMetricsResponse,
  VelocityBreakdown,
  SlaMetricsResponse,
  AtRiskOrder,
  VolumeMetricsResponse,
  HourlyTrend,
  DailyTrend,
  StatusBreakdown,
} from '@/types/orders-analytics'

import { asRecord, toCount, toNullableNumber, toStr } from '@/lib/api/normalizer-helpers'

// ---------------------------------------------------------------------------
// Velocity
// ---------------------------------------------------------------------------

function normalizeVelocityBreakdown(raw: unknown): VelocityBreakdown {
  const d = asRecord(raw)
  return {
    avgConfirmation: toNullableNumber(d.avgConfirmation ?? d.avg_confirmation),
    avgCompletion: toNullableNumber(d.avgCompletion ?? d.avg_completion),
  }
}

function normalizeStringRecord(raw: unknown): Record<string, VelocityBreakdown> {
  if (!raw || typeof raw !== 'object') return {}
  const result: Record<string, VelocityBreakdown> = {}
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    result[key] = normalizeVelocityBreakdown(val)
  }
  return result
}

export function normalizeVelocityMetricsResponse(raw: unknown): VelocityMetricsResponse {
  const r = asRecord(raw)
  const period = asRecord(r.period)
  return {
    avgConfirmationTimeMinutes: toNullableNumber(
      r.avgConfirmationTimeMinutes ?? r.avg_confirmation_time_minutes
    ),
    avgCompletionTimeMinutes: toNullableNumber(
      r.avgCompletionTimeMinutes ?? r.avg_completion_time_minutes
    ),
    p50ConfirmationMinutes: toCount(r.p50ConfirmationMinutes ?? r.p50_confirmation_minutes),
    p95ConfirmationMinutes: toCount(r.p95ConfirmationMinutes ?? r.p95_confirmation_minutes),
    p99ConfirmationMinutes: toCount(r.p99ConfirmationMinutes ?? r.p99_confirmation_minutes),
    p50CompletionMinutes: toCount(r.p50CompletionMinutes ?? r.p50_completion_minutes),
    p95CompletionMinutes: toCount(r.p95CompletionMinutes ?? r.p95_completion_minutes),
    p99CompletionMinutes: toCount(r.p99CompletionMinutes ?? r.p99_completion_minutes),
    byWarehouse: normalizeStringRecord(r.byWarehouse ?? r.by_warehouse),
    byDeliveryType: normalizeStringRecord(r.byDeliveryType ?? r.by_delivery_type),
    totalOrders: toCount(r.totalOrders ?? r.total_orders),
    period: {
      from: toStr(period.from),
      to: toStr(period.to),
    },
  }
}

// ---------------------------------------------------------------------------
// SLA
// ---------------------------------------------------------------------------

function normalizeAtRiskOrder(raw: unknown): AtRiskOrder {
  const d = asRecord(raw)
  return {
    orderId: toStr(d.orderId ?? d.order_id),
    createdAt: toStr(d.createdAt ?? d.created_at),
    currentStatus: toStr(d.currentStatus ?? d.current_status),
    minutesRemaining: toCount(d.minutesRemaining ?? d.minutes_remaining),
    riskType: (d.riskType ?? d.risk_type) === 'completion' ? 'completion' : 'confirmation',
    isBreached: typeof d.isBreached === 'boolean' ? d.isBreached : false,
  }
}

export function normalizeSlaMetricsResponse(raw: unknown): SlaMetricsResponse {
  const r = asRecord(raw)
  const ordersRaw: unknown[] = Array.isArray(r.atRiskOrders ?? r.at_risk_orders)
    ? ((r.atRiskOrders ?? r.at_risk_orders) as unknown[])
    : []
  return {
    confirmationSlaHours: toCount(r.confirmationSlaHours ?? r.confirmation_sla_hours),
    completionSlaHours: toCount(r.completionSlaHours ?? r.completion_sla_hours),
    confirmationCompliancePercent:
      toNullableNumber(r.confirmationCompliancePercent ?? r.confirmation_compliance_percent) ?? 0,
    completionCompliancePercent:
      toNullableNumber(r.completionCompliancePercent ?? r.completion_compliance_percent) ?? 0,
    pendingOrdersCount: toCount(r.pendingOrdersCount ?? r.pending_orders_count),
    atRiskTotal: toCount(r.atRiskTotal ?? r.at_risk_total),
    atRiskOrders: ordersRaw.map(normalizeAtRiskOrder),
    breachedCount: toCount(r.breachedCount ?? r.breached_count),
  }
}

// ---------------------------------------------------------------------------
// Volume
// ---------------------------------------------------------------------------

function normalizeHourlyTrend(raw: unknown): HourlyTrend {
  const d = asRecord(raw)
  return { hour: toCount(d.hour), count: toCount(d.count) }
}

function normalizeDailyTrend(raw: unknown): DailyTrend {
  const d = asRecord(raw)
  return { date: toStr(d.date), count: toCount(d.count) }
}

function normalizeStatusBreakdown(raw: unknown): StatusBreakdown {
  const d = asRecord(raw)
  return {
    status: toStr(d.status),
    count: toCount(d.count),
    percentage: toNullableNumber(d.percentage) ?? 0,
  }
}

export function normalizeVolumeMetricsResponse(raw: unknown): VolumeMetricsResponse {
  const r = asRecord(raw)
  const period = asRecord(r.period)
  const hourlyRaw: unknown[] = Array.isArray(r.hourlyTrend ?? r.hourly_trend)
    ? ((r.hourlyTrend ?? r.hourly_trend) as unknown[])
    : []
  const dailyRaw: unknown[] = Array.isArray(r.dailyTrend ?? r.daily_trend)
    ? ((r.dailyTrend ?? r.daily_trend) as unknown[])
    : []
  const peaksRaw: unknown[] = Array.isArray(r.peakHours ?? r.peak_hours)
    ? ((r.peakHours ?? r.peak_hours) as unknown[])
    : []
  const statusRaw: unknown[] = Array.isArray(r.statusBreakdown ?? r.status_breakdown)
    ? ((r.statusBreakdown ?? r.status_breakdown) as unknown[])
    : []
  return {
    hourlyTrend: hourlyRaw.map(normalizeHourlyTrend),
    dailyTrend: dailyRaw.map(normalizeDailyTrend),
    peakHours: peaksRaw.map(v => toCount(v)),
    cancellationRate: toNullableNumber(r.cancellationRate ?? r.cancellation_rate) ?? 0,
    b2bPercentage: toNullableNumber(r.b2bPercentage ?? r.b2b_percentage) ?? 0,
    totalOrders: toCount(r.totalOrders ?? r.total_orders),
    statusBreakdown: statusRaw.map(normalizeStatusBreakdown),
    period: {
      from: toStr(period.from),
      to: toStr(period.to),
    },
  }
}
