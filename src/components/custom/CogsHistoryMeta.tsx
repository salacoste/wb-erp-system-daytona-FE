'use client'

import { Card, CardContent } from '@/components/ui/card'

interface CogsHistoryMetaProps {
  meta: {
    nm_id: string
    product_name: string
    current_cogs: { unit_cost_rub: number; valid_from: string } | null
    total_versions: number
  }
}

/**
 * COGS History Meta Information Card
 * Story 5.1-fe: View COGS History
 *
 * AC: 9, 10
 * Reference: frontend/docs/stories/epic-5/story-5.1-fe-cogs-history-view.md
 */
export function CogsHistoryMeta({ meta }: CogsHistoryMetaProps) {
  /**
   * Format currency to Russian locale
   */
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-1">
          {/* AC: 9 - Product name */}
          <h1 className="text-2xl font-bold tracking-tight">
            {meta.product_name || 'Товар без названия'}
          </h1>

          {/* AC: 10 - nm_id as small text below product name */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>nm_id: {meta.nm_id}</span>
            <span>•</span>
            <span>
              Текущий COGS:{' '}
              {meta.current_cogs
                ? formatCurrency(meta.current_cogs.unit_cost_rub)
                : '—'}
            </span>
            <span>•</span>
            <span>
              Всего версий: {meta.total_versions}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
