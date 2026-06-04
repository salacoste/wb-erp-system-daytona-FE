'use client'

/**
 * ProductAnalyticsContent — client shell for the Unified Product Analytics page
 * (Stories 120.5 + 120.6-FE). Renders the product header + data-driven tabs.
 * Overview tab shows real /unified data; other tabs remain placeholders
 * until Story 120.7 wires organic-share + incremental-roas.
 */

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ROUTES } from '@/lib/routes'
import {
  UNIFIED_PRODUCT_TABS,
  UNIFIED_PRODUCT_TAB_LABELS,
  type UnifiedProductTab,
} from '@/types/unified-product'
import { useUnifiedProductAnalytics } from '@/hooks/use-unified-product-analytics'
import { ProductTabPlaceholder } from './ProductTabPlaceholder'
import { ProductOverviewTab } from './ProductOverviewTab'

interface ProductAnalyticsContentProps {
  nmId: string
}

// Default to the first tab in display order (single source of truth — no drift if reordered)
const DEFAULT_TAB: UnifiedProductTab = UNIFIED_PRODUCT_TABS[0]

export function ProductAnalyticsContent({ nmId }: ProductAnalyticsContentProps) {
  // Default date range: last 2 completed weeks (Monday-based ISO week logic).
  // Hardcoded for initial wiring — a week selector will be added in 120.7.
  const from = '2026-05-19'
  const to = '2026-06-01'

  const { data, isLoading, isError } = useUnifiedProductAnalytics({ nmId, from, to })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {/* asChild renders a single <a> styled as a button — avoids nested <a><button> (WCAG 4.1.2) */}
        <Button asChild variant="ghost" size="sm">
          <Link href={ROUTES.ANALYTICS.ROOT}>
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Назад к аналитике
          </Link>
        </Button>
        {/* nmId is an opaque ID — String(), never formatNumber (AP#10) */}
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Аналитика товара #{String(nmId)}
        </h1>
      </div>

      <Tabs defaultValue={DEFAULT_TAB}>
        <TabsList aria-label="Разделы аналитики товара">
          {UNIFIED_PRODUCT_TABS.map(tab => (
            <TabsTrigger key={tab} value={tab}>
              {UNIFIED_PRODUCT_TAB_LABELS[tab]}
            </TabsTrigger>
          ))}
        </TabsList>
        {UNIFIED_PRODUCT_TABS.map(tab => (
          <TabsContent key={tab} value={tab}>
            {tab === 'overview' ? (
              renderOverviewTab()
            ) : (
              <ProductTabPlaceholder label={UNIFIED_PRODUCT_TAB_LABELS[tab]} />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )

  function renderOverviewTab() {
    if (isLoading) return <OverviewSkeleton />
    if (isError || !data) {
      return <ProductTabPlaceholder label={UNIFIED_PRODUCT_TAB_LABELS.overview} />
    }
    return <ProductOverviewTab data={data} />
  }
}

/** Minimal skeleton — 4 KPI cards shimmering. */
function OverviewSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  )
}
