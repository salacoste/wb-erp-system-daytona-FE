'use client'

/**
 * AdminModelsList — Owner-gated AI model management page content.
 * Story 112.1-FE Task 3.
 * Content rendering extracted to AdminModelsContent; helpers in admin-models-helpers.ts.
 * State-precedence chain: loading → error → empty → happy (Story 109.5 F-17).
 */

import { useState } from 'react'
import Link from 'next/link'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminModels } from '@/hooks/useAdminModels'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES } from '@/lib/routes'
import { AdminModelsContent } from './AdminModelsContent'
import { type SortCol, type SortDir } from './admin-models-helpers'

const PAGE_LIMIT = 20

export function AdminModelsList() {
  const user = useAuthStore(s => s.user)
  const [statusFilter, setStatusFilter] = useState('all')
  // 171.2 gap-3 DISPOSITION (preserve-migration): pagination stays in-session useState,
  // NOT URL-synced. The epic RTC requires state preservation WITHIN a session (satisfied);
  // URL pagination is a feature add / behavior change (cf. 171.1 severity-render) and is
  // out of scope for a migration story.
  const [page, setPage] = useState(1)
  const [sortCol, setSortCol] = useState<SortCol>('version')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [rollbackTarget, setRollbackTarget] = useState<import('@/types/ai/models').AiModel | null>(
    null
  )

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

  function handleSortClick(col: SortCol) {
    if (sortCol === col) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(col)
      setSortDir('desc')
    }
  }

  return (
    <AdminModelsContent
      models={models}
      total={total}
      page={page}
      sortCol={sortCol}
      sortDir={sortDir}
      statusFilter={statusFilter}
      rollbackTarget={rollbackTarget}
      onSortClick={handleSortClick}
      setPage={setPage}
      setStatusFilter={setStatusFilter}
      setRollbackTarget={setRollbackTarget}
      pageLimit={PAGE_LIMIT}
    />
  )
}
