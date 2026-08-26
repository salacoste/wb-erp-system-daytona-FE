'use client'

/**
 * AdminModelsContent — Data-rendering portion of AdminModelsList.
 * Extracted for file-size compliance. Story 112.1-FE Task 3.
 */

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AdminModelsTable } from './AdminModelsTable'
import { AdminModelsPagination } from './AdminModelsPagination'
import { RollbackDialog } from './RollbackDialog'
import { STATUS_LABELS, STATUS_OPTIONS, type SortCol, type SortDir } from './admin-models-helpers'
import type { AiModel } from '@/types/ai/models'
import { sortModels } from './admin-models-helpers'

interface AdminModelsContentProps {
  models: AiModel[]
  total: number
  page: number
  sortCol: SortCol
  sortDir: SortDir
  statusFilter: string
  rollbackTarget: AiModel | null
  onSortClick: (col: SortCol) => void
  setPage: (page: number) => void
  setStatusFilter: (status: string) => void
  setRollbackTarget: (model: AiModel | null) => void
  pageLimit: number
}

export function AdminModelsContent({
  models,
  total,
  page,
  sortCol,
  sortDir,
  statusFilter,
  rollbackTarget,
  onSortClick,
  setPage,
  setStatusFilter,
  setRollbackTarget,
  pageLimit,
}: AdminModelsContentProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageLimit))
  const sorted = sortModels(models, sortCol, sortDir)

  return (
    <div className="space-y-4">
      {/* Header with filter */}
      <div className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4">
        <h1 className="text-lg font-semibold">Управление AI моделями</h1>
        <Select
          value={statusFilter}
          onValueChange={v => {
            setStatusFilter(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-44" aria-label="Фильтр по статусу">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* F-8: distinguish filter-empty from no-data-empty */}
      {sorted.length === 0 && statusFilter !== 'all' ? (
        <Alert>
          <AlertDescription>
            Нет моделей со статусом «{STATUS_LABELS[statusFilter] ?? statusFilter}».{' '}
            <Button
              variant="link"
              size="sm"
              onClick={() => setStatusFilter('all')}
              className="h-auto px-1 underline"
            >
              Сбросить фильтр
            </Button>
          </AlertDescription>
        </Alert>
      ) : sorted.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">Модели не найдены.</p>
      ) : null}

      {sorted.length > 0 && (
        <AdminModelsTable
          models={sorted}
          sortCol={sortCol}
          sortDir={sortDir}
          onSortClick={onSortClick}
          onRollback={setRollbackTarget}
        />
      )}

      <AdminModelsPagination
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={fn => setPage(fn(page))}
      />

      {rollbackTarget && (
        <RollbackDialog
          model={rollbackTarget}
          open={true}
          onOpenChange={open => {
            if (!open) {
              // 171.2 gap-5 (epic AX literal «focus returns to the invoking row»):
              // the dialog is conditionally unmounted via rollbackTarget state and has no
              // AlertDialogTrigger, so Radix's built-in focus-return cannot apply — capture
              // the invoking row's rollback button BEFORE unmount, then focus it after.
              const rowButton = document.querySelector<HTMLElement>(
                `[data-rollback-model-id="${CSS.escape(String(rollbackTarget.id))}"]`
              )
              setRollbackTarget(null)
              requestAnimationFrame(() => rowButton?.focus())
            }
          }}
          onSuccess={() => setRollbackTarget(null)}
        />
      )}
    </div>
  )
}
