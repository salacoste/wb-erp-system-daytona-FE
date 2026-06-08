/**
 * TurnoverTooltip -- extracted from TurnoverCard for line-count compliance
 * Custom hover/focus tooltip for inventory turnover metric explanations.
 */

'use client'

import { useCallback, useId, useRef, useState } from 'react'
import { Info } from 'lucide-react'

const LABELS: Record<'sales' | 'orders', string> = {
  sales:
    'Оборачиваемость по продажам показывает, за сколько дней будет распродан текущий остаток при текущей скорости продаж.',
  orders:
    'Оборачиваемость по заказам показывает, за сколько дней будет распродан текущий остаток при текущей скорости заказов.',
}

export function TurnoverTooltip({ type }: { type: 'sales' | 'orders' }) {
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

  return (
    <div className="relative inline-block">
      <button
        className="text-muted-foreground hover:text-foreground"
        aria-label="Подробнее об оборачиваемости"
        aria-describedby={open ? tooltipId : undefined}
        data-testid="turnover-tooltip-trigger"
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
            maxWidth: '280px',
          }}
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          <p className="text-xs text-slate-100">{LABELS[type]}</p>
        </div>
      )}
    </div>
  )
}
