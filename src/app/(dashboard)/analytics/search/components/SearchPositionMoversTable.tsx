'use client'

/**
 * Position movers table + close-to-page-one opportunities table
 * for search position trends tab.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber, formatDecimal } from '@/lib/utils'
import Link from 'next/link'
import { ROUTES } from '@/lib/routes'
import type { PositionTrendMover, CloseToPageOneItem } from '@/types/search-position-trends'

export function SearchPositionMoversTable({ movers }: { movers: PositionTrendMover[] }) {
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
                <tr key={m.nmId} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="p-2 font-mono text-xs">
                    <Link
                      href={`${ROUTES.ANALYTICS.SEARCH}?tab=by-product&nmId=${m.nmId}`}
                      className="text-blue-600 hover:underline"
                    >
                      {m.nmId}
                    </Link>
                  </td>
                  <td className="p-2 text-right font-medium">
                    {formatDecimal(m.currentAvgPosition, 1)}
                  </td>
                  <td className="p-2 text-right">
                    <span
                      className={
                        m.positionChange > 0
                          ? 'text-green-600 font-medium'
                          : m.positionChange < 0
                            ? 'text-red-500'
                            : 'text-muted-foreground'
                      }
                    >
                      {m.positionChange > 0 ? '+' : ''}
                      {formatDecimal(m.positionChange, 1)}
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

export function SearchPositionOpportunitiesTable({ items }: { items: CloseToPageOneItem[] }) {
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
                <tr key={item.nmId} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="p-2 font-mono text-xs">
                    <Link
                      href={`${ROUTES.ANALYTICS.SEARCH}?tab=by-product&nmId=${item.nmId}`}
                      className="text-blue-600 hover:underline"
                    >
                      {item.nmId}
                    </Link>
                  </td>
                  <td className="p-2 text-right font-medium">
                    {formatDecimal(item.currentAvgPosition, 1)}
                  </td>
                  <td className="p-2 text-right">
                    <span className="text-blue-600 font-medium">-{item.positionsAway}</span>
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
