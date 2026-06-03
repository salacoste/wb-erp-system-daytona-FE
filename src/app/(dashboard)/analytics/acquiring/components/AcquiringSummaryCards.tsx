/**
 * Acquiring Summary Cards
 * Epic 90-FE Story 90.2: Acquiring Reports List Page
 *
 * Null-vs-zero discipline (CLAUDE.md anti-pattern #8):
 * money fields are excluded from sum when null (not coerced to 0).
 * A footnote is shown when any item was excluded.
 *
 * Story 90.3: pluralizeReports extracted to shared src/lib/russian-plural.ts.
 * Kept as a re-export so existing imports from this file continue to work.
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { pluralize, REPORT_FORMS } from '@/lib/russian-plural'
import type { AcquiringReportListItem } from '@/types/acquiring-analytics'

/**
 * Re-export for backward compatibility with Story 90.2's test file that imports
 * pluralizeReports directly from this module.
 */
export function pluralizeReports(n: number): string {
  return pluralize(REPORT_FORMS, n)
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

  // Anti-pattern #8 at the AGGREGATE level: when items exist but EVERY one is null (e.g. all
  // reports still generating — backend returns null, not 0 — request-backend/166), the sum stays 0
  // and would render a fabricated "0 ₽" headline that reads as "acquiring was free". Show "—"
  // instead. The empty-items case stays "0 ₽" (genuine zero: no reports → no fees, a SEMANTIC-ZERO,
  // not unknown). Tables already preserve null per-row.
  const allFeesNull = items.length > 0 && nullCountFees === items.length
  const allVatNull = items.length > 0 && nullCountVat === items.length

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
          <p className="text-2xl font-bold">{allFeesNull ? '—' : formatCurrency(totalFees)}</p>
          {nullCountFees > 0 && (
            <p className="text-xs text-amber-700 mt-2">
              * Сумма не включает {nullCountFees} {pluralize(REPORT_FORMS, nullCountFees)} с
              неизвестными данными.
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
          <p className="text-2xl font-bold">{allVatNull ? '—' : formatCurrency(totalVat)}</p>
          {nullCountVat > 0 && (
            <p className="text-xs text-amber-700 mt-2">
              * Сумма не включает {nullCountVat} {pluralize(REPORT_FORMS, nullCountVat)} с
              неизвестными данными.
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
