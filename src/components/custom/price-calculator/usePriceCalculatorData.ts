'use client'

/**
 * External data hook for PriceCalculatorForm
 * Extracted from usePriceCalculatorState.ts for modularity (Story 74.1)
 *
 * Manages: tariff settings, commissions, category lookup, auto-fill,
 * watched form values, and warehouse form state.
 */

import { useCallback, useMemo } from 'react'
import { useWatch, type Control } from 'react-hook-form'
import type { UseFormSetValue } from 'react-hook-form'
import { logger } from '@/lib/logger'
import { useProductAutoFill } from '@/hooks/useProductAutoFill'
import { useWarehouseFormState } from './useWarehouseFormState'
import { useTariffSettings } from '@/hooks/useTariffSettings'
import { useCommissions } from '@/hooks/useCommissions'
import {
  DEFAULT_ACCEPTANCE_BOX_RATE,
  DEFAULT_ACCEPTANCE_PALLET_RATE,
} from './price-calculator-constants'
import type { CategoryHierarchy } from '@/types/price-calculator'
import type { CategoryCommission } from '@/types/tariffs'
import type { FormData } from './usePriceCalculatorForm'

interface DataDeps {
  setValue: UseFormSetValue<FormData>
  control: Control<FormData>
  setSelectedCategory: (cat: CategoryCommission | null) => void
  presetWarehouseId: number | null
}

export function usePriceCalculatorData(deps: DataDeps) {
  const { setValue, control, setSelectedCategory, presetWarehouseId } = deps

  // --- Tariff settings ---
  const { data: tariffSettings, error: tariffSettingsError } = useTariffSettings()
  const { data: commissionsData } = useCommissions()

  const acceptanceTariff = useMemo(
    () => ({
      boxRatePerLiter: tariffSettings?.acceptanceBoxRatePerLiter ?? DEFAULT_ACCEPTANCE_BOX_RATE,
      palletRate: tariffSettings?.acceptancePalletRate ?? DEFAULT_ACCEPTANCE_PALLET_RATE,
    }),
    [tariffSettings]
  )

  // --- Category lookup ---
  const findCategoryByHierarchy = useCallback(
    (hierarchy: CategoryHierarchy): CategoryCommission | null => {
      if (!commissionsData?.commissions) return null
      const result =
        commissionsData.commissions.find(
          c =>
            c.subjectID === hierarchy.subject_id &&
            (hierarchy.parent_id === null || c.parentID === hierarchy.parent_id)
        ) ?? null
      logger.debug('[PriceCalculatorForm] findCategoryByHierarchy:', {
        hierarchy,
        found: result ? `${result.parentName} → ${result.subjectName}` : 'not found',
        commission: result
          ? `FBO: ${result.paidStorageKgvp}% / FBS: ${result.kgvpMarketplace}%`
          : 'N/A',
      })
      return result
    },
    [commissionsData]
  )

  // --- Auto-fill ---
  const autoFill = useProductAutoFill({ setValue, setSelectedCategory, findCategoryByHierarchy })

  // --- Watch form values (must be unconditional per React Rules of Hooks) ---
  const fulfillmentType = useWatch({ control, name: 'fulfillment_type' })
  const lengthCm = useWatch({ control, name: 'length_cm' }) ?? 0
  const widthCm = useWatch({ control, name: 'width_cm' }) ?? 0
  const heightCm = useWatch({ control, name: 'height_cm' }) ?? 0
  const dimensions = { length_cm: lengthCm, width_cm: widthCm, height_cm: heightCm }
  const boxType = useWatch({ control, name: 'box_type' })
  const turnoverDays = useWatch({ control, name: 'turnover_days' })
  const weightExceeds25kg = useWatch({ control, name: 'weight_exceeds_25kg' })
  const localizationIndex = useWatch({ control, name: 'localization_index' })
  const unitsPerPackage = useWatch({ control, name: 'units_per_package' })

  // --- Warehouse form state ---
  const warehouse = useWarehouseFormState({
    setValue,
    lengthCm,
    widthCm,
    heightCm,
    boxType: boxType ?? 2,
    unitsPerPackage: unitsPerPackage ?? 1,
    acceptanceTariff,
    initialWarehouseId: presetWarehouseId,
  })

  return {
    tariffSettingsError,
    ...autoFill,
    fulfillmentType,
    dimensions,
    boxType,
    turnoverDays,
    weightExceeds25kg,
    localizationIndex,
    unitsPerPackage,
    ...warehouse,
  }
}
