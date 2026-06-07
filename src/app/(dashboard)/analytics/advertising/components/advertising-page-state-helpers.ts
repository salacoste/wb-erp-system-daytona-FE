/**
 * URL-param validation constants and initial-state resolvers
 * for the advertising page state hook.
 * Extracted from useAdvertisingPageState.ts for file-size compliance.
 */

import type { ViewByMode, GroupByMode } from '@/types/advertising-analytics'
import type { SortField, SortOrder } from './PerformanceMetricsTable'
import type { EfficiencyFilter } from './EfficiencyFilterDropdown'

/** Max allowed date range in days */
export const MAX_RANGE_DAYS = 90

/** Validated URL param arrays */
export const validViews: ViewByMode[] = ['sku', 'campaign', 'brand', 'category']
export const validGroupBys: GroupByMode[] = ['sku', 'imtId']
export const validSortFields: SortField[] = [
  'spend',
  'revenue',
  'orders',
  'views',
  'clicks',
  'roas',
  'roi',
  'ctr',
  'cpc',
  'profit_after_ads',
]
export const validSortOrders: SortOrder[] = ['asc', 'desc']
export const validEfficiencyFilters: EfficiencyFilter[] = [
  'all',
  'excellent',
  'good',
  'moderate',
  'poor',
  'loss',
  'unknown',
]

/** Parse a comma-separated string of campaign IDs from URL params */
export function parseCampaignIds(raw: string | null): number[] {
  if (!raw) return []
  return raw
    .split(',')
    .map(Number)
    .filter(n => !isNaN(n))
}

/** Validate a URL param value against an allowed list, returning a fallback */
export function validateParam<T extends string>(raw: string | null, allowed: T[], fallback: T): T {
  return allowed.includes(raw as T) ? (raw as T) : fallback
}
