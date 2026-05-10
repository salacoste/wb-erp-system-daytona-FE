import { describe, it, expect } from 'vitest'
import { mergeDeliveryCosts } from '../useUnitEconomicsPageState'
import type { UnitEconomicsResponse } from '@/types/unit-economics'
import type { FcuBySkuItem } from '@/lib/api/shipment-cost/fcu-aggregation-api'

const baseCosts = {
  cogs: 30,
  commission: 10,
  logistics_delivery: 8,
  logistics_return: 2,
  storage: 5,
  paid_acceptance: 1,
  penalties: 0.5,
  other_deductions: 1,
  advertising: 3,
  delivery_to_warehouse: null, // Story 96.4-FE: nullable typing
}

function makeUeResponse(items: Partial<UnitEconomicsResponse['data'][0]>[]): UnitEconomicsResponse {
  return {
    meta: {
      week: '2026-W10',
      cabinet_id: 'cab-1',
      view_by: 'sku',
      generated_at: '',
      cost_category_order: [
        'cogs',
        'delivery_to_warehouse',
        'commission',
        'logistics_delivery',
        'logistics_return',
        'storage',
        'paid_acceptance',
        'penalties',
        'other_deductions',
        'advertising',
      ],
    },
    summary: {
      total_revenue: 1000,
      total_net_profit: 100,
      avg_cogs_pct: 30,
      avg_wb_fees_pct: 26,
      avg_net_margin_pct: 10,
      sku_count: 1,
      profitable_sku_count: 1,
      loss_making_sku_count: 0,
      missing_cogs_count: 0,
    },
    data: items.map(i => ({
      sku_id: '12345',
      product_name: 'Test',
      revenue: 1000,
      units_sold: 10,
      costs_pct: { ...baseCosts },
      costs_rub: { ...baseCosts },
      total_costs_pct: 60,
      net_margin_pct: 10,
      net_profit: 100,
      profitability_status: 'good' as const,
      has_cogs: true,
      ...i,
    })),
  }
}

const mockFcu: FcuBySkuItem[] = [
  {
    nmId: 12345,
    productName: 'Test',
    latestPcu: 150,
    latestDcu: 25,
    latestFcu: 175,
    shipmentId: 's-1',
    shipmentName: 'Ship 1',
    confirmedAt: '2026-03-10T00:00:00Z',
  },
]

