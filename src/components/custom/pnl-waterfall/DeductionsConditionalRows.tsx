'use client'

/**
 * Deductions conditional rows — SPP compensation, loyalty, penalties
 * Extracted from DeductionsSection.tsx for file size compliance
 */

import { PnLRow } from './PnLRow'
import type { CabinetSummaryTotals } from '@/types/analytics'

interface DeductionsConditionalRowsProps {
  data: CabinetSummaryTotals
  acquiringPct: number | null
  loyaltyFeePct: number | null
  loyaltyCompensationPct: number | null
  penaltiesPct: number | null
  showSppCompensation: boolean
  sppCompensation: number
  sppCompensationPct: number | null
}

export function DeductionsConditionalRows({
  data,
  acquiringPct,
  loyaltyFeePct,
  loyaltyCompensationPct,
  penaltiesPct,
  showSppCompensation,
  sppCompensation,
  sppCompensationPct,
}: DeductionsConditionalRowsProps) {
  return (
    <>
      {/* Penalties - only if > 0, highlighted red */}
      {(data.penalties ?? 0) > 0 && (
        <PnLRow
          label="Штрафы"
          value={data.penalties}
          isNegative
          indent={1}
          highlight="negative"
          tooltip="Штрафы за нарушения: брак, пересорт, просрочка маркировки.
                  ВАЖНО: этот показатель должен быть равен 0!
                  Любые штрафы — повод для расследования причин."
          formula="Штрафы = Сумма всех начисленных штрафов"
          percentOfRevenue={penaltiesPct}
        />
      )}

      {/* Acquiring fee - only if > 0 */}
      <PnLRow
        label="Эквайринг"
        value={data.acquiring_fee}
        isNegative
        indent={1}
        showZero={false}
        tooltip="Комиссия за приём платежей от покупателей.
                  Обычно включена в основную комиссию WB,
                  отдельно выделяется для некоторых способов оплаты."
        formula="Эквайринг = % от суммы платежа"
        percentOfRevenue={acquiringPct}
      />

      {/* Loyalty fee - only if > 0 */}
      <PnLRow
        label="Программа лояльности"
        value={data.loyalty_fee}
        isNegative
        indent={1}
        showZero={false}
        tooltip="Плата за участие в программе лояльности WB.
                  Включает стоимость баллов, которые покупатели
                  использовали для оплаты ваших товаров."
        formula="Лояльность = Удержано баллов + Участие в программе"
        percentOfRevenue={loyaltyFeePct}
      />

      {/* Loyalty compensation - POSITIVE (green) - reduces deductions */}
      {(data.loyalty_compensation ?? 0) > 0 && (
        <PnLRow
          label="Компенсация лояльности"
          value={data.loyalty_compensation}
          isPositive
          indent={1}
          highlight="positive"
          tooltip="Компенсация ОТ WB за участие в программе лояльности.
                  Это ПЛЮС к вашему доходу — WB компенсирует часть
                  скидок, которые вы дали покупателям."
          formula="Компенсация = Возврат части удержанных средств"
          percentOfRevenue={loyaltyCompensationPct}
        />
      )}

      {/* SPP Compensation - credit from WB for subsidizing SPP discounts */}
      {showSppCompensation && (
        <PnLRow
          label="Компенсация СПП"
          value={sppCompensation}
          isPositive
          indent={1}
          highlight="positive"
          tooltip="Wildberries частично компенсирует продавцу скидку СПП (скидка постоянного покупателя).
                  Покупатель видит цену со скидкой СПП, но WB платит продавцу БОЛЬШЕ,
                  чем цена после скидки. Эта разница — компенсация СПП.

                  Это ПЛЮС к вашему доходу, уменьшает итоговые удержания."
          formula="Компенсация СПП = SUM(net_for_pay) − SUM(gross) по продажам"
          percentOfRevenue={sppCompensationPct}
        />
      )}
    </>
  )
}
