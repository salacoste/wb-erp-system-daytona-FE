/**
 * Cross-Reference page state components (loading, error, empty).
 * Extracted from CrossReferencePageContent.tsx for 200-line compliance.
 */

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { logger } from '@/lib/logger'

export function LoadingSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-busy="true">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  if (error) logger.error('[CrossReference] Load error:', error)
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{'Не удалось загрузить данные. Попробуйте снова.'}</span>
        <Button variant="outline" size="sm" onClick={onRetry} className="ml-4 shrink-0">
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Повторить
        </Button>
      </AlertDescription>
    </Alert>
  )
}

export function EmptyState() {
  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>Нет данных за выбранный период</AlertDescription>
    </Alert>
  )
}
