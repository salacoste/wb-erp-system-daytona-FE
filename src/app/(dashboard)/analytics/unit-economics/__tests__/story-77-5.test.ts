import { describe, it, expect, vi } from 'vitest'
import {
  mergeDeliveryCosts,
  deliveryNullsLastSort,
  computeDeliveryMetrics,
} from '../useUnitEconomicsPageState'
import { exportUnitEconomicsCsv } from '../unit-economics-csv-export'
import { calculateHealthScore } from '@/lib/unit-economics-utils'
import type { UnitEconomicsResponse, UnitEconomicsSummary } from '@/types/unit-economics'
import type { FcuBySkuItem } from '@/lib/api/shipment-cost/fcu-aggregation-api'

/* ── Shared fixtures ── */
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
      cabinet_id: 'c1',
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
      sku_id: '100',
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

const baseSummary: UnitEconomicsSummary = {
  total_revenue: 10000,
  total_net_profit: 2500,
  avg_cogs_pct: 30,
  avg_wb_fees_pct: 25,
  avg_net_margin_pct: 25,
  sku_count: 10,
  profitable_sku_count: 10,
  loss_making_sku_count: 0,
  missing_cogs_count: 0,
}

/* ── deliveryNullsLastSort (M2: tests actual exported function) ── */
describe('deliveryNullsLastSort', () => {
  it('sorts items desc with nulls at end', () => {
    const items = [
      { sku_id: 'A', costs_pct: { ...baseCosts, delivery_to_warehouse: 5 } },
      { sku_id: 'B', costs_pct: { ...baseCosts } },
      { sku_id: 'C', costs_pct: { ...baseCosts, delivery_to_warehouse: 15 } },
    ]
    const data = makeUeResponse(items)
    const sorted = [...data.data].sort((a, b) => deliveryNullsLastSort(a, b, 'desc'))
    expect(sorted[0].sku_id).toBe('C')
    expect(sorted[1].sku_id).toBe('A')
    expect(sorted[2].sku_id).toBe('B')
  })

  it('sorts items asc with nulls at end', () => {
    const items = [
      { sku_id: 'A', costs_pct: { ...baseCosts } },
      { sku_id: 'B', costs_pct: { ...baseCosts, delivery_to_warehouse: 12 } },
      { sku_id: 'C', costs_pct: { ...baseCosts, delivery_to_warehouse: 3 } },
    ]
    const data = makeUeResponse(items)
    const sorted = [...data.data].sort((a, b) => deliveryNullsLastSort(a, b, 'asc'))
    expect(sorted[0].sku_id).toBe('C')
    expect(sorted[1].sku_id).toBe('B')
    expect(sorted[2].sku_id).toBe('A')
  })
})

/* ── computeDeliveryMetrics (M2: tests actual exported function) ── */
describe('computeDeliveryMetrics', () => {
  it('computes average delivery cost per unit', () => {
    const fcu: FcuBySkuItem[] = [
      {
        nmId: 100,
        productName: 'T',
        latestPcu: 50,
        latestDcu: 20,
        latestFcu: 70,
        shipmentId: 's1',
        shipmentName: 'S1',
        confirmedAt: '2026-03-10',
      },
    ]
    const merged = mergeDeliveryCosts(
      makeUeResponse([{ sku_id: '100', revenue: 1000, units_sold: 10 }]),
      fcu
    )
    const result = computeDeliveryMetrics(merged.data)
    expect(result.avgDeliveryCost).toBe(20)
    expect(result.deliverySkuCount).toBe(1)
  })

  it('returns undefined avg when no delivery data', () => {
    const result = computeDeliveryMetrics(makeUeResponse([{ sku_id: '100' }]).data)
    expect(result.avgDeliveryCost).toBeUndefined()
    expect(result.deliverySkuCount).toBe(0)
  })

  it('computes coverage ratio correctly', () => {
    const fcu: FcuBySkuItem[] = [
      {
        nmId: 100,
        productName: 'T',
        latestPcu: 50,
        latestDcu: 10,
        latestFcu: 60,
        shipmentId: 's1',
        shipmentName: 'S1',
        confirmedAt: '2026-03-10',
      },
    ]
    const merged = mergeDeliveryCosts(
      makeUeResponse([
        { sku_id: '100', revenue: 500, units_sold: 5 },
        { sku_id: '200', revenue: 300, units_sold: 3 },
      ]),
      fcu
    )
    const result = computeDeliveryMetrics(merged.data)
    expect(result.deliveryCoverageRatio).toBe(0.5)
  })
})

