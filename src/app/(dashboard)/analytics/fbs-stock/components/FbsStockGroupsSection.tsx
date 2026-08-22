/**
 * FBS Stock — Groups Breakdown Section
 * Epic 96-FE Story 96.11-FE
 *
 * Independent state machine (Pattern 1): skeleton / error / empty / populated.
 * Failure here does NOT affect FbsStockSizesSection or FbsStockRegionsSection.
 *
 * Columns: Группа | SKU | Остатки (ед.) | Стоимость (₽) | Расход/день | Дней покрытия
 * Null money/ratio fields render as '—' (CLAUDE.md anti-pattern #8).
 */

'use client'

import { useState } from 'react'
import { format, subDays } from 'date-fns'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { DateRangePickerExtended } from '@/components/custom/DateRangePickerExtended'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDecimal } from '@/lib/utils'
import { useFbsStockGroups } from '@/hooks/use-fbs-stock-groups'
import type { DateRange } from '@/types/date-range'

function getDefaultRange(): DateRange {
  const to = new Date()
  to.setHours(23, 59, 59, 999)
  const from = subDays(to, 29)
  from.setHours(0, 0, 0, 0)
  return { from, to }
}

function formatApi(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function FbsStockGroupsSection() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(getDefaultRange)

  const apiFrom = dateRange ? formatApi(dateRange.from) : ''
  const apiTo = dateRange ? formatApi(dateRange.to) : ''

  const { data, isLoading, isError, refetch } = useFbsStockGroups(apiFrom, apiTo)
  const groups = data?.data.groups ?? []
  const hasData = groups.length > 0

  const showSkeleton = isLoading && !hasData
  const showFullError = isError && !hasData

  return (
    <div className="space-y-4" data-testid="fbs-stock-groups-section">
      {/* Date range picker */}
      <DateRangePickerExtended
        value={dateRange}
        onChange={setDateRange}
        maxDays={365}
        placeholder="Выберите период"
        id="fbs-stock-groups-date-range"
      />

      {/* State machine */}
      {showSkeleton ? (
        <div className="space-y-2" role="status" aria-busy="true" aria-label="Загрузка данных">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : showFullError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Не удалось загрузить данные по группам. Попробуйте ещё раз.</span>
            <Button
              variant="outline"
              size="sm"
              className="ml-4 shrink-0"
              onClick={() => void refetch()}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Повторить
            </Button>
          </AlertDescription>
        </Alert>
      ) : !hasData ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Нет данных по товарным группам за выбранный период.</AlertDescription>
        </Alert>
      ) : (
        <>
          {isError && hasData && (
            <div className="rounded-md border border-status-warning/30 bg-status-warning/15 px-4 py-2 text-sm text-status-warning flex items-center justify-between">
              <span>Не удалось обновить. Показаны кэшированные данные.</span>
              <Button variant="ghost" size="sm" onClick={() => void refetch()}>
                Повторить
              </Button>
            </div>
          )}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableCaption>Остатки FBS по товарным группам</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Группа</TableHead>
                  <TableHead className="text-right">SKU</TableHead>
                  <TableHead className="text-right">Остатки (ед.)</TableHead>
                  <TableHead className="text-right">Стоимость (₽)</TableHead>
                  <TableHead className="text-right">Расход/день</TableHead>
                  <TableHead className="text-right">Дней покрытия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map(item => (
                  <TableRow key={item.groupName}>
                    <TableCell className="font-medium">{item.groupName || '—'}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {item.skuCount}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {item.stockUnits}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {item.stockValue == null ? '—' : formatCurrency(item.stockValue)}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {item.averageDailyOutgoing}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {/* Russian locale: comma decimal ("12,5"), not "12.5" */}
                      {item.daysOfCover == null ? '—' : formatDecimal(item.daysOfCover)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
