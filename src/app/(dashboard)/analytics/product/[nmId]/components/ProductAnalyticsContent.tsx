'use client'

/**
 * ProductAnalyticsContent — client shell for the Unified Product Analytics page
 * (Story 120.5-FE). Renders the product header + Overview/Funnel/Advertising/
 * Organic tab layout. Tab bodies are backend-pending placeholders until Stories
 * 120.6/120.7 wire the data (VERIFY-FIRST, gated on Request #177).
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
import { ProductTabPlaceholder } from './ProductTabPlaceholder'

interface ProductAnalyticsContentProps {
  nmId: string
}

// Default to the first tab in display order (single source of truth — no drift if reordered)
const DEFAULT_TAB: UnifiedProductTab = UNIFIED_PRODUCT_TABS[0]

export function ProductAnalyticsContent({ nmId }: ProductAnalyticsContentProps) {
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
            <ProductTabPlaceholder label={UNIFIED_PRODUCT_TAB_LABELS[tab]} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
