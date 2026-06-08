/**
 * Tariffs API Client Tests
 * Covers: getCommissions, getWarehouses, getAcceptanceCoefficients,
 * getAllAcceptanceCoefficients, getTariffSettings.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock API client
vi.mock('../../api-client', () => ({
  apiClient: { get: vi.fn() },
}))

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// Mock normalizers — return realistic shapes so source-code logging doesn't crash
vi.mock('../tariffs-normalizer', () => ({
  normalizeCommissionsResponse: vi.fn(() => ({
    commissions: [],
    meta: { total: 0, cached: false, cache_ttl_seconds: 86400, fetched_at: '' },
  })),
  normalizeWarehousesResponse: vi.fn(() => ({
    warehouses: [],
    updated_at: '',
  })),
  normalizeAcceptanceCoefficientsResponse: vi.fn(() => ({
    coefficients: [],
    meta: { total: 0, available: 0, unavailable: 0, cache_ttl_seconds: 3600 },
  })),
  normalizeTariffSettings: vi.fn(() => ({
    default_commission_fbo_pct: 0,
    default_commission_fbs_pct: 0,
    acceptance_box_rate_per_liter: 0,
    acceptance_pallet_rate: 0,
    logistics_volume_tiers: [],
    logistics_large_first_liter_rate: 0,
    logistics_large_additional_liter_rate: 0,
    return_logistics_fbo_rate: 0,
    return_logistics_fbs_rate: 0,
    storage_free_days: 0,
    fbs_uses_fbo_logistics_rates: false,
    effective_from: '',
  })),
}))

import { apiClient } from '../../api-client'
import {
  getCommissions,
  getWarehouses,
  getAcceptanceCoefficients,
  getAllAcceptanceCoefficients,
  getTariffSettings,
} from '../tariffs'
import {
  normalizeCommissionsResponse,
  normalizeWarehousesResponse,
  normalizeAcceptanceCoefficientsResponse,
  normalizeTariffSettings,
} from '../tariffs-normalizer'

const mockGet = vi.mocked(apiClient.get)

beforeEach(() => {
  vi.clearAllMocks()
})

// =============================================================================
// getCommissions
// =============================================================================

describe('getCommissions', () => {
  it('calls GET /v1/tariffs/commissions and passes raw to normalizer', async () => {
    const raw = { commissions: [{ subjectID: 1 }], meta: { total: 1, cached: true } }
    mockGet.mockResolvedValueOnce(raw)

    const result = await getCommissions()

    expect(mockGet).toHaveBeenCalledWith('/v1/tariffs/commissions')
    expect(normalizeCommissionsResponse).toHaveBeenCalledWith(raw)
    // Result is the normalizer's return value
    expect(result.commissions).toEqual([])
    expect(result.meta.total).toBe(0)
  })

  it('propagates API errors', async () => {
    mockGet.mockRejectedValueOnce(new Error('Rate limited'))
    await expect(getCommissions()).rejects.toThrow('Rate limited')
  })
})

// =============================================================================
// getWarehouses
// =============================================================================

describe('getWarehouses', () => {
  it('calls GET /v1/tariffs/warehouses and passes raw to normalizer', async () => {
    const raw = { warehouses: [{ id: 1, name: 'WH-1' }], updated_at: '2025-01-01' }
    mockGet.mockResolvedValueOnce(raw)

    const result = await getWarehouses()

    expect(mockGet).toHaveBeenCalledWith('/v1/tariffs/warehouses')
    expect(normalizeWarehousesResponse).toHaveBeenCalledWith(raw)
    expect(result.warehouses).toEqual([])
  })

  it('propagates API errors', async () => {
    mockGet.mockRejectedValueOnce(new Error('Server error'))
    await expect(getWarehouses()).rejects.toThrow('Server error')
  })
})

// =============================================================================
// getAcceptanceCoefficients
// =============================================================================

describe('getAcceptanceCoefficients', () => {
  it('calls GET with the warehouseId query param', async () => {
    const raw = { coefficients: [], meta: { total: 0, available: 0, unavailable: 0 } }
    mockGet.mockResolvedValueOnce(raw)

    const result = await getAcceptanceCoefficients(12345)

    expect(mockGet).toHaveBeenCalledWith('/v1/tariffs/acceptance/coefficients?warehouseId=12345')
    expect(normalizeAcceptanceCoefficientsResponse).toHaveBeenCalledWith(raw)
    expect(result.coefficients).toEqual([])
  })

  it('encodes warehouseId as a number in the URL', async () => {
    mockGet.mockResolvedValueOnce({})
    await getAcceptanceCoefficients(0)

    const url = mockGet.mock.calls[0][0] as string
    expect(url).toContain('warehouseId=0')
  })

  it('propagates API errors', async () => {
    mockGet.mockRejectedValueOnce(new Error('Timeout'))
    await expect(getAcceptanceCoefficients(1)).rejects.toThrow('Timeout')
  })
})

// =============================================================================
// getAllAcceptanceCoefficients
// =============================================================================

describe('getAllAcceptanceCoefficients', () => {
  it('calls GET /v1/tariffs/acceptance/coefficients/all', async () => {
    const raw = { coefficients: [{ warehouseId: 1 }], meta: { total: 1 } }
    mockGet.mockResolvedValueOnce(raw)

    const result = await getAllAcceptanceCoefficients()

    expect(mockGet).toHaveBeenCalledWith('/v1/tariffs/acceptance/coefficients/all')
    expect(normalizeAcceptanceCoefficientsResponse).toHaveBeenCalledWith(raw)
    expect(result.coefficients).toEqual([])
  })

  it('propagates API errors', async () => {
    mockGet.mockRejectedValueOnce(new Error('Forbidden'))
    await expect(getAllAcceptanceCoefficients()).rejects.toThrow('Forbidden')
  })
})

// =============================================================================
// getTariffSettings
// =============================================================================

describe('getTariffSettings', () => {
  it('calls GET /v1/tariffs/settings and passes raw to normalizer', async () => {
    const raw = {
      default_commission_fbo_pct: 15,
      default_commission_fbs_pct: 10,
      effective_from: '2025-01-01',
    }
    mockGet.mockResolvedValueOnce(raw)

    const result = await getTariffSettings()

    expect(mockGet).toHaveBeenCalledWith('/v1/tariffs/settings')
    expect(normalizeTariffSettings).toHaveBeenCalledWith(raw)
    expect(result.effective_from).toBe('')
    expect(result.default_commission_fbo_pct).toBe(0)
  })

  it('propagates API errors', async () => {
    mockGet.mockRejectedValueOnce(new Error('Not found'))
    await expect(getTariffSettings()).rejects.toThrow('Not found')
  })
})
