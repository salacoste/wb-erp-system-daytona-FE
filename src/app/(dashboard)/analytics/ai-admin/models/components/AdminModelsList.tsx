'use client'

/**
 * AdminModelsList — Owner-gated AI model management page content.
 * Story 112.1-FE Task 3.
 * Table extracted to AdminModelsTable; pagination to AdminModelsPagination; helpers in admin-models-helpers.ts.
 * State-precedence chain: loading → error → empty → happy (Story 109.5 F-17).
 */

import { useState } from 'react'
import Link from 'next/link'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAdminModels } from '@/hooks/useAdminModels'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES } from '@/lib/routes'
import { AdminModelsTable } from './AdminModelsTable'
import { AdminModelsPagination } from './AdminModelsPagination'
import { RollbackDialog } from './RollbackDialog'
import {
  sortModels,
  STATUS_LABELS,
  STATUS_OPTIONS,
  type SortCol,
  type SortDir,
} from './admin-models-helpers'
import type { AiModel } from '@/types/ai/models'

const PAGE_LIMIT = 20

export function AdminModelsList() {
  const user = useAuthStore(s => s.user)
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [sortCol, setSortCol] = useState<SortCol>('version')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [rollbackTarget, setRollbackTarget] = useState<AiModel | null>(null)

  const { data, isLoading, error } = useAdminModels({
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    limit: PAGE_LIMIT,
  })

  // F-11: differentiate "auth not yet hydrated" from "explicitly non-Owner".
  if (user === null) {
    return (
      <div className="space-y-2" aria-label="Загрузка">
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  // Owner-only gate — mirrors Sidebar.tsx:29 'Owner' capitalization.
  if (user.role !== 'Owner') {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Доступ запрещён. Эта страница доступна только владельцу кабинета.{' '}
          <Link href={ROUTES.ANALYTICS.MODELS} className="underline">
            Вернуться к списку моделей
          </Link>
        </AlertDescription>
      </Alert>
    )
  }

  function handleSortClick(col: SortCol) {
    if (sortCol === col) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(col)
      setSortDir('desc')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2" aria-label="Загрузка списка моделей">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Не удалось загрузить список моделей. Попробуйте обновить страницу.
        </AlertDescription>
      </Alert>
    )
  }

  const models = data?.models ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT))
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
          onSortClick={handleSortClick}
          onRollback={setRollbackTarget}
        />
      )}

      <AdminModelsPagination
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
      />

      {rollbackTarget && (
        <RollbackDialog
          model={rollbackTarget}
          open={true}
          onOpenChange={open => {
            if (!open) setRollbackTarget(null)
          }}
          onSuccess={() => setRollbackTarget(null)}
        />
      )}
    </div>
  )
}
