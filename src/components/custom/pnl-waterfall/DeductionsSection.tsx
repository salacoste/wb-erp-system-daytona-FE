'use client'

/**
 * DeductionsSection — Section 2 of PnL Waterfall
 *
 * Shows all WB deductions: commission, logistics, storage, acceptance,
 * penalties, acquiring, loyalty, other adjustments, SPP compensation.
 * Extracted from PnLWaterfall.tsx — pure structural refactor.
 */

'use client'

import { SectionHeader } from './PnLSectionHeader'
import { PnLRow } from './PnLRow'
import { OtherAdjustmentsRows } from './OtherAdjustmentsRows'
import type { DeductionsSectionProps } from './pnl-types'

export function DeductionsSection({
  data,
  revenueBase,
  commissionPct,
  logisticsPct,
  storagePct,
  acceptancePct,
  penaltiesPct,
  acquiringPct,
  loyaltyFeePct,
  loyaltyCompensationPct,
  otherAdjustmentsPct,
  showSppCompensation,
  sppCompensation,
  sppCompensationPct,
  totalWBDeductions,
  totalDeductionsPct,
}: DeductionsSectionProps) {
  return (
    <div>
      <SectionHeader
        title="2. Удержания Wildberries"
        description="Все платежи в адрес маркетплейса (вычитаются из вашей выручки)"
        formula="Итого удержаний = Комиссия + Логистика + Хранение + Приёмка + Штрафы + Эквайринг + Лояльность − Компенсации − Компенсация СПП"
      />
      <div className="space-y-1">
        {/* Main commission */}
        <PnLRow
          label="Комиссия WB"
          value={data.total_commission_rub}
          isNegative
          indent={1}
          tooltip="Основная комиссия маркетплейса — разница между ценой для покупателя
                  и суммой, которую WB начисляет продавцу.
                  Зависит от категории товара (5-25%) и участия в акциях WB."
          formula="Комиссия = Цена покупателя − Gross (начислено продавцу)"
          percentOfRevenue={commissionPct}
        />

        {/* Logistics */}
        <PnLRow
          label="Логистика"
          value={data.logistics_cost}
          isNegative
          indent={1}
          tooltip="Стоимость доставки покупателям (~70% суммы) и возврата
                  непроданных товаров на склад (~30%).
                  Норма: 8-15% от продаж. Выше 15% — повод оптимизировать."
          formula="Логистика = Доставка + Возврат на склад"
          percentOfRevenue={logisticsPct}
        />

        {/* Storage */}
        <PnLRow
          label="Хранение"
          value={data.storage_cost}
          isNegative
          indent={1}
          tooltip="Плата за хранение товаров на складах WB (из финотчёта WB).
                  Финальная сумма за период. Может отличаться на 1-3% от данных API платного хранения.
                  Норма: 1-3% от продаж. Выше 5% — избыточные остатки!"
          formula="Хранение = Тариф × Объём × Дни"
          percentOfRevenue={storagePct}
        />

        {/* Paid acceptance - only if > 0 */}
        <PnLRow
          label="Платная приёмка"
          value={data.paid_acceptance_cost}
          isNegative
          indent={1}
          showZero={false}
          tooltip="Плата за приёмку товаров при поставке на склады WB.
                  Взимается при превышении лимитов бесплатной приёмки."
          formula="Приёмка = Кол-во единиц × Тариф"
          percentOfRevenue={acceptancePct}
        />

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

        {/* Other adjustments with WB services breakdown */}
        <OtherAdjustmentsRows
          data={data}
          revenueBase={revenueBase}
          otherAdjustmentsPct={otherAdjustmentsPct}
        />

        {/* NOTE: commission field REMOVED — duplicates total_commission_rub (double-count kВВ).
           See: docs/technical-debt/commission-separation.md */}

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

        {/* SUBTOTAL: Total WB deductions */}
        <PnLRow
          label="Итого удержания WB"
          value={totalWBDeductions}
          isSubtotal
          isNegative
          tooltip="Общая сумма всех удержаний Wildberries за вычетом компенсаций.
                  Рассчитывается как: Продажи (розница) − К перечислению.
                  Компенсация СПП уменьшает итоговые удержания."
          formula="Итого = Комиссия + Логистика + Хранение + ... − Компенсация СПП"
          percentOfRevenue={totalDeductionsPct}
        />
      </div>
    </div>
  )
}
