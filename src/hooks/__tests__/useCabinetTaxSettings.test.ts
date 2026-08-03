/**
 * TDD RED PHASE tests for useCabinetTaxSettings hooks
 * Story 66.2-FE: Tax Settings Hooks
 * Epic 66-FE: Tax & Accounting Frontend
 *
 * Tests: cabinetTaxKeys, useCabinetTaxSettings, useUpdateTaxSettings
 * These tests WILL FAIL until the hook file is implemented (RED phase).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createTestQueryClient, createQueryWrapper } from '@/test/utils/test-utils'
import type { Cabinet, UpdateCabinetTaxRequest } from '@/types/cabinet'
import type { QueryClient } from '@tanstack/react-query'

// Mock API module
vi.mock('@/lib/api/cabinet', () => ({
  getCabinetTaxSettings: vi.fn(),
  updateCabinetTaxSettings: vi.fn(),
}))

import { getCabinetTaxSettings, updateCabinetTaxSettings } from '@/lib/api/cabinet'
import {
  cabinetTaxKeys,
  useCabinetTaxSettings,
  useUpdateTaxSettings,
} from '../useCabinetTaxSettings'

// -- Mock data ----------------------------------------------------------------

const mockCabinet: Cabinet = {
  id: 'cab-123',
  name: 'Test Cabinet',
  isActive: true,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-02-15T10:00:00Z',
  taxSystem: 'usn6',
  taxRate: null,
  vatPayer: false,
  vatRate: null,
  targetMarginPct: null,
}

const mockUpdatedCabinet: Cabinet = {
  ...mockCabinet,
  vatPayer: true,
  vatRate: 20,
  updatedAt: '2025-02-16T12:00:00Z',
}

// -- Helpers ------------------------------------------------------------------

const mockedGet = vi.mocked(getCabinetTaxSettings)
const mockedUpdate = vi.mocked(updateCabinetTaxSettings)

let queryClient: QueryClient

beforeEach(() => {
  vi.clearAllMocks()
  queryClient = createTestQueryClient()
})

// -- Query Key Tests ----------------------------------------------------------

describe('cabinetTaxKeys', () => {
  it('returns base key from .all', () => {
    expect(cabinetTaxKeys.all).toEqual(['cabinet-tax'])
  })

  it('returns key with cabinetId from .byId()', () => {
    expect(cabinetTaxKeys.byId('cab-123')).toEqual(['cabinet-tax', 'cab-123'])
  })
})

// -- Query Hook Tests ---------------------------------------------------------

describe('useCabinetTaxSettings', () => {
  it('returns cabinet tax data when cabinetId is provided', async () => {
    mockedGet.mockResolvedValueOnce(mockCabinet)

    const { result } = renderHook(() => useCabinetTaxSettings('cab-123'), {
      wrapper: createQueryWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedGet).toHaveBeenCalledWith('cab-123')
    expect(result.current.data).toEqual(mockCabinet)
    expect(result.current.data?.taxSystem).toBe('usn6')
    expect(result.current.data?.vatPayer).toBe(false)
  })

  it('is disabled when cabinetId is empty string', () => {
    const { result } = renderHook(() => useCabinetTaxSettings(''), {
      wrapper: createQueryWrapper(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedGet).not.toHaveBeenCalled()
  })

  it('returns loading state initially', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useCabinetTaxSettings('cab-123'), {
      wrapper: createQueryWrapper(queryClient),
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  it('handles API error gracefully', async () => {
    mockedGet.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useCabinetTaxSettings('cab-123'), {
      wrapper: createQueryWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeInstanceOf(Error)
  })
})

// -- Mutation Hook Tests ------------------------------------------------------

describe('useUpdateTaxSettings', () => {
  it('calls updateCabinetTaxSettings with correct params', async () => {
    mockedUpdate.mockResolvedValueOnce(mockUpdatedCabinet)

    const { result } = renderHook(() => useUpdateTaxSettings('cab-123'), {
      wrapper: createQueryWrapper(queryClient),
    })

    const payload: UpdateCabinetTaxRequest = { vatPayer: true, vatRate: 20 }

    result.current.mutate(payload)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedUpdate).toHaveBeenCalledWith('cab-123', payload)
    expect(result.current.data).toEqual(mockUpdatedCabinet)
  })

  it('invalidates cabinet-tax and finance-summary queries on success', async () => {
    mockedUpdate.mockResolvedValueOnce(mockUpdatedCabinet)
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateTaxSettings('cab-123'), {
      wrapper: createQueryWrapper(queryClient),
    })

    result.current.mutate({ taxSystem: 'usn15' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['cabinet-tax'] })
    )
    expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['financial'] }))
  })

  it('updates the exact cabinet cache with the persisted response', async () => {
    const persisted = { ...mockUpdatedCabinet, targetMarginPct: 0 }
    mockedUpdate.mockResolvedValueOnce(persisted)
    const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData')

    const { result } = renderHook(() => useUpdateTaxSettings('cab-123'), {
      wrapper: createQueryWrapper(queryClient),
    })

    result.current.mutate({ targetMarginPct: 0 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(setQueryDataSpy).toHaveBeenCalledWith(cabinetTaxKeys.byId('cab-123'), persisted)
  })

  it('handles 400 validation error', async () => {
    const validationError = Object.assign(new Error('Validation failed'), {
      response: { status: 400, data: { message: 'Invalid vatRate' } },
    })
    mockedUpdate.mockRejectedValueOnce(validationError)

    const { result } = renderHook(() => useUpdateTaxSettings('cab-123'), {
      wrapper: createQueryWrapper(queryClient),
    })

    result.current.mutate({ vatPayer: true, vatRate: 99 as never })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeDefined()
  })
})
