'use client'

import { useState } from 'react'
import { MarginTrendChart } from '@/components/custom/MarginTrendChart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

/**
 * Margin Analysis by Time Period Page
 * Story 4.7: Margin Analysis by Time Period
 *
 * Features:
 * - View margin trends over different time periods
 * - Interactive line chart showing margin % evolution
 * - Time period selector (4, 8, 12, 26, 52 weeks)
 * - Color coding: Green for positive, red for negative margins
 * - Interactive tooltips with detailed metrics
 * - Summary statistics (average, max, min margin)
 * - Responsive design
 *
 * Backend Endpoint: GET /v1/analytics/weekly/margin-trends?weeks={n}
 * Reference: docs/backend-response-10-margin-trends-endpoint.md
 */

/**
 * Available time period options
 */
const TIME_PERIODS = [
  { value: '4', label: '4 недели (1 месяц)' },
  { value: '8', label: '8 недель (2 месяца)' },
  { value: '12', label: '12 недель (3 месяца)' },
  { value: '26', label: '26 недель (6 месяцев)' },
  { value: '52', label: '52 недели (1 год)' },
] as const

export default function MarginAnalysisByTimePeriodPage() {
  // State: Selected time period (number of weeks)
  const [selectedPeriod, setSelectedPeriod] = useState<string>('12') // Default: 12 weeks

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Анализ маржинальности по времени
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Отслеживайте изменения маржинальности и прибыльности во времени
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/analytics/sku">
            <Button variant="outline" size="sm">
              <TrendingUp className="mr-2 h-4 w-4" />
              По SKU
            </Button>
          </Link>
          <Link href="/analytics/brand">
            <Button variant="outline" size="sm">
              <TrendingUp className="mr-2 h-4 w-4" />
              По брендам
            </Button>
          </Link>
          <Link href="/analytics/category">
            <Button variant="outline" size="sm">
              <TrendingUp className="mr-2 h-4 w-4" />
              По категориям
            </Button>
          </Link>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          График показывает изменение маржинальности по неделям. Маржа рассчитывается на основе выручки и себестоимости (COGS).
          Недели без данных COGS отмечены предупреждением в подсказках.
        </AlertDescription>
      </Alert>

      {/* Time Period Selector Card */}
      <Card>
        <CardHeader>
          <CardTitle>Период анализа</CardTitle>
          <CardDescription>Выберите временной период для отображения трендов</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label htmlFor="time-period" className="whitespace-nowrap">
              Показать данные за:
            </Label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger id="time-period" className="w-64">
                <SelectValue placeholder="Выберите период" />
              </SelectTrigger>
              <SelectContent>
                {TIME_PERIODS.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Margin Trend Chart */}
      <MarginTrendChart
        queryParams={{
          weeks: parseInt(selectedPeriod, 10),
          includeCogs: true,
        }}
        title="Динамика маржинальности"
        description={`Изменение маржи за последние ${TIME_PERIODS.find((p) => p.value === selectedPeriod)?.label.toLowerCase()}`}
        height={450}
      />

      {/* Help Text */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Как читать график</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <div>
            <p className="font-semibold text-gray-900 mb-1">Ось X (горизонтальная):</p>
            <p>Недели в формате ISO (например, W47 = 47-я неделя года)</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-1">Ось Y (вертикальная):</p>
            <p>Процент маржи. Формула: <code className="bg-gray-100 px-1 rounded">((Выручка - COGS) / Выручка) × 100%</code></p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-1">Цветовые обозначения:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><span className="text-green-600 font-semibold">Зелёные точки</span> — положительная маржа (прибыль)</li>
              <li><span className="text-red-600 font-semibold">Красные точки</span> — отрицательная маржа (убыток)</li>
              <li><span className="text-gray-600 font-semibold">Серые точки</span> — нулевая маржа (безубыточность)</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-1">Интерактивность:</p>
            <p>Наведите курсор на точку графика, чтобы увидеть подробные метрики: маржа, выручка, прибыль, количество проданных единиц.</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-1">Статистика:</p>
            <p>Под графиком отображается сводная информация: количество недель, средняя маржа, максимальная и минимальная маржа за период.</p>
          </div>
          <div className="pt-2 border-t">
            <p className="text-xs text-gray-500">
              <strong>Примечание:</strong> Для расчёта маржи необходимы данные о себестоимости (COGS). Недели без COGS данных будут отмечены предупреждением в подсказке.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
