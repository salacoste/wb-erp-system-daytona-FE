'use client'

import { Percent } from 'lucide-react'
import { BuybackSlider } from './BuybackSlider'
import { DrrSlider } from './DrrSlider'
import { SppInput } from './SppInput'
import type { Control, FieldValues, Path } from 'react-hook-form'

/**
 * Props for PercentageCostsFormSection component
 * Uses generic T to accept any form data type that includes the required fields
 */
export interface PercentageCostsFormSectionProps<T extends FieldValues> {
  /** React Hook Form control for controlled components */
  control: Control<T>
  /** Current DRR percentage value */
  drrValue: number
  /** Current SPP percentage value */
  sppValue: number
  /** Callback when DRR value changes */
  onDrrChange: (value: number) => void
  /** Callback when SPP value changes */
  onSppChange: (value: number) => void
  /** Disable all inputs */
  disabled?: boolean
}

/**
 * Percentage-based costs input section for price calculator
 * Includes: Buyback %, DRR (advertising), SPP
 *
 * Story 44.2-FE: Input Form Component
 * Story 44.18-FE: DRR Input
 * Story 44.19-FE: SPP Display
 *
 * UX Update: All three fields now have consistent layout structure:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ [Label]                     [FieldTooltip]  [Badge?]        │
 * ├─────────────────────────────────────────────────────────────┤
 * │ [═══════ Slider ═══════]              [Input][%]            │
 * └─────────────────────────────────────────────────────────────┘
 */
export function PercentageCostsFormSection<T extends FieldValues>({
  control,
  drrValue,
  sppValue,
  onDrrChange,
  onSppChange,
  disabled = false,
}: PercentageCostsFormSectionProps<T>) {
  // Cast field name to Path<T> for type safety with generic forms
  const buybackField = 'buyback_pct' as Path<T>

  return (
    // Story 44.30: Changed from purple to emerald to distinguish from WarehouseSection
    <div className="bg-emerald-50 rounded-lg p-4 border-l-4 border-l-emerald-400">
      <div className="flex items-center gap-2 mb-4">
        <Percent className="h-4 w-4 text-emerald-600" aria-hidden="true" />
        <h3 className="text-base font-semibold text-emerald-900">Процентные расходы (%)</h3>
      </div>

      <div className="space-y-4">
        {/* Buyback % - Story 44.30: Now fully encapsulated with label and tooltip */}
        <BuybackSlider
          name={buybackField}
          control={control}
          min={10}
          max={100}
          step={0.5}
          unit="%"
          disabled={disabled}
          label="Процент выкупа"
          tooltipContent="Доля заказов, которые фактически выкупаются покупателями. При 98% выкупе из 100 заказов 2 будут возвращены. Влияет на расчёт логистики возврата. Средний показатель по WB: 95-98%."
        />

        {/* DRR Slider - Story 44.18 */}
        <DrrSlider
          value={drrValue}
          onChange={onDrrChange}
          disabled={disabled}
        />

        {/* SPP Input - Story 44.19 */}
        <SppInput
          value={sppValue}
          onChange={onSppChange}
          disabled={disabled}
        />
      </div>
    </div>
  )
}
