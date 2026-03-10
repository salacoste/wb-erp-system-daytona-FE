/**
 * Date Range Picker Loading & Error States
 * Extracted from DateRangeSelectors.tsx for file size compliance (Epic 74)
 */
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

/** Loading skeleton for DateRangePicker */
export function DateRangeLoadingState({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Label>Период</Label>
      <Skeleton className="h-10 w-full mt-2" />
    </div>
  )
}

/** Error/empty state for DateRangePicker */
export function DateRangeErrorState({
  className,
  isError,
}: {
  className?: string
  isError: boolean
}) {
  return (
    <div className={className}>
      <Label>Период</Label>
      <Alert variant="destructive" className="mt-2">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {isError ? 'Не удалось загрузить список недель' : 'Нет доступных недель для отображения'}
        </AlertDescription>
      </Alert>
    </div>
  )
}
