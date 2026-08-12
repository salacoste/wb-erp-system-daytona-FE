'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type SharedPaginationProps = {
  label: string
  resultScope: string
  disabled?: boolean
  updating?: boolean
  className?: string
  pageSize?: ReactNode
}

type EmptyOffsetPaginationProps = SharedPaginationProps & {
  kind: 'offset'
  currentPage: 0
  totalPages: 0
  onPageChange: (page: number) => void
}

type PopulatedOffsetPaginationProps = SharedPaginationProps & {
  kind: 'offset'
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

type CursorPaginationProps = SharedPaginationProps & {
  kind: 'cursor'
  hasPrevious: boolean
  hasNext: boolean
  onPrevious: () => void
  onNext: () => void
}

export type TablePaginationProps =
  EmptyOffsetPaginationProps | PopulatedOffsetPaginationProps | CursorPaginationProps

export function TablePagination(props: TablePaginationProps) {
  const unavailable = props.disabled || props.updating
  const validOffsetPage =
    props.kind !== 'offset' ||
    (props.currentPage === 0 && props.totalPages === 0) ||
    (Number.isInteger(props.currentPage) &&
      Number.isInteger(props.totalPages) &&
      props.currentPage >= 1 &&
      props.totalPages >= props.currentPage)
  const hasPrevious =
    props.kind === 'offset'
      ? validOffsetPage && props.totalPages > 0 && props.currentPage > 1
      : props.hasPrevious
  const hasNext =
    props.kind === 'offset'
      ? validOffsetPage && props.totalPages > 0 && props.currentPage < props.totalPages
      : props.hasNext

  function previous() {
    if (!hasPrevious || unavailable) return
    if (props.kind === 'offset') props.onPageChange(props.currentPage - 1)
    else props.onPrevious()
  }

  function next() {
    if (!hasNext || unavailable) return
    if (props.kind === 'offset') props.onPageChange(props.currentPage + 1)
    else props.onNext()
  }

  return (
    <nav
      aria-label={props.label}
      aria-busy={props.updating || undefined}
      className={cn(
        'flex min-w-0 flex-wrap items-center justify-between gap-3 py-3',
        props.className
      )}
    >
      <div className="min-w-0 break-words text-sm text-muted-foreground">{props.resultScope}</div>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {props.pageSize}
        <Button
          type="button"
          variant="outline"
          onClick={previous}
          disabled={!hasPrevious || unavailable}
          aria-label="Предыдущая страница"
          className="min-h-11 whitespace-normal"
        >
          <ChevronLeft aria-hidden="true" />
          Назад
        </Button>
        {props.kind === 'offset' ? (
          <span className="break-words text-sm text-muted-foreground" aria-live="polite">
            {!validOffsetPage
              ? 'Недоступный диапазон страниц'
              : props.totalPages === 0
                ? 'Страниц нет'
                : `Страница ${props.currentPage} из ${props.totalPages}`}
          </span>
        ) : null}
        <Button
          type="button"
          variant="outline"
          onClick={next}
          disabled={!hasNext || unavailable}
          aria-label="Следующая страница"
          className="min-h-11 whitespace-normal"
        >
          Вперёд
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </nav>
  )
}
