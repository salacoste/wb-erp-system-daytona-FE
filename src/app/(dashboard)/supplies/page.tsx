/**
 * Supplies List Page
 * Story 53.2-FE: Supplies List Page
 * Epic 53-FE: Supply Management UI
 *
 * Main page for FBS supplies with filters, table, pagination.
 * Reference: docs/stories/epic-53/story-53.2-fe-supplies-list-page.md
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { format, subDays } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { useSupplies, useSyncSupplies } from '@/hooks/useSupplies'
import { buildSupplyDetailRoute } from '@/lib/routes'
import {
  SuppliesPageHeader,
  SuppliesFilters,
  SuppliesTable,
  SuppliesPagination,
  SuppliesLoadingSkeleton,
  CreateSupplyModal,
} from '@/components/custom/supplies'
import type { SupplyStatus, SuppliesSortField, SortOrder, SupplyListItem } from '@/types/supplies'

const PAGE_SIZE = 20
const DEFAULT_SORT: SuppliesSortField = 'created_at'
const DEFAULT_ORDER: SortOrder = 'desc'

/** Get default date range (last 30 days) */
function getDefaultDateRange() {
  return {
    to: format(new Date(), 'yyyy-MM-dd'),
    from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
  }
}

export default function SuppliesPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const defaultRange = getDefaultDateRange()

  // State
  const [status, setStatus] = useState<SupplyStatus | undefined>(
    (searchParams.get('status') as SupplyStatus) || undefined
  )
  const [dateFrom, setDateFrom] = useState(searchParams.get('from') || defaultRange.from)
  const [dateTo, setDateTo] = useState(searchParams.get('to') || defaultRange.to)
  const [sortBy, setSortBy] = useState<SuppliesSortField>(
    (searchParams.get('sort_by') as SuppliesSortField) || DEFAULT_SORT
  )
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    (searchParams.get('sort_order') as SortOrder) || DEFAULT_ORDER
  )
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // URL sync
  useEffect(() => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (dateFrom !== defaultRange.from) params.set('from', dateFrom)
    if (dateTo !== defaultRange.to) params.set('to', dateTo)
    if (sortBy !== DEFAULT_SORT) params.set('sort_by', sortBy)
    if (sortOrder !== DEFAULT_ORDER) params.set('sort_order', sortOrder)
    if (page > 1) params.set('page', String(page))
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [status, dateFrom, dateTo, sortBy, sortOrder, page, pathname, router])

  // Data fetching
  const { data, isLoading, isError, error, refetch } = useSupplies({
    status,
    from: dateFrom,
    to: dateTo,
    sort_by: sortBy,
    sort_order: sortOrder,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  })
  const { mutate: triggerSync, isPending: isSyncing } = useSyncSupplies()

  // Handlers
  const handleSortChange = useCallback((field: SuppliesSortField) => {
    setSortBy(prev => {
      if (prev === field) {
        setSortOrder(cur => (cur === 'asc' ? 'desc' : 'asc'))
        return prev
      }
      setSortOrder('desc')
      return field
    })
    setPage(1)
  }, [])

  const handleRowClick = useCallback(
    (supply: SupplyListItem) => router.push(buildSupplyDetailRoute(supply.id)),
    [router]
  )

  const handleClearFilters = useCallback(() => {
    const range = getDefaultDateRange()
    setStatus(undefined)
    setDateFrom(range.from)
    setDateTo(range.to)
    setSortBy(DEFAULT_SORT)
    setSortOrder(DEFAULT_ORDER)
    setPage(1)
  }, [])

  // Derived state
  const hasFilters =
    status !== undefined || dateFrom !== defaultRange.from || dateTo !== defaultRange.to
  const totalCount = data?.pagination?.total ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const headerProps = {
    lastSyncAt: data?.items?.[0]?.syncedAt ?? null,
    nextSyncAt: null,
    isSyncing,
    onSync: () => triggerSync(),
    onCreateClick: () => setIsCreateModalOpen(true),
  }

  // Loading
  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <SuppliesPageHeader {...headerProps} />
        <SuppliesLoadingSkeleton />
      </div>
    )
  }

  // Error
  if (isError) {
    return (
      <div className="space-y-6">
        <SuppliesPageHeader {...headerProps} />
        <Alert variant="destructive" data-testid="supplies-error-state">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error instanceof Error ? error.message : 'Ошибка загрузки поставок'}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Повторить
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6" data-testid="supplies-page">
      <SuppliesPageHeader {...headerProps} />

      <Card>
        <CardContent className="pt-6">
          <SuppliesFilters
            status={status}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onStatusChange={v => {
              setStatus(v)
              setPage(1)
            }}
            onDateFromChange={v => {
              setDateFrom(v)
              setPage(1)
            }}
            onDateToChange={v => {
              setDateTo(v)
              setPage(1)
            }}
            onClearFilters={handleClearFilters}
            hasActiveFilters={hasFilters}
          />
        </CardContent>
      </Card>

      <SuppliesTable
        supplies={data?.items ?? []}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        onRowClick={handleRowClick}
        hasFilters={hasFilters}
        onClearFilters={handleClearFilters}
      />

      {totalCount > 0 && (
        <SuppliesPagination
          currentPage={page}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={setPage}
          isLoading={isLoading}
        />
      )}

      <CreateSupplyModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
    </div>
  )
}
