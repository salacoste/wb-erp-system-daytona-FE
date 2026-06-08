import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { SupplyMetricsBar } from '../SupplyMetricsBar'
import type { SupplyPlanningSummary } from '@/types/supply-planning'

vi.mock('@/lib/supply-planning-utils', () => ({
  formatReorderValue: vi.fn((v: number | null) => {
    if (v == null || v === 0) return '—'
    return `${v.toLocaleString('ru-RU')} ₽`
  }),
}))

const mockSummary: SupplyPlanningSummary = {
  total_skus: 50,
  out_of_stock_count: 3,
  stockout_critical: 7,
  stockout_warning: 12,
  stockout_low: 8,
  healthy_stock: 20,
  total_reorder_value: 500000,
  total_in_transit_units: 150,
  reorder_urgent: 10,
  reorder_soon: 5,
}

describe('SupplyMetricsBar', () => {
  it('renders "Требуют внимания" with correct at-risk count', () => {
    render(<SupplyMetricsBar summary={mockSummary} />)
    // totalAtRisk = out_of_stock(3) + critical(7) + warning(12) = 22
    expect(screen.getByText('22 SKU')).toBeInTheDocument()
    // urgentCount = out_of_stock(3) + critical(7) = 10
    expect(screen.getByText('(10 срочно)')).toBeInTheDocument()
  })

  it('renders "Требуется капитал" section', () => {
    render(<SupplyMetricsBar summary={mockSummary} />)
    expect(screen.getByText('Требуется капитал')).toBeInTheDocument()
  })

  it('renders "В пути" section with in-transit units', () => {
    render(<SupplyMetricsBar summary={mockSummary} />)
    expect(screen.getByText('В пути')).toBeInTheDocument()
    expect(screen.getByText(/150/)).toBeInTheDocument()
  })

  it('shows green color when urgent count is low', () => {
    const lowSummary: SupplyPlanningSummary = {
      ...mockSummary,
      out_of_stock_count: 1,
      stockout_critical: 2,
    }
    render(<SupplyMetricsBar summary={lowSummary} />)
    // urgentCount = 3 → green
    const urgentEl = screen.getByText('15 SKU') // 1+2+12 = 15
    expect(urgentEl.className).toContain('text-green-600')
  })

  it('shows orange color when urgent count is 6-10', () => {
    const medSummary: SupplyPlanningSummary = {
      ...mockSummary,
      out_of_stock_count: 3,
      stockout_critical: 4,
    }
    render(<SupplyMetricsBar summary={medSummary} />)
    // urgentCount = 7 → orange
    const urgentEl = screen.getByText('19 SKU') // 3+4+12 = 19
    expect(urgentEl.className).toContain('text-orange-600')
  })

  it('shows red color when urgent count > 10', () => {
    const highSummary: SupplyPlanningSummary = {
      ...mockSummary,
      out_of_stock_count: 6,
      stockout_critical: 7,
    }
    render(<SupplyMetricsBar summary={highSummary} />)
    // urgentCount = 13 > 10 → red
    const urgentEl = screen.getByText('25 SKU') // 6+7+12 = 25
    expect(urgentEl.className).toContain('text-red-600')
  })

  it('renders all three metric sections', () => {
    render(<SupplyMetricsBar summary={mockSummary} />)
    expect(screen.getByText('Требуют внимания')).toBeInTheDocument()
    expect(screen.getByText('Требуется капитал')).toBeInTheDocument()
    expect(screen.getByText('В пути')).toBeInTheDocument()
  })
})
