/**
 * SKU Filter Section
 * Date range picker + summary statistics cards.
 * Extracted from page.tsx for file size compliance.
 */

import { DateRangePicker } from '@/components/custom/DateRangePicker'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { TrendingUp } from 'lucide-react'
import { formatPercentage } from '@/lib/utils'
import type { SkuPageStats } from './sku-page-stats'

interface SkuFilterSectionProps {
  weekStart: string
  weekEnd: string
  onRangeChange: (start: string, end: string) => void
  historicalSppEnabled: boolean
  onHistoricalSppChange: (enabled: boolean) => void
  stats: SkuPageStats | null
}

export function SkuFilterSection({
  weekStart,
  weekEnd,
  onRangeChange,
  historicalSppEnabled,
  onHistoricalSppChange,
  stats,
}: SkuFilterSectionProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Week Picker */}
      <Card>
        <CardHeader>
          <CardTitle>Период анализа</CardTitle>
          <CardDescription>Выберите неделю для анализа</CardDescription>
        </CardHeader>
        <CardContent>
          <DateRangePicker
            weekStart={weekStart}
            weekEnd={weekEnd}
            onRangeChange={onRangeChange}
            maxWeeks={52}
          />
          <div className="mt-4 border-t pt-4">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="historical-spp-toggle" className="cursor-pointer text-sm font-medium">
                Историческое СПП из отчётов WB
              </Label>
              <Switch
                id="historical-spp-toggle"
                checked={historicalSppEnabled}
                onCheckedChange={onHistoricalSppChange}
                aria-label="Показывать фактическое историческое СПП из финансовых отчётов WB"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Фактические значения по транзакциям финансовых отчётов WB.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      {stats && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Средняя маржа
              </CardTitle>
              <CardDescription>За выбранный период</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Margin - uses full expense formula from API */}
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {stats.avgMargin !== null ? formatPercentage(stats.avgMargin, 1) : '—'}
                  </span>
                  <span className="text-sm text-gray-500">операционная маржа</span>
                </div>
                <p className="text-xs text-gray-500">Выручка − COGS − Все расходы</p>
                <p className="text-xs text-gray-400">
                  (логистика, хранение, комиссия, эквайринг и др.)
                </p>
              </div>
              <p className="pt-2 text-sm text-gray-600 border-t">
                По {stats.withCogs} товарам с себестоимостью
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Охват</CardTitle>
              <CardDescription>Статистика по себестоимости</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Всего товаров:</span>
                  <span className="font-semibold text-gray-900">{stats.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">С себестоимостью:</span>
                  <span className="font-semibold text-green-600">{stats.withCogs}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Без себестоимости:</span>
                  <span className="font-semibold text-yellow-600">{stats.withoutCogs}</span>
                </div>
                <div className="mt-2 pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Охват:</span>
                    <span className="font-semibold text-blue-600">
                      {stats.total > 0
                        ? formatPercentage((stats.withCogs / stats.total) * 100, 1)
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
