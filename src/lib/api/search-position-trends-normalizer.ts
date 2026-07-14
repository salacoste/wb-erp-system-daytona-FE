/**
 * Search Position Trends Boundary Normalizers
 * Backend: commit 3f29d8ca (2026-06-07)
 *
 * Absorbs shape drift for 4 search position trend endpoints.
 * Follows canonical pattern from search-analytics-normalizer.ts.
 */

import {
  toCount,
  toNullableNumber,
  toStringOrNull,
  toStr,
  asRecord,
} from '@/lib/api/normalizer-helpers'
import type {
  PositionTrendMover,
  CloseToPageOneItem,
  PositionTrendsSummary,
  PositionTrendsResponse,
  PositionMoverItem,
  PositionMoversResponse,
  PageOneOpportunityItem,
  PageOneOpportunitiesResponse,
  PositionHistoryPoint,
  PositionHistoryResponse,
  TrendDirection,
} from '@/types/search-position-trends'

const VALID_DIRECTIONS = new Set<TrendDirection>(['improving', 'declining', 'stable'])

function toTrendDirection(raw: unknown): TrendDirection {
  const s = String(raw ?? 'stable') as TrendDirection
  return VALID_DIRECTIONS.has(s) ? s : 'stable'
}

// --- Per-item normalizers ---

function normalizePositionTrendMover(raw: unknown): PositionTrendMover {
  const r = asRecord(raw)
  return {
    nmId: toCount(r.nmId),
    currentAvgPosition: toNullableNumber(r.currentAvgPosition) ?? 0,
    previousAvgPosition: toNullableNumber(r.previousAvgPosition) ?? 0,
    positionChange: toNullableNumber(r.positionChange) ?? 0,
    trend: toTrendDirection(r.trend),
    totalQueries: toCount(r.totalQueries),
    totalImpressions: toCount(r.totalImpressions),
    topQuery: toOptionalString(r.topQuery),
  }
}

function toOptionalString(raw: unknown): string | undefined {
  return typeof raw === 'string' && raw.length > 0 ? raw : undefined
}

function normalizeCloseToPageOneItem(raw: unknown): CloseToPageOneItem {
  const r = asRecord(raw)
  return {
    nmId: toCount(r.nmId),
    currentAvgPosition: toNullableNumber(r.currentAvgPosition) ?? 0,
    positionsAway: toCount(r.positionsAway),
    totalImpressions: toCount(r.totalImpressions),
    totalQueries: toCount(r.totalQueries),
    topQuery: toOptionalString(r.topQuery),
  }
}

function normalizeTrendsSummary(raw: unknown): PositionTrendsSummary {
  const r = asRecord(raw)
  return {
    improvingCount: toCount(r.improvingCount),
    decliningCount: toCount(r.decliningCount),
    stableCount: toCount(r.stableCount),
    closeToPageOneCount: toCount(r.closeToPageOneCount),
    totalSkusAnalyzed: toCount(r.totalSkusAnalyzed),
    currentWeekStart: toStr(r.currentWeekStart),
    previousWeekStart: toStr(r.previousWeekStart),
  }
}

export function normalizePositionTrendsResponse(raw: unknown): PositionTrendsResponse {
  const r = asRecord(raw)
  const movers = Array.isArray(r.movers) ? r.movers : []
  const closeToPageOne = Array.isArray(r.closeToPageOne) ? r.closeToPageOne : []
  return {
    movers: movers.map(normalizePositionTrendMover),
    closeToPageOne: closeToPageOne.map(normalizeCloseToPageOneItem),
    summary: normalizeTrendsSummary(r.summary),
  }
}

function normalizePositionMoverItem(raw: unknown): PositionMoverItem {
  const r = asRecord(raw)
  return {
    nmId: toCount(r.nmId),
    vendorCode: toStringOrNull(r.vendorCode),
    productName: toStringOrNull(r.productName),
    currentPosition: toNullableNumber(r.currentPosition) ?? 0,
    previousPosition: toNullableNumber(r.previousPosition) ?? 0,
    positionDelta: toNullableNumber(r.positionDelta) ?? 0,
    query: toStringOrNull(r.query),
  }
}

export function normalizePositionMoversResponse(raw: unknown): PositionMoversResponse {
  const r = asRecord(raw)
  const movers = Array.isArray(r.movers) ? r.movers : []
  return {
    movers: movers.map(normalizePositionMoverItem),
    period: toStr(r.period),
  }
}

function normalizePageOneOpportunityItem(raw: unknown): PageOneOpportunityItem {
  const r = asRecord(raw)
  return {
    nmId: toCount(r.nmId),
    vendorCode: toStringOrNull(r.vendorCode),
    currentPosition: toNullableNumber(r.currentPosition) ?? 0,
    query: toStringOrNull(r.query),
    avgImpressions: toCount(r.avgImpressions),
    avgClicks: toCount(r.avgClicks),
  }
}

export function normalizePageOneOpportunitiesResponse(raw: unknown): PageOneOpportunitiesResponse {
  const r = asRecord(raw)
  const opportunities = Array.isArray(r.opportunities) ? r.opportunities : []
  return {
    opportunities: opportunities.map(normalizePageOneOpportunityItem),
  }
}

function normalizePositionHistoryPoint(raw: unknown): PositionHistoryPoint {
  const r = asRecord(raw)
  return {
    date: toStr(r.date),
    // AP#8: avgPosition (ratio) & ctr (ratio) preserve null — null renders '—'.
    avgPosition: toNullableNumber(r.avgPosition),
    impressions: toCount(r.impressions),
    clicks: toCount(r.clicks),
    ctr: toNullableNumber(r.ctr),
  }
}

export function normalizePositionHistoryResponse(raw: unknown): PositionHistoryResponse {
  const r = asRecord(raw)
  const history = Array.isArray(r.history) ? r.history : []
  return {
    nmId: toCount(r.nmId),
    history: history.map(normalizePositionHistoryPoint),
    days: toCount(r.days),
  }
}
