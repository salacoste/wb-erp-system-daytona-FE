'use client'

/**
 * Supply Planning Detail - Right Column Sections
 * Story 6.3: Stockout Table & Detail Panel
 *
 * Presentational sections:
 * - 7-Day Forecast (daily stock depletion table)
 * - Reorder Recommendation (order calculation breakdown)
 * - Cost Analysis (COGS-based profitability estimate)
 */

import { Calendar, ShoppingCart, CircleHelp } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { ROUTES } from '@/lib/routes'
import type { SupplyPlanningItem } from '@/types/supply-planning'
import type { ForecastDay } from './supply-detail-calculations'
import { formatStockQty, formatReorderValue } from '@/lib/supply-planning-utils'

// ============================================================================
// Types
// ============================================================================

interface RightColumnProps {
  item: SupplyPlanningItem
  forecast: ForecastDay[]
  totalPotentialLoss: number
}

// ============================================================================
// Component
// ============================================================================

export function SupplyDetailRightColumn({ item, forecast, totalPotentialLoss }: RightColumnProps) {
  return (
    <div className="space-y-6">
      {/* 7-Day Forecast */}
      <section className="bg-white rounded-lg border p-4">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
          <Calendar className="h-4 w-4" />
          Прогноз на 7 дней
        </h4>
        <div className="space-y-2 text-sm">
          {forecast.map(day => (
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
              <span
                className={cn('font-medium', day.isStockout ? 'text-red-600' : 'text-gray-900')}
              >
                {day.stockStart} → {day.stockEnd} шт
                {day.isStockout && (
                  <span className="ml-2 text-red-600">&#x26A0;&#xFE0F; СТОКАУТ</span>
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
            <dd className="font-medium text-gray-900">{formatStockQty(item.effective_stock)} шт</dd>
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
          &#x1F4B0; Анализ затрат
        </h4>
        {item.has_cogs && item.cogs_per_unit ? (
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">Себестоимость:</dt>
              <dd className="font-medium text-gray-900">
                {formatReorderValue(item.cogs_per_unit)}/шт ×{' '}
                {formatStockQty(item.reorder_quantity)} = {formatReorderValue(item.reorder_value)}
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
  )
}
