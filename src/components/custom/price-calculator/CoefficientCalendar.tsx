'use client'

import { useCallback, useRef } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import {
  getCoefficientStatusConfig,
  formatCoefficient,
  formatCoefficientDate,
  getDayFromDate,
  isToday,
  type NormalizedCoefficient,
} from '@/lib/coefficient-utils'

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
        <div ref={gridRef} className="grid grid-cols-7 gap-1" role="grid" aria-label="Календарь коэффициентов">
          {displayedCoefficients.map((item, index) => (
            <CalendarCell
              key={item.date}
              item={item}
              index={index}
              isSelected={selectedDate === item.date}
              isSelectable={isSelectable}
              onSelect={onDateSelect}
              onKeyDown={(e) => handleKeyDown(e, index, displayedCoefficients)}
            />
          ))}
        </div>
        <CalendarLegend />
      </div>
    </TooltipProvider>
  )
}

interface CalendarCellProps {
  item: NormalizedCoefficient
  index: number
  isSelected: boolean
  isSelectable: boolean
  onSelect?: (date: string, coefficient: number) => void
  onKeyDown: (e: React.KeyboardEvent) => void
}

function CalendarCell({ item, isSelected, isSelectable, onSelect, onKeyDown }: CalendarCellProps) {
  const config = getCoefficientStatusConfig(item.coefficient)
  const isTodayDate = isToday(item.date)
  const day = getDayFromDate(item.date)
  // Use isAvailable flag: coefficient=0 with isAvailable=true means FREE slot
  const isAvailable = item.isAvailable
  const canClick = isSelectable && isAvailable

  const handleClick = () => {
    if (canClick && onSelect) {
      onSelect(item.date, item.coefficient)
    }
  }

  const coeffDisplay = isAvailable ? formatCoefficient(item.coefficient) : '--'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'p-1 text-center text-xs rounded transition-all',
            config.bgColor,
            config.textColor,
            isTodayDate && 'ring-2 ring-primary ring-offset-1',
            isSelected && 'ring-2 ring-blue-500 ring-offset-1',
            // Story 44.30: Added active:scale-95 for press feedback
            canClick && 'cursor-pointer hover:opacity-80 hover:scale-105 active:scale-95 transition-transform duration-150',
            !isAvailable && 'cursor-not-allowed opacity-60',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
          )}
          role="gridcell"
          tabIndex={isAvailable ? 0 : -1}
          aria-label={`${formatCoefficientDate(item.date)}: ${isAvailable ? `коэффициент ${coeffDisplay}` : 'недоступно'}`}
          aria-selected={isSelected}
          aria-disabled={!isAvailable}
          onClick={handleClick}
          onKeyDown={onKeyDown}
        >
          <div className="font-medium leading-tight">{day}</div>
          <div className="text-[10px] leading-tight opacity-80">{coeffDisplay}</div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-center">
        <p className="font-medium">{formatCoefficientDate(item.date)}</p>
        <p>
          {isAvailable ? `Коэффициент: ${coeffDisplay} (${config.label})` : 'Недоступно для сдачи'}
        </p>
        {isTodayDate && <p className="text-primary text-xs mt-1">Сегодня</p>}
        {isSelected && <p className="text-blue-500 text-xs mt-1">Выбрано</p>}
      </TooltipContent>
    </Tooltip>
  )
}

function CalendarLegend() {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground mt-2">
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded bg-green-200" />
        <span>≤1.0</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded bg-yellow-200" />
        <span>1.0-1.5</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded bg-orange-200" />
        <span>1.5-2.0</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded bg-red-200" />
        <span>&gt;2.0</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded bg-gray-200" />
        <span>н/д</span>
      </div>
    </div>
  )
}
