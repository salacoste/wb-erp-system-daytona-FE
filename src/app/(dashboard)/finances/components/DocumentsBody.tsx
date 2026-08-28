'use client'

/**
 * DocumentsBody — state-machine view for the NEW-7 documents list.
 *
 * Extracted from DocumentsTable (Story 172.10 max-lines cap): owns the
 * loading / error / empty / filtered-empty / populated render branches.
 * State and data fetching stay in DocumentsTable.
 */

import { RefreshCw, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableCaption,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { formatDate } from '@/lib/utils'
import { DocumentDownloadButton } from './DocumentDownloadButton'
import type { DocumentItem, DocumentsLocale } from '@/types/finances'

const DOCS_ERROR_MESSAGE = 'Не удалось загрузить документы. Попробуйте ещё раз.'

export interface DocumentsBodyProps {
  isLoading: boolean
  isError: boolean
  documents?: DocumentItem[]
  locale?: DocumentsLocale
  /** Optional — table caption naming the source (RTC contract, Story 172.10-FE) */
  captionText?: string
  /** Distinguishes filtered-empty (offers a reset) from a plain empty list. */
  hasActiveFilters: boolean
  onRetry: () => void
  onResetFilters: () => void
}

export function DocumentsBody({
  isLoading,
  isError,
  documents,
  locale,
  captionText,
  hasActiveFilters,
  onRetry,
  onResetFilters,
}: DocumentsBodyProps) {
  if (isLoading) {
    return (
      <div role="status" aria-label="Загрузка финансовых документов">
        <Skeleton className="h-64 w-full" aria-hidden />
      </div>
    )
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
    if (hasActiveFilters) {
      return (
        <div className="space-y-3 py-8 text-center">
          <p className="text-sm text-muted-foreground">По выбранным фильтрам документов нет</p>
          <Button variant="outline" size="sm" onClick={onResetFilters}>
            Сбросить фильтры
          </Button>
        </div>
      )
    }
    return <p className="py-8 text-center text-sm text-muted-foreground">Документы не найдены</p>
  }
  return (
    <Table scrollContainerTabIndex={0} scrollContainerAriaLabel="Финансовые документы">
      {/* Story 172.10: caption names the source (RTC); spec-order above header,
          visually bottom via ui Table caption-bottom (171.9 canon). */}
      {captionText ? <TableCaption>{captionText}</TableCaption> : null}
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
