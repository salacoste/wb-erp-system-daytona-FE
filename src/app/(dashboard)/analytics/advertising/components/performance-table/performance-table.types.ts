/** Type definitions for PerformanceMetricsTable — extracted for 200-line limit */

import type {
  AdvertisingAnalyticsParams,
  AdvertisingItem,
  MultiCampaignSkuWarning,
  ViewByMode,
} from '@/types/advertising-analytics'

// Derive from AdvertisingAnalyticsParams.sort_by — single source of truth (matches FunnelTable/BuyoutTable pattern)
export type SortField = NonNullable<AdvertisingAnalyticsParams['sort_by']>
export type SortOrder = 'asc' | 'desc'

export interface PerformanceMetricsTableProps {
  /** Data items to display */
  data: AdvertisingItem[]
  /** Current view mode */
  viewBy: ViewByMode
  /** Loading state */
  isLoading: boolean
  /** Current sort configuration */
  sortBy: SortField
  sortOrder: SortOrder
  /** Sort change handler */
  onSortChange: (field: SortField) => void
  /** Pagination info */
  page: number
  pageSize: number
  totalCount: number
  /** Pagination handlers */
  onPageChange: (page: number) => void
  /** Multi-campaign SKU warnings for profit multiplication (Story 72.4) */
  multiCampaignSkuWarnings?: MultiCampaignSkuWarning[]
}
