// ============================================================================
// Single COGS Form Action Buttons
// Epic 74-FE: Extracted from SingleCogsForm.tsx for file size compliance
// Contains: submit/cancel buttons and help text
// ============================================================================

import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export interface SingleCogsFormActionsProps {
  isPending: boolean
  isPolling: boolean
  isEditMode: boolean
  onCancel?: () => void
}

/**
 * Action buttons and help text for single COGS form
 * Displays submit button with loading states and optional cancel button
 */
export function SingleCogsFormActions({
  isPending,
  isPolling,
  isEditMode,
  onCancel,
}: SingleCogsFormActionsProps) {
  return (
    <>
      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button type="submit" disabled={isPending || isPolling} className="flex-1">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Сохранение...
            </>
          ) : isPolling ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Ожидание расчёта маржи...
            </>
          ) : isEditMode ? (
            'Обновить себестоимость'
          ) : (
            'Назначить себестоимость'
          )}
        </Button>

        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending || isPolling}
          >
            Отмена
          </Button>
        )}
      </div>

      {/* Help Text */}
      <div className="rounded-lg border border-status-information/40 bg-status-information/10 p-4 text-sm text-status-information">
        <strong>Совет:</strong>{' '}
        {isEditMode
          ? 'При обновлении себестоимости будет создана новая версия. Старая версия сохранится в истории.'
          : 'После назначения себестоимости маржа будет рассчитана автоматически на основе данных продаж за последнюю завершённую неделю.'}
      </div>
    </>
  )
}
