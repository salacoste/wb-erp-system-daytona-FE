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

import { useCallback, useId, useRef, useState } from 'react'
import { Package, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatDate } from '@/lib/utils'
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
      <Card className={cn('border-red-200', className)} role="alert">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-500" aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">Остатки</span>
          </div>
          <div className="mt-2 text-sm text-red-600">{error.message}</div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className={cn('transition-shadow hover:shadow-md', className)} role="article">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-blue-500" aria-hidden="true" />
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
            <Package className="h-4 w-4 text-blue-500" aria-hidden="true" />
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

/** Custom tooltip with inventory breakdown rows */
function BreakdownTooltip({
  onWarehouse,
  inWayToClient,
  inWayFromClient,
}: {
  onWarehouse: number
  inWayToClient: number
  inWayFromClient: number
}) {
  const [open, setOpen] = useState(false)
  const tooltipId = useId()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setOpen(true)
  }, [])

  const hide = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpen(false), 100)
  }, [])

  const rows = [
    { label: 'На складах МП', value: onWarehouse },
    { label: 'В пути к клиентам', value: inWayToClient },
    { label: 'В пути от клиентов', value: inWayFromClient },
  ]

  return (
    <div className="relative inline-block">
      <button
        className="text-muted-foreground hover:text-foreground"
        aria-label="Показать подкатегории остатков"
        aria-describedby={open ? tooltipId : undefined}
        data-testid="inventory-breakdown-trigger"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        <Info className="h-4 w-4" />
      </button>
      {open && (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2"
          style={{
            backgroundColor: '#1e293b',
            color: '#f1f5f9',
            padding: '8px 12px',
            borderRadius: '6px',
            minWidth: '220px',
          }}
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          <div className="flex flex-col gap-1">
            {rows.map(r => (
              <div key={r.label} className="flex items-center justify-between gap-4">
                <span className="text-xs text-slate-300">{r.label}</span>
                <span className="text-xs font-medium text-slate-100">
                  {new Intl.NumberFormat('ru-RU').format(r.value)} шт
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
