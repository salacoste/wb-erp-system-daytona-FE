'use client'

/**
 * ReconciliationSection — date picker + reconciliation table
 *
 * Displays orders reconciliation data with a date range picker
 * and a table showing by-date variance breakdown.
 */

import { useState, useMemo } from 'react'
import { format, subDays } from 'date-fns'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DateRangePickerExtended } from '@/components/custom/DateRangePickerExtended'
import { useOrdersReconciliation } from '@/hooks/use-orders-reconciliation'
import { formatPercentage } from '@/lib/utils'
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

function formatDisplay(date: Date): string {
  return format(date, 'dd.MM.yyyy')
}

export function ReconciliationSection() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(getDefaultRange)

  const { apiFrom, apiTo } = useMemo(
    () => ({
      apiFrom: dateRange ? formatApi(dateRange.from) : '',
      apiTo: dateRange ? formatApi(dateRange.to) : '',
    }),
    [dateRange]
  )

  const { data, isLoading, isError, refetch } = useOrdersReconciliation(apiFrom, apiTo)

  const byDate = data?.byDate ?? []
  const hasData = byDate.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Сверка заказов</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date range picker */}
        <div className="flex items-center gap-4 flex-wrap">
          <DateRangePickerExtended
            value={dateRange}
            onChange={setDateRange}
            maxDays={90}
            placeholder="Выберите период"
            id="reconciliation-date-range"
          />
        </div>

        {/* Summary stats */}
        {data && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Всего заказов</p>
              <p className="text-lg font-bold tabular-nums">{data.totalCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Локальных</p>
              <p className="text-lg font-bold tabular-nums">{data.localCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ожидаемых</p>
              <p className="text-lg font-bold tabular-nums">{data.expectedCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Расхождение</p>
              <p className="text-lg font-bold tabular-nums">
                {data.variancePercent != null ? formatPercentage(data.variancePercent) : '—'}
              </p>
            </div>
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <div className="space-y-2" role="status" aria-busy="true">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : isError && !hasData ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Не удалось загрузить данные сверки.</span>
              <Button
                variant="outline"
                size="sm"
                className="ml-4 shrink-0"
                onClick={() => void refetch()}
              >
                <RefreshCw className="mr-1 h-4 w-4" />
                Повторить
              </Button>
            </AlertDescription>
          </Alert>
        ) : !hasData ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Нет данных за выбранный период.
          </p>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead className="text-right">Локальных</TableHead>
                  <TableHead className="text-right">Ожидаемых</TableHead>
                  <TableHead className="text-right">Расхождение</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byDate.map(row => (
                  <TableRow key={row.date}>
                    <TableCell className="font-medium">
                      {formatDisplay(new Date(row.date))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{row.localCount}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.expectedCount}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.variance}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.variancePercent != null ? formatPercentage(row.variancePercent) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
