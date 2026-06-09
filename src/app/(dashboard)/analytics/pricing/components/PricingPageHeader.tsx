'use client'

/**
 * Pricing page header with breadcrumbs, CSV export, and refresh button
 * Epic 121 Phase 1: Per-SKU price recommendation engine
 */

import { useMemo } from 'react'
import { RefreshCw, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExportCsvButton } from '@/components/custom/ai/ExportCsvButton'
import { exportPricingToCsv } from '@/lib/csv/pricing-csv-export'
import type { PriceRecommendation } from '@/types/price-recommendations'

interface PricingPageHeaderProps {
  items: PriceRecommendation[]
  isRefreshing: boolean
  onRefresh: () => void
}

export function PricingPageHeader({ items, isRefreshing, onRefresh }: PricingPageHeaderProps) {
  const csvContent = useMemo(() => exportPricingToCsv(items), [items])

  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <span>Аналитика</span>
          <span>/</span>
          <span className="text-foreground">Рекомендации по ценам</span>
        </div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Tag className="h-6 w-6" />
          Рекомендации по ценам
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Рекомендованные цены для достижения целевой маржинальности по каждому SKU
        </p>
      </div>
      <div className="flex items-center gap-2">
        <ExportCsvButton
          csvContent={csvContent}
          fileName="pricing-recommendations.csv"
          label="Скачать CSV"
          disabled={items.length === 0}
        />
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Обновление...' : 'Обновить'}
        </Button>
      </div>
    </div>
  )
}
