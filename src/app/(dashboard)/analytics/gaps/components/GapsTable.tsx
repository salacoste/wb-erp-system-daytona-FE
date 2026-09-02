'use client'

/**
 * Table of missing dates with analyze button and status
 */

import { Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate } from '@/lib/utils'
import type { MissingDate } from '@/types/financial-gaps'

interface GapsTableProps {
  missingDates: MissingDate[] | undefined
  isLoading: boolean
  analyzingDate: string | null
  onAnalyze: (missingDate: string, trigger: HTMLButtonElement) => void
}

/** Russian day name mapping */
const DAY_NAMES: Record<string, string> = {
  Monday: 'Понедельник',
  Tuesday: 'Вторник',
  Wednesday: 'Среда',
  Thursday: 'Четверг',
  Friday: 'Пятница',
  Saturday: 'Суббота',
  Sunday: 'Воскресенье',
}

export function GapsTable({ missingDates, isLoading, analyzingDate, onAnalyze }: GapsTableProps) {
  if (isLoading) {
    return (
      <div role="status" aria-live="polite" className="space-y-3">
        <span className="sr-only">Таблица пропусков загружается</span>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (!missingDates || missingDates.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Пропуски не обнаружены — все данные на месте
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      {/* C13 (2026-09-02): caption is the table identity; the scroll-region label describes the scrollable area — deduplicated so SR users don't hear the table twice. */}
      <Table
        scrollContainerTabIndex={0}
        scrollContainerAriaLabel="Область прокрутки таблицы пропущенных дней"
      >
        <TableCaption>Пропущенные дни в финансовых данных</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Дата</TableHead>
            <TableHead>День недели</TableHead>
            <TableHead className="text-right">Действие</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {missingDates.map(item => {
            const isAnalyzing = analyzingDate === item.missing_date
            return (
              <TableRow key={item.missing_date}>
                <TableCell className="font-medium">
                  {formatDate(new Date(item.missing_date + 'T00:00:00'))}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{DAY_NAMES[item.day_name] ?? item.day_name}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-11"
                    disabled={analyzingDate !== null}
                    aria-label={`Анализ за ${formatDate(new Date(item.missing_date + 'T00:00:00'))}`}
                    onClick={event => onAnalyze(item.missing_date, event.currentTarget)}
                  >
                    {isAnalyzing ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Search className="mr-1 h-3 w-3" />
                    )}
                    Анализ
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
