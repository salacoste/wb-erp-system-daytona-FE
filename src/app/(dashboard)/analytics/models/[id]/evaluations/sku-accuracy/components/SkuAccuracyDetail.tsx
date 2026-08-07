'use client'

/**
 * SkuAccuracyDetail — per-SKU drill-down view.
 * Story 110.3-FE Task 6: header card + aggregate stats + history table (DESC by evaluationDate).
 * AP#8: avgAiMape, avgNaiveMape, aiAccuracyPercent render '—' when null.
 * Story 163.5-FE (FR10): naiveBaseline units column "Базовый прогноз (ед.)" — distinct from
 * "Naive MAPE" (%). Finite → formatNumber (0 → "0"); null → "—" (no ?? 0 coercion, AP#8).
 * Empty-state: "SKU не найден" + back-link when nmId not in response.
 */

import Link from 'next/link'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { buildModelSkuAccuracyRoute } from '@/lib/routes'
import { formatDate, formatPercentage } from '@/lib/utils'
import { formatNumber } from '@/lib/fbs-analytics-formatters'
import { formatSkuMapeDisplay } from './sku-accuracy-helpers'
import type { SkuAccuracyEntry, SkuAccuracyHistoryEntry } from '@/types/ai/evaluations'

interface SkuAccuracyDetailProps {
  nmId: number
  modelId: string
  /** F-5: undefined when data has not yet arrived; [] would create false empty-state flash */
  skuAccuracies: SkuAccuracyEntry[] | undefined
  isLoading?: boolean
  isError?: boolean
}

function sortHistoryDesc(history: SkuAccuracyHistoryEntry[]): SkuAccuracyHistoryEntry[] {
  return [...history].sort((a, b) => b.evaluationDate.localeCompare(a.evaluationDate))
}

export function SkuAccuracyDetail({
  nmId,
  modelId,
  skuAccuracies,
  isLoading = false,
  isError = false,
}: SkuAccuracyDetailProps) {
  // F-2: Gate empty-state behind data-arrived check to prevent loading flash.
  // While loading, render skeleton; while error, render error alert;
  // only render "SKU не найден" when data has arrived AND nmId truly not found.
  if (isLoading) {
    return (
      <div className="space-y-4 p-6" data-testid="sku-detail-skeleton">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-48 w-full animate-pulse rounded bg-muted" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>Ошибка загрузки данных по SKU</AlertDescription>
        </Alert>
      </div>
    )
  }

  // F-5: skuAccuracies is undefined when data hasn't arrived (isLoading guard above catches that case)
  const entry = skuAccuracies?.find(e => e.nmId === nmId)

  if (!entry) {
    return (
      <div className="p-6">
        <Alert>
          <AlertDescription>
            SKU не найден. {/* F-6: focus-visible ring for WCAG 2.4.7 compliance */}
            <Link
              href={buildModelSkuAccuracyRoute(modelId)}
              className="underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:rounded"
            >
              Вернуться к обзору SKU
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const sortedHistory = sortHistoryDesc(entry.history)

  return (
    <div className="space-y-6 p-6">
      {/* Header card */}
      <Card>
        <CardHeader>
          <CardTitle>
            Артикул {entry.nmId}
            {entry.vendorCode ? ` — ${entry.vendorCode}` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Aggregate stats — AP#8: null → '—' for all four ratio fields (F-3: added naiveAccuracyPercent) */}
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Средняя AI MAPE</p>
              <p className="text-2xl font-semibold mt-1">{formatSkuMapeDisplay(entry.avgAiMape)}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Средняя Naive MAPE</p>
              <p className="text-2xl font-semibold mt-1">
                {formatSkuMapeDisplay(entry.avgNaiveMape)}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">AI accuracy %</p>
              <p className="text-2xl font-semibold mt-1">
                {entry.aiAccuracyPercent !== null ? formatPercentage(entry.aiAccuracyPercent) : '—'}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Naive accuracy %</p>
              <p className="text-2xl font-semibold mt-1">
                {entry.naiveAccuracyPercent !== null
                  ? formatPercentage(entry.naiveAccuracyPercent)
                  : '—'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History table */}
      {sortedHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>История оценок</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата оценки</TableHead>
                  <TableHead>Прогноз (ед.)</TableHead>
                  <TableHead>Базовый прогноз (ед.)</TableHead>
                  <TableHead>Факт (ед.)</TableHead>
                  <TableHead>AI MAPE</TableHead>
                  <TableHead>Naive MAPE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedHistory.map(row => (
                  <TableRow key={row.evaluationDate}>
                    <TableCell>{formatDate(row.evaluationDate)}</TableCell>
                    {/* eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: count field */}
                    <TableCell>{formatNumber(row.predictedUnits ?? 0)}</TableCell>
                    {/* Story 163.5-FE: naiveBaseline is nullable units — null → '—' (no ?? 0, AP#8) */}
                    <TableCell>
                      {row.naiveBaseline !== null ? formatNumber(row.naiveBaseline) : '—'}
                    </TableCell>
                    {/* eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: count field */}
                    <TableCell>{formatNumber(row.actualUnits ?? 0)}</TableCell>
                    <TableCell>{formatSkuMapeDisplay(row.mapeUnits)}</TableCell>
                    <TableCell>{formatSkuMapeDisplay(row.naiveMape)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
