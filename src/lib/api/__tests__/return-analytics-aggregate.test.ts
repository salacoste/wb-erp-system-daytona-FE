/**
 * return-analytics aggregateRawRecords (iter-127).
 * Raw classification records carry NO salesCount, so returnRate is UNKNOWN — it must be null,
 * NOT a hardcoded 0 (which ReturnRateCell colours green/"healthy", hiding a high-return SKU).
 */
import { describe, it, expect } from 'vitest'
import { aggregateRawRecords } from '../return-analytics'

describe('aggregateRawRecords — raw return records → per-SKU summary', () => {
  it('emits returnRate: null (not 0) and tallies categories per SKU', () => {
    const items = aggregateRawRecords([
      { nmId: 1, returnCategory: 'cancel_before_shipment' },
      { nmId: 1, returnCategory: 'return_after_receipt' },
      { nmId: 1, returnCategory: 'return_after_receipt' },
      { nmId: 2, returnCategory: 'refusal_at_pvz' },
    ])

    const sku1 = items.find(i => i.nmId === 1)!
    expect(sku1.totalReturns).toBe(3)
    expect(sku1.returnRate).toBeNull() // was hardcoded 0 → false "0,0 %" green
    expect(sku1.returnRate).not.toBe(0)
    expect(sku1.cancelBeforeShipment).toBe(1)
    expect(sku1.returnAfterReceipt).toBe(2)
    expect(sku1.refusalAtPvz).toBe(0)

    const sku2 = items.find(i => i.nmId === 2)!
    expect(sku2.totalReturns).toBe(1)
    expect(sku2.returnRate).toBeNull()
    expect(sku2.refusalAtPvz).toBe(1)
  })

  it('returns an empty array for no records', () => {
    expect(aggregateRawRecords([])).toEqual([])
  })
})
