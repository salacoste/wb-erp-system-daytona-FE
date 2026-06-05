'use client'

/**
 * Price Recommendations Page
 * Epic 121 Phase 1: Per-SKU price recommendation engine
 */

import { List } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { usePricingPageState } from './components/usePricingPageState'
import { PricingPageHeader } from './components/PricingPageHeader'
import { PricingFilters } from './components/PricingFilters'
import { PricingSummaryCards } from './components/PricingSummaryCards'
import { PricingTable } from './components/PricingTable'

export default function PricingPage() {
  const state = usePricingPageState()

  if (state.isError) {
    return (
      <div className="space-y-6">
        <PricingPageHeader isRefreshing={state.isRefreshing} onRefresh={state.handleRefresh} />
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
      <PricingPageHeader isRefreshing={state.isRefreshing} onRefresh={state.handleRefresh} />

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
          <PricingTable items={state.items} isLoading={state.isLoading} />
        </CardContent>
      </Card>
    </div>
  )
}
