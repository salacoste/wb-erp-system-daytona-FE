import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface FunnelSummarySlowLoadingProps {
  onRetry: () => void
}

export function FunnelSummarySlowLoading({ onRetry }: FunnelSummarySlowLoadingProps) {
  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex flex-wrap items-center justify-between gap-4">
        <span>Метрики воронки загружаются дольше обычного. Можно повторить запрос.</span>
        <Button
          variant="outline"
          size="sm"
          className="min-h-11 min-w-11 shrink-0"
          onClick={onRetry}
        >
          Повторить
        </Button>
      </AlertDescription>
    </Alert>
  )
}
