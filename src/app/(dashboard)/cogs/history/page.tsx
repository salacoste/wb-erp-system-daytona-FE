'use client'

/**
 * COGS History Page
 * Story 5.1-fe: View COGS History
 * Route: /cogs/history?nmId={nmId}
 * Sub-components: CogsHistoryPageStates (no-nmId, loading, error, empty states)
 */

import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useCogsHistoryFull } from '@/hooks/useCogsHistoryFull'
import { CogsHistoryMeta } from '@/components/custom/CogsHistoryMeta'
import { CogsHistoryTable } from '@/components/custom/CogsHistoryTable'
import { CogsHistoryPagination } from '@/components/custom/CogsHistoryPagination'
import { Breadcrumbs } from './CogsHistoryBreadcrumbs'
import { getPluralForm } from './cogs-history-utils'
import { useCogsHistoryPageState } from './useCogsHistoryPageState'
import {
  CogsHistoryNoNmId,
  CogsHistoryLoading,
  CogsHistoryError,
  CogsHistoryEmpty,
} from './CogsHistoryPageStates'

/**
 * COGS History Page
 * Story 5.1-fe: View COGS History
 * Route: /cogs/history?nmId={nmId}
 *
 * AC: 1, 2, 3, 11, 12, 13
 * Reference: frontend/docs/stories/epic-5/story-5.1-fe-cogs-history-view.md
 */
export default function CogsHistoryPage() {
  const searchParams = useSearchParams()
  const nmId = searchParams.get('nmId')

  const {
    cursor,
    includeDeleted,
    limit,
    handlePreviousPage,
    handleNextPage,
    handleIncludeDeletedChange,
    hasPrevious,
    hasNext,
  } = useCogsHistoryPageState()

  // Fetch COGS history
  const { data, isLoading, isError, error, refetch } = useCogsHistoryFull(nmId || undefined, {
    limit,
    cursor,
    include_deleted: includeDeleted,
  })

  // No nmId provided
  if (!nmId) return <CogsHistoryNoNmId />

  // AC: 11 - Skeleton loader during loading
  if (isLoading) return <CogsHistoryLoading />

  // AC: 13 - Error state with retry button
  if (isError) return <CogsHistoryError error={error} onRetry={() => refetch()} />

  // AC: 12 - Empty state
  if (!data?.data?.length && !isLoading) {
    return <CogsHistoryEmpty nmId={nmId} meta={data?.meta} />
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs productName={data?.meta?.product_name} />

      {/* AC: 2, 9, 10 - Page header with meta info */}
      {data?.meta && <CogsHistoryMeta meta={data.meta} />}

      {/* Main table card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>История изменений</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {data?.pagination?.total || 0}{' '}
              {getPluralForm(data?.pagination?.total || 0, 'версия', 'версии', 'версий')}
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/cogs">
              <ArrowLeft className="mr-2 h-4 w-4" />К товарам
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {/* AC: 4-8, 14-20 - History table with all features */}
          <CogsHistoryTable
            data={data?.data || []}
            includeDeleted={includeDeleted}
            onIncludeDeletedChange={handleIncludeDeletedChange}
          />

          {/* AC: 6 - Pagination */}
          <CogsHistoryPagination
            displayedCount={data?.data?.length || 0}
            totalCount={data?.pagination?.total || 0}
            hasPrevious={hasPrevious}
            hasNext={hasNext(data?.pagination)}
            onPrevious={handlePreviousPage}
            onNext={() => handleNextPage(data?.pagination)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
