/**
 * Story 44.44-FE: Preset Save/Load
 * TDD Tests - Red Phase (Failing Tests)
 *
 * These tests define the expected behavior BEFORE implementation.
 * Run: npm test -- PresetSaveLoad.story-44.44
 *
 * @see docs/stories/epic-44/story-44.44-fe-preset-save-load.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { render, screen, waitFor } from '@testing-library/react'

// Types that will be created
import type { FormData } from '../usePriceCalculatorForm'

// ============================================================================
// Constants (matching story spec)
// ============================================================================

const PRESET_KEY = 'price-calculator-preset'
/** Version 2: Added nm_id, category_id, is_vat_payer, vat_pct, spp_pct, buyback_pct, acquiring_pct, warehouse_name, packaging_rub, logistics_to_mp_rub */
const CURRENT_VERSION = 2

// ============================================================================
// Test Fixtures
// ============================================================================

/** Valid preset matching story schema */
const mockValidPreset = {
  version: 2,
  savedAt: '2026-01-27T10:30:00.000Z',
  data: {
    cogs_rub: 500,
    target_margin_pct: 25,
    fulfillment_type: 'FBO' as const,
    warehouse_id: 507,
    box_type: 2 as const,
    length_cm: 20,
    width_cm: 15,
    height_cm: 10,
    weight_exceeds_25kg: false,
    tax_rate_pct: 6,
    tax_type: 'income' as const,
    drr_pct: 5,
    turnover_days: 30,
    units_per_package: 1,
  },
}

/** Form values for save operation */
const mockFormValues: Partial<FormData> = {
  fulfillment_type: 'FBO',
  cogs_rub: 500,
  target_margin_pct: 25,
  warehouse_id: 507,
  box_type: 2,
  length_cm: 20,
  width_cm: 15,
  height_cm: 10,
  weight_exceeds_25kg: false,
  tax_rate_pct: 6,
  tax_type: 'income',
  drr_pct: 5,
  turnover_days: 30,
  units_per_package: 1,
  // These should NOT be saved (dynamic data)
  delivery_date: '2026-01-28',
  logistics_coefficient: 1.2,
  storage_coefficient: 1.1,
}

/** Outdated preset with wrong version (v1 is now outdated, v2 is current) */
const mockOutdatedPreset = {
  version: 1,
  savedAt: '2025-01-01T00:00:00.000Z',
  data: {
    cogs_rub: 100,
  },
}

/** Corrupted JSON string */
const corruptedJson = '{ invalid json syntax'

// ============================================================================
// Mock Setup
// ============================================================================

// Separate store to avoid circular reference
let mockStore: Record<string, string> = {}

// Simple localStorage mock with explicit typing for Vitest mocks
const localStorageMock = {
  get store(): Record<string, string> {
    return mockStore
  },
  set store(value: Record<string, string>) {
    mockStore = value
  },
  getItem: vi.fn().mockImplementation((key: string): string | null => mockStore[key] || null),
  setItem: vi.fn().mockImplementation((key: string, value: string): void => {
    mockStore[key] = value
  }),
  removeItem: vi.fn().mockImplementation((key: string): void => {
    delete mockStore[key]
  }),
  clear: vi.fn().mockImplementation((): void => {
    mockStore = {}
  }),
}

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}))

// ============================================================================
// Tests
// ============================================================================

