/**
 * GrossProfitSection — Section 4 of PnL Waterfall
 *
 * Shows gross profit (payout - COGS) when COGS coverage = 100%.
 * Shows coverage warning when COGS is incomplete.
 * Extracted from PnLWaterfall.tsx — pure structural refactor.
 */

'use client'

import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { cn, formatPercentageInt } from '@/lib/utils'
import { SectionHeader } from './PnLSectionHeader'
import { PnLRow } from './PnLRow'
import { formatPercent } from './pnl-formatters'
import type { GrossProfitSectionProps } from './pnl-types'

export function GrossProfitSection({
  hasCogs,
  sellerPayout,
  cogsTotal,
  cogsPct,
  grossProfit,
  grossMarginPct,
  profitToRevenuePct,
  products,
}: GrossProfitSectionProps) {
  return (
    <div>
      <SectionHeader
        title="4. Валовая прибыль"
        description="Ваш реальный заработок после вычета себестоимости товаров"
        formula="Валовая прибыль = К перечислению − Себестоимость (COGS)"
      />
      {hasCogs ? (
        <div className="space-y-1">
          <PnLRow
            label="К перечислению"
            value={sellerPayout}
            tooltip="Сумма от WB (из предыдущего раздела)"
          />
          <PnLRow
            label="Себестоимость (COGS)"
            value={cogsTotal}
            isNegative
            indent={1}
            tooltip="Закупочная стоимость проданных товаров.
                    Рассчитывается как: цена закупки × количество проданных единиц.

                    Включает только товары с присвоенной себестоимостью."
            formula="COGS = Σ (Закупочная цена × Кол-во проданных)"
            percentOfRevenue={cogsPct}
          />
          {/* Story 70.2-FE: Tooltip clarified — formula explicitly states К перечислению − COGS */}
          <PnLRow
            label="Валовая прибыль"
            value={grossProfit}
            isTotal
            highlight={grossProfit && grossProfit > 0 ? 'positive' : 'negative'}
            tooltip="Ваш РЕАЛЬНЫЙ заработок после всех удержаний WB и вычета себестоимости товаров.
                    Это деньги, которые остаются у вас после оплаты товаров поставщикам и всех комиссий маркетплейса.
                    Формула: К перечислению за товар − Себестоимость (COGS)"
            formula="Валовая прибыль = К перечислению − Себестоимость (COGS)"
            percentOfRevenue={profitToRevenuePct}
          />

          {/* Margin indicator */}
          <div className="flex items-center gap-4 px-4 py-3 mt-3 bg-slate-50 rounded-lg border">
            {grossProfit && grossProfit > 0 ? (
              <TrendingUp className="h-6 w-6 text-green-600" />
            ) : (
              <TrendingDown className="h-6 w-6 text-red-600" />
            )}
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">Валовая маржа от Payout:</div>
              <div
                className={cn(
                  'text-xl font-bold',
                  grossMarginPct && grossMarginPct >= 25
                    ? 'text-green-600'
                    : grossMarginPct && grossMarginPct >= 15
                      ? 'text-amber-600'
                      : 'text-red-600'
                )}
              >
                {formatPercent(grossMarginPct)}
              </div>
            </div>
            <div className="text-right">
              <span
                className={cn(
                  'text-sm px-3 py-1.5 rounded-full font-medium',
                  grossMarginPct && grossMarginPct >= 25
                    ? 'bg-green-100 text-green-800'
                    : grossMarginPct && grossMarginPct >= 15
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                )}
              >
                {grossMarginPct && grossMarginPct >= 25
                  ? 'Отлично (≥25%)'
                  : grossMarginPct && grossMarginPct >= 15
                    ? 'Норма (15-25%)'
                    : 'Низкая (<15%)'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-800">Требуется 100% покрытие себестоимости</p>
              <p className="text-sm text-amber-700 mt-1">
                Для расчёта валовой прибыли добавьте себестоимость для всех{' '}
                <strong>{products.without_cogs}</strong> товаров без COGS.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-2 bg-amber-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${products.coverage_pct}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-amber-700">
                  {formatPercentageInt(products.coverage_pct)} ({products.with_cogs}/
                  {products.total})
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
