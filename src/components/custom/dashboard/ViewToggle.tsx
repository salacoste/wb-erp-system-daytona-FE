'use client'

/**
 * ViewToggle Component
 * Story 62.9-FE: Chart/Table View Toggle
 *
 * Toggle button group for switching between chart and table views.
 * Uses ARIA radiogroup pattern for accessibility.
 *
 * @see docs/stories/epic-62/story-62.9-fe-chart-table-view-toggle.md
 */

import { BarChart3, Table2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ViewType = 'chart' | 'table'

export interface ViewToggleProps {
  /** Current view selection */
  value: ViewType
  /** Callback when view changes */
  onChange: (value: ViewType) => void
  /** Additional CSS classes */
  className?: string
}

/**
 * Toggle button group for chart/table view switching.
 *
 * @example
 * <ViewToggle value={view} onChange={setView} />
 */
export function ViewToggle({ value, onChange, className }: ViewToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Выбор представления данных"
      className={cn('inline-flex rounded-md border border-gray-200', className)}
    >
      <button
        type="button"
        role="radio"
        aria-checked={value === 'chart'}
        aria-label="Показать график"
        onClick={() => onChange('chart')}
        className={cn(
          'inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium',
          'rounded-l-md transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E53935] focus-visible:ring-offset-2',
          value === 'chart'
            ? 'bg-[#E53935] text-white hover:bg-[#D32F2F]'
            : 'bg-white text-gray-700 hover:bg-red-50 hover:border-[#E53935]'
        )}
      >
        <BarChart3 className="h-4 w-4" aria-hidden="true" />
        <span>График</span>
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === 'table'}
        aria-label="Показать таблицу"
        onClick={() => onChange('table')}
        className={cn(
          'inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium',
          'rounded-r-md transition-colors duration-150 -ml-px',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E53935] focus-visible:ring-offset-2',
          value === 'table'
            ? 'bg-[#E53935] text-white hover:bg-[#D32F2F]'
            : 'bg-white text-gray-700 hover:bg-red-50 hover:border-[#E53935]'
        )}
      >
        <Table2 className="h-4 w-4" aria-hidden="true" />
        <span>Таблица</span>
      </button>
    </div>
  )
}
