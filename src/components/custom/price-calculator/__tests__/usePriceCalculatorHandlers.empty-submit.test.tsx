import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { usePriceCalculatorHandlers } from '../usePriceCalculatorHandlers'
import { defaultFormValues } from '../usePriceCalculatorForm'

vi.mock('../useTaxHandlers', () => ({
  useTaxHandlers: () => ({
    handleTaxRateChange: vi.fn(),
    handleTaxTypeChange: vi.fn(),
    handleVatPayerChange: vi.fn(),
    handleVatRateChange: vi.fn(),
  }),
}))

function createState() {
  return {
    debounceTimerRef: { current: null },
    tariffSettingsError: null,
    presetLoadedRef: { current: true },
    loadPreset: vi.fn(),
    setDrrValue: vi.fn(),
    setSppValue: vi.fn(),
    setTaxRate: vi.fn(),
    setTaxType: vi.fn(),
    setIsVatPayer: vi.fn(),
    setVatRate: vi.fn(),
    setPresetWarehouseId: vi.fn(),
    setPresetNmId: vi.fn(),
    reset: vi.fn(),
    skipUnitsResetRef: { current: true },
    setValue: vi.fn(),
    boxType: 'box',
    fulfillmentType: 'FBO',
    acceptanceCost: { perUnitCost: 0 },
    selectedCategory: null,
    isValid: true,
    setShowResetConfirm: vi.fn(),
  } as unknown as Parameters<typeof usePriceCalculatorHandlers>[0]
}

const allZeroForm = {
  ...defaultFormValues,
  target_margin_pct: 0,
  cogs_rub: 0,
  logistics_forward_rub: 0,
  logistics_reverse_rub: 0,
  buyback_pct: 0,
  advertising_pct: 0,
  storage_rub: 0,
}

describe('usePriceCalculatorHandlers empty submission boundary', () => {
  it('does not publish form data or submit an all-zero calculation', () => {
    const onSubmit = vi.fn()
    const onFormDataChange = vi.fn()
    const { result } = renderHook(() =>
      usePriceCalculatorHandlers(createState(), {
        onSubmit,
        onFormDataChange,
        hasResults: false,
        disabled: false,
      })
    )

    act(() => result.current.performCalculation(allZeroForm))

    expect(onFormDataChange).not.toHaveBeenCalled()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits when a calculation field is non-zero', () => {
    const onSubmit = vi.fn()
    const onFormDataChange = vi.fn()
    const { result } = renderHook(() =>
      usePriceCalculatorHandlers(createState(), {
        onSubmit,
        onFormDataChange,
        hasResults: false,
        disabled: false,
      })
    )

    act(() => result.current.performCalculation({ ...allZeroForm, cogs_rub: 1 }))

    expect(onFormDataChange).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})
