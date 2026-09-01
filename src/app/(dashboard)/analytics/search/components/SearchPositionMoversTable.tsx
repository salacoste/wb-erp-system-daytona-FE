'use client'

/**
 * Position movers table + close-to-page-one opportunities table
 * for search position trends tab.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { formatNumber, formatDecimal, cn } from '@/lib/utils'
import Link from 'next/link'
import { ROUTES } from '@/lib/routes'
import type { PositionTrendMover, TrendDirection } from '@/types/search-position-trends'

/**
 * Color the "Изменение" cell off the semantic `trend` enum, NOT the raw
 * positionChange sign (task-51 / BD-25). This is unambiguous regardless of the
 * numeric sign convention: rank improvement = green, decline = red, stable = muted.
 *
 * Backend convention (confirmed, docs/API-PATHS-REFERENCE.md:7518): for the
 * /position/trends endpoint positionChange is a pre-signed improvement value —
 * POSITIVE = improved (moved up), NEGATIVE = declined — so `trend: 'improving'`
 * pairs with positionChange > 0. (Note the sibling /position-movers endpoint
 * uses positionDelta where NEGATIVE = up; driving off `trend` avoids that trap.)
 */
function trendColorClass(trend: TrendDirection): string {
  if (trend === 'improving') return 'text-status-success font-medium'
  if (trend === 'declining') return 'text-status-error'
  return 'text-muted-foreground'
}

/**
 * Story 170.7 Task 3 Pattern-1: own loading/error chrome over the SHARED
 * usePositionTrends fetch. A shared-fetch failure is signalled per-section;
 * retained data still renders (isError && non-empty list wins over the chrome).
 */
export function SearchPositionMoversTable({
  movers,
  isLoading,
  isError,
  onSelectSku,
  selectedNmId,
}: {
  movers: PositionTrendMover[]
  isLoading: boolean
  isError: boolean
  onSelectSku?: (nmId: number) => void
  selectedNmId?: number | null
}) {
  if (isLoading && movers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Изменения позиций</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (isError && movers.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Не удалось загрузить изменения позиций</AlertDescription>
      </Alert>
    )
  }

  if (movers.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Нет данных об изменениях позиций за выбранный период
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Изменения позиций</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="p-2 font-medium">nmId</th>
                <th className="p-2 font-medium text-right">Позиция</th>
                <th className="p-2 font-medium text-right">Изменение</th>
                <th className="p-2 font-medium text-right">Запросов</th>
                <th className="p-2 font-medium">Топ запрос</th>
              </tr>
            </thead>
            <tbody>
              {movers.slice(0, 20).map(m => (
                <tr
                  key={m.nmId}
                  className={cn(
                    'border-b last:border-0 hover:bg-muted/50',
                    selectedNmId === m.nmId && 'bg-status-information/15',
                    onSelectSku && 'cursor-pointer'
                  )}
                  onClick={() => onSelectSku?.(m.nmId)}
                >
                  <td className="p-2 font-mono text-xs">
                    <Link
                      href={`${ROUTES.ANALYTICS.SEARCH}?tab=by-product&nmId=${m.nmId}`}
                      className="text-status-information hover:underline"
                      onClick={e => e.stopPropagation()}
                    >
                      {m.nmId}
                    </Link>
                  </td>
                  <td className="p-2 text-right font-medium">
                    {m.currentAvgPosition == null
                      ? 'Нет данных'
                      : formatDecimal(m.currentAvgPosition, 1)}
                  </td>
                  <td className="p-2 text-right">
                    <span className={trendColorClass(m.trend)}>
                      {m.positionChange == null
                        ? 'Нет данных'
                        : `${m.positionChange > 0 ? '+' : ''}${formatDecimal(m.positionChange, 1)}`}
                    </span>
                  </td>
                  <td className="p-2 text-right">{formatNumber(m.totalQueries)}</td>
                  <td className="p-2 text-sm text-muted-foreground max-w-48 truncate">
                    {m.topQuery || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
