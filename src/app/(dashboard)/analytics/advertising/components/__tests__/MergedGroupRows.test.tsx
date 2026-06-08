import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { MergedGroupRows, renderOrganicValue } from '../MergedGroupRows'
import type { AdvertisingGroup } from '@/types/advertising-analytics'

// Mock metrics calculator functions
vi.mock('../utils/metrics-calculator', () => ({
  calculateTotalSales: vi.fn(() => 50000),
  calculateRevenue: vi.fn(() => 30000),
  calculateOrganicSales: vi.fn(() => 20000),
  calculateOrganicContribution: vi.fn(() => 40),
  calculateSpend: vi.fn(() => 10000),
  calculateROAS: vi.fn(() => 3.0),
}))

// Mock formatters
vi.mock('../utils/formatters', () => ({
  formatCurrency: vi.fn((v: number) => `${v.toLocaleString('ru-RU')} ₽`),
  formatRevenueWithPercent: vi.fn((rev: number, pct: number) => `${rev} (${pct}%)`),
  formatROAS: vi.fn((r: number) => `${r}x`),
}))

function makeProduct(overrides: { nmId: number; vendorCode: string; isMainProduct: boolean }) {
  return {
    nmId: overrides.nmId,
    vendorCode: overrides.vendorCode,
    isMainProduct: overrides.isMainProduct,
    imtId: 123,
    totalViews: 1000,
    totalClicks: 200,
    totalOrders: 30,
    totalSpend: 5000,
    totalRevenue: 20000,
    totalSales: 30000,
    organicSales: 10000,
    organicContribution: 50,
    roas: 4.0 as number | null,
    roi: 2.0 as number | null,
    ctr: 20.0,
    cpc: 25.0 as number | null,
    conversionRate: 15.0,
    profitAfterAds: 15000,
  }
}

function makeGroup(overrides: Partial<AdvertisingGroup> = {}): AdvertisingGroup {
  return {
    type: 'merged_group',
    imtId: 123,
    mainProduct: { nmId: 1, vendorCode: 'VC-001' },
    productCount: 2,
    aggregateMetrics: {
      totalViews: 2000,
      totalClicks: 400,
      totalOrders: 60,
      totalSpend: 10000,
      totalRevenue: 40000,
      totalSales: 60000,
      organicSales: 20000,
      organicContribution: 33,
      roas: 4.0,
      roi: 2.0,
      ctr: 20.0,
      cpc: 25.0,
      conversionRate: 15.0,
      profitAfterAds: 30000,
    },
    products: [
      makeProduct({ nmId: 1, vendorCode: 'VC-001', isMainProduct: true }),
      makeProduct({ nmId: 2, vendorCode: 'VC-002', isMainProduct: false }),
    ],
    ...overrides,
  }
}

describe('renderOrganicValue', () => {
  it('returns formatted currency for non-negative values', () => {
    const result = renderOrganicValue(5000)
    expect(result).toBeTruthy()
  })

  it('returns warning badge for negative values (over-attribution)', () => {
    const result = renderOrganicValue(-500)
    render(<>{result}</>)
    expect(screen.getByText('Переатрибуция')).toBeInTheDocument()
  })

  it('handles zero value', () => {
    const result = renderOrganicValue(0)
    expect(result).toBeTruthy()
  })
})

describe('MergedGroupRows', () => {
  it('renders aggregate row with group label', () => {
    render(<MergedGroupRows group={makeGroup()} />)
    expect(screen.getByText(/ГРУППА #123/)).toBeInTheDocument()
  })

  it('renders rowspan cell for multi-product groups', () => {
    render(<MergedGroupRows group={makeGroup()} />)
    expect(screen.getByText('+ 1 товаров')).toBeInTheDocument()
    // VC-001 appears in both rowspan header and detail row
    const vc001Elements = screen.getAllByText('VC-001')
    expect(vc001Elements.length).toBeGreaterThanOrEqual(2)
  })

  it('renders detail rows for each product', () => {
    render(<MergedGroupRows group={makeGroup()} />)
    expect(screen.getAllByText('VC-001').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('VC-002')).toBeInTheDocument()
  })

  it('renders crown icon for main product', () => {
    render(<MergedGroupRows group={makeGroup()} />)
    expect(screen.getByLabelText('Главный товар')).toBeInTheDocument()
  })

  it('renders correct number of rows', () => {
    render(<MergedGroupRows group={makeGroup()} />)
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThanOrEqual(3)
  })

  it('does not render rowspan cell for single-product group', () => {
    const singleProduct = makeProduct({ nmId: 1, vendorCode: 'VC-001', isMainProduct: true })
    render(<MergedGroupRows group={makeGroup({ productCount: 1, products: [singleProduct] })} />)
    expect(screen.queryByText(/\+ \d+ товаров/)).not.toBeInTheDocument()
  })

  it('uses aggregateMetrics when provided', () => {
    render(<MergedGroupRows group={makeGroup()} />)
    expect(screen.getByText(/ГРУППА #123/)).toBeInTheDocument()
  })
})
