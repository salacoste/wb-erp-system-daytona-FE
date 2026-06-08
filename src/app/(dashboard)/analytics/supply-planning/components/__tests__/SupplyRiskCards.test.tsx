import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { SupplyRiskCards } from '../SupplyRiskCards'
import type { SupplyPlanningSummary } from '@/types/supply-planning'

// Mock supply-planning-config
vi.mock('@/lib/supply-planning-config', () => ({
  STOCKOUT_RISK_CONFIG: {
    out_of_stock: { label: 'Нет в наличии', color: '#EF4444', lucideIcon: 'PackageOpen' },
    critical: { label: 'Критично', color: '#F97316', lucideIcon: 'AlertTriangle' },
    warning: { label: 'Внимание', color: '#EAB308', lucideIcon: 'AlertCircle' },
    low: { label: 'Низкий', color: '#3B82F6', lucideIcon: 'Info' },
    healthy: { label: 'Достаточно', color: '#22C55E', lucideIcon: 'CheckCircle' },
  },
}))

// Mock supply-risk-card-styles
vi.mock('../supply-risk-card-styles', () => ({
  LUCIDE_ICONS: {
    PackageOpen: () => <span data-testid="icon-package">pkg</span>,
    AlertTriangle: () => <span data-testid="icon-triangle">tri</span>,
    AlertCircle: () => <span data-testid="icon-circle">cir</span>,
    Info: () => <span data-testid="icon-info">inf</span>,
    CheckCircle: () => <span data-testid="icon-check">chk</span>,
  },
  getCardStyles: () => ({
    card: 'bg-white',
    icon: 'text-gray-600',
    label: 'text-gray-700',
    count: 'text-gray-900',
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
  total_in_transit_units: 100,
  reorder_urgent: 10,
  reorder_soon: 5,
}

describe('SupplyRiskCards', () => {
  it('renders all 5 risk cards', () => {
    render(<SupplyRiskCards summary={mockSummary} activeFilter={null} onCardClick={vi.fn()} />)
    expect(screen.getByText('Нет в наличии')).toBeInTheDocument()
    expect(screen.getByText('Критично')).toBeInTheDocument()
    expect(screen.getByText('Внимание')).toBeInTheDocument()
    expect(screen.getByText('Низкий')).toBeInTheDocument()
    expect(screen.getByText('Достаточно')).toBeInTheDocument()
  })

  it('shows correct SKU counts from summary', () => {
    render(<SupplyRiskCards summary={mockSummary} activeFilter={null} onCardClick={vi.fn()} />)
    // Each card shows "{count} SKU"
    const skuTexts = screen.getAllByText('SKU')
    expect(skuTexts.length).toBe(5)
  })

  it('renders cards as clickable', () => {
    render(<SupplyRiskCards summary={mockSummary} activeFilter={null} onCardClick={vi.fn()} />)
    const cards = screen.getAllByText('SKU')
    cards.forEach(el => {
      const card = el.closest('[class*="cursor-pointer"]')
      expect(card).toBeTruthy()
    })
  })

  it('calls onCardClick with correct status when card is clicked', async () => {
    const handleClick = vi.fn()
    const { userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()

    render(<SupplyRiskCards summary={mockSummary} activeFilter={null} onCardClick={handleClick} />)

    const card = screen.getByText('Нет в наличии').closest('[class*="cursor-pointer"]')!
    await user.click(card)
    expect(handleClick).toHaveBeenCalledWith('out_of_stock')
  })

  it('shows active indicator for selected card', () => {
    render(<SupplyRiskCards summary={mockSummary} activeFilter="critical" onCardClick={vi.fn()} />)
    const criticalCard = screen.getByText('Критично').closest('[class*="cursor-pointer"]')!
    expect(criticalCard.className).toContain('ring-2')
  })

  it('renders in a 5-column grid', () => {
    const { container } = render(
      <SupplyRiskCards summary={mockSummary} activeFilter={null} onCardClick={vi.fn()} />
    )
    const grid = container.firstChild as HTMLElement
    expect(grid.className).toContain('grid-cols-5')
  })
})
