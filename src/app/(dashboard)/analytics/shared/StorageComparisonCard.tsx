'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
  const diff = data.storage_difference ?? 0
  const hasDivergence = Math.abs(diff) > 1

  return (
    <Card className={`${hasDivergence ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'}`}>
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
            <div className="text-gray-500">Storage API (paid_storage)</div>
            <div className="text-lg font-bold text-gray-900">
              {data.storage.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
            </div>
          </div>
          <div>
            <div className="text-gray-500">Еженедельный отчёт</div>
            <div className="text-lg font-bold text-gray-600">
              {(data.storage_weekly_report ?? 0).toLocaleString('ru-RU', {
                maximumFractionDigits: 0,
              })}{' '}
              ₽
            </div>
          </div>
          <div>
            <div className="text-gray-500">Разница</div>
            <div
              className={`text-lg font-bold ${
                !hasDivergence ? 'text-green-600' : diff > 0 ? 'text-red-600' : 'text-orange-600'
              }`}
            >
              {diff > 0 ? '+' : ''}
              {diff.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
