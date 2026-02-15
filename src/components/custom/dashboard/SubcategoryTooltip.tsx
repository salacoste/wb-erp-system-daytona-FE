/**
 * SubcategoryTooltip - Story 65.16
 * Tooltip showing dual-value subcategories: absolute value and percentage of parent total.
 *
 * Each row displays: label, formatted value / percentage
 * When parentTotal=0, percentage shows em-dash for percentage.
 *
 * @see docs/epics/epic-65-dashboard-metrics-parity/stories-wave-4-ux.md
 */

'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Info } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export interface SubcategoryItem {
  label: string
  value: number
}

export interface SubcategoryTooltipProps {
  subcategories: SubcategoryItem[]
  parentTotal: number
  formatValue?: (value: number) => string
}

/** Format percentage with exactly 2 decimal places (Russian locale) */
function formatPct(value: number, total: number): string {
  if (total === 0) return '\u2014'
  const pct = (value / total) * 100
  return (
    new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(pct) + '\u00A0%'
  )
}

/**
 * Renders a tooltip trigger (info icon button) that shows subcategory
 * breakdown rows on hover or keyboard focus.
 *
 * Uses a custom tooltip implementation to avoid Radix content duplication
 * in the accessibility tree, ensuring each label appears exactly once.
 */
export function SubcategoryTooltip({
  subcategories,
  parentTotal,
  formatValue = formatCurrency,
}: SubcategoryTooltipProps) {
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

  /** Close tooltip on Escape key press (document-level listener) */
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <div className="relative inline-block">
      <button
        className="text-muted-foreground hover:text-foreground"
        aria-label="Показать подкатегории"
        aria-describedby={open ? tooltipId : undefined}
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
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50"
          style={{
            backgroundColor: '#1e293b',
            color: '#f1f5f9',
            fontSize: '12px',
            lineHeight: 1.4,
            padding: '8px 12px',
            borderRadius: '6px',
            maxWidth: '350px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
          }}
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          <div className="flex flex-col gap-1.5">
            {subcategories.map(item => (
              <div key={item.label} className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-300 shrink-0">{item.label}</span>
                <span className="text-xs font-medium text-slate-100 whitespace-nowrap">
                  {formatValue(item.value)}
                  <span aria-hidden="true"> / </span>
                  <span>{formatPct(item.value, parentTotal)}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
