/**
 * Boundary normalizer tests — МойСклад stock-db (M1).
 * Contract: docs/request-backend/221-moysklad-integration-backend-contract.md
 *
 * Covers: Prisma Decimal `{s,e,d}` → number (decimal.js-verified sample), null
 * preservation (AP#8 — stockFree/reserve/nmId → null, never 0), response-shape
 * `{count,total,date,rows}` handling, query-param building, date routing.
 */

import { describe, it, expect, vi } from 'vitest'
import { mapStockSnapshot, getMoyskladStockDb } from '../moysklad-stock'
import { apiClient } from '../../api-client'
import {
  stockSnapshotSample,
  stockSnapshotUnmatchedSample,
  stockDbRawFixture,
  stockDbEmptyFixture,
} from '@/test/fixtures/moysklad-empty'

vi.mock('../../api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const mockedGet = vi.mocked(apiClient.get)

describe('mapStockSnapshot', () => {
  it('decodes Prisma Decimal stockFree/reserve to numbers (decimal.js {s,e,d})', () => {
    // {s:1,e:4,d:[28765,3100000]} = 28765.31 ; {s:1,e:1,d:[50,0]} = 50
    const s = mapStockSnapshot(stockSnapshotSample)
    expect(s.stockFree).toBe(28765.31)
    expect(s.reserve).toBe(50)
    expect(s.nmId).toBe(12345678)
    expect(s.date).toBe('2026-07-03')
    expect(s.moyskladAssortmentId).toBe('assort-1')
  })

  it('preserves null nmId/reserve/syncedAt on unmatched rows (AP#8 — never 0)', () => {
    const s = mapStockSnapshot(stockSnapshotUnmatchedSample)
    expect(s.nmId).toBeNull()
    expect(s.reserve).toBeNull()
    expect(s.syncedAt).toBeNull()
    // stockFree still present (100), not collapsed to 0.
    expect(s.stockFree).toBe(100)
  })

  it('returns safe defaults for null input', () => {
    const s = mapStockSnapshot(null)
    expect(s.id).toBe('')
    expect(s.moyskladAssortmentId).toBe('')
    expect(s.nmId).toBeNull()
    expect(s.stockFree).toBeNull()
    expect(s.reserve).toBeNull()
    expect(s.date).toBeNull()
    expect(s.syncedAt).toBeNull()
  })

  it('accepts string-serialized decimals defensively', () => {
    const s = mapStockSnapshot({ id: 'x', stockFree: '12.5', reserve: 5 })
    expect(s.stockFree).toBe(12.5)
    expect(s.reserve).toBe(5)
  })
})

describe('getMoyskladStockDb', () => {
  it('reads {count,total,date,rows} envelope with skipDataUnwrap', async () => {
    mockedGet.mockResolvedValueOnce(stockDbRawFixture)
    const res = await getMoyskladStockDb()
    expect(mockedGet).toHaveBeenCalledWith(
      '/v1/moysklad/stock-db',
      expect.objectContaining({ skipDataUnwrap: true })
    )
    expect(res.count).toBe(2)
    expect(res.total).toBe(365)
    expect(res.date).toBe('2026-07-03')
    expect(res.rows).toHaveLength(2)
    expect(res.rows[0].stockFree).toBe(28765.31)
  })

  it('sends date param when provided', async () => {
    mockedGet.mockResolvedValueOnce(stockDbRawFixture)
    await getMoyskladStockDb({ date: '2026-07-01' })
    expect(mockedGet).toHaveBeenCalledWith(
      '/v1/moysklad/stock-db?date=2026-07-01',
      expect.objectContaining({ skipDataUnwrap: true })
    )
  })

  it('builds limit/offset query for positive ints', async () => {
    mockedGet.mockResolvedValueOnce(stockDbEmptyFixture)
    await getMoyskladStockDb({ limit: 50, offset: 10 })
    expect(mockedGet).toHaveBeenCalledWith(
      '/v1/moysklad/stock-db?limit=50&offset=10',
      expect.objectContaining({ skipDataUnwrap: true })
    )
  })

  it('omits limit=0 (backend treats 0 as absent)', async () => {
    mockedGet.mockResolvedValueOnce(stockDbEmptyFixture)
    await getMoyskladStockDb({ limit: 0 })
    expect(mockedGet).toHaveBeenCalledWith(
      '/v1/moysklad/stock-db',
      expect.objectContaining({ skipDataUnwrap: true })
    )
  })

  it('surfaces an invalid-date 400 (lets it throw — hook reports the error)', async () => {
    mockedGet.mockRejectedValueOnce(new Error('Request failed with status code 400'))
    await expect(getMoyskladStockDb({ date: 'not-a-date' })).rejects.toThrow('400')
  })
})
