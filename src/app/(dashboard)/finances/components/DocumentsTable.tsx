'use client'

/**
 * DocumentsTable — NEW-7 financial documents list.
 *
 * Filters (category dropdown, period date pickers, sort order) + pagination
 * (limit/offset) + per-row download (DocumentDownloadButton). Owns its OWN
 * loading/empty/error state machine (AC4) — a documents failure never blanks
 * the balance card. Render branches live in DocumentsBody (Story 172.10
 * max-lines extraction).
 *
 * Rate-limit-aware: the underlying `useFinanceDocuments` hook has a 10s
 * staleTime mirroring the WB 1/10s limit.
 */

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useFinanceDocuments, useFinanceDocumentCategories } from '@/hooks/useFinances'
import { DEFAULT_PAGE_SIZE } from '@/hooks/useFinances-utils'
import { DocumentsBody } from './DocumentsBody'
import { DocumentsFilters } from './DocumentsFilters'
import { DocumentsPagination } from './DocumentsPagination'
import type { DocumentsSort, DocumentsOrder, DocumentsLocale } from '@/types/finances'

export interface DocumentsTableProps {
  enabled?: boolean
  locale?: DocumentsLocale
  /** Optional — table caption naming the source (RTC contract, Story 172.10-FE) */
  captionText?: string
}

export function DocumentsTable({ enabled = true, locale, captionText }: DocumentsTableProps) {
  const [category, setCategory] = useState<string>('all')
  const [beginTime, setBeginTime] = useState<string>('')
  const [endTime, setEndTime] = useState<string>('')
  const [sort, setSort] = useState<DocumentsSort>('date')
  const [order, setOrder] = useState<DocumentsOrder>('desc')
  const [offset, setOffset] = useState(0)

  const query = {
    locale,
    category: category !== 'all' ? category : undefined,
    beginTime: beginTime ? toIsoStart(beginTime) : undefined,
    endTime: endTime ? toIsoEnd(endTime) : undefined,
    sort,
    order,
    limit: DEFAULT_PAGE_SIZE,
    offset,
  }

  const docs = useFinanceDocuments(query, { enabled })
  const categories = useFinanceDocumentCategories(locale, { enabled })

  const handleRetry = useCallback(() => docs.refetch(), [docs])
  const resetOffset = useCallback(() => setOffset(0), [])
  const resetFilters = useCallback(() => {
    setCategory('all')
    setBeginTime('')
    setEndTime('')
    setOffset(0)
  }, [])
  const hasActiveFilters = category !== 'all' || Boolean(beginTime) || Boolean(endTime)
  const categoryState = categories.isLoading ? 'loading' : categories.isError ? 'error' : 'ready'

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Финансовые документы</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <DocumentsFilters
          category={category}
          onCategoryChange={v => {
            setCategory(v)
            resetOffset()
          }}
          beginTime={beginTime}
          endTime={endTime}
          onBeginTimeChange={v => {
            setBeginTime(v)
            resetOffset()
          }}
          onEndTimeChange={v => {
            setEndTime(v)
            resetOffset()
          }}
          sort={sort}
          order={order}
          // Sort/order change must reset to page 1, else offset>0 fetches a stale
          // (likely empty) page under the new ordering — same as category/date.
          onSortChange={v => {
            setSort(v)
            resetOffset()
          }}
          onOrderChange={v => {
            setOrder(v)
            resetOffset()
          }}
          categoryOptions={categories.data}
          categoryState={categoryState}
        />
        <DocumentsBody
          isLoading={docs.isLoading}
          isError={docs.isError}
          documents={docs.data}
          locale={locale}
          captionText={captionText}
          hasActiveFilters={hasActiveFilters}
          onRetry={handleRetry}
          onResetFilters={resetFilters}
        />
        <DocumentsPagination
          offset={offset}
          pageSize={DEFAULT_PAGE_SIZE}
          count={docs.data?.length ?? 0}
          onPrev={() => setOffset(Math.max(0, offset - DEFAULT_PAGE_SIZE))}
          onNext={() => setOffset(offset + DEFAULT_PAGE_SIZE)}
        />
      </CardContent>
    </Card>
  )
}

/** Date input value (yyyy-mm-dd) → ISO 8601 start-of-day. */
function toIsoStart(dateValue: string): string {
  return `${dateValue}T00:00:00Z`
}

/** Date input value (yyyy-mm-dd) → ISO 8601 end-of-day. */
function toIsoEnd(dateValue: string): string {
  return `${dateValue}T23:59:59Z`
}
