'use client'

/**
 * Price Recommendations Page
 * Epic 121 Phase 1: Per-SKU price recommendation engine
 * Story 122.2-FE: price history sheet integration
 */

import { useState, useCallback, useRef } from 'react'
import { List } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuthStore } from '@/stores/authStore'
import { usePricingPageState } from './components/usePricingPageState'
import { PricingPageHeader } from './components/PricingPageHeader'
import { PricingBasisToggle } from './components/PricingBasisToggle'
import { PricingFilters } from './components/PricingFilters'
import { PricingSummaryCards } from './components/PricingSummaryCards'
import { PricingTable } from './components/PricingTable'
import { PriceHistorySheet } from './components/PriceHistorySheet'
import { ElasticitySection } from './components/ElasticitySection'

export default function PricingPage() {
  const state = usePricingPageState()
  const cabinetId = useAuthStore(auth => auth.cabinetId)
  const [historyNmId, setHistoryNmId] = useState<number | null>(null)
  const [historyVendorCode, setHistoryVendorCode] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const historyTriggerRef = useRef<HTMLElement | null>(null)

  const headerActions = <PricingBasisToggle cabinetId={cabinetId} />

  const handleRowClick = useCallback(
    (nmId: number) => {
      historyTriggerRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
      const item = state.items.find(i => i.nmId === nmId)
      setHistoryVendorCode(item?.vendorCode ?? null)
      setHistoryNmId(nmId)
      setHistoryOpen(true)
    },
    [state.items]
  )

  if (state.isError) {
    return (
      <div className="space-y-6">
        <PricingPageHeader
          isRefreshing={state.isRefreshing}
          onRefresh={state.handleRefresh}
          actions={headerActions}
        />
        <Alert variant="destructive">
          <AlertDescription>
            Не удалось загрузить рекомендации по ценам. Попробуйте обновить данные.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PricingPageHeader
        isRefreshing={state.isRefreshing}
        onRefresh={state.handleRefresh}
        actions={headerActions}
      />

      <PricingFilters
        targetMargin={state.targetMargin}
        gapFilter={state.gapFilter}
        sort={state.sort}
        onTargetMarginChange={state.handleTargetMarginChange}
        onGapFilterChange={state.handleGapFilterChange}
        onSortChange={state.handleSortChange}
      />

      <PricingSummaryCards items={state.items} isLoading={state.isLoading} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5 text-muted-foreground" />
            Рекомендации
            {state.total > 0 && (
              <span className="text-sm font-normal text-muted-foreground">({state.total})</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PricingTable
            items={state.items}
            isLoading={state.isLoading}
            onRowClick={handleRowClick}
          />
        </CardContent>
      </Card>

      <PriceHistorySheet
        nmId={historyNmId}
        vendorCode={historyVendorCode}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        onReturnFocus={() => historyTriggerRef.current?.focus()}
      />

      <ElasticitySection />
    </div>
  )
}
