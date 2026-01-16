/**
 * GroupByToggle Component (Epic 36)
 *
 * Toggle buttons for switching between SKU and imtId grouping modes.
 *
 * @see frontend/docs/stories/epic-36/story-36.4-fe-page-layout-toggle.md
 */

import { Button } from '@/components/ui/button'
import type { GroupByMode } from '@/types/advertising-analytics'

interface GroupByToggleProps {
  /** Current grouping mode */
  groupBy: GroupByMode
  /** Callback when mode changes */
  onGroupByChange: (mode: GroupByMode) => void
  /** Optional className for styling */
  className?: string
}

export function GroupByToggle({
  groupBy,
  onGroupByChange,
  className,
}: GroupByToggleProps) {
  return (
    <div className={`flex gap-2 ${className || ''}`}>
      <Button
        variant={groupBy === 'sku' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onGroupByChange('sku')}
        aria-pressed={groupBy === 'sku'}
        aria-label="Группировка по артикулам"
      >
        По артикулам
      </Button>
      <Button
        variant={groupBy === 'imtId' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onGroupByChange('imtId')}
        aria-pressed={groupBy === 'imtId'}
        aria-label="Группировка по склейкам"
      >
        По склейкам
      </Button>
    </div>
  )
}
