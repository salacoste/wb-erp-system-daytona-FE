'use client'

/**
 * Funnel Overlay Chart — Alert States & Loading
 * Extracted from FunnelOverlayChart for max-lines compliance
 */

import { AlertCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AlertProps {
  isError?: boolean
  dailyGranularityAvailable?: boolean
  hasNoData?: boolean
}

/**
 * Returns an alert/skeleton element for loading/error/empty states, or null if data is ready.
 */
export function FunnelChartAlert({
  isLoading,
  isError,
  dailyGranularityAvailable = true,
  dataLength,
}: AlertProps & { isLoading: boolean; dataLength: number }) {
  if (isLoading) {
    return <Skeleton className="h-64 w-full" />
  }
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Не удалось загрузить график</AlertDescription>
      </Alert>
    )
  }
  if (!dailyGranularityAvailable) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Посуточная разбивка воронки недоступна — WB API возвращает агрегат за период, а не данные
          по дням. Итоговые метрики воронки доступны в таблице и карточках ниже.
        </AlertDescription>
      </Alert>
    )
  }
  if (dataLength === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Нет данных для графика за выбранный период</AlertDescription>
      </Alert>
    )
  }
  return null
}
