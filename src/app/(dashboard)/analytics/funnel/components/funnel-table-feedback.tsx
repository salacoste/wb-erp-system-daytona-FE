import { AlertCircle, RefreshCw } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

function RetryButton({ label, onRetry }: { label: string; onRetry: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="min-h-11 min-w-11 shrink-0"
      onClick={onRetry}
    >
      <RefreshCw className="mr-1 h-4 w-4" />
      {label}
    </Button>
  )
}

export function FunnelTableError({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex flex-wrap items-center justify-between gap-4">
        <span>Не удалось загрузить данные воронки</span>
        <RetryButton label="Повторить загрузку таблицы" onRetry={onRetry} />
      </AlertDescription>
    </Alert>
  )
}

export function FunnelTableRefreshAlert({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex flex-wrap items-center justify-between gap-4">
        <span>Показаны ранее загруженные данные таблицы; обновление завершилось ошибкой.</span>
        <RetryButton label="Повторить загрузку таблицы" onRetry={onRetry} />
      </AlertDescription>
    </Alert>
  )
}

export function FunnelTableComparisonAlert({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex flex-wrap items-center justify-between gap-4">
        <span>Не удалось загрузить сравнение таблицы; текущие данные сохранены.</span>
        <RetryButton label="Повторить сравнение таблицы" onRetry={onRetry} />
      </AlertDescription>
    </Alert>
  )
}

export function FunnelTableSlowLoading({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex flex-wrap items-center justify-between gap-4">
        <span>Таблица воронки загружается дольше обычного. Можно повторить запрос.</span>
        <RetryButton label="Повторить" onRetry={onRetry} />
      </AlertDescription>
    </Alert>
  )
}
