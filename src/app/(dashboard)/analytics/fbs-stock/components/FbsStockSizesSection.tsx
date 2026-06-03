/**
 * FBS Stock — Sizes Breakdown Section
 * Epic 96-FE Story 96.11-FE
 *
 * Independent state machine (Pattern 1): skeleton / error / empty / populated.
 * Failure here does NOT affect FbsStockGroupsSection or FbsStockRegionsSection.
 *
 * Includes optional nm_id (WB article) free-text filter above the table.
 * Empty input → no nm_id filter applied (all sizes returned).
 *
 * Columns: Размер | Артикул WB | SKU | Остатки (ед.) | Расход/день | Дней покрытия
 * Null ratio fields render as '—' (CLAUDE.md anti-pattern #8).
 */

'use client'

import { useState } from 'react'
import { format, subDays } from 'date-fns'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { DateRangePickerExtended } from '@/components/custom/DateRangePickerExtended'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useFbsStockSizes } from '@/hooks/use-fbs-stock-sizes'
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

export function FbsStockSizesSection() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(getDefaultRange)
  const [nmIdInput, setNmIdInput] = useState('')

  const apiFrom = dateRange ? formatApi(dateRange.from) : ''
  const apiTo = dateRange ? formatApi(dateRange.to) : ''
  // M-3: regex-validated positive integer parse — rejects decimals, negatives, scientific notation
  const trimmed = nmIdInput.trim()
  const parsedNmId = /^\d+$/.test(trimmed) ? Number.parseInt(trimmed, 10) : null
  const nmId = parsedNmId != null && parsedNmId > 0 ? parsedNmId : undefined
  const showNmIdError = trimmed !== '' && parsedNmId === null

  const { data, isLoading, isError, refetch } = useFbsStockSizes(apiFrom, apiTo, nmId)
  const sizes = data?.data.sizes ?? []
  const hasData = sizes.length > 0

  const showSkeleton = isLoading && !hasData
  const showFullError = isError && !hasData

  return (
    <div className="space-y-4" data-testid="fbs-stock-sizes-section">
      {/* Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <DateRangePickerExtended
          value={dateRange}
          onChange={setDateRange}
          maxDays={365}
          placeholder="Выберите период"
          id="fbs-stock-sizes-date-range"
        />
        <div className="flex flex-col gap-1">
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Артикул WB (опционально)"
            value={nmIdInput}
            onChange={e => setNmIdInput(e.target.value)}
            className="w-56"
            aria-label="Фильтр по артикулу WB"
          />
          {showNmIdError && (
            <p className="text-xs text-amber-700">Должно быть положительное целое число</p>
          )}
        </div>
      </div>

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
            <span>Не удалось загрузить данные по размерам. Попробуйте ещё раз.</span>
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
          <AlertDescription>Нет данных по размерам за выбранный период.</AlertDescription>
        </Alert>
      ) : (
        <>
          {isError && hasData && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 flex items-center justify-between">
              <span>Не удалось обновить. Показаны кэшированные данные.</span>
              <Button variant="ghost" size="sm" onClick={() => void refetch()}>
                Повторить
              </Button>
            </div>
          )}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Размер</TableHead>
                  <TableHead className="text-right">Артикул WB</TableHead>
                  <TableHead className="text-right">SKU</TableHead>
                  <TableHead className="text-right">Остатки (ед.)</TableHead>
                  <TableHead className="text-right">Расход/день</TableHead>
                  <TableHead className="text-right">Дней покрытия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sizes.map(item => (
                  <TableRow key={`${item.nmId}-${item.size}`}>
                    <TableCell className="font-medium">{item.size || '—'}</TableCell>
                    <TableCell className="text-right text-sm font-mono">{item.nmId}</TableCell>
                    <TableCell className="text-right text-sm">{item.skuCount}</TableCell>
                    <TableCell className="text-right text-sm">{item.stockUnits}</TableCell>
                    <TableCell className="text-right text-sm">
                      {item.averageDailyOutgoing}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {/* Russian locale: comma decimal ("12,5"), not "12.5" */}
                      {item.daysOfCover == null
                        ? '—'
                        : item.daysOfCover.toFixed(1).replace('.', ',')}
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
