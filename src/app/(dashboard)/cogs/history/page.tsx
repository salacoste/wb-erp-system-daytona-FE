'use client'

import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, ArrowLeft, Home, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useCogsHistoryFull } from '@/hooks/useCogsHistoryFull'
import { CogsHistoryMeta } from '@/components/custom/CogsHistoryMeta'
import { CogsHistoryTable } from '@/components/custom/CogsHistoryTable'
import { CogsHistoryPagination } from '@/components/custom/CogsHistoryPagination'
import { useState } from 'react'

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

  // State for pagination and filters
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [prevCursors, setPrevCursors] = useState<string[]>([])
  const [includeDeleted, setIncludeDeleted] = useState(false)

  const limit = 25

  // Fetch COGS history
  const { data, isLoading, isError, error, refetch } = useCogsHistoryFull(nmId || undefined, {
    limit,
    cursor,
    include_deleted: includeDeleted,
  })

  // Handle pagination
  const handlePreviousPage = () => {
    if (prevCursors.length > 0) {
      const newPrevCursors = [...prevCursors]
      const previousCursor = newPrevCursors.pop()
      setPrevCursors(newPrevCursors)
      setCursor(previousCursor)
    }
  }

  const handleNextPage = () => {
    if (data?.pagination?.cursor) {
      setPrevCursors(cursor ? [...prevCursors, cursor] : prevCursors)
      setCursor(data.pagination.cursor)
    }
  }

  const handleIncludeDeletedChange = (value: boolean) => {
    setIncludeDeleted(value)
    setCursor(undefined)
    setPrevCursors([])
  }

  // AC: 3 - Breadcrumb navigation
  const Breadcrumbs = () => (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
      <Link href="/dashboard" className="flex items-center hover:text-foreground">
        <Home className="h-4 w-4" />
      </Link>
      <ChevronRight className="h-4 w-4" />
      <Link href="/cogs" className="hover:text-foreground">
        COGS
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-foreground">История</span>
      {data?.meta?.product_name && (
        <>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground truncate max-w-[200px]">
            {data.meta.product_name}
          </span>
        </>
      )}
    </nav>
  )

  // No nmId provided
  if (!nmId) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Не указан ID товара. Перейдите на страницу товара и нажмите &quot;История COGS&quot;.
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href="/cogs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Вернуться к товарам
          </Link>
        </Button>
      </div>
    )
  }

  // AC: 11 - Skeleton loader during loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // AC: 13 - Error state with retry button
  if (isError) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                {error instanceof Error
                  ? error.message
                  : 'Ошибка загрузки истории COGS'}
              </span>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Повторить
              </Button>
            </div>
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href="/cogs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Вернуться к товарам
          </Link>
        </Button>
      </div>
    )
  }

  // AC: 12 - Empty state
  if (!data?.data?.length && !isLoading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />

        {/* Meta card even for empty state */}
        {data?.meta && (
          <CogsHistoryMeta meta={data.meta} />
        )}

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <CardTitle className="mb-2">История изменений COGS пуста</CardTitle>
            <p className="text-muted-foreground text-center max-w-md">
              Назначьте COGS товару для начала. После назначения здесь будет
              отображаться история всех изменений себестоимости.
            </p>
            <Button asChild className="mt-6">
              <Link href={`/cogs?nmId=${nmId}`}>
                Назначить COGS
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Computed values for pagination
  const hasPrevious = prevCursors.length > 0 || cursor !== undefined
  const hasNext = Boolean(data?.pagination?.has_more)

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      {/* AC: 2, 9, 10 - Page header with meta info */}
      {data?.meta && (
        <CogsHistoryMeta meta={data.meta} />
      )}

      {/* Main table card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>История изменений</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {data?.pagination?.total || 0} {getPluralForm(data?.pagination?.total || 0, 'версия', 'версии', 'версий')}
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/cogs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              К товарам
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
            hasNext={hasNext}
            onPrevious={handlePreviousPage}
            onNext={handleNextPage}
          />
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Helper for Russian plural forms
 */
function getPluralForm(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100

  if (mod100 >= 11 && mod100 <= 19) return many
  if (mod10 === 1) return one
  if (mod10 >= 2 && mod10 <= 4) return few
  return many
}
