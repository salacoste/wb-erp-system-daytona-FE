/**
 * KeyMetricsSection — Section 5 of PnL Waterfall
 *
 * Shows: ROI, Profit per Unit, Units Sold, Dormant SKUs.
 * Extracted from PnLWaterfall.tsx — pure structural refactor.
 */

'use client'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import { SectionHeader } from './PnLSectionHeader'
import { formatCurrency } from './pnl-formatters'
import type { KeyMetricsSectionProps } from './pnl-types'

export function KeyMetricsSection({ data }: KeyMetricsSectionProps) {
  return (
    <div>
      <SectionHeader
        title="5. Ключевые метрики"
        description="Показатели эффективности бизнеса для принятия решений"
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
        {/* ROI */}
        <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-100">
          <div className="text-2xl font-bold text-blue-700">
            {data.roi !== null ? `${data.roi.toFixed(0)}%` : '—'}
          </div>
          <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
            ROI
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-blue-400" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-medium">Return on Investment</p>
                <p className="text-xs mt-1">
                  Сколько рублей прибыли приносит каждый рубль, вложенный в закупку товаров.
                </p>
                {/* Story 70.2-FE: Fixed ROI formula — uses payout-minus-COGS, not gross-profit/COGS */}
                <p className="text-xs font-mono mt-2 bg-slate-100 p-1 rounded">
                  ROI = (Чистая выручка − COGS) ÷ COGS × 100%
                </p>
                <p className="text-xs mt-1 text-green-600">Норма: &gt;50%</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Profit per Unit */}
        <div className="bg-green-50 rounded-lg p-4 text-center border border-green-100">
          <div className="text-2xl font-bold text-green-700">
            {data.profit_per_unit !== null ? formatCurrency(data.profit_per_unit) : '—'}
          </div>
          <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
            Прибыль/ед.
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-green-400" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-medium">Прибыль на единицу</p>
                <p className="text-xs mt-1">
                  Средняя валовая прибыль с каждой проданной единицы товара.
                </p>
                {/* Story 70.2-FE: Fixed PPU formula — clarifies it is (payout − COGS) ÷ qty, not gross-profit label */}
                <p className="text-xs font-mono mt-2 bg-slate-100 p-1 rounded">
                  Прибыль/ед = (Чистая выручка − COGS) ÷ Кол-во проданных
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Units Sold */}
        <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-100">
          <div className="text-2xl font-bold text-purple-700">
            {data.qty.toLocaleString('ru-RU')}
          </div>
          <div className="text-sm text-muted-foreground mt-1">Продано единиц</div>
        </div>

        {/* Dormant SKUs - only if > 0 */}
        {(data.skus_with_expenses_only ?? 0) > 0 && (
          <div className="bg-amber-50 rounded-lg p-4 text-center border border-amber-100">
            <div className="text-2xl font-bold text-amber-700">{data.skus_with_expenses_only}</div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
              Без продаж
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-amber-400" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-medium">Товары без продаж</p>
                  <p className="text-xs mt-1">
                    SKU, которые генерируют расходы на хранение, но не имеют продаж за период.
                  </p>
                  <p className="text-xs mt-1 text-amber-600 font-medium">
                    Рекомендация: рассмотрите ликвидацию или продвижение.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
