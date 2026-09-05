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
              {/* P2 wave-3 pass-1 (2026-09-05): this chip sits on the bg-muted/50 indicator
                  strip (:68) — a compositing layer the over-card wave-2 numbers didn't model.
                  In-situ (layered) the warning /5 tint measured 4.34 light FAIL (ANCHOR-2),
                  so the warning branch became a SOLID pair (PR 384 canon):
                  bg-status-warning + text-status-warning-foreground = 4.81 light / 11.41
                  dark over ANY parent — a solid bg kills compositing. fin-pos/5 = 4.61 and
                  fin-neg/5 = 4.99 light in-situ over muted/50 PASS → kept fg-on-tint. */}
              <span
                className={cn(
                  'text-sm px-3 py-1.5 rounded-full font-medium',
                  grossMarginPct && grossMarginPct >= 25
                    ? 'bg-financial-positive/5 text-financial-positive'
                    : grossMarginPct && grossMarginPct >= 15
                      ? 'bg-status-warning text-status-warning-foreground border border-status-warning/40'
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
        // P2 wave-3 pass-1: SOLID warning notice box (PR 384 canon). Note: this box's parent
        // chain is plain bg-card (PnLWaterfall Card) — warn/5 there measured 4.52 flat-pass —
        // but the review-pass-1 wave unified all warning NOTICE BOXES on the solid pair, which
        // is parent-independent (4.81 light / 11.41 dark over ANY base: solid bg kills
        // compositing). All inner content pairs with the solid amber: text-foreground on solid
        // warning = 3.35 light FAIL, so inner text/icon use status-warning-foreground; the
        // progress bar flips to foreground-on-amber.
        <div className="bg-status-warning text-status-warning-foreground border border-status-warning/40 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-status-warning-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-status-warning-foreground">
                Требуется 100% покрытие себестоимости
              </p>
              <p className="text-sm text-status-warning-foreground mt-1">
                Для расчёта валовой прибыли добавьте себестоимость для всех{' '}
                <strong>{products.without_cogs}</strong> товаров без COGS.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-2 bg-status-warning-foreground/25 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-status-warning-foreground rounded-full transition-all"
                    style={{ width: `${products.coverage_pct}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-status-warning-foreground">
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
