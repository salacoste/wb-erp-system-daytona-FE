/**
 * OtherAdjustmentsRows — WB Services Breakdown within Deductions
 *
 * Shows: other_adjustments total + WB.Promotion, Jam, Other services sub-rows.
 * Request #56: WB Services Breakdown (inside other_adjustments).
 * Extracted from DeductionsSection.tsx — pure structural refactor.
 */

'use client'

import { PnLRow } from './PnLRow'
import type { CabinetSummaryTotals } from '@/types/analytics'

interface OtherAdjustmentsRowsProps {
  data: CabinetSummaryTotals
  revenueBase: number
  otherAdjustmentsPct: number | null
}

export function OtherAdjustmentsRows({
  data,
  revenueBase,
  otherAdjustmentsPct,
}: OtherAdjustmentsRowsProps) {
  if ((data.other_adjustments ?? 0) === 0) return null

  return (
    <>
      <PnLRow
        label="Прочие удержания"
        value={data.other_adjustments}
        isNegative={(data.other_adjustments ?? 0) > 0}
        isPositive={(data.other_adjustments ?? 0) < 0}
        indent={1}
        tooltip="Общая сумма прочих корректировок и удержаний WB.
                Ниже показана детализация по типам сервисов."
        formula="Прочие = WB.Продвижение + Джем + Прочие сервисы"
        percentOfRevenue={otherAdjustmentsPct}
      />

      {/* Request #56: WB Services Breakdown (inside other_adjustments) */}
      {/* WB.Продвижение (реклама) */}
      {(data.wb_promotion_cost ?? 0) > 0 && (
        <PnLRow
          label="→ WB.Продвижение"
          value={data.wb_promotion_cost}
          isNegative
          indent={2}
          showZero={false}
          tooltip="Удержания WB за услуги продвижения из финансового отчёта.
                  Отличается от расхода на кампании в рекламном кабинете (API рекламы).
                  Это фактические списания за продвижение в поиске и каталоге."
          formula="Оказание услуг «WB Продвижение»"
          percentOfRevenue={
            data.wb_promotion_cost && revenueBase > 0
              ? (data.wb_promotion_cost / revenueBase) * 100
              : null
          }
        />
      )}

      {/* Джем (подписка) */}
      {(data.wb_jam_cost ?? 0) > 0 && (
        <PnLRow
          label="→ Джем"
          value={data.wb_jam_cost}
          isNegative
          indent={2}
          showZero={false}
          tooltip="Подписка на сервис «Джем» от Wildberries.
                  Включает аналитику, автоматизацию и инструменты
                  для управления продажами."
          formula="Предоставление услуг по подписке «Джем»"
          percentOfRevenue={
            data.wb_jam_cost && revenueBase > 0 ? (data.wb_jam_cost / revenueBase) * 100 : null
          }
        />
      )}

      {/* Прочие сервисы WB (утилизация и др.) */}
      {(data.wb_other_services_cost ?? 0) > 0 && (
        <PnLRow
          label="→ Прочие сервисы WB"
          value={data.wb_other_services_cost}
          isNegative
          indent={2}
          showZero={false}
          tooltip="Прочие сервисы Wildberries:
                  - Утилизация товаров
                  - Другие сервисные комиссии"
          formula="Утилизация + Другие сервисы"
          percentOfRevenue={
            data.wb_other_services_cost && revenueBase > 0
              ? (data.wb_other_services_cost / revenueBase) * 100
              : null
          }
        />
      )}
    </>
  )
}
