/**
 * FBS Stock — Regions Breakdown Section
 * Epic 96-FE Story 96.11-FE
 *
 * Independent state machine (Pattern 1): skeleton / error / empty / populated.
 * Failure here does NOT affect FbsStockGroupsSection or FbsStockSizesSection.
 *
 * No date range picker — regions endpoint uses latest-snapshot semantics.
 * Displays generatedAt timestamp (localized via formatDate, M-1) for data
 * freshness indication. Stale-warning chip shown when data is >24h old.
 *
 * Columns: Регион | Складов | Остатки (ед.) | Стоимость (₽) | Доля от всех (%)
 * Null money/ratio fields render as '—' (CLAUDE.md anti-pattern #8).
 */

'use client'

import { AlertCircle, Clock, RefreshCw } from 'lucide-react'
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
import { formatCurrency, formatPercentage, formatDate } from '@/lib/utils'
import { useFbsStockRegions } from '@/hooks/use-fbs-stock-regions'

const STALE_THRESHOLD_HOURS = 24

/**
 * Returns elapsed hours since `generatedAt`, or null when:
 *   - input is empty / invalid (isNaN)
 *   - timestamp is in the future (server clock skew) — treat as fresh
 *
 * Story 96.11-FE 2nd-pass L2-1: future-date case made explicit so the
 * caller doesn't silently receive -1 (which happened to be "not stale"
 * by accident; now it's "null = fresh" by design).
 */
function getStaleHours(generatedAt: string): number | null {
  if (!generatedAt) return null
  const ts = new Date(generatedAt).getTime()
  if (isNaN(ts)) return null
  const elapsedMs = Date.now() - ts
  if (elapsedMs < 0) return null // future-dated (clock skew) — treat as fresh
  return Math.floor(elapsedMs / 3_600_000)
}

/**
 * Russian-plural hours formatter via Intl.RelativeTimeFormat.
 * Produces: "1 час назад", "2 часа назад", "5 часов назад", "21 час назад".
 * Story 96.11-FE 2nd-pass M2-3: replaces "{N} ч." abbreviation.
 */
const RTF = new Intl.RelativeTimeFormat('ru-RU', { numeric: 'always' })
function formatStaleHours(hours: number): string {
  return RTF.format(-hours, 'hour')
}

export function FbsStockRegionsSection() {
  const { data, isLoading, isError, refetch } = useFbsStockRegions()
  const regions = data?.data.regions ?? []
  const hasData = regions.length > 0

  const showSkeleton = isLoading && !hasData
  const showFullError = isError && !hasData

  const staleHours = data?.generatedAt ? getStaleHours(data.generatedAt) : null
  const isStale = staleHours != null && staleHours >= STALE_THRESHOLD_HOURS

  return (
    <div className="space-y-4" data-testid="fbs-stock-regions-section">
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
            <span>Не удалось загрузить данные по регионам. Попробуйте ещё раз.</span>
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
          <AlertDescription>Нет данных по регионам.</AlertDescription>
        </Alert>
      ) : (
        <>
          {/* generatedAt freshness indicator — localized via formatDate (M-1) */}
          {data?.generatedAt && (
            <p className="text-xs text-muted-foreground">
              Данные актуальны на: {formatDate(data.generatedAt)}
            </p>
          )}

          {/* Stale-data warning chip — shown when snapshot is >24h old (M-1) */}
          {isStale && staleHours != null && (
            <div className="flex items-center gap-2 rounded-md border border-status-warning/30 bg-status-warning/15 px-3 py-2 text-xs text-status-warning">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>
                Данные обновлены {formatStaleHours(staleHours)}. Возможно, остатки изменились.
              </span>
            </div>
          )}

          {isError && hasData && (
            <div className="rounded-md border border-status-warning/30 bg-status-warning/15 px-4 py-2 text-sm text-status-warning flex items-center justify-between">
              <span>Не удалось обновить. Показаны кэшированные данные.</span>
              <Button variant="ghost" size="sm" onClick={() => void refetch()}>
                Повторить
              </Button>
            </div>
          )}

          <div className="rounded-md border">
            <Table scrollContainerTabIndex={0} scrollContainerAriaLabel="Остатки FBS по регионам">
              <TableCaption>Остатки FBS по регионам</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Регион</TableHead>
                  <TableHead className="text-right">Складов</TableHead>
                  <TableHead className="text-right">Остатки (ед.)</TableHead>
                  <TableHead className="text-right">Стоимость (₽)</TableHead>
                  <TableHead className="text-right">Доля от всех (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regions.map(item => (
                  <TableRow key={item.regionName}>
                    <TableCell className="font-medium">{item.regionName || '—'}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {item.warehouseCount}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {item.stockUnits}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {item.stockValue == null ? '—' : formatCurrency(item.stockValue)}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {item.shareOfTotalPct == null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        formatPercentage(item.shareOfTotalPct)
                      )}
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
