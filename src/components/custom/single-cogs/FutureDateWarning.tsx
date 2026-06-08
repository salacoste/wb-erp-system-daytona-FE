'use client'

/**
 * FutureDateWarning sub-component
 * Extracted from SingleCogsFormFields for file size compliance
 * Request #17: Warning when COGS valid_from is after last completed week
 */

import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-react'

interface FutureDateWarningProps {
  lastCompletedWeek: string
  canTriggerRecalculation: boolean
  isRecalculating: boolean
  onTriggerRecalculation: () => void
}

/**
 * Warning alert shown when COGS valid_from is after last completed week
 * Request #17: Includes optional manual recalculation button for Manager+ roles
 */
export function FutureDateWarning({
  lastCompletedWeek,
  canTriggerRecalculation,
  isRecalculating,
  onTriggerRecalculation,
}: FutureDateWarningProps) {
  return (
    <Alert variant="warning" className="mt-2">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <p className="font-medium">
            COGS назначен с даты после последней завершенной недели ({lastCompletedWeek})
          </p>
          <p className="text-sm">
            Автоматический пересчет маржи для прошлых недель не запустится. Если нужна маржа для{' '}
            {lastCompletedWeek}, назначьте COGS с датой до или во время этой недели.
          </p>
          {/* Story 23.10: Only show recalculation button for Manager+ roles */}
          {canTriggerRecalculation && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onTriggerRecalculation}
              disabled={isRecalculating}
              className="mt-2"
            >
              {isRecalculating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Запуск пересчета...
                </>
              ) : (
                `Пересчитать маржу для ${lastCompletedWeek}`
              )}
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}
