/**
 * RevenueSection — Section 1 of PnL Waterfall
 *
 * Shows: GMV, Returns, Net Sales (retail).
 * Formula: Продажи (розница) = GMV - Возвраты
 * Extracted from PnLWaterfall.tsx — pure structural refactor.
 */

'use client'

import { SectionHeader } from './PnLSectionHeader'
import { PnLRow } from './PnLRow'
import type { RevenueSectionProps } from './pnl-types'

export function RevenueSection({ data }: RevenueSectionProps) {
  return (
    <div>
      <SectionHeader
        title="1. Выручка"
        description="Сколько заплатили покупатели за ваши товары"
        formula="Продажи (розница) = GMV − Возвраты"
      />
      <div className="space-y-1">
        <PnLRow
          label="Продажи (GMV)"
          value={data.sales_gross}
          tooltip="Общая сумма, которую заплатили покупатели за товары.
                  Это цена товара с учётом всех скидок WB (СПП, акции).
                  Источник: поле retail_price_with_discount для продаж."
          formula="SUM(retail_price_with_discount) WHERE doc_type='sale'"
        />
        <PnLRow
          label="Возвраты"
          value={data.returns_gross}
          isNegative
          indent={1}
          tooltip="Сумма возвращённых покупателями товаров.
                  Это НЕ расход, а уменьшение выручки — товар вернулся к вам.
                  Отображается красным, т.к. уменьшает ваш доход."
          formula="SUM(retail_price_with_discount) WHERE doc_type='return'"
        />
        <PnLRow
          label="Продажи (розница)"
          value={data.sale_gross}
          isSubtotal
          tooltip="Итоговая выручка после возвратов.
                  В личном кабинете WB это называется просто «Продажи».
                  Это база (100%) для расчёта всех комиссий и удержаний."
          formula="Net Sales = GMV − Возвраты"
          percentOfRevenue={100}
        />
      </div>
    </div>
  )
}
