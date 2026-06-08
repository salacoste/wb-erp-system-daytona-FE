'use client'

import { useState } from 'react'
import { MarginTrendChart } from '@/components/custom/MarginTrendChart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'
import { MarginNavLinks } from './components/MarginNavLinks'
import { ChartHelpCard } from './components/ChartHelpCard'

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

/** Available time period options */
const TIME_PERIODS = [
  { value: '4', label: '4 недели (1 месяц)' },
  { value: '8', label: '8 недель (2 месяца)' },
  { value: '12', label: '12 недель (3 месяца)' },
  { value: '26', label: '26 недель (6 месяцев)' },
  { value: '52', label: '52 недели (1 год)' },
] as const

export default function MarginAnalysisByTimePeriodPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('12')

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
        <MarginNavLinks />
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          График показывает изменение маржинальности по неделям. Маржа рассчитывается на основе
          выручки и себестоимости (COGS). Недели без данных COGS отмечены предупреждением в
          подсказках.
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
                {TIME_PERIODS.map(period => (
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
        }}
        title="Динамика маржинальности"
        description={`Изменение маржи за последние ${TIME_PERIODS.find(p => p.value === selectedPeriod)?.label.toLowerCase()}`}
        height={450}
      />

      <ChartHelpCard />
    </div>
  )
}
