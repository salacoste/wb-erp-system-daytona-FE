'use client'

import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { isCogsAfterLastCompletedWeek, getLastCompletedWeek } from '@/lib/margin-helpers'
import { useAuthStore } from '@/stores/authStore'
import { canEnqueueTasks } from './product-margin-utils'
import { COGSNotAssignedContext } from './COGSNotAssignedContext'
import type { ProductListItem } from '@/types/api'

export interface CalculationInProgressDisplayProps {
  product: ProductListItem
  shouldShowRetryButton: (nmId: string) => boolean
  getAffectedWeeks: (nmId: string) => string[]
  triggerRecalculation: (params: { weeks: string[]; nm_ids: string[] }) => void
  isRecalculating: boolean
}

export function CalculationInProgressDisplay({
  product,
  shouldShowRetryButton,
  getAffectedWeeks,
  triggerRecalculation,
  isRecalculating,
}: CalculationInProgressDisplayProps): React.ReactElement {
  // Story 23.10: Get user role for access control
  const user = useAuthStore(state => state.user)
  const canTriggerRecalculation = canEnqueueTasks(user?.role)

  // Request #18: COGS assigned but no missing_data_reason and no margin = calculation in progress
  // Request #31: Show applicable COGS if different from current
  // Request #33/#35 UX: Reuse COGSNotAssignedContext for consistent display
  if (isCogsAfterLastCompletedWeek(product.cogs!.valid_from)) {
    // When COGS is from future date and no margin data, show enhanced context
    // This provides same UX as MissingDataReasonDisplay with COGS_NOT_ASSIGNED
    return (
      <COGSNotAssignedContext
        product={product}
        enableMarginDisplay={true} // Always show margin in this context
      />
    )
  }

  // COGS is valid for last completed week, but margin calculation in progress
  return (
    <div className="flex flex-col gap-1">
      <div
        className="text-xs text-muted-foreground"
        title="Маржа рассчитывается для последней завершенной недели. Расчёт может занять несколько секунд."
      >
        (расчёт маржи...)
      </div>
      {/* Request #18: Show manual retry button if state persists > 5 minutes
          Story 23.10: Only show for Manager+ roles (Analyst gets 403 from backend) */}
      {shouldShowRetryButton(product.nm_id) && canTriggerRecalculation && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs text-status-warning hover:text-status-warning/80 hover:bg-status-warning/10 -ml-1"
          onClick={e => {
            e.stopPropagation()
            const affectedWeeks = getAffectedWeeks(product.nm_id)
            if (affectedWeeks.length > 0) {
              triggerRecalculation({ weeks: affectedWeeks, nm_ids: [product.nm_id] })
            } else {
              const lastCompletedWeek = getLastCompletedWeek()
              triggerRecalculation({ weeks: [lastCompletedWeek], nm_ids: [product.nm_id] })
            }
          }}
          disabled={isRecalculating}
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isRecalculating ? 'animate-spin' : ''}`} />
          Пересчитать вручную
        </Button>
      )}
    </div>
  )
}
