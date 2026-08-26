/**
 * CapitalizationTooltip — Tooltip sub-component for CapitalizationCard
 * Extracted for 200-line file limit compliance.
 */

'use client'

import { useCallback, useId, useRef, useState } from 'react'
import { Info } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

/** Format coverage percentage with Russian locale */
export function formatPct(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
}

/** Tooltip showing capitalization calculation breakdown */
export function CapitalizationTooltip({
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
            backgroundColor: 'var(--color-chart-tooltip)',
            color: 'var(--color-chart-tooltip-foreground)',
            padding: '8px 12px',
            borderRadius: '6px',
            minWidth: '220px',
          }}
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          <p className="mb-1.5 text-xs font-medium text-chart-tooltip-foreground">
            Расчёт капитализации:
          </p>
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
      <span className="text-xs text-chart-tooltip-foreground/70">{label}</span>
      <span className="text-xs font-medium text-chart-tooltip-foreground">{value}</span>
    </div>
  )
}
