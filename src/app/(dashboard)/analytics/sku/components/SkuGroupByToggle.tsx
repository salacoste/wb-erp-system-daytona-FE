/**
 * FR-7 (#221) Phase 2: «По товарам» / «По цветомоделям» toggle for the SKU page.
 *
 * Mirrors advertising/ViewByToggle.tsx: aria-pressed on the active button, Button
 * variants (default=active, outline=inactive). The variant button is disabled in
 * range mode — the by-variant endpoint is single-week only (400 UNSUPPORTED_MODE),
 * so we surface that constraint via title instead of silently re-scoping.
 */

import { Button } from '@/components/ui/button'

export type SkuGroupByMode = 'sku' | 'variant'

interface SkuGroupByToggleProps {
  /** Current group-by mode. */
  groupBy: SkuGroupByMode
  /** Fired with the newly selected mode (only when selectable). */
  onGroupByChange: (mode: SkuGroupByMode) => void
  /** True when the period spans multiple weeks — variant mode is unavailable. */
  isRangeMode: boolean
}

export function SkuGroupByToggle({ groupBy, onGroupByChange, isRangeMode }: SkuGroupByToggleProps) {
  return (
    <div className="flex gap-2" role="group" aria-label="Группировка данных">
      <Button
        variant={groupBy === 'sku' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onGroupByChange('sku')}
        aria-pressed={groupBy === 'sku'}
      >
        По товарам
      </Button>
      <Button
        variant={groupBy === 'variant' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onGroupByChange('variant')}
        aria-pressed={groupBy === 'variant'}
        disabled={isRangeMode}
        title={
          isRangeMode
            ? 'По цветомоделям доступно только для одной недели'
            : 'Просмотр по цветомоделям (FBS)'
        }
      >
        По цветомоделям
      </Button>
      {/* The disabled variant button is removed from the tab order, so its `title` is
          mouse-only. Announce the constraint to keyboard/SR users via sr-only text. */}
      {isRangeMode && (
        <span className="sr-only">
          По цветомоделям доступно только для одной недели — выберите одну неделю, чтобы включить.
        </span>
      )}
    </div>
  )
}
