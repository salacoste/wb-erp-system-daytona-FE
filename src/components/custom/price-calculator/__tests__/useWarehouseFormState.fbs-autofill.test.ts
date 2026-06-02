/**
 * useWarehouseFormState — forward-logistics auto-fill regression (price-calc DEFECT-2, iter-57)
 *
 * FBS "Маркетплейс" warehouses have a real FBO logistics rate of 0. The auto-fill effect must
 * write that 0 into the form when such a warehouse is selected — the old `logisticsForwardRub > 0`
 * guard dropped it, leaving a stale rate from a previously selected FBO warehouse (selection-order-
 * dependent wrong logistics). These tests pin the corrected behavior.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { UseFormSetValue } from 'react-hook-form'
import { useWarehouseFormState } from '../useWarehouseFormState'
import type { FormData } from '../usePriceCalculatorForm'
import type { Warehouse } from '@/types/warehouse'

const FBO_WAREHOUSE: Warehouse = {
  id: 507,
  name: 'Коледино',
  tariffs: {
    deliveryBaseLiterRub: 48,
    deliveryPerLiterRub: 11,
    storageBaseLiterRub: 0.07,
    storagePerLiterRub: 0.05,
    logisticsCoefficient: 1,
    storageCoefficient: 1,
  },
}

const FBS_WAREHOUSE: Warehouse = {
  id: 1107175926,
  name: 'Маркетплейс: Центральный федеральный округ',
  tariffs: {
    // Real FBO rate of 0 — the seller ships the goods (no WB FBO box logistics).
    deliveryBaseLiterRub: 0,
    deliveryPerLiterRub: 0,
    storageBaseLiterRub: 0.11,
    storagePerLiterRub: 0.11,
    logisticsCoefficient: 1,
    storageCoefficient: 1,
  },
}

function renderWarehouseFormState(setValue: UseFormSetValue<FormData>) {
  // Non-zero dimensions → volumeLiters > 0 so logistics auto-fill is active.
  return renderHook(() =>
    useWarehouseFormState({
      setValue,
      lengthCm: 10,
      widthCm: 10,
      heightCm: 10,
      boxType: 2,
      unitsPerPackage: 1,
    })
  )
}

function lastLogisticsForwardCall(setValue: ReturnType<typeof vi.fn>): number | undefined {
  const calls = setValue.mock.calls.filter(c => c[0] === 'logistics_forward_rub')
  return calls.length ? (calls[calls.length - 1][1] as number) : undefined
}

describe('useWarehouseFormState — forward-logistics auto-fill (DEFECT-2)', () => {
  let setValue: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setValue = vi.fn()
  })

  it('does NOT auto-fill logistics before a warehouse is selected', () => {
    renderWarehouseFormState(setValue as unknown as UseFormSetValue<FormData>)
    expect(lastLogisticsForwardCall(setValue)).toBeUndefined()
  })

  it('auto-fills a positive forward logistics for a normal FBO warehouse', () => {
    const { result } = renderWarehouseFormState(setValue as unknown as UseFormSetValue<FormData>)
    act(() => result.current.handleWarehouseChange(FBO_WAREHOUSE.id, FBO_WAREHOUSE))
    expect(result.current.logisticsForwardRub).toBeGreaterThan(0)
    expect(lastLogisticsForwardCall(setValue)).toBeGreaterThan(0)
  })

  it('writes a real 0 forward logistics when switching FBO → FBS warehouse (no stale value)', () => {
    const { result } = renderWarehouseFormState(setValue as unknown as UseFormSetValue<FormData>)
    // 1) Select a normal FBO warehouse → positive logistics auto-filled.
    act(() => result.current.handleWarehouseChange(FBO_WAREHOUSE.id, FBO_WAREHOUSE))
    expect(lastLogisticsForwardCall(setValue)).toBeGreaterThan(0)
    // 2) Switch to an FBS "Маркетплейс" warehouse → must overwrite with 0, not keep the prior rate.
    act(() => result.current.handleWarehouseChange(FBS_WAREHOUSE.id, FBS_WAREHOUSE))
    expect(result.current.logisticsForwardRub).toBe(0)
    expect(lastLogisticsForwardCall(setValue)).toBe(0)
    expect(result.current.isLogisticsAutoFilled).toBe(true)
  })
})
