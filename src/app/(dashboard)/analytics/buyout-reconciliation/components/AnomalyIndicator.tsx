'use client'

/**
 * AnomalyIndicator — Defensive Frontend anomaly cell renderer
 * Epic 96-FE Story 96.14: per-row AlertTriangle for 3 buyout reconciliation anomaly types.
 *
 * Per CLAUDE.md Defensive Frontend Principle:
 *   - Raw count is preserved (NOT replaced with "OK" or hidden).
 *   - AlertTriangle (amber) shown when count > 0.
 *   - Tooltip explains the specific anomaly type.
 *   - tabIndex + role + aria-label for keyboard accessibility (Story 96.13 L2-2 lesson).
 *
 * Backend resolved in Epic 106 (request #169 § 1.3); guard kept for defense-in-depth.
 * Do NOT swap counts with text or hide them; preserve evidence of backend data inconsistency.
 *
 * @see src/components/custom/orders/OrdersTableRow.tsx (canonical AlertTriangle precedent — Story 87.3)
 * @see CLAUDE.md § Defensive Frontend Principle
 */

import { memo } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export type AnomalyType = 'return_without_buyout' | 'orphan_buyout' | 'return_quantity_mismatch'

const TOOLTIP_COPY: Record<AnomalyType, string> = {
  return_without_buyout: 'Аномалия: возврат без подтверждённого выкупа. Возможна ошибка данных WB.',
  orphan_buyout: 'Аномалия: выкуп без подтверждённого исходного заказа. Возможна ошибка данных WB.',
  return_quantity_mismatch:
    'Аномалия: расхождение количества возвратов между источниками. Возможна ошибка данных WB.',
}

interface AnomalyIndicatorProps {
  count: number
  type: AnomalyType
}

export const AnomalyIndicator = memo(function AnomalyIndicator({
  count,
  type,
}: AnomalyIndicatorProps) {
  // No anomaly: render plain count without icon
  if (count <= 0) return <span>{count}</span>

  const tooltipText = TOOLTIP_COPY[type]

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-amber-700 font-medium">{count}</span>
      <Tooltip>
        <TooltipTrigger asChild>
          {/* M2-2 fix: drop role="button" — Radix Tooltip surfaces on focus/hover, NOT click.
              role="button" requires Enter/Space activation; these spans have no onClick.
              tabIndex={0} + aria-label provide focus-based keyboard disclosure without
              announcing a non-functional button to screen readers.
              Story 96.10 M2-1 + Story 96.13 L2-3 lesson: focus-based tooltip ≠ click-activated button. */}
          <span
            tabIndex={0}
            aria-label={tooltipText}
            className="cursor-help focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
          >
            <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden="true" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-xs">{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </span>
  )
})
