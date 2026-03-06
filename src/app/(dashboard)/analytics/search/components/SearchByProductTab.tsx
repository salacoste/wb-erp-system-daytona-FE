'use client'

/**
 * Search By Product Tab - Product selector + search query data orchestrator
 * Story 71.6-FE: By-Product Keyword Explorer Tab
 */

import { useState } from 'react'
import { useSearchByProduct } from '@/hooks/use-search-analytics'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Search } from 'lucide-react'
import { ProductCombobox } from './ProductCombobox'
import { SearchByProductTable } from './SearchByProductTable'

interface SearchByProductTabProps {
  from: string
  to: string
}

export function SearchByProductTab({ from, to }: SearchByProductTabProps) {
  const [selectedNmId, setSelectedNmId] = useState<number | undefined>()
  const { data, isLoading, isError } = useSearchByProduct(selectedNmId, from, to)

  return (
    <div className="space-y-4 pt-4">
      <ProductCombobox value={selectedNmId} onChange={setSelectedNmId} />

      {!selectedNmId && <NoProductPlaceholder />}

      {selectedNmId && isLoading && <LoadingSkeleton />}

      {selectedNmId && isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Не удалось загрузить поисковые данные. Попробуйте обновить страницу.
          </AlertDescription>
        </Alert>
      )}

      {selectedNmId && !isLoading && !isError && data && (
        <QueryResults queries={data.queries} totalQueries={data.totalQueries} nmId={selectedNmId} />
      )}
    </div>
  )
}

function NoProductPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Search className="h-12 w-12 mb-3 opacity-40" />
      <p className="text-sm">Выберите товар, чтобы увидеть поисковые запросы</p>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-64" />
      <Skeleton className="h-96 w-full" />
    </div>
  )
}

function QueryResults({
  queries,
  totalQueries,
  nmId,
}: {
  queries: {
    searchQuery: string
    avgPosition: number
    totalImpressions: number
    totalClicks: number
    avgCtr: number
    totalOrders: number
    totalRevenue: number
  }[]
  totalQueries: number
  nmId: number
}) {
  if (queries.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Нет поисковых данных для этого товара за выбранный период
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Найдено запросов: <span className="font-medium text-foreground">{totalQueries}</span> для
        товара nmId: {nmId}
      </p>
      <SearchByProductTable queries={queries} />
    </div>
  )
}
