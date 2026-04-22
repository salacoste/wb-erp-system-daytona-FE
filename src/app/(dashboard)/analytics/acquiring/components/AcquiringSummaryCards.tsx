/**
 * Acquiring Summary Cards
 * Epic 90-FE Story 90.2: Acquiring Reports List Page
 *
 * Null-vs-zero discipline (CLAUDE.md anti-pattern #8):
 * money fields are excluded from sum when null (not coerced to 0).
 * A footnote is shown when any item was excluded.
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { AcquiringReportListItem } from '@/types/acquiring-analytics'

/**
 * Russian count-based pluralization for "отчёт" noun.
 * Rules: 1 → "отчёт", 2-4 → "отчёта", 5-20 → "отчётов", then repeats by last digit.
 * Review fix H-1 (Story 90.2 code review).
 */
export function pluralizeReports(n: number): string {
  const abs = Math.abs(n)
  const lastTwo = abs % 100
  if (lastTwo >= 11 && lastTwo <= 14) return 'отчётов'
  const lastDigit = abs % 10
  if (lastDigit === 1) return 'отчёт'
  if (lastDigit >= 2 && lastDigit <= 4) return 'отчёта'
  return 'отчётов'
}

interface AcquiringSummaryCardsProps {
  items: AcquiringReportListItem[]
}

export function AcquiringSummaryCards({ items }: AcquiringSummaryCardsProps) {
  // Sum money fields, excluding null items (anti-pattern #8 — null ≠ zero)
  let totalFees = 0
  let nullCountFees = 0
  let totalVat = 0
  let nullCountVat = 0

  for (const item of items) {
    if (item.acquiringFeeSum == null) {
      nullCountFees++
    } else {
      totalFees += item.acquiringFeeSum
    }
    if (item.acquiringFeeVatSum == null) {
      nullCountVat++
    } else {
      totalVat += item.acquiringFeeVatSum
    }
  }

  // Period: min dateFrom → max dateTo
  let periodFrom: string | null = null
  let periodTo: string | null = null
  for (const item of items) {
    if (periodFrom === null || item.dateFrom < periodFrom) periodFrom = item.dateFrom
    if (periodTo === null || item.dateTo > periodTo) periodTo = item.dateTo
  }

  const periodLabel =
    periodFrom && periodTo ? `${formatDate(periodFrom)} — ${formatDate(periodTo)}` : '—'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Всего комиссий */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Всего комиссий
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatCurrency(totalFees)}</p>
          {nullCountFees > 0 && (
            <p className="text-xs text-amber-700 mt-2">
              * Сумма не включает {nullCountFees} {pluralizeReports(nullCountFees)} с неизвестными
              данными.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Всего НДС */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Всего НДС</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatCurrency(totalVat)}</p>
          {nullCountVat > 0 && (
            <p className="text-xs text-amber-700 mt-2">
              * Сумма не включает {nullCountVat} {pluralizeReports(nullCountVat)} с неизвестными
              данными.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Отчётов */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Отчётов</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{items.length}</p>
        </CardContent>
      </Card>

      {/* Период */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Период</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-bold break-words">{periodLabel}</p>
        </CardContent>
      </Card>
    </div>
  )
}
