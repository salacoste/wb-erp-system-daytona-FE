/**
 * Audit Log Table sub-components
 * Extracted from AuditLogTable.tsx for file size compliance
 * Epic 52-FE: Story 52-FE.4 - Audit Log Viewer
 */

import { FileText, RefreshCcw, ChevronLeft, ChevronRight, Lock } from 'lucide-react'
import { TableRow, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { isForbiddenError } from '@/types/api'

/**
 * Format datetime for audit timestamp
 * @param dateString - ISO date string from API
 * @returns Formatted date string DD.MM.YY HH:mm
 */
export function formatAuditDateTime(dateString: string): string {
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear().toString().slice(-2)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${day}.${month}.${year} ${hours}:${minutes}`
}

export function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 7 }).map((_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full" data-testid="skeleton" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <FileText className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium text-gray-900">Журнал изменений пуст</h3>
      <p className="text-sm text-muted-foreground mt-1">
        Здесь будут отображаться все изменения тарифов.
      </p>
    </div>
  )
}

export function ErrorState({ onRetry, error }: { onRetry: () => void; error?: Error | null }) {
  // F-21: for these Admin-only endpoints a 403 is overwhelmingly a missing-role
  // denial, so show a permission message and suppress the futile retry. Copy says
  // "системным администраторам" because the cabinet Owner (highest FE role) still
  // lacks this backend Admin role — see docs/request-backend/183.
  if (isForbiddenError(error)) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Lock className="text-muted-foreground mb-4 h-8 w-8" />
        <h3 className="text-lg font-medium text-gray-900">Доступно только администраторам</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Журнал изменений тарифов доступен только системным администраторам.
        </p>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-red-500 mb-4">&#9888;&#65039;</div>
      <h3 className="text-lg font-medium text-gray-900">Ошибка загрузки</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        Не удалось загрузить журнал изменений
      </p>
      <Button variant="outline" onClick={onRetry}>
        <RefreshCcw className="h-4 w-4 mr-2" />
        Повторить
      </Button>
    </div>
  )
}

interface PaginationControlsProps {
  page: number
  totalPages: number
  total: number
  limit: number
  onPageChange: (page: number) => void
  disabled?: boolean
}

export function PaginationControls({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  disabled,
}: PaginationControlsProps) {
  const startItem = (page - 1) * limit + 1
  const endItem = Math.min(page * limit, total)

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <p className="text-sm text-muted-foreground">
        Показано {startItem}-{endItem} из {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page <= 1}
          aria-label="Назад"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Назад
        </Button>
        <span className="text-sm text-muted-foreground">
          Страница {page} из {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || page >= totalPages}
          aria-label="Вперед"
        >
          Вперед
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
