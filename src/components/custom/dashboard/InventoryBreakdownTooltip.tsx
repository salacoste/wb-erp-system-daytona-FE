/**
 * BreakdownTooltip — Inventory subcategory tooltip
 * Extracted from InventoryCard.tsx for file-size compliance (Epic 134-FE)
 */

'use client'

import { useCallback, useId, useRef, useState } from 'react'
import { Info } from 'lucide-react'

/** Custom tooltip with inventory breakdown rows */
export function BreakdownTooltip({
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
            backgroundColor: 'var(--color-chart-tooltip)',
            color: 'var(--color-chart-tooltip-foreground)',
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
                <span className="text-xs text-chart-tooltip-foreground/70">{r.label}</span>
                <span className="text-xs font-medium text-chart-tooltip-foreground">
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
