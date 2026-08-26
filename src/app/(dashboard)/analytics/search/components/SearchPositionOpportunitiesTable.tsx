'use client'

/**
 * SearchPositionOpportunitiesTable — close-to-page-one opportunities table.
 * Story 170.7 Task 3: split out of SearchPositionMoversTable.tsx (2 components
 * in one 187-line file) per the proactive-extraction rule. Tokens migrated to
 * status valence (nmId links + "До топ-20" = information; selected-row /15).
 * Pattern-1: own loading/error chrome over the SHARED usePositionTrends fetch.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { formatNumber, formatDecimal, cn } from '@/lib/utils'
import Link from 'next/link'
import { ROUTES } from '@/lib/routes'
import type { CloseToPageOneItem } from '@/types/search-position-trends'

export function SearchPositionOpportunitiesTable({
  items,
  isLoading,
  isError,
  onSelectSku,
  selectedNmId,
}: {
  items: CloseToPageOneItem[]
  isLoading: boolean
  isError: boolean
  onSelectSku?: (nmId: number) => void
  selectedNmId?: number | null
}) {
  if (isLoading && items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Рядом с первой страницей</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (isError && items.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Не удалось загрузить SKU рядом с первой страницей</AlertDescription>
      </Alert>
    )
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Нет SKU рядом с первой страницей поиска
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Рядом с первой страницей</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="p-2 font-medium">nmId</th>
                <th className="p-2 font-medium text-right">Позиция</th>
                <th className="p-2 font-medium text-right">До топ-20</th>
                <th className="p-2 font-medium text-right">Показы</th>
                <th className="p-2 font-medium">Топ запрос</th>
              </tr>
            </thead>
            <tbody>
              {items.slice(0, 20).map(item => (
                <tr
                  key={item.nmId}
                  className={cn(
                    'border-b last:border-0 hover:bg-muted/50',
                    selectedNmId === item.nmId && 'bg-status-information/15',
                    onSelectSku && 'cursor-pointer'
                  )}
                  onClick={() => onSelectSku?.(item.nmId)}
                >
                  <td className="p-2 font-mono text-xs">
                    <Link
                      href={`${ROUTES.ANALYTICS.SEARCH}?tab=by-product&nmId=${item.nmId}`}
                      className="text-status-information hover:underline"
                      onClick={e => e.stopPropagation()}
                    >
                      {item.nmId}
                    </Link>
                  </td>
                  <td className="p-2 text-right font-medium">
                    {item.currentAvgPosition == null
                      ? 'Нет данных'
                      : formatDecimal(item.currentAvgPosition, 1)}
                  </td>
                  <td className="p-2 text-right">
                    <span className="text-status-information font-medium">
                      -{item.positionsAway}
                    </span>
                  </td>
                  <td className="p-2 text-right">{formatNumber(item.totalImpressions)}</td>
                  <td className="p-2 text-sm text-muted-foreground max-w-48 truncate">
                    {item.topQuery || '—'}
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
