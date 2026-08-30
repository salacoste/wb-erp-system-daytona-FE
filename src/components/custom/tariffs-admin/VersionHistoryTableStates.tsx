'use client'

/**
 * Version History Table - State sub-components (skeleton, empty, error)
 * Extracted from VersionHistoryTable.tsx for file size compliance
 */

import { ClipboardList, RefreshCcw, Lock } from 'lucide-react'
import { TableRow, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { isForbiddenError } from '@/types/api'

/** Format source for display */
export function formatSource(source: 'manual' | 'api'): string {
  return source === 'api' ? 'API' : 'manual'
}

/** Loading skeleton for table rows */
export function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 8 }).map((_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full" data-testid="skeleton" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

/** Empty state component */
export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium text-foreground">История версий пуста</h3>
      <p className="text-sm text-muted-foreground mt-1">
        Создайте первую версию тарифов или запланируйте изменения.
      </p>
    </div>
  )
}

/** Error state component */
interface ErrorStateProps {
  onRetry: () => void
  error?: Error | null
}

export function ErrorState({ onRetry, error }: ErrorStateProps) {
  if (isForbiddenError(error)) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Lock className="text-muted-foreground mb-4 h-8 w-8" />
        <h3 className="text-lg font-medium text-foreground">Доступно только администраторам</h3>
        <p className="text-sm text-muted-foreground mt-1">
          История версий тарифов доступна только системным администраторам.
        </p>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 text-status-error" aria-hidden="true">
        ⚠️
      </div>
      <h3 className="text-lg font-medium text-foreground">Ошибка загрузки</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-4">Не удалось загрузить историю версий</p>
      <Button variant="outline" onClick={onRetry}>
        <RefreshCcw className="h-4 w-4 mr-2" />
        Повторить
      </Button>
    </div>
  )
}
