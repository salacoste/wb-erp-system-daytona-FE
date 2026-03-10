/**
 * Storage Top Consumers Widget - State components
 * Extracted from StorageTopConsumersWidget.tsx for file size compliance
 * @see docs/stories/epic-63/story-63.5-fe-storage-top-consumers.md
 */

import { AlertCircle, PackageX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export function LoadingSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-2 py-2">
          <Skeleton className="h-5 w-10" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  )
}

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <PackageX className="h-10 w-10 text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground">Нет данных по хранению за выбранный период</p>
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
      <p className="text-sm text-muted-foreground mb-3">
        {error?.message || 'Ошибка загрузки данных'}
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Повторить
      </Button>
    </div>
  )
}
