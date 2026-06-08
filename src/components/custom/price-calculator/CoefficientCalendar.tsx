'use client'

import { useCallback, useRef } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { NormalizedCoefficient } from '@/lib/coefficient-utils'
import { CalendarCell, CalendarLegend } from './CoefficientCalendarCells'

interface CoefficientCalendarProps {
  coefficients: NormalizedCoefficient[]
  /** Maximum days to display (default: 14) */
  maxDays?: number
  /** Currently selected date (ISO format) */
  selectedDate?: string | null
  /** Callback when date is selected */
  onDateSelect?: (date: string, coefficient: number) => void
}

/**
 * 14-day mini calendar with logistics coefficients, click-to-select & keyboard nav
 * Stories 44.9-FE, 44.26a-FE
 * Colors: Green ≤1.0, Yellow 1.01-1.5, Orange 1.51-2.0, Red >2.0, Gray unavailable
 */
export function CoefficientCalendar({
  coefficients,
  maxDays = 14,
  selectedDate,
  onDateSelect,
}: CoefficientCalendarProps) {
  const gridRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number, displayedCoefficients: NormalizedCoefficient[]) => {
      let nextIndex = index
      const cols = 7

      switch (e.key) {
        case 'ArrowRight':
          nextIndex = Math.min(index + 1, displayedCoefficients.length - 1)
          break
        case 'ArrowLeft':
          nextIndex = Math.max(index - 1, 0)
          break
        case 'ArrowDown':
          nextIndex = Math.min(index + cols, displayedCoefficients.length - 1)
          break
        case 'ArrowUp':
          nextIndex = Math.max(index - cols, 0)
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          const item = displayedCoefficients[index]
          // Use isAvailable flag: coefficient=0 with isAvailable=true means FREE slot
          if (item.isAvailable && onDateSelect) {
            onDateSelect(item.date, item.coefficient)
          }
          return
        default:
          return
      }

      e.preventDefault()
      const buttons = gridRef.current?.querySelectorAll('[role="gridcell"]')
      ;(buttons?.[nextIndex] as HTMLElement)?.focus()
    },
    [onDateSelect]
  )

  if (!coefficients || coefficients.length === 0) {
    return <div className="text-xs text-muted-foreground">Нет данных о коэффициентах</div>
  }

  const displayedCoefficients = coefficients.slice(0, maxDays)
  const isSelectable = !!onDateSelect

  return (
    <TooltipProvider>
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">
          Коэффициенты на {displayedCoefficients.length} дней:
        </div>
        <div
          ref={gridRef}
          className="grid grid-cols-7 gap-1"
          role="grid"
          aria-label="Календарь коэффициентов"
        >
          {displayedCoefficients.map((item, index) => (
            <CalendarCell
              key={item.date}
              item={item}
              isSelected={selectedDate === item.date}
              isSelectable={isSelectable}
              onSelect={onDateSelect}
              onKeyDown={e => handleKeyDown(e, index, displayedCoefficients)}
            />
          ))}
        </div>
        <CalendarLegend />
      </div>
    </TooltipProvider>
  )
}
