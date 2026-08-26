/**
 * InventoryCard - Story 65.9: Inventory count with breakdown tooltip
 * Displays total stock as "N шт" with subcategory breakdown on hover.
 *
 * Subcategories: На складах МП, В пути к клиентам, В пути от клиентов
 * Shows snapshot date in DD.MM.YYYY format.
 *
 * @see docs/epics/epic-65-dashboard-metrics-parity/stories-wave-3.md
 */

'use client'

import { Package } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatDate } from '@/lib/utils'
import { BreakdownTooltip } from '@/components/custom/dashboard/InventoryBreakdownTooltip'
import type { InventorySummaryResponse } from '@/components/custom/dashboard/__tests__/epic65/mocks/api-mocks'

export type InventorySummaryData = InventorySummaryResponse

export interface InventoryCardProps {
  data: InventorySummaryData | null
  isLoading: boolean
  error?: Error | null
  noDataMessage?: string
  className?: string
}

/** Format number with Russian locale and "шт" suffix */
function formatStock(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value)
}

export function InventoryCard({
  data,
  isLoading,
  error,
  noDataMessage,
  className,
}: InventoryCardProps): React.ReactElement {
  if (isLoading) {
    return (
      <Card className={cn('min-h-[100px]', className)} aria-busy="true">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="mt-1 h-7 w-28" />
          <Skeleton className="mt-1 h-3 w-32" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn('border-status-error/40', className)} role="alert">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">Остатки</span>
          </div>
          <div className="mt-2 text-sm text-status-error">{error.message}</div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className={cn('transition-shadow hover:shadow-md', className)} role="article">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-status-information" aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">Остатки</span>
          </div>
          <div className="mt-2 text-xl font-bold">{noDataMessage ?? '\u2014'}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('transition-shadow hover:shadow-md', className)} role="article">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-status-information" aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">Остатки</span>
          </div>
          <BreakdownTooltip
            onWarehouse={data.onWarehouse}
            inWayToClient={data.inWayToClient}
            inWayFromClient={data.inWayFromClient}
          />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-xl font-bold">{formatStock(data.totalStock)}</span>
          <span className="text-sm text-muted-foreground">шт</span>
        </div>
        {data.totalStock > 0 && (
          <div className="mt-1 text-xs text-muted-foreground">
            Данные на {formatDate(data.snapshotDate)}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
