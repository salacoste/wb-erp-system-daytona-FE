'use client'

/**
 * ProductAnalyticsContent — client shell for the Unified Product Analytics page
 * (Stories 120.5 + 120.6 + 120.7-FE). Renders the product header + data-driven tabs.
 * Overview/Funnel/Advertising/Organic tabs show real data from /unified, /organic-share,
 * and /incremental-roas. Funnel tab shipped in Story 122.1-FE.
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
import {
  useUnifiedProductAnalytics,
  useOrganicShare,
  useIncrementalRoas,
} from '@/hooks/use-unified-product-analytics'
import { ProductTabPlaceholder } from './ProductTabPlaceholder'
import { ProductOverviewTab } from './ProductOverviewTab'
import { FunnelTab } from './FunnelTab'
import { AdvertisingTab } from './AdvertisingTab'
import { OrganicTab } from './OrganicTab'

interface ProductAnalyticsContentProps {
  nmId: string
}

const DEFAULT_TAB: UnifiedProductTab = UNIFIED_PRODUCT_TABS[0]

export function ProductAnalyticsContent({ nmId }: ProductAnalyticsContentProps) {
  // Default date range — will be replaced by week selector (FUTURE)
  const from = '2026-05-19'
  const to = '2026-06-01'
  const hookParams = { nmId, from, to }

  const unified = useUnifiedProductAnalytics(hookParams)
  const organicShare = useOrganicShare(hookParams)
  const iroas = useIncrementalRoas(hookParams)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={ROUTES.ANALYTICS.ROOT}>
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Назад к аналитике
          </Link>
        </Button>
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
            {renderTab(tab)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )

  function renderTab(tab: UnifiedProductTab) {
    switch (tab) {
      case 'overview':
        if (unified.isLoading) return <OverviewSkeleton />
        if (unified.isError || !unified.data) {
          return <ProductTabPlaceholder label={UNIFIED_PRODUCT_TAB_LABELS.overview} />
        }
        return <ProductOverviewTab data={unified.data} />

      case 'funnel':
        if (unified.isLoading) return <OverviewSkeleton />
        if (unified.isError || !unified.data) {
          return <ProductTabPlaceholder label={UNIFIED_PRODUCT_TAB_LABELS.funnel} />
        }
        return <FunnelTab dates={unified.data.funnel.dates} totals={unified.data.funnel.totals} />

      case 'advertising':
        if (unified.isLoading) return <OverviewSkeleton />
        if (unified.isError || !unified.data) {
          return <ProductTabPlaceholder label={UNIFIED_PRODUCT_TAB_LABELS.advertising} />
        }
        return (
          <AdvertisingTab
            totals={unified.data.advertising.totals}
            campaigns={unified.data.advertising.campaigns}
          />
        )

      case 'organic':
        if (organicShare.isLoading || iroas.isLoading) return <OverviewSkeleton />
        return <OrganicTab correlation={organicShare.data ?? []} iroas={iroas.data ?? null} />

      default:
        return <ProductTabPlaceholder label={UNIFIED_PRODUCT_TAB_LABELS[tab]} />
    }
  }
}

function OverviewSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  )
}
