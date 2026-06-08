/**
 * Price Calculator Preset Hook
 * Story 44.44-FE: Preset Save/Load
 *
 * Manages localStorage persistence of calculator form values.
 * @see docs/stories/epic-44/story-44.44-fe-preset-save-load.md
 */

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import type { FormData } from './usePriceCalculatorForm'
import { PRESET_FIELDS } from './preset-fields'

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
          logger.warn('[Preset] Version mismatch, discarding preset')
        }
        localStorage.removeItem(PRESET_KEY)
        toast.warning('Формат пресета устарел, используются стандартные значения')
        setHasPreset(false)
        return null
      }

      if (!preset.data || typeof preset.data !== 'object') {
        localStorage.removeItem(PRESET_KEY)
        setHasPreset(false)
        return null
      }

      setIsPresetLoaded(true)
      return preset.data
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('[Preset] Failed to load:', error)
      }
      try {
        localStorage.removeItem(PRESET_KEY)
      } catch {
        /* ignore */
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
        logger.error('[Preset] Failed to save:', error)
      }
      toast.error('Не удалось сохранить пресет')
    }
  }, [])

  /** AC3: Clear preset from localStorage */
  const clearPreset = useCallback(() => {
    try {
      localStorage.removeItem(PRESET_KEY)
    } catch {
      /* ignore */
    }
    setHasPreset(false)
    setIsPresetLoaded(false)
    toast.info('Пресет очищен')
  }, [])

  return { hasPreset, isPresetLoaded, loadPreset, savePreset, clearPreset }
}
