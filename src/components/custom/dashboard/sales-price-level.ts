/**
 * Sales-by-price-level model (TZ-3).
 *
 * Pure helper that builds the labelled sub-rows for SalesByPriceLevelCard — the 4
 * "revenue at different price levels" metrics previously rendered as near-identical
 * simple cards: Заказы (РРЦ), Заказы (со скидкой), Выкупы, Продажи (розница).
 *
 * Each row carries an inline `clarifier` so the price level is distinguishable without
 * a tooltip (AC), the raw `current` value for formatting, and `previous` for period
 * comparison. The two price scales must not be conflated (simpleCardConfigs.ts:5-9):
 *   retail:   saleGross = sales_gross − returns_gross
 *   supplier: wbSalesGross (after WB commission)
 * ⚠ saleGross ≠ wbSalesGross − wbReturnsGross (different price levels).
 *
 * @see docs/ux/IMPLEMENTATION-TZ.md (TZ-3)
 */

import type { DashboardMetricsGridProps } from './DashboardMetricsGridTypes'

export interface SalesPriceLevelRow {
  id: string
  /** Inline label — distinguishes the price level by itself (no tooltip needed). */
  label: string
  /** Short clarifier of the price level / basis. */
  clarifier: string
  current: number | undefined
  /** Previous-period raw value for comparison (null/undefined → no comparison badge). */
  previous: number | null | undefined
  /** Tailwind text color for the value (blue = order price level, green = revenue). */
  valueColor: string
}

/**
 * Build the 4 price-level rows. `previous` mirrors the wiring the original simple
 * cards used (ordersAmount for РРЦ, salesAmount for Выкупы, saleGross for розница;
 * discounted-card had no comparison).
 */
export function buildSalesPriceLevelRows(p: DashboardMetricsGridProps): SalesPriceLevelRow[] {
  const prev = p.previousPeriodData
  return [
    {
      id: 'orders-rrc',
      label: 'Заказы по РРЦ',
      clarifier: 'полная цена каталога',
      current: p.ordersRevenue,
      previous: prev?.ordersAmount,
      valueColor: 'text-blue-600',
    },
    {
      id: 'orders-discounted',
      label: 'Заказы на карточке',
      clarifier: 'после скидки продавца',
      current: p.ordersRevenueDiscounted,
      previous: undefined,
      valueColor: 'text-blue-600',
    },
    {
      id: 'buyouts',
      label: 'Выкупы',
      clarifier: 'выручка после комиссии WB',
      current: p.wbSalesGross,
      previous: prev?.salesAmount,
      valueColor: 'text-green-600',
    },
    {
      id: 'retail-sales',
      label: 'Продажи (розница)',
      clarifier: 'до комиссии WB',
      current: p.saleGross,
      previous: prev?.saleGross,
      valueColor: 'text-green-600',
    },
  ]
}
