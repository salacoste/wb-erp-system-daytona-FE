/**
 * Acquiring Report Detail Summary Cards
 * Epic 90-FE Story 90.3: 3 KPI cards for the report detail view.
 *
 * Null-vs-zero discipline (CLAUDE.md anti-pattern #8):
 * money fields excluded from sum when null; footnote shown with pluralized count.
 * Uses shared pluralize(TRANSACTION_FORMS, n) from src/lib/russian-plural.ts.
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { pluralize, TRANSACTION_FORMS } from '@/lib/russian-plural'
import type { AcquiringReportDetailItem } from '@/types/acquiring-analytics'

interface AcquiringReportDetailSummaryProps {
  transactions: AcquiringReportDetailItem[]
}

export function AcquiringReportDetailSummary({ transactions }: AcquiringReportDetailSummaryProps) {
  // Sum money fields, excluding null items (anti-pattern #8 — null ≠ zero)
  let totalFees = 0
  let nullCountFees = 0
  let totalVat = 0
  let nullCountVat = 0

  for (const t of transactions) {
    if (t.acquiringFee == null) {
      nullCountFees++
    } else {
      totalFees += t.acquiringFee
    }
    if (t.acquiringFeeVat == null) {
      nullCountVat++
    } else {
      totalVat += t.acquiringFeeVat
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              * Сумма не включает {nullCountFees} {pluralize(TRANSACTION_FORMS, nullCountFees)} с
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
          <p className="text-2xl font-bold">{formatCurrency(totalVat)}</p>
          {nullCountVat > 0 && (
            <p className="text-xs text-amber-700 mt-2">
              * Сумма не включает {nullCountVat} {pluralize(TRANSACTION_FORMS, nullCountVat)} с
              неизвестными данными.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Транзакций */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Транзакций</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{transactions.length}</p>
        </CardContent>
      </Card>
    </div>
  )
}
