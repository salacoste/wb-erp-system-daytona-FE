/**
 * ReturnsTable sub-components and helpers
 * Epic 71: ReturnRateCell renderer + products enrichment map builder
 */

'use client'

import { useMemo } from 'react'
import { formatPercentage } from '@/lib/utils'
import type { ProductListItem } from '@/types/cogs/products'

/** Build a lookup map from products API response for table enrichment */
export function useProductsMap(productsData: { products: ProductListItem[] } | undefined) {
  return useMemo(() => {
    const map = new Map<number, { saName: string; brand: string; vendorCode: string }>()
    for (const p of productsData?.products ?? []) {
      map.set(Number(p.nm_id), {
        saName: p.sa_name ?? '',
        brand: p.brand ?? '',
        vendorCode: p.vendor_code ?? '',
      })
    }
    return map
  }, [productsData])
}

/**
 * Return rate cell with color-coded severity
 * null = rate unknown (no sales data) — renders em-dash, NOT 0/green (anti-pattern #8).
 */
export function ReturnRateCell({ rate }: { rate: number | null }) {
  if (rate == null) return <span className="font-medium text-muted-foreground">—</span>

  let color = 'text-green-600'
  if (rate > 50) color = 'text-red-600'
  else if (rate >= 20) color = 'text-yellow-600'

  return <span className={`font-medium ${color}`}>{formatPercentage(rate, 1)}</span>
}
