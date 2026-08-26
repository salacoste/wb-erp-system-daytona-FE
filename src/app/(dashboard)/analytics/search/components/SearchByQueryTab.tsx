'use client'

/**
 * Search By Query Tab - Search input + product ranking orchestrator
 * Story 71.7-FE: By-Query Product Ranking Tab
 * Story 119.2-FE Pass-1 F-1: optional `initialQuery` seeds both the visible input
 * and the debounced query so the funnel cross-page link auto-fires the search.
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useSearchByQuery } from '@/hooks/use-search-analytics'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { ExportCsvButton } from '@/components/custom/ai/ExportCsvButton'
import { exportSearchByQueryToCsv } from '@/lib/csv/search-csv-export'
import { AlertCircle, Search, X } from 'lucide-react'
import type { SearchProductItem } from '@/types/search-analytics'
import { SearchByQueryTable } from './SearchByQueryTable'

const DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 2

interface SearchByQueryTabProps {
  from: string
  to: string
  /** Story 119.2-FE Pass-1 F-1: when set (via Search page `?query=` URL param),
   * seeds the input and immediately triggers the search (no manual typing required). */
  initialQuery?: string
}

export function SearchByQueryTab({ from, to, initialQuery }: SearchByQueryTabProps) {
  const seed = typeof initialQuery === 'string' ? initialQuery : ''
  const [queryInput, setQueryInput] = useState(seed)
  const [debouncedQuery, setDebouncedQuery] = useState(seed.trim())
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Story 119.2-FE Pass-2 P2-4: reseed state when `initialQuery` prop changes
   * after mount. Without this, a user already on the Search page who clicks a
   * SECOND funnel query link (URL changes to ?query=термостойкая but component
   * doesn't remount) sees stale input value from the FIRST click. Effect only
   * fires on prop-change, not on user typing (which mutates queryInput directly).
   */
  useEffect(() => {
    if (typeof initialQuery === 'string') {
      setQueryInput(initialQuery)
      setDebouncedQuery(initialQuery.trim())
    }
    // Intentionally only depend on initialQuery — see comment above
  }, [initialQuery])

  const shouldFetch = debouncedQuery.length >= MIN_QUERY_LENGTH
  const { data, isLoading, isError } = useSearchByQuery(shouldFetch ? debouncedQuery : '', from, to)

  const handleInputChange = useCallback((value: string) => {
    setQueryInput(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setDebouncedQuery(value.trim()), DEBOUNCE_MS)
  }, [])

  const handleClear = useCallback(() => {
    setQueryInput('')
    setDebouncedQuery('')
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div className="space-y-4 pt-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={queryInput}
          onChange={e => handleInputChange(e.target.value)}
          placeholder="Введите поисковый запрос (мин. 2 символа)"
          // 170.7: label reverted to the e2e-locked «Поисковый запрос» — the 7f08f688
          // rename to «Поиск по запросам» left e2e tests 5+8 silently skipping.
          aria-label="Поисковый запрос"
          className="pl-9 pr-9"
        />
        {queryInput && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Очистить запрос"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {!shouldFetch && <NoQueryPlaceholder />}

      {shouldFetch && isLoading && <LoadingSkeleton />}

      {shouldFetch && isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Не удалось загрузить данные. Попробуйте обновить страницу.
          </AlertDescription>
        </Alert>
      )}

      {shouldFetch && !isLoading && !isError && data && (
        <QueryResults
          products={data.products}
          totalProducts={data.totalProducts}
          query={debouncedQuery}
        />
      )}
    </div>
  )
}

function NoQueryPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Search className="mb-3 h-12 w-12 opacity-40" aria-hidden="true" />
      <p className="text-sm">Введите поисковый запрос, чтобы увидеть рейтинг товаров</p>
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
  products,
  totalProducts,
  query,
}: {
  products: SearchProductItem[]
  totalProducts: number
  query: string
}) {
  const csvContent = useMemo(() => exportSearchByQueryToCsv(products), [products])
  const csvFileName = `search-by-query-${query}.csv`

  if (products.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Ваши товары не найдены по запросу &laquo;{query}&raquo;</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Найдено товаров: <span className="font-medium text-foreground">{totalProducts}</span> по
          запросу &laquo;{query}&raquo;
        </p>
        <ExportCsvButton csvContent={csvContent} fileName={csvFileName} label="Скачать CSV" />
      </div>
      <SearchByQueryTable products={products} />
    </div>
  )
}
