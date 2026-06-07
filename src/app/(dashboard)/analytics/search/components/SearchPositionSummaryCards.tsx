'use client'

/**
 * Summary metric cards for search position trends.
 * Shows counts: improving, declining, close-to-page-one, total SKU analyzed.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Target } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

export interface PositionTrendsSummary {
  improvingCount: number
  decliningCount: number
  stableCount: number
  closeToPageOneCount: number
  totalSkusAnalyzed: number
}

export function SearchPositionSummaryCards({ summary }: { summary: PositionTrendsSummary }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-green-600" />
            Растут
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-600">{summary.improvingCount}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <TrendingDown className="h-4 w-4 text-red-500" />
            Падают
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-red-500">{summary.decliningCount}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <Target className="h-4 w-4 text-blue-600" />
            Рядом с топ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-blue-600">{summary.closeToPageOneCount}</p>
          <p className="text-xs text-muted-foreground">позиция 20-40</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Всего SKU</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatNumber(summary.totalSkusAnalyzed)}</p>
        </CardContent>
      </Card>
    </div>
  )
}
