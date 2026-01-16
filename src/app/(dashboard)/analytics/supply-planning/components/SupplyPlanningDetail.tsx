'use client'

import { useMemo } from 'react'
import {
  Package,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  ShoppingCart,
  Warehouse,
  CircleHelp,
  Copy,
  ClipboardCheck,
  History,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { SupplyPlanningItem, VelocityTrend } from '@/types/supply-planning'
import {
  formatDaysUntilStockout,
  formatStockQty,
  formatReorderValue,
  formatVelocity,
  formatStockoutDate,
  STOCKOUT_RISK_CONFIG,
  VELOCITY_TREND_CONFIG,
} from '@/lib/supply-planning-utils'
import Link from 'next/link'
import { ROUTES } from '@/lib/routes'

/**
 * Supply Planning Detail Panel
 * Story 6.3: Stockout Table & Detail Panel
 * UX Specs by Sally (2025-12-12)
 *
 * Expandable detail panel showing:
 * - Current situation summary
 * - 7-day forecast
 * - Reorder calculation breakdown
 * - Cost/profit analysis
 * - Warehouse distribution
 */

interface SupplyPlanningDetailProps {
  item: SupplyPlanningItem
}

// Velocity trend icons
const TREND_ICONS: Record<VelocityTrend, React.ComponentType<{ className?: string }>> = {
  growing: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
}

export function SupplyPlanningDetail({ item }: SupplyPlanningDetailProps) {
  // Fallback to defaults if values are missing/invalid
  const stockoutRisk = item.stockout_risk && item.stockout_risk in STOCKOUT_RISK_CONFIG ? item.stockout_risk : 'healthy'
  const velocityTrend = item.velocity_trend && item.velocity_trend in TREND_ICONS ? item.velocity_trend : 'stable'

  const statusConfig = STOCKOUT_RISK_CONFIG[stockoutRisk]
  const trendConfig = VELOCITY_TREND_CONFIG[velocityTrend]
  const TrendIcon = TREND_ICONS[velocityTrend]

  // Generate 7-day forecast
  const forecast = useMemo(() => {
    const days: Array<{
      day: number
      date: string
      stockStart: number
      sales: number
      stockEnd: number
      isStockout: boolean
      potentialLoss: number
    }> = []

    let currentStock = item.current_stock
    const dailySales = item.avg_daily_sales
    const avgPrice = item.has_cogs && item.cogs_per_unit
      ? item.cogs_per_unit * 2.5 // Approximate retail price
      : 1000 // Default assumption

    for (let i = 1; i <= 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      const dateStr = date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
      })

      const stockStart = Math.max(0, currentStock)
      const sales = Math.round(dailySales)
      const stockEnd = Math.max(0, stockStart - sales)
      const isStockout = stockEnd === 0 && stockStart < sales
      const potentialLoss = isStockout ? Math.round((sales - stockStart) * avgPrice) : 0

      days.push({
        day: i,
        date: dateStr,
        stockStart,
        sales,
        stockEnd,
        isStockout,
        potentialLoss,
      })

      currentStock = stockEnd
    }

    return days
  }, [item])

  // Calculate total potential losses
  const totalPotentialLoss = forecast.reduce((sum, day) => sum + day.potentialLoss, 0)

  // Copy info to clipboard
  const handleCopyInfo = () => {
    const info = `
SKU: ${item.sku_id}
Название: ${item.product_name}
Остаток: ${item.current_stock} шт
В пути: ${item.in_transit} шт
Скорость продаж: ${formatVelocity(item.avg_daily_sales)} шт/день
Дней до стокаута: ${item.days_until_stockout ?? 'N/A'}
Рекомендация к заказу: ${item.reorder_quantity} шт
Сумма заказа: ${formatReorderValue(item.reorder_value)}
    `.trim()

    navigator.clipboard.writeText(info)
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-b-lg p-6 animate-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span
          className={cn(
            'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs',
            statusConfig?.bgClass ?? 'bg-gray-100',
            statusConfig?.textClass ?? 'text-gray-600'
          )}
        >
          {statusConfig?.icon ?? '?'}
        </span>
        <h3 className="text-lg font-semibold text-gray-900">
          {item.sku_id}: {item.product_name}
        </h3>
        {item.stockout_risk !== 'healthy' && (
          <span className={cn(
            'text-sm font-medium',
            item.stockout_risk === 'out_of_stock' ? 'text-gray-700' :
            item.stockout_risk === 'critical' ? 'text-red-600' :
            item.stockout_risk === 'warning' ? 'text-orange-600' :
            'text-yellow-600'
          )}>
            — {item.days_until_stockout !== null
              ? `Стокаут через ${formatDaysUntilStockout(item.days_until_stockout)}`
              : 'Нет в наличии'}
          </span>
        )}
      </div>

      {/* Main Grid: 2 columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Current Situation */}
          <section className="bg-white rounded-lg border p-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <Package className="h-4 w-4" />
              Текущая ситуация
            </h4>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">Остаток:</dt>
                <dd className={cn(
                  'font-medium',
                  item.current_stock === 0 ? 'text-red-600' : 'text-gray-900'
                )}>
                  {formatStockQty(item.current_stock)} шт
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">В пути:</dt>
                <dd className={cn(
                  'font-medium',
                  item.in_transit > 0 ? 'text-blue-600' : 'text-gray-400'
                )}>
                  {item.in_transit > 0 ? `${formatStockQty(item.in_transit)} шт` : '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Эффективный запас:</dt>
                <dd className="font-medium text-gray-900">
                  {formatStockQty(item.effective_stock)} шт
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Скорость продаж:</dt>
                <dd className="font-medium text-gray-900 flex items-center gap-1">
                  {formatVelocity(item.avg_daily_sales)} шт/день
                  <TrendIcon className={cn('h-3 w-3', trendConfig?.textClass ?? 'text-gray-500')} />
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Стокаут:</dt>
                <dd className={cn(
                  'font-bold',
                  item.days_until_stockout !== null && item.days_until_stockout <= 7
                    ? 'text-red-600'
                    : item.days_until_stockout !== null && item.days_until_stockout <= 14
                      ? 'text-orange-600'
                      : 'text-gray-900'
                )}>
                  {item.stockout_date
                    ? `${formatStockoutDate(item.stockout_date)} (${formatDaysUntilStockout(item.days_until_stockout)})`
                    : '—'}
                </dd>
              </div>
            </dl>
          </section>

          {/* Velocity Trend */}
          <section className="bg-white rounded-lg border p-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <TrendIcon className="h-4 w-4" />
              Тренд скорости продаж
            </h4>
            <div className="flex items-center gap-3">
              <div className={cn(
                'flex items-center gap-2 text-lg font-bold',
                trendConfig?.textClass ?? 'text-gray-500'
              )}>
                <TrendIcon className="h-5 w-5" />
                {trendConfig?.label ?? 'Стабильно'}
              </div>
              <span className="text-sm text-gray-500">
                (за последние 14 дней)
              </span>
            </div>
            {/* Simple sparkline placeholder */}
            <div className="mt-3 flex items-end gap-0.5 h-8">
              {[3, 4, 5, 4, 6, 7, 5, 6, 8, 7, 9, 8, 10, 9].map((h, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex-1 rounded-t',
                    i >= 12 ? (trendConfig?.textClass ?? 'text-gray-500').replace('text-', 'bg-') : 'bg-gray-300'
                  )}
                  style={{ height: `${h * 10}%` }}
                />
              ))}
            </div>
          </section>

          {/* Warehouse Distribution */}
          {item.warehouses.length > 0 && (
            <section className="bg-white rounded-lg border p-4">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <Warehouse className="h-4 w-4" />
                Распределение по складам
              </h4>
              <div className="space-y-2">
                {item.warehouses.map((wh, i) => {
                  const percentage = item.current_stock > 0
                    ? Math.round((wh.stock / item.current_stock) * 100)
                    : 0
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-24 truncate">
                        {wh.name}
                      </span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 rounded-full h-2 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-20 text-right">
                        {formatStockQty(wh.stock)} шт
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* 7-Day Forecast */}
          <section className="bg-white rounded-lg border p-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <Calendar className="h-4 w-4" />
              Прогноз на 7 дней
            </h4>
            <div className="space-y-2 text-sm">
              {forecast.map((day) => (
                <div
                  key={day.day}
                  className={cn(
                    'flex items-center justify-between py-1 px-2 rounded',
                    day.isStockout ? 'bg-red-50' : ''
                  )}
                >
                  <span className="text-gray-600">
                    День {day.day} ({day.date}):
                  </span>
                  <span className={cn(
                    'font-medium',
                    day.isStockout ? 'text-red-600' : 'text-gray-900'
                  )}>
                    {day.stockStart} → {day.stockEnd} шт
                    {day.isStockout && (
                      <span className="ml-2 text-red-600">⚠️ СТОКАУТ</span>
                    )}
                  </span>
                </div>
              ))}
              {totalPotentialLoss > 0 && (
                <div className="mt-3 pt-3 border-t flex justify-between font-bold text-red-600">
                  <span>Потенциальные потери (7 дней):</span>
                  <span>{formatReorderValue(totalPotentialLoss)}</span>
                </div>
              )}
            </div>
          </section>

          {/* Reorder Recommendation */}
          <section className="bg-white rounded-lg border p-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <ShoppingCart className="h-4 w-4" />
              Рекомендация по заказу
            </h4>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">Горизонт планирования:</dt>
                <dd className="font-medium text-gray-900">
                  {item.safety_stock_units > 0
                    ? `${Math.round(item.safety_stock_units / item.avg_daily_sales)} дней`
                    : '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Буфер безопасности:</dt>
                <dd className="font-medium text-gray-900">
                  {formatStockQty(item.safety_stock_units)} шт
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Уже есть:</dt>
                <dd className="font-medium text-gray-900">
                  {formatStockQty(item.effective_stock)} шт
                </dd>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <dt className="font-bold text-gray-900">Рекомендуем заказать:</dt>
                <dd className="font-bold text-blue-600 text-lg">
                  {formatStockQty(item.reorder_quantity)} шт
                </dd>
              </div>
            </dl>
          </section>

          {/* Cost Analysis */}
          <section className="bg-white rounded-lg border p-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              💰 Анализ затрат
            </h4>
            {item.has_cogs && item.cogs_per_unit ? (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Себестоимость:</dt>
                  <dd className="font-medium text-gray-900">
                    {formatReorderValue(item.cogs_per_unit)}/шт × {formatStockQty(item.reorder_quantity)} = {formatReorderValue(item.reorder_value)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Ожид. выручка:</dt>
                  <dd className="font-medium text-gray-900">
                    ~{formatReorderValue(item.reorder_value * 2.5)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Ожид. прибыль:</dt>
                  <dd className="font-medium text-green-600">
                    ~{formatReorderValue(item.reorder_value * 1.5)} (60%)
                  </dd>
                </div>
              </dl>
            ) : (
              <div className="flex items-center gap-2 text-gray-400">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center gap-1">
                        — Себестоимость не указана
                        <CircleHelp className="h-3 w-3" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Укажите себестоимость для расчёта маржи</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Link
                  href={`${ROUTES.COGS.ROOT}?sku=${item.sku_id}`}
                  className="text-blue-600 hover:underline text-sm ml-2"
                >
                  Указать COGS
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t">
        <Button variant="outline" size="sm" onClick={handleCopyInfo}>
          <Copy className="h-4 w-4 mr-2" />
          Копировать инфо
        </Button>
        <Button variant="outline" size="sm">
          <ClipboardCheck className="h-4 w-4 mr-2" />
          Отметить заказ
        </Button>
        <Button variant="outline" size="sm">
          <History className="h-4 w-4 mr-2" />
          История заказов
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" className="text-gray-500">
          <X className="h-4 w-4 mr-2" />
          Закрыть
        </Button>
      </div>
    </div>
  )
}
