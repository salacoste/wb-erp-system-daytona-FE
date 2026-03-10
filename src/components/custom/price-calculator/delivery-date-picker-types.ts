/**
 * Type definitions for DeliveryDatePicker component
 * Story 44.26a-FE: Delivery Date Selection
 * Story 44.40-FE: Two Tariff Systems Integration
 * Epic 74: File Size Compliance - extracted from DeliveryDatePicker.tsx
 */

import type { DailyCoefficient } from '@/hooks/useAcceptanceCoefficients'
import type { SupplyDateTariffs } from '@/lib/tariff-system-utils'
import type { NormalizedCoefficient } from '@/lib/coefficient-utils'
import type { BoxTypeCoefficients } from '@/hooks/useAcceptanceCoefficients'

/** Extended daily coefficient with full tariff data for SUPPLY system */
export interface ExtendedDailyCoefficient extends DailyCoefficient {
  /** Full supply tariff data for this date (Story 44.40) */
  supplyTariffs?: SupplyDateTariffs
}

export interface DeliveryDatePickerProps {
  /** Array of coefficients for the next 14 days (legacy, default box type) */
  coefficients: NormalizedCoefficient[]
  /** Coefficients grouped by box type */
  byBoxType?: BoxTypeCoefficients[]
  /** Currently selected date (ISO format) */
  selectedDate: string | null
  /** Callback when date is selected - Story 44.40: includes supply tariffs */
  onDateSelect: (date: string, coefficient: number) => void
  /** Story 44.40: Extended callback with full supply tariff data */
  onDateSelectWithTariffs?: (
    date: string,
    coefficient: number,
    supplyTariffs: SupplyDateTariffs | null
  ) => void
  /** Story 44.40: Full supply tariff data indexed by date */
  supplyTariffsMap?: Map<string, SupplyDateTariffs>
  /** Whether the coefficients are loading */
  isLoading?: boolean
  /** Error message if coefficients failed to load */
  error?: string | null
  /** Label for the picker (default: "Дата сдачи товара") */
  label?: string
  /** Show hint icon */
  showHint?: boolean
  /** Show fallback mode when API has no data (simple date picker with default coefficient) */
  showFallback?: boolean
}