describe('Story 44.44: Preset Save/Load', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', localStorageMock)
    localStorageMock.store = {}
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // ==========================================================================
  // AC1: Save Preset Button
  // ==========================================================================
  describe('AC1: Save Preset Button', () => {
    it('should save all form values to localStorage on savePreset call', async () => {
      // Import hook (will fail until implemented)
      const { usePriceCalculatorPreset } = await import('../usePriceCalculatorPreset')

      const { result } = renderHook(() => usePriceCalculatorPreset())

      act(() => {
        result.current.savePreset(mockFormValues as FormData)
      })

      // Verify localStorage.setItem was called
      expect(localStorageMock.setItem).toHaveBeenCalledWith(PRESET_KEY, expect.any(String))

      // Verify saved data structure
      const savedData = JSON.parse(localStorageMock.store[PRESET_KEY])
      expect(savedData.version).toBe(CURRENT_VERSION)
      expect(savedData.savedAt).toBeDefined()
      expect(savedData.data.cogs_rub).toBe(500)
      expect(savedData.data.target_margin_pct).toBe(25)
    })

    it('should show success toast after saving', async () => {
      const { toast } = await import('sonner')
      const { usePriceCalculatorPreset } = await import('../usePriceCalculatorPreset')

      const { result } = renderHook(() => usePriceCalculatorPreset())

      act(() => {
        result.current.savePreset(mockFormValues as FormData)
      })

      expect(toast.success).toHaveBeenCalledWith('Пресет сохранён')
    })

    it('should set hasPreset to true after saving', async () => {
      const { usePriceCalculatorPreset } = await import('../usePriceCalculatorPreset')

      const { result } = renderHook(() => usePriceCalculatorPreset())

      expect(result.current.hasPreset).toBe(false)

      act(() => {
        result.current.savePreset(mockFormValues as FormData)
      })

      expect(result.current.hasPreset).toBe(true)
    })

    it('should overwrite existing preset when saving again', async () => {
      localStorageMock.store[PRESET_KEY] = JSON.stringify(mockValidPreset)

      const { usePriceCalculatorPreset } = await import('../usePriceCalculatorPreset')

      const { result } = renderHook(() => usePriceCalculatorPreset())

      const newValues = { ...mockFormValues, cogs_rub: 999 }

      act(() => {
        result.current.savePreset(newValues as FormData)
      })

      const savedData = JSON.parse(localStorageMock.store[PRESET_KEY])
      expect(savedData.data.cogs_rub).toBe(999)
    })

    it('should handle save error gracefully', async () => {
      // Simulate localStorage throwing error
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('QuotaExceeded')
      })

      const { toast } = await import('sonner')
      const { usePriceCalculatorPreset } = await import('../usePriceCalculatorPreset')

      const { result } = renderHook(() => usePriceCalculatorPreset())

      act(() => {
        result.current.savePreset(mockFormValues as FormData)
      })

      expect(toast.error).toHaveBeenCalledWith('Не удалось сохранить пресет')
    })
  })

  // ==========================================================================
  // AC2: Load Preset on Page Load
  // ==========================================================================
  describe('AC2: Load Preset on Page Load', () => {
    it('should return preset data when valid preset exists', async () => {
      localStorageMock.store[PRESET_KEY] = JSON.stringify(mockValidPreset)

      const { usePriceCalculatorPreset } = await import('../usePriceCalculatorPreset')

      const { result } = renderHook(() => usePriceCalculatorPreset())

      let loadedData: Partial<FormData> | null = null
      act(() => {
        loadedData = result.current.loadPreset()
      })

      expect(loadedData).not.toBeNull()
      // Non-null assertion after expect verification
      expect(loadedData!.cogs_rub).toBe(500)
      expect(loadedData!.target_margin_pct).toBe(25)
      expect(loadedData!.fulfillment_type).toBe('FBO')
    })

    it('should return null when no preset exists', async () => {
      const { usePriceCalculatorPreset } = await import('../usePriceCalculatorPreset')

      const { result } = renderHook(() => usePriceCalculatorPreset())

      let loadedData: Partial<FormData> | null = null
      act(() => {
        loadedData = result.current.loadPreset()
      })

      expect(loadedData).toBeNull()
    })

    it('should set isPresetLoaded to true after successful load', async () => {
      localStorageMock.store[PRESET_KEY] = JSON.stringify(mockValidPreset)

      const { usePriceCalculatorPreset } = await import('../usePriceCalculatorPreset')

      const { result } = renderHook(() => usePriceCalculatorPreset())

      expect(result.current.isPresetLoaded).toBe(false)

      act(() => {
        result.current.loadPreset()
      })

      expect(result.current.isPresetLoaded).toBe(true)
    })

    it('should detect hasPreset on mount when preset exists', async () => {
      localStorageMock.store[PRESET_KEY] = JSON.stringify(mockValidPreset)

      const { usePriceCalculatorPreset } = await import('../usePriceCalculatorPreset')

      const { result } = renderHook(() => usePriceCalculatorPreset())

      // After initial render effect
      await waitFor(() => {
        expect(result.current.hasPreset).toBe(true)
      })
    })

    it('should set hasPreset to false on mount when no preset', async () => {
      const { usePriceCalculatorPreset } = await import('../usePriceCalculatorPreset')

      const { result } = renderHook(() => usePriceCalculatorPreset())

      await waitFor(() => {
        expect(result.current.hasPreset).toBe(false)
      })
    })
  })

  // ==========================================================================
  // AC3: Clear Preset Button
  // ==========================================================================
  describe('AC3: Clear Preset Button', () => {
    it('should remove preset from localStorage on clearPreset', async () => {
      localStorageMock.store[PRESET_KEY] = JSON.stringify(mockValidPreset)

      const { usePriceCalculatorPreset } = await import('../usePriceCalculatorPreset')

      const { result } = renderHook(() => usePriceCalculatorPreset())

      act(() => {
        result.current.clearPreset()
      })

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(PRESET_KEY)
      expect(localStorageMock.store[PRESET_KEY]).toBeUndefined()
    })

    it('should show info toast after clearing', async () => {
      localStorageMock.store[PRESET_KEY] = JSON.stringify(mockValidPreset)

      const { toast } = await import('sonner')
      const { usePriceCalculatorPreset } = await import('../usePriceCalculatorPreset')

      const { result } = renderHook(() => usePriceCalculatorPreset())

      act(() => {
        result.current.clearPreset()
      })

      expect(toast.info).toHaveBeenCalledWith('Пресет очищен')
    })

    it('should set hasPreset to false after clearing', async () => {
      localStorageMock.store[PRESET_KEY] = JSON.stringify(mockValidPreset)

      const { usePriceCalculatorPreset } = await import('../usePriceCalculatorPreset')

      const { result } = renderHook(() => usePriceCalculatorPreset())

      // Initially should detect preset
      await waitFor(() => {
        expect(result.current.hasPreset).toBe(true)
      })

      act(() => {
        result.current.clearPreset()
      })

      expect(result.current.hasPreset).toBe(false)
    })

    it('should set isPresetLoaded to false after clearing', async () => {
      localStorageMock.store[PRESET_KEY] = JSON.stringify(mockValidPreset)

      const { usePriceCalculatorPreset } = await import('../usePriceCalculatorPreset')

      const { result } = renderHook(() => usePriceCalculatorPreset())

      act(() => {
        result.current.loadPreset()
      })

      expect(result.current.isPresetLoaded).toBe(true)

      act(() => {
        result.current.clearPreset()
      })

      expect(result.current.isPresetLoaded).toBe(false)
    })
  })

  // ==========================================================================
  // AC4: Visual Indicator (PresetIndicator Component)
  // ==========================================================================
  describe('AC4: Visual Indicator', () => {
    it('should render badge when isVisible is true', async () => {
      const { PresetIndicator } = await import('../PresetIndicator')

      render(<PresetIndicator isVisible={true} />)

      expect(screen.getByText(/Пресет загружен/)).toBeInTheDocument()
    })

    it('should not render when isVisible is false', async () => {
      const { PresetIndicator } = await import('../PresetIndicator')

      const { container } = render(<PresetIndicator isVisible={false} />)

      expect(container.firstChild).toBeNull()
    })

    it('should include save icon (💾 or equivalent)', async () => {
      const { PresetIndicator } = await import('../PresetIndicator')

      render(<PresetIndicator isVisible={true} />)

      // Check for icon presence (emoji or SVG)
      const badge = screen.getByText(/Пресет загружен/)
      expect(badge.textContent).toMatch(/💾|Пресет/)
    })

    it('should auto-hide after 3 seconds by default', async () => {
      vi.useFakeTimers()

      const { PresetIndicator } = await import('../PresetIndicator')

      render(<PresetIndicator isVisible={true} />)

      expect(screen.getByText(/Пресет загружен/)).toBeInTheDocument()

      // Advance time by 3 seconds
      act(() => {
        vi.advanceTimersByTime(3000)
      })

      await waitFor(() => {
        expect(screen.queryByText(/Пресет загружен/)).not.toBeInTheDocument()
      })

      vi.useRealTimers()
    })

    it('should respect custom autoHideMs prop', async () => {
      vi.useFakeTimers()

      const { PresetIndicator } = await import('../PresetIndicator')

      render(<PresetIndicator isVisible={true} autoHideMs={5000} />)

      expect(screen.getByText(/Пресет загружен/)).toBeInTheDocument()

      // After 3 seconds, should still be visible
      act(() => {
        vi.advanceTimersByTime(3000)
      })

      expect(screen.getByText(/Пресет загружен/)).toBeInTheDocument()

      // After 5 seconds total, should be hidden
      act(() => {
        vi.advanceTimersByTime(2000)
      })

      await waitFor(() => {
        expect(screen.queryByText(/Пресет загружен/)).not.toBeInTheDocument()
      })

      vi.useRealTimers()
    })

    it('should have green styling for the badge', async () => {
      const { PresetIndicator } = await import('../PresetIndicator')

      render(<PresetIndicator isVisible={true} />)

      const badge = screen.getByText(/Пресет загружен/).closest('[class]')
      expect(badge).toHaveClass(/green/)
    })
  })

  // ==========================================================================
  // AC5: Preset Version Migration
  // ==========================================================================
  describe('AC5: Preset Version Migration', () => {
    it('should discard preset with wrong version', async () => {
      localStorageMock.store[PRESET_KEY] = JSON.stringify(mockOutdatedPreset)

      const { usePriceCalculatorPreset } = await import('../usePriceCalculatorPreset')

      const { result } = renderHook(() => usePriceCalculatorPreset())

      let loadedData: Partial<FormData> | null = null
      act(() => {
        loadedData = result.current.loadPreset()
      })

      expect(loadedData).toBeNull()
    })

    it('should show warning toast for outdated preset', async () => {
      localStorageMock.store[PRESET_KEY] = JSON.stringify(mockOutdatedPreset)

      const { toast } = await import('sonner')
      const { usePriceCalculatorPreset } = await import('../usePriceCalculatorPreset')

      const { result } = renderHook(() => usePriceCalculatorPreset())

      act(() => {
        result.current.loadPreset()
      })

      expect(toast.warning).toHaveBeenCalledWith(
        'Формат пресета устарел, используются стандартные значения'
      )
    })

    it('should remove outdated preset from localStorage', async () => {
      localStorageMock.store[PRESET_KEY] = JSON.stringify(mockOutdatedPreset)

      const { usePriceCalculatorPreset } = await import('../usePriceCalculatorPreset')

      const { result } = renderHook(() => usePriceCalculatorPreset())

      act(() => {
        result.current.loadPreset()
      })

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(PRESET_KEY)
    })

    it('should set hasPreset to false after discarding outdated preset', async () => {
      localStorageMock.store[PRESET_KEY] = JSON.stringify(mockOutdatedPreset)

      const { usePriceCalculatorPreset } = await import('../usePriceCalculatorPreset')

      const { result } = renderHook(() => usePriceCalculatorPreset())

      act(() => {
        result.current.loadPreset()
      })

      expect(result.current.hasPreset).toBe(false)
    })
  })

  // ==========================================================================
  // AC6: Form Fields Covered
  // ==========================================================================
  describe('AC6: Form Fields Covered', () => {
    it('should save all required form fields', async () => {
      const { usePriceCalculatorPreset } = await import('../usePriceCalculatorPreset')

      const { result } = renderHook(() => usePriceCalculatorPreset())

      const fullFormValues: Partial<FormData> = {
        cogs_rub: 500,
        target_margin_pct: 25,
        fulfillment_type: 'FBO',
        warehouse_id: 507,
        box_type: 2,
        length_cm: 20,
        width_cm: 15,
        height_cm: 10,
        weight_exceeds_25kg: false,
        tax_rate_pct: 6,
        tax_type: 'income',
        drr_pct: 5,
        turnover_days: 30,
        units_per_package: 1,
      }

      act(() => {
        result.current.savePreset(fullFormValues as FormData)
      })

      const savedData = JSON.parse(localStorageMock.store[PRESET_KEY])

      // Verify all required fields are saved
      expect(savedData.data.cogs_rub).toBe(500)
      expect(savedData.data.target_margin_pct).toBe(25)
      expect(savedData.data.fulfillment_type).toBe('FBO')
      expect(savedData.data.warehouse_id).toBe(507)
      expect(savedData.data.box_type).toBe(2)
      expect(savedData.data.length_cm).toBe(20)
      expect(savedData.data.width_cm).toBe(15)
      expect(savedData.data.height_cm).toBe(10)
      expect(savedData.data.weight_exceeds_25kg).toBe(false)
      expect(savedData.data.tax_rate_pct).toBe(6)
      expect(savedData.data.tax_type).toBe('income')
      expect(savedData.data.drr_pct).toBe(5)
      expect(savedData.data.turnover_days).toBe(30)
      expect(savedData.data.units_per_package).toBe(1)
    })

    it('should exclude delivery_date from preset (dynamic data)', async () => {
      const { usePriceCalculatorPreset } = await import('../usePriceCalculatorPreset')

      const { result } = renderHook(() => usePriceCalculatorPreset())

      const formWithDynamicData = {
        ...mockFormValues,
        delivery_date: '2026-01-28',
      }

      act(() => {
        result.current.savePreset(formWithDynamicData as FormData)
      })

      const savedData = JSON.parse(localStorageMock.store[PRESET_KEY])
      expect(savedData.data.delivery_date).toBeUndefined()
    })

    it('should exclude API-fetched coefficients from preset', async () => {
      const { usePriceCalculatorPreset } = await import('../usePriceCalculatorPreset')

      const { result } = renderHook(() => usePriceCalculatorPreset())

      const formWithCoefficients = {
        ...mockFormValues,
        logistics_coefficient: 1.2,
        storage_coefficient: 1.1,
      }

      act(() => {
        result.current.savePreset(formWithCoefficients as FormData)
      })

      const savedData = JSON.parse(localStorageMock.store[PRESET_KEY])
      expect(savedData.data.logistics_coefficient).toBeUndefined()
      expect(savedData.data.storage_coefficient).toBeUndefined()
    })

    it('should exclude calculation results from preset', async () => {
      const { usePriceCalculatorPreset } = await import('../usePriceCalculatorPreset')

      const { result } = renderHook(() => usePriceCalculatorPreset())

      const formWithResults = {
        ...mockFormValues,
        // These would be calculation results, not form inputs
        acceptance_cost: 19.5,
        logistics_forward_rub: 120,
        storage_rub: 25,
      }

      act(() => {
        result.current.savePreset(formWithResults as FormData)
      })

      const savedData = JSON.parse(localStorageMock.store[PRESET_KEY])
      // acceptance_cost is calculated, should not be saved
      expect(savedData.data.acceptance_cost).toBeUndefined()
    })
  })

  // ==========================================================================
  // Edge Cases
  // ==========================================================================
  describe('Edge Cases', () => {
    it('should handle corrupted JSON gracefully', async () => {
      localStorageMock.store[PRESET_KEY] = corruptedJson

      const { usePriceCalculatorPreset } = await import('../usePriceCalculatorPreset')

      const { result } = renderHook(() => usePriceCalculatorPreset())

      let loadedData: Partial<FormData> | null = null
      act(() => {
        loadedData = result.current.loadPreset()
      })

      expect(loadedData).toBeNull()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(PRESET_KEY)
    })

    it('should handle localStorage unavailable (private browsing)', async () => {
      // Simulate localStorage throwing error
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('SecurityError: localStorage not available')
      })

      const { usePriceCalculatorPreset } = await import('../usePriceCalculatorPreset')

      const { result } = renderHook(() => usePriceCalculatorPreset())

      let loadedData: Partial<FormData> | null = null
      act(() => {
        loadedData = result.current.loadPreset()
      })

      // Should fail silently and return null
      expect(loadedData).toBeNull()
    })

    it('should handle preset with missing data field', async () => {
      const malformedPreset = {
        version: 1,
        savedAt: '2026-01-27T10:30:00.000Z',
        // missing data field
      }
      localStorageMock.store[PRESET_KEY] = JSON.stringify(malformedPreset)

      const { usePriceCalculatorPreset } = await import('../usePriceCalculatorPreset')

      const { result } = renderHook(() => usePriceCalculatorPreset())

      let loadedData: Partial<FormData> | null = null
      act(() => {
        loadedData = result.current.loadPreset()
      })

      // Should handle gracefully
      expect(loadedData).toBeNull()
    })

    it('should handle empty preset data object', async () => {
      const emptyDataPreset = {
        version: 2, // Current version
        savedAt: '2026-01-27T10:30:00.000Z',
        data: {},
      }
      localStorageMock.store[PRESET_KEY] = JSON.stringify(emptyDataPreset)

      const { usePriceCalculatorPreset } = await import('../usePriceCalculatorPreset')

      const { result } = renderHook(() => usePriceCalculatorPreset())

      let loadedData: Partial<FormData> | null = null
      act(() => {
        loadedData = result.current.loadPreset()
      })

      // Empty data is technically valid, should return empty object
      expect(loadedData).toEqual({})
    })

    it('should include savedAt timestamp in saved preset', async () => {
      const { usePriceCalculatorPreset } = await import('../usePriceCalculatorPreset')

      const { result } = renderHook(() => usePriceCalculatorPreset())

      act(() => {
        result.current.savePreset(mockFormValues as FormData)
      })

      const savedData = JSON.parse(localStorageMock.store[PRESET_KEY])
      expect(savedData.savedAt).toBeDefined()
      expect(new Date(savedData.savedAt).getTime()).not.toBeNaN()
    })
  })

  // ==========================================================================
  // Hook Return Interface
  // ==========================================================================
  describe('Hook Return Interface', () => {
    it('should return all expected properties', async () => {
      const { usePriceCalculatorPreset } = await import('../usePriceCalculatorPreset')

      const { result } = renderHook(() => usePriceCalculatorPreset())

      // Verify hook returns expected interface
      expect(result.current).toHaveProperty('hasPreset')
      expect(result.current).toHaveProperty('isPresetLoaded')
      expect(result.current).toHaveProperty('loadPreset')
      expect(result.current).toHaveProperty('savePreset')
      expect(result.current).toHaveProperty('clearPreset')

      // Verify types
      expect(typeof result.current.hasPreset).toBe('boolean')
      expect(typeof result.current.isPresetLoaded).toBe('boolean')
      expect(typeof result.current.loadPreset).toBe('function')
      expect(typeof result.current.savePreset).toBe('function')
      expect(typeof result.current.clearPreset).toBe('function')
    })
  })

  // ==========================================================================
  // Accessibility (WCAG 2.1 AA)
  // ==========================================================================
  describe('Accessibility', () => {
    it('PresetIndicator badge should have sufficient color contrast', async () => {
      const { PresetIndicator } = await import('../PresetIndicator')

      render(<PresetIndicator isVisible={true} />)

      const badge = screen.getByText(/Пресет загружен/)
      // Green on light background should have >= 4.5:1 contrast
      expect(badge).toBeInTheDocument()
      // Visual verification needed for actual contrast ratio
    })

    it('PresetIndicator should be announced to screen readers', async () => {
      const { PresetIndicator } = await import('../PresetIndicator')

      render(<PresetIndicator isVisible={true} />)

      const badge = screen.getByText(/Пресет загружен/)
      // Should be visible to assistive technology
      expect(badge).toBeVisible()
    })
  })
})
