/**
 * Orders History Boundary Normalizer Tests
 * Tests for normalizeLocalHistoryResponse, normalizeWbHistoryResponse,
 * normalizeFullHistoryResponse from orders-history-normalizer.ts
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeLocalHistoryResponse,
  normalizeWbHistoryResponse,
  normalizeFullHistoryResponse,
} from '../orders-history-normalizer'

// Helper: normalizer output uses `entries` via spread, but the FE canonical type
// may differ. Cast to Record<string, unknown> for property assertions.
type NormResult = Record<string, unknown>
interface NormEntry {
  status: string
  timestamp: string
  source?: string
  wbStatusCode?: number
  [key: string]: unknown
}

const getEntries = (r: NormResult): NormEntry[] => (r.entries ?? []) as NormEntry[]

// --- normalizeLocalHistoryResponse ---

describe('normalizeLocalHistoryResponse', () => {
  it('normalizes a fully-populated local history response', () => {
    const raw = {
      orderId: '1234567890',
      currentStatus: { supplierStatus: 'complete', wbStatus: 'sold', isFinal: true },
      entries: [
        {
          status: 'new',
          timestamp: '2026-01-02T10:00:00.000Z',
          oldSupplierStatus: null,
          newSupplierStatus: 'new',
        },
        {
          status: 'confirm',
          timestamp: '2026-01-02T12:30:00.000Z',
          oldSupplierStatus: 'new',
          newSupplierStatus: 'confirm',
        },
      ],
    }

    const result = normalizeLocalHistoryResponse(raw) as unknown as NormResult
    expect(result.orderId).toBe('1234567890')
    expect(getEntries(result)).toHaveLength(2)
    expect(getEntries(result)[0].status).toBe('new')
    expect(getEntries(result)[1].timestamp).toBe('2026-01-02T12:30:00.000Z')
  })

  it('handles snake_case orderId (order_id)', () => {
    const raw = { order_id: '998877', entries: [] }
    const result = normalizeLocalHistoryResponse(raw) as unknown as NormResult
    expect(result.orderId).toBe('998877')
  })

  it('handles entries under "history" key instead of "entries"', () => {
    const raw = {
      orderId: '111',
      history: [{ status: 'sold', timestamp: '2026-03-01T08:00:00Z' }],
    }
    const result = normalizeLocalHistoryResponse(raw) as unknown as NormResult
    expect(getEntries(result)).toHaveLength(1)
    expect(getEntries(result)[0].status).toBe('sold')
  })

  it('coerces entry timestamp from createdAt when timestamp is missing', () => {
    const raw = {
      orderId: '222',
      entries: [{ createdAt: '2026-02-15T14:00:00Z' }],
    }
    const result = normalizeLocalHistoryResponse(raw) as unknown as NormResult
    expect(getEntries(result)[0].timestamp).toBe('2026-02-15T14:00:00Z')
  })

  it('coerces entry timestamp from created_at (snake_case fallback)', () => {
    const raw = {
      orderId: '333',
      entries: [{ created_at: '2026-04-10T09:00:00Z' }],
    }
    const result = normalizeLocalHistoryResponse(raw) as unknown as NormResult
    expect(getEntries(result)[0].timestamp).toBe('2026-04-10T09:00:00Z')
  })

  it('defaults status to empty string when missing', () => {
    const raw = { orderId: '444', entries: [{}] }
    const result = normalizeLocalHistoryResponse(raw) as unknown as NormResult
    expect(getEntries(result)[0].status).toBe('')
  })

  it('defaults currentStatus to "unknown" when missing', () => {
    const raw = { orderId: '555', entries: [] }
    const result = normalizeLocalHistoryResponse(raw) as unknown as NormResult
    expect(result.currentStatus).toBe('unknown')
  })

  it('handles snake_case current_status', () => {
    const raw = { orderId: '666', current_status: 'waiting', entries: [] }
    const result = normalizeLocalHistoryResponse(raw) as unknown as NormResult
    expect(result.currentStatus).toBe('waiting')
  })

  it('returns empty entries for null/undefined raw', () => {
    const r1 = normalizeLocalHistoryResponse(null) as unknown as NormResult
    expect(getEntries(r1)).toEqual([])
    expect(r1.orderId).toBe('')

    const r2 = normalizeLocalHistoryResponse(undefined) as unknown as NormResult
    expect(getEntries(r2)).toEqual([])
    expect(r2.orderId).toBe('')
  })

  it('preserves extra spread properties on entries', () => {
    const raw = {
      orderId: '777',
      entries: [{ status: 'new', timestamp: '2026-01-01T00:00:00Z', customField: 'value' }],
    }
    const result = normalizeLocalHistoryResponse(raw) as unknown as NormResult
    expect(getEntries(result)[0].customField).toBe('value')
  })
})

// --- normalizeWbHistoryResponse ---

describe('normalizeWbHistoryResponse', () => {
  it('normalizes a fully-populated WB history response', () => {
    const raw = {
      orderId: 'WB-001',
      entries: [
        { status: 'created', timestamp: '2026-01-10T10:00:00Z', wbStatusCode: 100 },
        { status: 'assembling', timestamp: '2026-01-10T11:00:00Z', wbStatusCode: 200 },
      ],
    }
    const result = normalizeWbHistoryResponse(raw) as unknown as NormResult
    expect(result.orderId).toBe('WB-001')
    expect(getEntries(result)).toHaveLength(2)
    expect(getEntries(result)[0].status).toBe('created')
    expect(getEntries(result)[0].wbStatusCode).toBe(100)
  })

  it('handles snake_case order_id', () => {
    const raw = { order_id: 'WB-002', entries: [] }
    const result = normalizeWbHistoryResponse(raw) as unknown as NormResult
    expect(result.orderId).toBe('WB-002')
  })

  it('handles entries under "history" key', () => {
    const raw = {
      orderId: 'WB-003',
      history: [{ status: 'shipped', timestamp: '2026-02-01T00:00:00Z' }],
    }
    const result = normalizeWbHistoryResponse(raw) as unknown as NormResult
    expect(getEntries(result)).toHaveLength(1)
  })

  it('coerces timestamp from dt (WB field name fallback)', () => {
    const raw = {
      orderId: 'WB-004',
      entries: [{ status: 'sorted', dt: '2026-03-15T12:00:00Z' }],
    }
    const result = normalizeWbHistoryResponse(raw) as unknown as NormResult
    expect(getEntries(result)[0].timestamp).toBe('2026-03-15T12:00:00Z')
  })

  it('coerces timestamp from created_at (snake_case fallback)', () => {
    const raw = {
      orderId: 'WB-005',
      entries: [{ status: 'delivered', created_at: '2026-05-01T06:00:00Z' }],
    }
    const result = normalizeWbHistoryResponse(raw) as unknown as NormResult
    expect(getEntries(result)[0].timestamp).toBe('2026-05-01T06:00:00Z')
  })

  it('defaults wbStatusCode to 0 when missing', () => {
    const raw = { orderId: 'WB-006', entries: [{ status: 'new' }] }
    const result = normalizeWbHistoryResponse(raw) as unknown as NormResult
    expect(getEntries(result)[0].wbStatusCode).toBe(0)
  })

  it('handles snake_case wb_status_code', () => {
    const raw = { orderId: 'WB-007', entries: [{ status: 'x', wb_status_code: 42 }] }
    const result = normalizeWbHistoryResponse(raw) as unknown as NormResult
    expect(getEntries(result)[0].wbStatusCode).toBe(42)
  })

  it('returns empty entries for null/undefined raw', () => {
    const r1 = normalizeWbHistoryResponse(null) as unknown as NormResult
    expect(getEntries(r1)).toEqual([])
    const r2 = normalizeWbHistoryResponse(undefined) as unknown as NormResult
    expect(getEntries(r2)).toEqual([])
  })
})

// --- normalizeFullHistoryResponse ---

describe('normalizeFullHistoryResponse', () => {
  it('normalizes a fully-populated full history response', () => {
    const raw = {
      orderId: 'FULL-001',
      entries: [
        { source: 'wb_native', status: 'created', timestamp: '2026-01-01T00:00:00Z' },
        { source: 'local', status: 'new', timestamp: '2026-01-01T00:05:00Z' },
      ],
    }
    const result = normalizeFullHistoryResponse(raw) as unknown as NormResult
    expect(result.orderId).toBe('FULL-001')
    expect(getEntries(result)).toHaveLength(2)
    expect(getEntries(result)[0].source).toBe('wb_native')
    expect(getEntries(result)[1].source).toBe('local')
  })

  it('handles entries under "history" key', () => {
    const raw = {
      orderId: 'FULL-002',
      history: [{ source: 'local', status: 'confirm', timestamp: '2026-02-10T00:00:00Z' }],
    }
    const result = normalizeFullHistoryResponse(raw) as unknown as NormResult
    expect(getEntries(result)).toHaveLength(1)
  })

  it('defaults source to "unknown" when missing', () => {
    const raw = { orderId: 'FULL-003', entries: [{ status: 'x', timestamp: 't' }] }
    const result = normalizeFullHistoryResponse(raw) as unknown as NormResult
    expect(getEntries(result)[0].source).toBe('unknown')
  })

  it('coerces timestamp from dt and created_at fallbacks', () => {
    const withDt = { orderId: 'A', entries: [{ source: 'wb', status: 's', dt: '2026-06-01Z' }] }
    const r1 = normalizeFullHistoryResponse(withDt) as unknown as NormResult
    expect(getEntries(r1)[0].timestamp).toBe('2026-06-01Z')

    const withCreatedAt = {
      orderId: 'B',
      entries: [{ source: 'wb', status: 's', created_at: '2026-06-02Z' }],
    }
    const r2 = normalizeFullHistoryResponse(withCreatedAt) as unknown as NormResult
    expect(getEntries(r2)[0].timestamp).toBe('2026-06-02Z')
  })

  it('returns empty entries for null/undefined raw', () => {
    const r1 = normalizeFullHistoryResponse(null) as unknown as NormResult
    expect(getEntries(r1)).toEqual([])
    const r2 = normalizeFullHistoryResponse(undefined) as unknown as NormResult
    expect(getEntries(r2)).toEqual([])
  })
})
