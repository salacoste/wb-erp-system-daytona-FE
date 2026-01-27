/**
 * Price Calculator Preset Hook
 * Story 44.44-FE: Preset Save/Load
 *
 * Manages localStorage persistence of calculator form values.
 * @see docs/stories/epic-44/story-44.44-fe-preset-save-load.md
 */

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { FormData } from './usePriceCalculatorForm'

// Constants
export const PRESET_KEY = 'price-calculator-preset'
/** Version 2: Added nm_id, category_id, is_vat_payer, vat_pct, spp_pct, buyback_pct, acquiring_pct, warehouse_name, packaging_rub, logistics_to_mp_rub */
export const CURRENT_VERSION = 2

/** Preset schema stored in localStorage (AC5: version for migration) */
export interface PriceCalculatorPreset {
  version: number
  savedAt: string
  data: Partial<FormData>
}

/** Hook return interface (AC1-AC3: Save, load, clear) */
export interface UsePriceCalculatorPresetReturn {
  hasPreset: boolean
  isPresetLoaded: boolean
  loadPreset: () => Partial<FormData> | null
  savePreset: (values: FormData) => void
  clearPreset: () => void
}

/**
 * Form fields to include in preset (AC6)
 *
 * Includes: All user-editable fields
 * Excludes: Calculated values, API-fetched coefficients, delivery_date (changes daily)
 */
const PRESET_FIELDS: (keyof FormData)[] = [
  // Product selection
  'nm_id',
  'category_id',

  // Cost inputs
  'cogs_rub',
  'target_margin_pct',

  // Fulfillment & warehouse
  'fulfillment_type',
  'warehouse_id',
  'warehouse_name',
  'box_type',

  // Dimensions
  'length_cm',
  'width_cm',
  'height_cm',
  'weight_exceeds_25kg',

  // Tax configuration (налоги)
  'tax_rate_pct',
  'tax_type',
  'is_vat_payer',
  'vat_pct',

  // Percentage costs
  'drr_pct',
  'spp_pct',
  'buyback_pct',
  'acquiring_pct',

  // FBO settings
  'turnover_days',
  'units_per_package',

  // Seller costs (Story 44.50)
  'packaging_rub',
  'logistics_to_mp_rub',
]

/**
 * Hook for managing price calculator presets
 *
 * @example
 * const { hasPreset, loadPreset, savePreset, clearPreset } = usePriceCalculatorPreset()
 * const presetData = loadPreset()
 * if (presetData) form.reset(presetData)
 */
export function usePriceCalculatorPreset(): UsePriceCalculatorPresetReturn {
  const [hasPreset, setHasPreset] = useState(false)
  const [isPresetLoaded, setIsPresetLoaded] = useState(false)

  // AC2: Check for preset on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PRESET_KEY)
      setHasPreset(!!stored)
    } catch {
      setHasPreset(false)
    }
  }, [])

  /** AC2: Load preset from localStorage. AC5: Handles version migration */
  const loadPreset = useCallback((): Partial<FormData> | null => {
    try {
      const stored = localStorage.getItem(PRESET_KEY)
      if (!stored) return null

      const preset: PriceCalculatorPreset = JSON.parse(stored)

      // AC5: Version migration check
      if (preset.version !== CURRENT_VERSION) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Preset] Version mismatch, discarding preset')
        }
        localStorage.removeItem(PRESET_KEY)
        toast.warning('Формат пресета устарел, используются стандартные значения')
        setHasPreset(false)
        return null
      }

      // Handle missing or invalid data field
      if (!preset.data || typeof preset.data !== 'object') {
        localStorage.removeItem(PRESET_KEY)
        setHasPreset(false)
        return null
      }

      setIsPresetLoaded(true)
      return preset.data
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Preset] Failed to load:', error)
      }
      try {
        localStorage.removeItem(PRESET_KEY)
      } catch {
        // Ignore removal failure
      }
      setHasPreset(false)
      return null
    }
  }, [])

  /** AC1: Save preset to localStorage. AC6: Only saves specified fields */
  const savePreset = useCallback((values: FormData) => {
    try {
      const data: Partial<FormData> = {}
      for (const field of PRESET_FIELDS) {
        if (values[field] !== undefined) {
          ;(data as Record<string, unknown>)[field] = values[field]
        }
      }

      const preset: PriceCalculatorPreset = {
        version: CURRENT_VERSION,
        savedAt: new Date().toISOString(),
        data,
      }

      localStorage.setItem(PRESET_KEY, JSON.stringify(preset))
      setHasPreset(true)
      toast.success('Пресет сохранён')
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Preset] Failed to save:', error)
      }
      toast.error('Не удалось сохранить пресет')
    }
  }, [])

  /** AC3: Clear preset from localStorage */
  const clearPreset = useCallback(() => {
    try {
      localStorage.removeItem(PRESET_KEY)
    } catch {
      // Ignore removal failure
    }
    setHasPreset(false)
    setIsPresetLoaded(false)
    toast.info('Пресет очищен')
  }, [])

  return {
    hasPreset,
    isPresetLoaded,
    loadPreset,
    savePreset,
    clearPreset,
  }
}
