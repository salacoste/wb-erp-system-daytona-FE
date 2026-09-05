'use client'

/**
 * FR-7 (#221): ⚠️ marker for ALLOCATED (approximate) variant fields.
 *
 * Defensive Frontend Principle — allocated values ("распределено по доле выручки
 * варианта") must NEVER be rendered as exact. This marker is appended to the
 * Прибыль/Маржа cells AND their column headers, with a tooltip explaining why.
 *
 * `aria-label` is the stable hook for tests (VariantTable.test.tsx).
 */
import { AlertTriangle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const ALLOCATED_TOOLTIP = 'Приблизительно: распределено по доле выручки варианта (FBS)'

/** Inline marker shown next to an allocated value. */
export function AllocatedMarker() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <AlertTriangle
          className="ml-1 inline-block h-3.5 w-3.5 text-status-warning"
          aria-label="Приблизительное значение"
        />
      </TooltipTrigger>
      <TooltipContent>{ALLOCATED_TOOLTIP}</TooltipContent>
    </Tooltip>
  )
}

/** Marker for a column header (slightly larger hit area). */
export function AllocatedHeaderMarker() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <AlertTriangle
          className="ml-1 inline-block h-3.5 w-3.5 text-status-warning"
          aria-label="Столбец содержит приблизительные значения"
        />
      </TooltipTrigger>
      <TooltipContent>{ALLOCATED_TOOLTIP}</TooltipContent>
    </Tooltip>
  )
}
