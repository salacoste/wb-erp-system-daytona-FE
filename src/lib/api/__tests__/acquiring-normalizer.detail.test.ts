/**
 * Boundary Normalizer Tests — Story 90.1-FE
 * Split from acquiring-normalizer.test.ts after Story 90.1 review H-1 (236 lines → 2 files).
 * This file: normalizeAcquiringDetailResponse tests only. See .list.test.ts for list normalizer.
 */

import { describe, it, expect } from 'vitest'
import { normalizeAcquiringDetailResponse } from '../acquiring-normalizer'

// ---------------------------------------------------------------------------
// Fixture helpers (derived from test-api/34-acquiring-analytics.http §RESPONSE SAMPLES)
// ---------------------------------------------------------------------------

function makeRawDetailItem(overrides: Record<string, unknown> = {}) {
  return {
    rrd_id: 1001,
    report_id: 12345,
    acq_date: '2026-04-05',
    acquiring_bank: 'Сбербанк',
    sale_date: '2026-04-04',
    srid: 'abc123',
    doc_type_name: 'Продажа',
    nm_id: 55555,
    retail_amount: 1500.5,
    acquiring_fee: 22.5,
    acquiring_fee_vat: 4.5,
    currency: 'RUB',
    ...overrides,
  }
}

function makeRawDetailResponse(overrides: Record<string, unknown> = {}) {
  return {
    data: [makeRawDetailItem()],
    cached_at: '2026-04-13T10:00:00Z',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// normalizeAcquiringDetailResponse
// ---------------------------------------------------------------------------

describe('normalizeAcquiringDetailResponse', () => {
  it('happy path: fully-populated snake_case response normalizes to typed shape', () => {
    const result = normalizeAcquiringDetailResponse(makeRawDetailResponse())
    expect(result.cachedAt).toBe('2026-04-13T10:00:00Z')
    expect(result.data).toHaveLength(1)
    const item = result.data[0]
    expect(item.rrdId).toBe(1001)
    expect(item.reportId).toBe(12345)
    expect(item.acqDate).toBe('2026-04-05')
    expect(item.acquiringBank).toBe('Сбербанк')
    expect(item.saleDate).toBe('2026-04-04')
    expect(item.srid).toBe('abc123')
    expect(item.docTypeName).toBe('Продажа')
    expect(item.nmId).toBe(55555)
    expect(item.retailAmount).toBe(1500.5)
    expect(item.acquiringFee).toBe(22.5)
    expect(item.acquiringFeeVat).toBe(4.5)
    expect(item.currency).toBe('RUB')
  })

  it('retailAmount: null is preserved as null (not coerced to 0)', () => {
    const raw = makeRawDetailResponse({
      data: [makeRawDetailItem({ retail_amount: null })],
    })
    const result = normalizeAcquiringDetailResponse(raw)
    expect(result.data[0].retailAmount).toBeNull()
  })

  it('acquiringFee: null is preserved as null', () => {
    const raw = makeRawDetailResponse({
      data: [makeRawDetailItem({ acquiring_fee: null })],
    })
    const result = normalizeAcquiringDetailResponse(raw)
    expect(result.data[0].acquiringFee).toBeNull()
  })

  it('acquiringFeeVat: null is preserved as null', () => {
    const raw = makeRawDetailResponse({
      data: [makeRawDetailItem({ acquiring_fee_vat: null })],
    })
    const result = normalizeAcquiringDetailResponse(raw)
    expect(result.data[0].acquiringFeeVat).toBeNull()
  })

  it('snake_case dual-lookup: rrd_id / nm_id / acquiring_fee_vat all normalize correctly', () => {
    const raw = makeRawDetailResponse({
      data: [
        {
          rrd_id: 2002,
          report_id: 99001,
          acq_date: '2026-04-10',
          acquiring_bank: 'Тинькофф',
          sale_date: '2026-04-09',
          srid: 'xyz789',
          doc_type_name: 'Возврат',
          nm_id: 77777,
          retail_amount: 2000.0,
          acquiring_fee: 30.0,
          acquiring_fee_vat: 6.0,
          currency: 'RUB',
        },
      ],
    })
    const result = normalizeAcquiringDetailResponse(raw)
    const item = result.data[0]
    expect(item.rrdId).toBe(2002)
    expect(item.nmId).toBe(77777)
    expect(item.acquiringFeeVat).toBe(6.0)
  })

  it('NaN guard: acquiringFee: NaN → null via Number.isFinite check', () => {
    const raw = makeRawDetailResponse({
      data: [makeRawDetailItem({ acquiring_fee: NaN })],
    })
    const result = normalizeAcquiringDetailResponse(raw)
    expect(result.data[0].acquiringFee).toBeNull()
  })

  it('missing cached_at in detail response → cachedAt is empty string', () => {
    const result = normalizeAcquiringDetailResponse({ data: [makeRawDetailItem()] })
    expect(result.cachedAt).toBe('')
  })

  it('empty data array normalizes to empty array without crash', () => {
    const result = normalizeAcquiringDetailResponse({ data: [], cached_at: '2026-04-13T10:00:00Z' })
    expect(result.data).toHaveLength(0)
    expect(result.cachedAt).toBe('2026-04-13T10:00:00Z')
  })
})
