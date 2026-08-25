'use client'

/**
 * Brand-Share page — PR4b competitive analytics.
 * Reference: docs/request-backend/225-brand-share-backend-contract.md
 *
 * Holds the cascading UI state (brand → category → date range) and renders
 * `<BrandShareView>`. The default date window is left empty so the backend
 * applies its trailing-7-day default (contract §2).
 */
import { useState } from 'react'
import { BrandShareView } from '@/components/custom/analytics/BrandShareView'
import type { BrandShareDateRange } from '@/types/brand-share'

export default function BrandSharePage() {
  const [brand, setBrand] = useState<string | null>(null)
  const [parentId, setParentId] = useState<number | null>(null)
  const [dateRange, setDateRange] = useState<BrandShareDateRange>({})

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Доля бренда в категории</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Конкурентная позиция бренда: рейтинг и доли по цене/количеству внутри категории WB.
        </p>
      </div>
      <BrandShareView
        brand={brand}
        parentId={parentId}
        dateRange={dateRange}
        onBrandChange={setBrand}
        onParentIdChange={setParentId}
        onDateRangeChange={setDateRange}
      />
    </div>
  )
}
