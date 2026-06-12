/**
 * Funnel CSV export API helper.
 *
 * Export intentionally uses its own paging loop because the backend caps funnel
 * requests at 500 rows. Keeping this API-adjacent prevents page hooks from
 * owning request pagination policy while still reusing the normalized
 * getFunnelData boundary.
 */

import type { FunnelProductItem } from '@/types/analytics-funnel'
import { getFunnelData } from '@/lib/api/funnel-analytics'

export const FUNNEL_EXPORT_PAGE_SIZE = 500

export async function fetchFunnelExportItems(
  apiFrom: string,
  apiTo: string,
  nmIds: number[]
): Promise<FunnelProductItem[]> {
  const exportFilter = nmIds.length ? nmIds : undefined
  const items: FunnelProductItem[] = []
  let offset = 0
  let hasMore = true

  while (hasMore) {
    const page = await getFunnelData({
      from: apiFrom,
      to: apiTo,
      groupBy: 'product',
      limit: FUNNEL_EXPORT_PAGE_SIZE,
      offset,
      nmIds: exportFilter,
    })

    const pageItems = page.items as FunnelProductItem[]
    items.push(...pageItems)

    hasMore = page.pagination.hasMore && pageItems.length > 0
    offset += page.pagination.limit || FUNNEL_EXPORT_PAGE_SIZE
  }

  return items
}