describe('mergeDeliveryCosts', () => {
  it('merges delivery cost when SKU matches by nmId', () => {
    const ue = makeUeResponse([{ sku_id: '12345', revenue: 1000, units_sold: 10 }])
    const result = mergeDeliveryCosts(ue, mockFcu)
    // DCU=25, units=10 → deliveryRub=250, deliveryPct=(250/1000)*100=25
    expect(result.data[0].costs_rub.delivery_to_warehouse).toBe(250)
    expect(result.data[0].costs_pct.delivery_to_warehouse).toBe(25)
  })

  it('skips items with no matching FCU', () => {
    const ue = makeUeResponse([{ sku_id: '99999' }])
    const result = mergeDeliveryCosts(ue, mockFcu)
    expect(result.data[0].costs_rub.delivery_to_warehouse).toBeNull() // Story 96.4-FE: nullable typing — `null` represents "no FCU match" / "no shipment data"
    expect(result.data[0].costs_pct.delivery_to_warehouse).toBeNull() // Story 96.4-FE: nullable typing — `null` represents "no FCU match" / "no shipment data"
  })

  it('skips items with zero units_sold', () => {
    const ue = makeUeResponse([{ sku_id: '12345', units_sold: 0 }])
    const result = mergeDeliveryCosts(ue, mockFcu)
    expect(result.data[0].costs_rub.delivery_to_warehouse).toBeNull() // Story 96.4-FE: nullable typing — `null` represents "no FCU match" / "no shipment data"
  })

  it('skips items with undefined units_sold', () => {
    const ue = makeUeResponse([{ sku_id: '12345', units_sold: undefined }])
    const result = mergeDeliveryCosts(ue, mockFcu)
    expect(result.data[0].costs_rub.delivery_to_warehouse).toBeNull() // Story 96.4-FE: nullable typing — `null` represents "no FCU match" / "no shipment data"
  })

  it('skips items with zero revenue', () => {
    const ue = makeUeResponse([{ sku_id: '12345', revenue: 0, units_sold: 10 }])
    const result = mergeDeliveryCosts(ue, mockFcu)
    expect(result.data[0].costs_rub.delivery_to_warehouse).toBeNull() // Story 96.4-FE: nullable typing — `null` represents "no FCU match" / "no shipment data"
  })

  it('handles empty FCU array gracefully', () => {
    const ue = makeUeResponse([{ sku_id: '12345' }])
    const result = mergeDeliveryCosts(ue, [])
    expect(result.data[0].costs_rub.delivery_to_warehouse).toBeNull() // Story 96.4-FE: nullable typing — `null` represents "no FCU match" / "no shipment data"
  })

  it('preserves original data when no FCU matches', () => {
    const ue = makeUeResponse([{ sku_id: '12345' }])
    const result = mergeDeliveryCosts(ue, [])
    expect(result.data[0].revenue).toBe(1000)
    expect(result.data[0].costs_rub.cogs).toBe(30)
    expect(result.summary).toBe(ue.summary)
    expect(result.meta).toBe(ue.meta)
  })

  it('handles DCU of zero correctly (valid data, not missing)', () => {
    const zeroDcuFcu: FcuBySkuItem[] = [{ ...mockFcu[0], latestDcu: 0 }]
    const ue = makeUeResponse([{ sku_id: '12345', revenue: 1000, units_sold: 10 }])
    const result = mergeDeliveryCosts(ue, zeroDcuFcu)
    // DCU=0 → deliveryRub=0, deliveryPct=0 — this is valid data (zero cost)
    expect(result.data[0].costs_rub.delivery_to_warehouse).toBe(0)
    expect(result.data[0].costs_pct.delivery_to_warehouse).toBe(0)
  })

  it('M2-2 (Story 96.10 2nd-pass review): fcu exists but units_sold=0 — latestFcu/Dcu still propagated, delivery cost skipped', () => {
    // M2-2 fix: the old early-return `if (!fcu || !units_sold || revenue<=0) return item`
    // dropped latestFcu/Dcu when fcu existed but units_sold was 0.
    // New shape: always spread latestFcu/Dcu when fcu entry exists; skip arithmetic only.
    const ue = makeUeResponse([{ sku_id: '12345', revenue: 1000, units_sold: 0 }])
    const result = mergeDeliveryCosts(ue, mockFcu)
    // delivery cost NOT computed (units_sold=0 is unsafe for arithmetic)
    expect(result.data[0].costs_rub.delivery_to_warehouse).toBeNull()
    expect(result.data[0].costs_pct.delivery_to_warehouse).toBeNull()
    // latestFcu/Dcu propagated from fcu map entry (null-vs-undefined invariant preserved)
    expect(result.data[0].latestFcu).toBe(175)
    expect(result.data[0].latestDcu).toBe(25)
  })

  it('L-2 (Story 96.10 1st-pass review): null DCU — propagates latestFcu/latestDcu as null, skips delivery cost computation', () => {
    // H-1 fix: FcuBySkuItem.latestDcu is now number | null (boundary normalizer).
    // When backend returns null DCU (no confirmed shipment data), the merge must
    // NOT attempt arithmetic and must propagate null values end-to-end (anti-pattern #8).
    const nullDcuFcu: FcuBySkuItem[] = [{ ...mockFcu[0], latestDcu: null, latestFcu: null }]
    const ue = makeUeResponse([{ sku_id: '12345', revenue: 1000, units_sold: 10 }])
    const result = mergeDeliveryCosts(ue, nullDcuFcu)
    // delivery_to_warehouse NOT computed — stays null (preserving original unset value)
    expect(result.data[0].costs_rub.delivery_to_warehouse).toBeNull()
    expect(result.data[0].costs_pct.delivery_to_warehouse).toBeNull()
    // latestFcu/latestDcu propagated as null (not undefined, not 0)
    expect(result.data[0].latestFcu).toBeNull()
    expect(result.data[0].latestDcu).toBeNull()
  })
})
