'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { isStorageDivergent } from '@/lib/analytics-utils'

interface StorageComparisonData {
  storage: number
  storage_weekly_report: number | null
  storage_difference: number | null
}

interface StorageComparisonCardProps {
  data: StorageComparisonData
}

/**
 * Request #67: Storage Source Comparison Card.
 * Shows paid_storage API vs weekly report storage with difference indicator.
 * Shared between brand and category margin analysis pages.
 */
export function StorageComparisonCard({ data }: StorageComparisonCardProps) {
  const weekly = data.storage_weekly_report
  const diff = data.storage_difference
  // Flag a divergence via the canonical 3% tolerance (analytics-utils), NOT a flat >1 ₽ which
  // over-flagged large-storage cabinets. null weekly/diff = reconciliation data unavailable →
  // no warning + no fabricated "0 ₽" (Defensive Frontend Principle).
  const hasDivergence = isStorageDivergent(data.storage, weekly)

  return (
    <Card className={`${hasDivergence ? 'border-yellow-400 bg-yellow-50' : 'border-border'}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          📦 Сравнение источников хранения
          {hasDivergence && (
            <span className="px-2 py-0.5 text-xs bg-yellow-200 text-yellow-800 rounded">
              Расхождение
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Storage API (paid_storage)</div>
            <div className="text-lg font-bold text-foreground">
              {data.storage.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Еженедельный отчёт</div>
            <div className="text-lg font-bold text-foreground">
              {weekly == null
                ? '—'
                : `${weekly.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽`}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Разница</div>
            <div
              className={`text-lg font-bold ${
                diff == null
                  ? 'text-muted-foreground'
                  : !hasDivergence
                    ? 'text-green-600'
                    : diff > 0
                      ? 'text-red-600'
                      : 'text-orange-600'
              }`}
            >
              {diff == null
                ? '—'
                : `${diff > 0 ? '+' : ''}${diff.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽`}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
