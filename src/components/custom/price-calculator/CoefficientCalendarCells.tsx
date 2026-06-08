'use client'

/**
 * Calendar cell and legend sub-components
 * Extracted from CoefficientCalendar.tsx for file size compliance
 */

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import {
  getCoefficientStatusConfig,
  formatCoefficient,
  formatCoefficientDate,
  getDayFromDate,
  isToday,
  type NormalizedCoefficient,
} from '@/lib/coefficient-utils'

interface CalendarCellProps {
  item: NormalizedCoefficient
  index?: number
  isSelected: boolean
  isSelectable: boolean
  onSelect?: (date: string, coefficient: number) => void
  onKeyDown: (e: React.KeyboardEvent) => void
}

export function CalendarCell({
  item,
  isSelected,
  isSelectable,
  onSelect,
  onKeyDown,
}: CalendarCellProps) {
  const config = getCoefficientStatusConfig(item.coefficient)
  const isTodayDate = isToday(item.date)
  const day = getDayFromDate(item.date)
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
            canClick &&
              'cursor-pointer hover:opacity-80 hover:scale-105 active:scale-95 transition-transform duration-150',
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

export function CalendarLegend() {
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
