/**
 * Date Range Picker Loading & Error States
 * Extracted from DateRangeSelectors.tsx for file size compliance (Epic 74)
 */
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { formatPeriodLabel } from './date-range-utils'

/** Loading skeleton for DateRangePicker */
export function DateRangeLoadingState({
  className,
  weekStart,
  weekEnd,
}: {
  className?: string
  weekStart?: string
  weekEnd?: string
}) {
  return (
    <div aria-busy="true" className={className}>
      <Label>Период</Label>
      {weekStart && weekEnd && (
        <div className="mt-1 break-words text-sm text-foreground">
          Текущий период: {formatPeriodLabel(weekStart, weekEnd)}
        </div>
      )}
      <Skeleton aria-hidden="true" className="mt-2 h-10 w-full" />
      <span role="status" className="mt-1 block text-sm text-muted-foreground">
        Загрузка доступных недель
      </span>
    </div>
  )
}

/** Error/empty state for DateRangePicker */
export function DateRangeErrorState({
  className,
  isError,
  weekStart,
  weekEnd,
}: {
  className?: string
  isError: boolean
  weekStart?: string
  weekEnd?: string
}) {
  return (
    <div className={className}>
      <Label>Период</Label>
      {weekStart && weekEnd && (
        <div className="mt-1 break-words text-sm text-foreground">
          Текущий период: {formatPeriodLabel(weekStart, weekEnd)}
        </div>
      )}
      <Alert variant="destructive" className="mt-2">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {isError ? 'Не удалось загрузить список недель' : 'Нет доступных недель для отображения'}
        </AlertDescription>
      </Alert>
    </div>
  )
}
