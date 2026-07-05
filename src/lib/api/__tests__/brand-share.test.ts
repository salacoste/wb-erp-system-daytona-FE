/**
 * Brand-Share API tests — PR4b.
 * Covers: brand list mapping, parent-subject mapping + date forwarding, report
 * mapping, NULL preservation (AP#8 — never `?? 0` on percent/rating), and the
 * 503 upstream-failure propagation path.
 * Reference: docs/request-backend/225-brand-share-backend-contract.md
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiError } from '@/types/api'

vi.mock('../../api-client', () => ({
  apiClient: { get: vi.fn() },
}))

import { apiClient } from '../../api-client'
import {
  getBrandShareBrands,
  getBrandShareParentSubjects,
  getBrandShareReport,
} from '../brand-share'

vi.spyOn(console, 'debug').mockImplementation(() => {})

describe('getBrandShareBrands', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GETs /v1/analytics/brand-share/brands and returns string[]', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(['DURABOND', 'Acme'])
    const result = await getBrandShareBrands()
    expect(apiClient.get).toHaveBeenCalledWith('/v1/analytics/brand-share/brands')
    expect(result).toEqual(['DURABOND', 'Acme'])
  })

  it('drops empty strings and coerces non-string values', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(['Nike', '', 'Puma', null, 42])
    const result = await getBrandShareBrands()
    expect(result).toEqual(['Nike', 'Puma', '42'])
  })

  it('returns [] when payload is not an array', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ not: 'an array' })
    const result = await getBrandShareBrands()
    expect(result).toEqual([])
  })
})

describe('getBrandShareParentSubjects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GETs parent-subjects with brand only (no dates → no date params)', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([
      { parentId: 8555, parentName: 'Отделочные материалы' },
    ])
    const result = await getBrandShareParentSubjects({ brand: 'DURABOND' })
    expect(apiClient.get).toHaveBeenCalledWith(
      '/v1/analytics/brand-share/parent-subjects?brand=DURABOND'
    )
    expect(result).toEqual([{ parentId: 8555, parentName: 'Отделочные материалы' }])
  })

  it('forwards dateFrom / dateTo when provided', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([])
    await getBrandShareParentSubjects({
      brand: 'DURABOND',
      dateFrom: '2026-06-27',
      dateTo: '2026-07-04',
    })
    const calledUrl = vi.mocked(apiClient.get).mock.calls[0][0] as string
    expect(calledUrl).toContain('brand=DURABOND')
    expect(calledUrl).toContain('dateFrom=2026-06-27')
    expect(calledUrl).toContain('dateTo=2026-07-04')
  })

  it('drops rows with non-numeric parentId', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([
      { parentId: 1, parentName: 'A' },
      { parentId: 'oops', parentName: 'B' },
      { parentName: 'no-id' },
    ])
    const result = await getBrandShareParentSubjects({ brand: 'X' })
    expect(result).toEqual([{ parentId: 1, parentName: 'A' }])
  })
})

describe('getBrandShareReport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GETs the report with brand + parentId + dates', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      report: [{ applyDate: '2026-07-01', brandRating: 3, pricePercent: 12.5, qtyPercent: 8 }],
    })
    const result = await getBrandShareReport({
      brand: 'DURABOND',
      parentId: 8555,
      dateFrom: '2026-06-27',
      dateTo: '2026-07-04',
    })
    const calledUrl = vi.mocked(apiClient.get).mock.calls[0][0] as string
    expect(calledUrl).toBe(
      '/v1/analytics/brand-share?brand=DURABOND&parentId=8555&dateFrom=2026-06-27&dateTo=2026-07-04'
    )
    expect(result.report).toEqual([
      { applyDate: '2026-07-01', brandRating: 3, pricePercent: 12.5, qtyPercent: 8 },
    ])
  })

  it('maps 0 share percents to null (contract §2: 0 = no-data), keeps brandRating 0 + non-zero shares', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      report: [
        { applyDate: '2026-07-01', brandRating: null, pricePercent: null, qtyPercent: null },
        { applyDate: '2026-07-02', brandRating: 5, pricePercent: 0, qtyPercent: 0 },
        { applyDate: '2026-07-03', brandRating: 0, pricePercent: 7.5, qtyPercent: 4 },
      ],
    })
    const result = await getBrandShareReport({ brand: 'B', parentId: 1 })
    // nulls preserved (AP#8).
    expect(result.report[0]).toEqual({
      applyDate: '2026-07-01',
      brandRating: null,
      pricePercent: null,
      qtyPercent: null,
    })
    // Contract §2: 0 share on a low-volume day is a no-data sentinel → null.
    expect(result.report[1]).toEqual({
      applyDate: '2026-07-02',
      brandRating: 5,
      pricePercent: null,
      qtyPercent: null,
    })
    // brandRating 0 is a real value (kept); non-zero shares are kept.
    expect(result.report[2]).toEqual({
      applyDate: '2026-07-03',
      brandRating: 0,
      pricePercent: 7.5,
      qtyPercent: 4,
    })
  })

  it('returns empty report when payload lacks the report array', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ unrelated: 'shape' })
    const result = await getBrandShareReport({ brand: 'B', parentId: 1 })
    expect(result.report).toEqual([])
  })

  it('propagates 503 ApiError verbatim (upstream WB failure)', async () => {
    const err = new ApiError('ServiceUnavailableException', 503)
    vi.mocked(apiClient.get).mockRejectedValueOnce(err)
    await expect(getBrandShareReport({ brand: 'B', parentId: 1 })).rejects.toMatchObject({
      status: 503,
    })
  })
})
