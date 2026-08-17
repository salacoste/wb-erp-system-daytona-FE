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
import { formatPercentageInt } from '@/lib/utils'
import type { KeyMetricsSectionProps } from './pnl-types'

export function KeyMetricsSection({ data, roi, profitPerUnit }: KeyMetricsSectionProps) {
  return (
    <div>
      <SectionHeader
        title="5. Ключевые метрики"
        description="Показатели эффективности бизнеса для принятия решений"
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
        {/* ROI */}
        <div className="bg-status-information/10 rounded-lg p-4 text-center border border-status-information/20">
          <div className="text-2xl font-bold text-status-information">
            {roi !== null ? formatPercentageInt(roi) : '—'}
          </div>
          <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
            ROI
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-status-information" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-medium">Return on Investment</p>
                <p className="text-xs mt-1">
                  Сколько рублей прибыли приносит каждый рубль, вложенный в закупку товаров.
                </p>
                <p className="text-xs font-mono mt-2 bg-muted p-1 rounded">
                  ROI = (К перечислению − COGS) ÷ COGS × 100%
                </p>
                <p className="text-xs mt-1 text-financial-positive">Норма: &gt;50%</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Profit per Unit */}
        <div className="bg-financial-positive/10 rounded-lg p-4 text-center border border-financial-positive/20">
          <div className="text-2xl font-bold text-financial-positive">
            {profitPerUnit !== null ? formatCurrency(profitPerUnit) : '—'}
          </div>
          <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
            Прибыль/ед.
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-financial-positive" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-medium">Прибыль на единицу</p>
                <p className="text-xs mt-1">
                  Средняя валовая прибыль с каждой проданной единицы товара.
                </p>
                <p className="text-xs font-mono mt-2 bg-muted p-1 rounded">
                  Прибыль/ед = (К перечислению − COGS) ÷ Кол-во проданных
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Units Sold */}
        <div className="bg-primary/10 rounded-lg p-4 text-center border border-primary/20">
          <div className="text-2xl font-bold text-primary">{data.qty.toLocaleString('ru-RU')}</div>
          <div className="text-sm text-muted-foreground mt-1">Продано единиц</div>
        </div>

        {/* Dormant SKUs - only if > 0 */}
        {(data.skus_with_expenses_only ?? 0) > 0 && (
          <div className="bg-status-warning/10 rounded-lg p-4 text-center border border-status-warning/20">
            <div className="text-2xl font-bold text-status-warning">
              {data.skus_with_expenses_only}
            </div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
              Без продаж
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-status-warning" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-medium">Товары без продаж</p>
                  <p className="text-xs mt-1">
                    SKU, которые генерируют расходы на хранение, но не имеют продаж за период.
                  </p>
                  <p className="text-xs mt-1 text-status-warning font-medium">
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
