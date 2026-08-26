/**
 * Dashboard Alert Components
 * Story 60.4-FE: Connect Dashboard to Period State
 * Story 60.5-FE: Remove Data Duplication
 *
 * Extracted alert components for processing status, errors, and failures.
 *
 * @see docs/stories/epic-60/story-60.5-fe-remove-data-duplication.md
 */

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Info } from 'lucide-react'
import { formatPercentageInt } from '@/lib/utils'

export interface ProcessingAlertProps {
  processingStatus?: { reportLoading?: { progress?: number } }
}

/** Processing status alert for dashboard */
export function ProcessingAlert({ processingStatus }: ProcessingAlertProps): React.ReactElement {
  return (
    <Alert className="border-status-information/40 bg-status-information/10">
      <Info className="h-4 w-4 text-status-information" />
      <AlertDescription className="text-status-information">
        <p className="mb-1 font-semibold">Обработка финансовых данных</p>
        <p>
          Финансовые отчеты обрабатываются. Метрики появятся после завершения.
          {processingStatus?.reportLoading?.progress !== undefined && (
            <span className="ml-2">
              Прогресс: {formatPercentageInt(processingStatus.reportLoading.progress)}
            </span>
          )}
        </p>
      </AlertDescription>
    </Alert>
  )
}

/** Failed processing alert for dashboard */
export function FailedAlert(): React.ReactElement {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <p className="mb-1 font-semibold">Ошибка обработки финансовых данных</p>
        <p>Не удалось обработать финансовые отчеты. Проверьте настройки кабинета.</p>
      </AlertDescription>
    </Alert>
  )
}

export interface DataGapsAlertProps {
  failedCount: number
}

/** Warning alert for partial data gaps (failed imports exist but data is available) */
export function DataGapsAlert({ failedCount }: DataGapsAlertProps): React.ReactElement {
  return (
    <Alert className="border-status-warning/40 bg-status-warning/10">
      <Info className="h-4 w-4 text-status-warning" />
      <AlertDescription className="text-status-warning">
        {failedCount} {failedCount === 1 ? 'импорт завершился' : 'импортов завершились'} с ошибкой —
        возможны пропуски данных за некоторые периоды.
      </AlertDescription>
    </Alert>
  )
}

export interface ErrorAlertProps {
  onRetry: () => void
}

/** Error alert with retry button for dashboard */
export function ErrorAlert({ onRetry }: ErrorAlertProps): React.ReactElement {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>Не удалось загрузить метрики. Пожалуйста, попробуйте еще раз.</span>
        <Button variant="outline" size="sm" onClick={onRetry} className="ml-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          Повторить
        </Button>
      </AlertDescription>
    </Alert>
  )
}
