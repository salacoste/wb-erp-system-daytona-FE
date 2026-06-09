/**
 * CapitalizationCard - Story 65.9: Inventory capitalization by COGS or retail
 * Displays monetary value with optional COGS coverage warning and tooltip breakdown.
 *
 * type='cogs' → "Капитализация по себестоимости" with cogsCoveragePct warning
 * type='retail' → "Капитализация по розничной цене"
 *
 * @see docs/epics/epic-65-dashboard-metrics-parity/stories-wave-3.md
 */

'use client'

import { Banknote } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatCurrency } from '@/lib/utils'
import { CapitalizationTooltip, formatPct } from './CapitalizationTooltip'

const TITLES: Record<'cogs' | 'retail', string> = {
  cogs: 'Капитализация (себестоимость)',
  retail: 'Капитализация (розница)',
}

export interface CapitalizationCardProps {
  type: 'cogs' | 'retail'
  value: number | null
  cogsCoveragePct?: number
  inventoryCount?: number
  avgCogs?: number
  isLoading: boolean
  className?: string
}

export function CapitalizationCard({
  type,
  value,
  cogsCoveragePct,
  inventoryCount,
  avgCogs,
  isLoading,
  className,
}: CapitalizationCardProps): React.ReactElement {
  const title = TITLES[type]

  if (isLoading) {
    return (
      <Card className={cn('min-h-[100px]', className)} aria-busy="true">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="mt-1 h-7 w-28" />
          <Skeleton className="mt-1 h-3 w-24" />
        </CardContent>
      </Card>
    )
  }

  const hasValue = value != null
  const displayValue = hasValue ? formatCurrency(value) : '\u2014'
  const showCoverageWarning = type === 'cogs' && cogsCoveragePct != null && cogsCoveragePct < 100
  const hasTooltipData = inventoryCount != null && avgCogs != null

  return (
    <Card className={cn('transition-shadow hover:shadow-md', className)} role="article">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4 text-green-600" aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
          </div>
          {hasTooltipData && (
            <CapitalizationTooltip
              inventoryCount={inventoryCount}
              avgCogs={avgCogs}
              value={value}
              type={type}
            />
          )}
        </div>

        <div className="mt-1">
          <span className="text-xl font-bold">{displayValue}</span>
        </div>

        {showCoverageWarning && (
          <div className="mt-1 text-xs text-amber-600">
            Покрытие себестоимости: {formatPct(cogsCoveragePct!)} %
          </div>
        )}
      </CardContent>
    </Card>
  )
}