/* ── calculateHealthScore with delivery coverage ── */
describe('calculateHealthScore (Story 77.5 rebalanced)', () => {
  it('returns 100 for excellent portfolio with full delivery coverage', () => {
    expect(calculateHealthScore(baseSummary, 0.9)).toBe(100)
  })
  it('returns 90 without delivery data (no bonus)', () => {
    expect(calculateHealthScore(baseSummary)).toBe(90)
  })
  it('adds 5 points for coverage >0.5 ≤0.8', () => {
    expect(calculateHealthScore(baseSummary, 0.6)).toBe(95)
  })
  it('adds 10 points for coverage >0.8', () => {
    expect(calculateHealthScore(baseSummary, 0.85)).toBe(100)
  })
  it('adds 0 points for coverage ≤0.5', () => {
    expect(calculateHealthScore(baseSummary, 0.3)).toBe(90)
  })
  it('margin 15-25% gets 26 points', () => {
    expect(calculateHealthScore({ ...baseSummary, avg_net_margin_pct: 20 })).toBe(81)
  })
  it('margin 5-15% gets 18 points', () => {
    expect(calculateHealthScore({ ...baseSummary, avg_net_margin_pct: 10 })).toBe(73)
  })
  it('caps at 100', () => {
    expect(calculateHealthScore(baseSummary, 1.0)).toBeLessThanOrEqual(100)
  })
})

/* ── CSV export: delivery column + quote escaping (H1, M3) ── */
describe('exportUnitEconomicsCsv', () => {
  let capturedCsv = ''
  const mockLink = { href: '', download: '', click: vi.fn() }
  const OrigBlob = globalThis.Blob

  beforeEach(() => {
    capturedCsv = ''
    mockLink.href = ''
    mockLink.download = ''
    mockLink.click.mockClear()
    globalThis.Blob = class MockBlob extends OrigBlob {
      constructor(parts?: BlobPart[], options?: BlobPropertyBag) {
        super(parts, options)
        if (parts) capturedCsv = parts.map(String).join('')
      }
    } as typeof Blob
    URL.createObjectURL = vi.fn(() => 'blob:mock')
    URL.revokeObjectURL = vi.fn()
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLElement)
  })
  afterEach(() => {
    globalThis.Blob = OrigBlob
    vi.restoreAllMocks()
  })

  it('produces CSV with delivery column and escaped quotes', () => {
    const data = makeUeResponse([
      {
        sku_id: '100',
        product_name: 'Widget "Pro"',
        costs_pct: { ...baseCosts, delivery_to_warehouse: 5.5 },
      },
    ])
    exportUnitEconomicsCsv(data, '2026-W10')

    expect(capturedCsv).toContain('Доставка на склад %')
    expect(capturedCsv).toContain('"5.5"')
    expect(capturedCsv).toContain('Widget ""Pro""')
    expect(mockLink.download).toBe('unit-economics-2026-W10.csv')
  })

  it('renders em dash for missing delivery data', () => {
    exportUnitEconomicsCsv(makeUeResponse([{ sku_id: '100' }]), '2026-W10')
    expect(capturedCsv).toContain('"—"')
  })

  it('prepends a UTF-8 BOM so Excel (RU/Windows) detects UTF-8, not CP1251', () => {
    exportUnitEconomicsCsv(makeUeResponse([{ sku_id: '100' }]), '2026-W10')
    expect(capturedCsv.charCodeAt(0)).toBe(0xfeff)
    expect(capturedCsv).toContain('Выручка') // Cyrillic header intact after the BOM
  })

  it('neutralizes a formula-injection product_name (OWASP CSV injection)', () => {
    const data = makeUeResponse([{ sku_id: '100', product_name: '=HYPERLINK("http://x")' }])
    exportUnitEconomicsCsv(data, '2026-W10')
    // the leading "=" is defanged with a "'" so Excel does not evaluate it
    expect(capturedCsv).toContain('"\'=HYPERLINK')
    expect(capturedCsv).not.toContain('"=HYPERLINK')
  })
})
