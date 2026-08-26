'use client'

/**
 * Search By Product Tab - Product selector + search query data orchestrator
 * Story 71.6-FE: By-Product Keyword Explorer Tab
 */

import { useState, useMemo, useEffect } from 'react'
import { useSearchByProduct } from '@/hooks/use-search-analytics'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ExportCsvButton } from '@/components/custom/ai/ExportCsvButton'
import { exportSearchByProductToCsv } from '@/lib/csv/search-csv-export'
import { AlertCircle, Search } from 'lucide-react'
import type { SearchQueryItem } from '@/types/search-analytics'
import { ProductCombobox } from './ProductCombobox'
import { SearchByProductTable } from './SearchByProductTable'

interface SearchByProductTabProps {
  from: string
  to: string
  /** Story 170.7 deep-link: numeric nmId from ?nmId= — preselects the product
   * (movers/opportunities cross-links are live). Reseeded on prop change like
   * SearchByQueryTab's initialQuery reseed (119.2-FE P2-4 pattern). */
  initialNmId?: number
}

export function SearchByProductTab({ from, to, initialNmId }: SearchByProductTabProps) {
  const [selectedNmId, setSelectedNmId] = useState<number | undefined>(initialNmId)
  // Reseed on deep-link prop change after mount (119.2-FE P2-4 pattern):
  // a second movers link click while already on the page must re-preselect.
  useEffect(() => {
    if (initialNmId !== undefined) setSelectedNmId(initialNmId)
  }, [initialNmId])

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
      <Search className="h-12 w-12 mb-3 opacity-40" aria-hidden="true" />
      <p className="text-sm">Выберите товар, чтобы увидеть поисковые запросы</p>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-busy="true">
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
  queries: SearchQueryItem[]
  totalQueries: number
  nmId: number
}) {
  const csvContent = useMemo(() => exportSearchByProductToCsv(queries), [queries])
  const csvFileName = `search-by-product-${nmId}.csv`

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
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Найдено запросов: <span className="font-medium text-foreground">{totalQueries}</span> для
          товара nmId: {nmId}
        </p>
        <ExportCsvButton csvContent={csvContent} fileName={csvFileName} label="Скачать CSV" />
      </div>
      <SearchByProductTable queries={queries} />
    </div>
  )
}
