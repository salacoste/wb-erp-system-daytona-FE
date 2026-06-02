/**
 * OtherAdjustmentsRows — WB Services Breakdown within Deductions
 *
 * Shows: other_adjustments total + WB.Promotion, Jam, Other services sub-rows.
 * Request #56: WB Services Breakdown (inside other_adjustments).
 * Extracted from DeductionsSection.tsx — pure structural refactor.
 *
 * Source-field cross-reference: this component reads `data.other_adjustments` (sum of
 * all "прочие" items in `weekly_margin_fact`). The same total is also available via
 * `data.commission_other` per request-backend/173 § I1 — backend extracts the latter
 * from `corrections.bonus_type_name` matching (WB.Продвижение + Джем). The two sources
 * are expected to be near-equivalent in normal operation; consumers choose
 * `other_adjustments` for backwards-compat with Request #56-era code. Switch to
 * `commission_other` if backend ever diverges them (e.g., when `bonus_type_name`
 * adds new categories not reflected in `other_adjustments`).
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
        formula="Прочие включает: WB.Продвижение + Джем + Прочие сервисы (и иные корректировки WB)"
        percentOfRevenue={otherAdjustmentsPct}
      />

      {/* Request #56: WB Services Breakdown (inside other_adjustments) */}
      {/* WB.Продвижение (реклама) */}
      {/* eslint-disable-next-line no-restricted-syntax -- DISPLAY-GUARD: wb_promotion_cost null = absent; visibility guard checks > 0 */}
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
      {/* eslint-disable-next-line no-restricted-syntax -- DISPLAY-GUARD: wb_jam_cost null = absent; visibility guard checks > 0 */}
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
      {/* eslint-disable-next-line no-restricted-syntax -- DISPLAY-GUARD: wb_other_services_cost null = absent; visibility guard checks > 0 */}
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
