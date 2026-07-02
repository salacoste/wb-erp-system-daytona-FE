'use client'

/**
 * FR-7 (#221): margin analytics by variant (color/size).
 * Backend: GET /v1/analytics/weekly/by-variant?week=YYYY-Www
 *
 * Single-week only — the endpoint rejects weekStart/weekEnd (400 UNSUPPORTED_MODE),
 * nm_id server filter (400), and range/comparison/include_* flags. Params are built
 * manually here (NOT via buildMarginAnalyticsParams, which sends range/flags it rejects).
 *
 * Mirrors useMarginAnalyticsByBrand structure; differences: manual params,
 * VariantAnalyticsResponse return type, mapVariantItem normalizer.
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { logger } from '@/lib/logger'
import type { VariantAnalyticsItem } from '@/types/variant-analytics'
import { MARGIN_ANALYTICS_QUERY_CONFIG } from './margin-analytics-query-keys'

/** Filters accepted by the by-variant endpoint (single-week, no range/comparison/flags). */
export interface VariantAnalyticsFilters {
  /** ISO week, e.g. "2026-W26". Required to enable the query. */
  week?: string
  cursor?: string
  limit?: number
}

/** Pagination block returned by the by-variant endpoint (verified W26). */
export interface VariantAnalyticsPagination {
  count?: number
  has_more?: boolean
  next_cursor?: string | null
}

/** Frontend-canonical hook response. */
export interface VariantAnalyticsResponse {
  data: VariantAnalyticsItem[]
  meta: VariantAnalyticsPagination | undefined
}

/**
 * Fetch per-variant weekly analytics for a single week.
 * @returns Query result with variant data + pagination meta.
 */
export function useMarginAnalyticsByVariant(filters: VariantAnalyticsFilters) {
  const { week, cursor, limit = 50 } = filters

  return useQuery({
    queryKey: ['analytics', 'margin', 'by-variant', { week, cursor, limit }],
    queryFn: async (): Promise<VariantAnalyticsResponse> => {
      if (!week) {
        throw new Error('[Variant Analytics] week is required for by-variant query')
      }
      try {
        // Manual params — endpoint rejects range/comparison/include_* flags.
        const params = new URLSearchParams({ week })
        if (cursor) params.append('cursor', cursor)
        if (limit !== 50) params.append('limit', String(limit))

        logger.debug('[Variant Analytics] Fetching variant analytics:', { week, cursor, limit })

        // skipDataUnwrap: preserve the full {data, pagination} envelope. apiClient
        // otherwise unwraps to the bare data array, and `extractItems` only reads
        // `.meta` (never `.pagination`) — so has_more/next_cursor would be silently
        // lost, breaking cursor pagination in Phase 2/3. Read both directly here.
        const response = await apiClient.get<{
          data?: unknown[]
          pagination?: VariantAnalyticsPagination
        }>(`/v1/analytics/weekly/by-variant?${params.toString()}`, {
          skipDataUnwrap: true,
        })

        const transformed: VariantAnalyticsResponse = {
          data: (response?.data ?? []).map(item => mapVariantItem(item)),
          meta: response?.pagination,
        }

        logger.debug('[Variant Analytics] Variant analytics received:', {
          count: transformed.data.length,
        })

        return transformed
      } catch (error) {
        logger.error('[Variant Analytics] Failed to fetch variant analytics:', error)
        throw error
      }
    },
    ...MARGIN_ANALYTICS_QUERY_CONFIG,
    enabled: !!week,
  })
}

/** Raw backend item shape for by-variant (all fields optional/nullable per contract). */
interface RawVariantItem {
  chrt_id?: number
  nm_id?: number
  color_name?: string | null
  tech_size?: string | number | null
  metadata_pending?: boolean
  has_revenue?: boolean
  revenue_net?: number
  total_units?: number
  profit_allocated_rub?: number | null
  margin_allocated_pct?: number | null
  revenue_gross?: number | null
  cogs?: number | null
  total_expenses?: number | null
  profit?: number | null
  margin_pct?: number | null
  operating_profit?: number | null
  operating_margin_pct?: number | null
}

/**
 * Map a single raw by-variant API item to the frontend-canonical shape.
 * Money/ratio fields use `?? null` (anti-pattern #8 — never ?? 0). total_units (a count)
 * defaults ?? 0; revenue_net is contract-non-null money where 0 = no FBS sales. tech_size → string|null.
 */
export function mapVariantItem(raw: unknown): VariantAnalyticsItem {
  const item = raw as RawVariantItem
  return {
    chrt_id: item.chrt_id ?? 0,
    nm_id: item.nm_id ?? 0,
    color_name: item.color_name ?? null,
    // Backend returns string ("0","65-135") — normalize to string|null, never number.
    tech_size: item.tech_size == null ? null : String(item.tech_size),
    metadata_pending: item.metadata_pending ?? false,
    has_revenue: item.has_revenue ?? false,
    // total_units — a count; 0 = "sold nothing this week" (true semantic zero).
    total_units: item.total_units ?? 0,
    // revenue_net — exact FBS revenue. The contract types it non-null and 0 is a real
    // "no FBS sales" value (not a missing-data lie), so ?? 0 is correct here.
    // eslint-disable-next-line no-restricted-syntax -- BACKEND-CONTRACT-NON-NULL: contract guarantees non-null; 0 is a true zero (no FBS sales), not an unknown-data placeholder
    revenue_net: item.revenue_net ?? 0,
    // ALLOCATED — money/ratio, preserve null
    profit_allocated_rub: item.profit_allocated_rub ?? null,
    margin_allocated_pct: item.margin_allocated_pct ?? null,
    // parent-nm context — money/ratio, preserve null
    revenue_gross: item.revenue_gross ?? null,
    cogs: item.cogs ?? null,
    total_expenses: item.total_expenses ?? null,
    profit: item.profit ?? null,
    margin_pct: item.margin_pct ?? null,
    operating_profit: item.operating_profit ?? null,
    operating_margin_pct: item.operating_margin_pct ?? null,
  }
}
