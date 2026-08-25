'use client'

/**
 * Insights Cards — Story 73.7-FE
 * Top products with both organic presence and high ad spend (potential overspend)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingDown } from 'lucide-react'
import type { CrossReferenceItem } from '../utils/cross-reference-utils'
import { fmtCurrency } from '../utils/cross-reference-utils'

interface InsightsCardsProps {
  items: CrossReferenceItem[]
}

export function InsightsCards({ items }: InsightsCardsProps) {
  if (items.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-status-warning" />
          Возможная переплата
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Товары присутствуют в органике и имеют высокий рекламный расход
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {items.map(item => (
            <div key={item.nmId} className="rounded-lg border p-3 space-y-1">
              <p className="font-mono text-sm font-medium truncate">
                {item.vendorCode || item.nmId}
              </p>
              <p className="text-sm text-muted-foreground">
                Расход:{' '}
                <span className="font-semibold text-foreground">{fmtCurrency(item.adSpend)}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Заказы (орг.):{' '}
                <span className="font-semibold text-foreground">{item.totalOrders}</span>
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
