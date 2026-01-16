'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Week Filter Badge
 * Story 24.10-FE: Chart Click-to-Filter Interaction
 * Epic 24: Paid Storage Analytics (Frontend)
 *
 * Displays active week filter with clear button.
 * Shows "Фильтр: W47" format when a week is selected in the trends chart.
 */

interface WeekFilterBadgeProps {
  /** Selected week in ISO format (e.g., "2025-W47") */
  week: string
  /** Callback when clear button is clicked */
  onClear: () => void
}

/**
 * Format week for display: "2025-W47" → "W47"
 */
function formatWeekShort(week: string): string {
  return week.split('-')[1] || week
}

export function WeekFilterBadge({ week, onClear }: WeekFilterBadgeProps) {
  return (
    <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium">
      <span>Фильтр: {formatWeekShort(week)}</span>
      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0 hover:bg-primary/20 rounded-full"
        onClick={onClear}
        aria-label="Сбросить фильтр недели"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}
