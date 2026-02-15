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

import { useCallback, useId, useRef, useState } from 'react'
import { Banknote, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatCurrency } from '@/lib/utils'

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

/** Format coverage percentage with Russian locale */
function formatPct(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
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

/** Tooltip showing capitalization calculation breakdown */
function CapitalizationTooltip({
  inventoryCount,
  avgCogs,
  value,
  type,
}: {
  inventoryCount: number
  avgCogs: number
  value: number | null
  type: 'cogs' | 'retail'
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

  const label = type === 'cogs' ? 'Средняя себестоимость' : 'Средняя цена'

  return (
    <div className="relative inline-block">
      <button
        className="text-muted-foreground hover:text-foreground"
        aria-label="Показать расчёт капитализации"
        aria-describedby={open ? tooltipId : undefined}
        data-testid="capitalization-tooltip-trigger"
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
          <p className="mb-1.5 text-xs font-medium text-slate-100">Расчёт капитализации:</p>
          <div className="flex flex-col gap-1">
            <TooltipRow
              label="Остатки"
              value={`${new Intl.NumberFormat('ru-RU').format(inventoryCount)} шт`}
            />
            <TooltipRow label={label} value={formatCurrency(avgCogs)} />
            {value != null && <TooltipRow label="Итого" value={formatCurrency(value)} />}
          </div>
        </div>
      )}
    </div>
  )
}

function TooltipRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-slate-300">{label}</span>
      <span className="text-xs font-medium text-slate-100">{value}</span>
    </div>
  )
}
