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
          <div className="flex items-center gap-4 px-4 py-3 mt-3 bg-muted/50 rounded-lg border">
            {grossProfit && grossProfit > 0 ? (
              <TrendingUp className="h-6 w-6 text-financial-positive" />
            ) : (
              <TrendingDown className="h-6 w-6 text-financial-negative" />
            )}
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">Валовая маржа от Payout:</div>
              <div
                className={cn(
                  'text-xl font-bold',
                  grossMarginPct && grossMarginPct >= 25
                    ? 'text-financial-positive'
                    : grossMarginPct && grossMarginPct >= 15
                      ? 'text-status-warning'
                      : 'text-financial-negative'
                )}
              >
                {formatPercent(grossMarginPct)}
              </div>
            </div>
            <div className="text-right">
              {/* P2 wave-3 (2026-09-05): chip /15→/5 per house rule — measured <4.5:1 light
                  (см. артефакт debt-p2-wave3-aa-quickwins / волна-2 canon): fin-pos/15 = 4.19,
                  warning/15 = 3.97 (worst in class), fin-neg/15 = 4.42 → /5 = 4.80 / 4.52 / 5.20
                  light PASS (8.72 / 12.23 / 8.19 dark). Fold-in: COGS-coverage warning box
                  (ниже, hasCogs=false) bg-status-warning/10→/5 — warning text on /10 = 4.24
                  light FAIL (та же пара, что MarginSlider medium) → 4.52 (12.23 dark);
                  border /20 kept (non-text ≥3:1). */}
              <span
                className={cn(
                  'text-sm px-3 py-1.5 rounded-full font-medium',
                  grossMarginPct && grossMarginPct >= 25
                    ? 'bg-financial-positive/5 text-financial-positive'
                    : grossMarginPct && grossMarginPct >= 15
                      ? 'bg-status-warning/5 text-status-warning'
                      : 'bg-financial-negative/5 text-financial-negative'
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
        <div className="bg-status-warning/5 border border-status-warning/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-status-warning mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-status-warning">
                Требуется 100% покрытие себестоимости
              </p>
              <p className="text-sm text-foreground mt-1">
                Для расчёта валовой прибыли добавьте себестоимость для всех{' '}
                <strong>{products.without_cogs}</strong> товаров без COGS.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-2 bg-status-warning/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-status-warning rounded-full transition-all"
                    style={{ width: `${products.coverage_pct}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-status-warning">
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
