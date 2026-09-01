'use client'

/**
 * Summary metric cards for search position trends.
 * Shows counts: improving, declining, close-to-page-one, total SKU analyzed.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, Target, AlertCircle } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import type { PositionTrendsSummary } from '@/types/search-position-trends'

export interface SearchPositionSummaryCardsProps {
  summary: PositionTrendsSummary | undefined
  /** Pattern-1 (170.7): shared-fetch loading — skeletons while first load. */
  isLoading: boolean
  /** Pattern-1 (170.7): shared-fetch error — own error chrome, never blanks siblings. */
  isError: boolean
}

/**
 * Story 170.7 Task 2: legacy palette -> status valence tokens
 * (improving=success, declining=error, near-top=information; 169.9 canon).
 * Story 170.7 Task 3 Pattern-1: own loading/error chrome over the SHARED
 * usePositionTrends fetch — residual: a fetch-level failure still degrades
 * movers/opportunities together (fetch is shared by design, documented).
 */
export function SearchPositionSummaryCards({
  summary,
  isLoading,
  isError,
}: SearchPositionSummaryCardsProps) {
  if (isError && !summary) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Не удалось загрузить сводку по позициям</AlertDescription>
      </Alert>
    )
  }

  // Round-1 MEDIUM tri-state + r3-fix: the error branch above renders the section's
  // own destructive Alert; loading-without-data skeletons; a not-loading/not-error
  // undefined summary is an explicit empty (null) — never an indefinite skeleton.
  if (isLoading && !summary) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" role="status" aria-busy="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    )
  }

  // Round-1 MEDIUM: not-loading/not-error undefined summary — explicit empty
  // (never an indefinite busy skeleton).
  if (!summary) return null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-status-success" />
            Растут
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-status-success">{summary.improvingCount}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <TrendingDown className="h-4 w-4 text-status-error" />
            Падают
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-status-error">{summary.decliningCount}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <Target className="h-4 w-4 text-status-information" />
            Рядом с топ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-status-information">
            {summary.closeToPageOneCount}
          </p>
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
