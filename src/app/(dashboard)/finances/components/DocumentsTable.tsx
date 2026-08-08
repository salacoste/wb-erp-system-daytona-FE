'use client'

/**
 * DocumentsTable — NEW-7 financial documents list.
 *
 * Filters (category dropdown, period date pickers, sort order) + pagination
 * (limit/offset) + per-row download (DocumentDownloadButton). Owns its OWN
 * loading/empty/error state machine (AC4) — a documents failure never blanks
 * the balance card.
 *
 * Rate-limit-aware: the underlying `useFinanceDocuments` hook has a 10s
 * staleTime mirroring the WB 1/10s limit.
 */

import { useState, useCallback } from 'react'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { useFinanceDocuments, useFinanceDocumentCategories } from '@/hooks/useFinances'
import { DEFAULT_PAGE_SIZE } from '@/hooks/useFinances-utils'
import { formatDate } from '@/lib/utils'
import { DocumentDownloadButton } from './DocumentDownloadButton'
import { DocumentsFilters } from './DocumentsFilters'
import { DocumentsPagination } from './DocumentsPagination'
import type { DocumentItem, DocumentsSort, DocumentsOrder, DocumentsLocale } from '@/types/finances'

const DOCS_ERROR_MESSAGE = 'Не удалось загрузить документы. Попробуйте ещё раз.'

export interface DocumentsTableProps {
  enabled?: boolean
  locale?: DocumentsLocale
}

export function DocumentsTable({ enabled = true, locale }: DocumentsTableProps) {
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
        />
        <DocumentsBody
          isLoading={docs.isLoading}
          isError={docs.isError}
          documents={docs.data}
          locale={locale}
          onRetry={handleRetry}
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

interface DocumentsBodyProps {
  isLoading: boolean
  isError: boolean
  documents?: DocumentItem[]
  locale?: DocumentsLocale
  onRetry: () => void
}

function DocumentsBody({ isLoading, isError, documents, locale, onRetry }: DocumentsBodyProps) {
  if (isLoading) {
    return <Skeleton className="h-64 w-full" />
  }
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
          <span>{DOCS_ERROR_MESSAGE}</span>
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Повторить
          </Button>
        </AlertDescription>
      </Alert>
    )
  }
  if (!documents || documents.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Документы не найдены</p>
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Название</TableHead>
          <TableHead>Категория</TableHead>
          <TableHead>Дата</TableHead>
          <TableHead className="text-right">Скачать</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map(doc => (
          <DocumentRow key={doc.serviceName ?? doc.name} doc={doc} locale={locale} />
        ))}
      </TableBody>
    </Table>
  )
}

function DocumentRow({ doc, locale }: { doc: DocumentItem; locale?: DocumentsLocale }) {
  return (
    <TableRow>
      <TableCell className="font-medium">{doc.name ?? doc.serviceName ?? '—'}</TableCell>
      <TableCell>{doc.category ?? '—'}</TableCell>
      <TableCell className="tabular-nums">
        {doc.creationTime ? formatDate(doc.creationTime) : '—'}
      </TableCell>
      <TableCell className="text-right">
        <DocumentDownloadButton
          serviceName={doc.serviceName ?? ''}
          extensions={doc.extensions}
          locale={locale}
          disabled={!doc.serviceName}
        />
      </TableCell>
    </TableRow>
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
