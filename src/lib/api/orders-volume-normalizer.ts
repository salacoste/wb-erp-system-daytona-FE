/**
 * Orders Volume — Boundary Normalizer
 *
 * Normalizes raw backend responses from orders volume and seasonal patterns
 * endpoints into frontend-canonical shapes (src/types/orders-volume.ts).
 *
 * AP#8 split: counts → toCount (0), money/amounts → toNullableNumber (null).
 *
 * @see src/types/orders-volume.ts
 * @see CLAUDE.md § Boundary Normalizer Pattern
 */

import type {
  OrdersVolumeResponse,
  OrderStatusBreakdown,
  DailyOrderVolume,
  HourlyOrderVolume,
  SeasonalPatternsResponse,
  MonthlyPattern,
  WeekdayPattern,
  SeasonalInsights,
} from '@/types/orders-volume'

import { asRecord, toCount, toNullableNumber, toStr } from '@/lib/api/normalizer-helpers'

// ---------------------------------------------------------------------------
// Orders Volume
// ---------------------------------------------------------------------------

function normalizeStatusBreakdown(raw: unknown): OrderStatusBreakdown {
  const d = asRecord(raw)
  return {
    new: toCount(d.new),
    confirm: toCount(d.confirm),
    complete: toCount(d.complete),
    cancel: toCount(d.cancel),
  }
}

function normalizeDailyVolume(raw: unknown): DailyOrderVolume {
  const d = asRecord(raw)
  return {
    date: toStr(d.date),
    orders: toCount(d.orders),
    amount: toNullableNumber(d.amount) ?? 0,
  }
}

function normalizeHourlyVolume(raw: unknown): HourlyOrderVolume {
  const d = asRecord(raw)
  return {
    hour: toCount(d.hour),
    orders: toCount(d.orders),
    amount: toNullableNumber(d.amount) ?? 0,
  }
}

export function normalizeOrdersVolumeResponse(raw: unknown): OrdersVolumeResponse {
  const r = asRecord(raw)
  const byDayRaw = r.by_day ?? r.byDay
  const byHourRaw = r.by_hour ?? r.byHour
  return {
    total_orders: toCount(r.total_orders ?? r.totalOrders),
    total_amount: toNullableNumber(r.total_amount ?? r.totalAmount) ?? 0,
    avg_order_value: toNullableNumber(r.avg_order_value ?? r.avgOrderValue) ?? 0,
    by_status: normalizeStatusBreakdown(r.by_status ?? r.byStatus),
    by_day: Array.isArray(byDayRaw) ? (byDayRaw as unknown[]).map(normalizeDailyVolume) : undefined,
    by_hour: Array.isArray(byHourRaw)
      ? (byHourRaw as unknown[]).map(normalizeHourlyVolume)
      : undefined,
  }
}

// ---------------------------------------------------------------------------
// Seasonal Patterns
// ---------------------------------------------------------------------------

function normalizeMonthlyPattern(raw: unknown): MonthlyPattern {
  const d = asRecord(raw)
  return {
    month: toStr(d.month),
    avgOrders: toCount(d.avgOrders ?? d.avg_orders),
    avgRevenue: toNullableNumber(d.avgRevenue ?? d.avg_revenue) ?? 0,
  }
}

function normalizeWeekdayPattern(raw: unknown): WeekdayPattern {
  const d = asRecord(raw)
  return {
    dayOfWeek: toStr(d.dayOfWeek ?? d.day_of_week),
    avgOrders: toCount(d.avgOrders ?? d.avg_orders),
    peakHour: toCount(d.peakHour ?? d.peak_hour),
  }
}

function normalizeSeasonalInsights(raw: unknown): SeasonalInsights {
  const d = asRecord(raw)
  return {
    peakMonth: toStr(d.peakMonth ?? d.peak_month),
    lowMonth: toStr(d.lowMonth ?? d.low_month),
    peakDay: toStr(d.peakDay ?? d.peak_day),
  }
}

export function normalizeSeasonalPatternsResponse(raw: unknown): SeasonalPatternsResponse {
  const r = asRecord(raw)
  const patterns = asRecord(r.patterns)
  return {
    patterns: {
      monthly: Array.isArray(patterns.monthly) ? patterns.monthly.map(normalizeMonthlyPattern) : [],
      weekday: Array.isArray(patterns.weekday) ? patterns.weekday.map(normalizeWeekdayPattern) : [],
    },
    insights: normalizeSeasonalInsights(r.insights),
  }
}
