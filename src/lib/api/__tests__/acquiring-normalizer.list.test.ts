/**
 * Boundary Normalizer Tests — Story 90.1-FE
 * Split from acquiring-normalizer.test.ts after Story 90.1 review H-1 (236 lines → 2 files).
 * This file: normalizeAcquiringListResponse tests only. See .detail.test.ts for detail normalizer.
 */

import { describe, it, expect } from 'vitest'
import { normalizeAcquiringListResponse } from '../acquiring-normalizer'

// ---------------------------------------------------------------------------
// Fixture helpers (derived from test-api/34-acquiring-analytics.http §RESPONSE SAMPLES)
// ---------------------------------------------------------------------------

function makeRawListItem(overrides: Record<string, unknown> = {}) {
  return {
    report_id: 12345,
    seller_finance_name: 'ИП Иванов И.И.',
    date_from: '2026-04-01',
    date_to: '2026-04-07',
    create_date: '2026-04-08',
    currency: 'RUB',
    acquiring_fee_sum: 450.5,
    acquiring_fee_vat_sum: 90.1,
    ...overrides,
  }
}

function makeRawListResponse(overrides: Record<string, unknown> = {}) {
  return {
    data: [makeRawListItem()],
    cached_at: '2026-04-13T10:00:00Z',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// normalizeAcquiringListResponse
// ---------------------------------------------------------------------------

describe('normalizeAcquiringListResponse', () => {
  it('happy path: fully-populated snake_case response normalizes to typed shape', () => {
    const result = normalizeAcquiringListResponse(makeRawListResponse())
    expect(result.cachedAt).toBe('2026-04-13T10:00:00Z')
    expect(result.data).toHaveLength(1)
    const item = result.data[0]
    expect(item.reportId).toBe(12345)
    expect(item.sellerFinanceName).toBe('ИП Иванов И.И.')
    expect(item.dateFrom).toBe('2026-04-01')
    expect(item.dateTo).toBe('2026-04-07')
    expect(item.createDate).toBe('2026-04-08')
    expect(item.currency).toBe('RUB')
    expect(item.acquiringFeeSum).toBe(450.5)
    expect(item.acquiringFeeVatSum).toBe(90.1)
  })

  it('acquiringFeeSum: null is preserved as null (not coerced to 0)', () => {
    const raw = makeRawListResponse({
      data: [makeRawListItem({ acquiring_fee_sum: null })],
    })
    const result = normalizeAcquiringListResponse(raw)
    expect(result.data[0].acquiringFeeSum).toBeNull()
  })

  it('acquiringFeeVatSum: null is preserved as null', () => {
    const raw = makeRawListResponse({
      data: [makeRawListItem({ acquiring_fee_vat_sum: null })],
    })
    const result = normalizeAcquiringListResponse(raw)
    expect(result.data[0].acquiringFeeVatSum).toBeNull()
  })

  it('snake_case dual-lookup: report_id / date_from / acquiring_fee_sum all normalize correctly', () => {
    const raw = makeRawListResponse({
      data: [
        {
          report_id: 99001,
          seller_finance_name: 'ООО Тест',
          date_from: '2026-03-01',
          date_to: '2026-03-31',
          create_date: '2026-04-01',
          currency: 'RUB',
          acquiring_fee_sum: 999.99,
          acquiring_fee_vat_sum: 199.99,
        },
      ],
    })
    const result = normalizeAcquiringListResponse(raw)
    const item = result.data[0]
    expect(item.reportId).toBe(99001)
    expect(item.dateFrom).toBe('2026-03-01')
    expect(item.acquiringFeeSum).toBe(999.99)
  })

  it('NaN guard: acquiringFeeSum NaN → null via Number.isFinite check', () => {
    const raw = makeRawListResponse({
      data: [makeRawListItem({ acquiring_fee_sum: NaN })],
    })
    const result = normalizeAcquiringListResponse(raw)
    expect(result.data[0].acquiringFeeSum).toBeNull()
  })

  it('string-number coercion: report_id as string "12345" → reportId number 12345', () => {
    const raw = makeRawListResponse({
      data: [makeRawListItem({ report_id: '12345' })],
    })
    const result = normalizeAcquiringListResponse(raw)
    expect(result.data[0].reportId).toBe(12345)
    expect(typeof result.data[0].reportId).toBe('number')
  })

  it('missing cached_at → cachedAt is empty string', () => {
    const result = normalizeAcquiringListResponse({ data: [makeRawListItem()] })
    expect(result.cachedAt).toBe('')
  })

  it('empty data array normalizes to empty array without crash', () => {
    const result = normalizeAcquiringListResponse({ data: [], cached_at: '2026-04-13T10:00:00Z' })
    expect(result.data).toHaveLength(0)
    expect(result.cachedAt).toBe('2026-04-13T10:00:00Z')
  })
})
