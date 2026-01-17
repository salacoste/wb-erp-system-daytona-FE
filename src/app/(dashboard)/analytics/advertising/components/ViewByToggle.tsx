/**
 * ViewByToggle Component (Epic 37 A11Y Fix)
 *
 * Toggle buttons for switching between SKU, Campaign, Brand, Category view modes.
 * Replaces Radix Tabs to fix aria-controls accessibility violation.
 *
 * @see frontend/docs/stories/epic-37/ACCESSIBILITY-REPORT.md
 * @see frontend/docs/stories/epic-37/QA-PHASE-2-COMPLETION-REPORT.md
 */

import { Button } from '@/components/ui/button'
import type { ViewByMode } from '@/types/advertising-analytics'

interface ViewByToggleProps {
  /** Current view mode */
  viewBy: ViewByMode
  /** Callback when view mode changes */
  onViewByChange: (view: ViewByMode) => void
  /** Optional className for styling */
  className?: string
}

/** View mode options with Russian labels and ARIA labels */
const VIEW_MODES: Array<{
  value: ViewByMode
  label: string
  ariaLabel: string
}> = [
  { value: 'sku', label: 'По товарам', ariaLabel: 'Просмотр по товарам' },
  { value: 'campaign', label: 'По кампаниям', ariaLabel: 'Просмотр по кампаниям' },
  { value: 'brand', label: 'По брендам', ariaLabel: 'Просмотр по брендам' },
  { value: 'category', label: 'По категориям', ariaLabel: 'Просмотр по категориям' },
]

export function ViewByToggle({
  viewBy,
  onViewByChange,
  className,
}: ViewByToggleProps) {
  return (
    <div className={`flex gap-2 ${className || ''}`}>
      {VIEW_MODES.map((mode) => (
        <Button
          key={mode.value}
          variant={viewBy === mode.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewByChange(mode.value)}
          aria-pressed={viewBy === mode.value}
          aria-label={mode.ariaLabel}
        >
          {mode.label}
        </Button>
      ))}
    </div>
  )
}
