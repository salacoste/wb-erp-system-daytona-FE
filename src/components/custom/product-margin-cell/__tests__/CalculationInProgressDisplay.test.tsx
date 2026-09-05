import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { CalculationInProgressDisplay } from '../CalculationInProgressDisplay'
import type { ProductListItem } from '@/types/api'

// Mock dependencies
const mockIsCogsAfterLastCompletedWeek = vi.fn()
vi.mock('@/lib/margin-helpers', () => ({
  getLastCompletedWeek: vi.fn(() => '2025-W46'),
  isCogsAfterLastCompletedWeek: () => mockIsCogsAfterLastCompletedWeek(),
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector?: (state: { user: { role: string } }) => unknown) => {
    const state = { user: { role: 'Owner' } }
    return selector ? selector(state) : state
  }),
}))

vi.mock('../COGSNotAssignedContext', () => ({
  COGSNotAssignedContext: ({ product }: { product: ProductListItem }) => (
    <div data-testid="cogs-context">COGS for {product.nm_id}</div>
  ),
}))

const baseProduct: ProductListItem = {
  nm_id: '12345',
  sa_name: 'Test Product',
  has_cogs: true,
  cogs: {
    id: '1',
    unit_cost_rub: '500',
    valid_from: '2025-W46',
    valid_to: null,
  },
  last_sale_date: null,
  total_sales_qty: 0,
}

describe('CalculationInProgressDisplay', () => {
  const defaultProps = {
    shouldShowRetryButton: vi.fn(() => false),
    getAffectedWeeks: vi.fn(() => ['2025-W46']),
    triggerRecalculation: vi.fn(),
    isRecalculating: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders calculation in progress text for valid COGS', () => {
    mockIsCogsAfterLastCompletedWeek.mockReturnValue(false)
    render(<CalculationInProgressDisplay product={baseProduct} {...defaultProps} />)
    expect(screen.getByText('(расчёт маржи...)')).toBeInTheDocument()
  })

  it('renders COGSNotAssignedContext when COGS is from future', () => {
    mockIsCogsAfterLastCompletedWeek.mockReturnValue(true)
    render(<CalculationInProgressDisplay product={baseProduct} {...defaultProps} />)
    expect(screen.getByTestId('cogs-context')).toBeInTheDocument()
  })

  it('shows retry button when allowed and user has permission', () => {
    mockIsCogsAfterLastCompletedWeek.mockReturnValue(false)
    const shouldShowRetryButton = vi.fn(() => true)
    render(
      <CalculationInProgressDisplay
        product={baseProduct}
        {...defaultProps}
        shouldShowRetryButton={shouldShowRetryButton}
      />
    )
    expect(screen.getByText('Пересчитать вручную')).toBeInTheDocument()
  })

  it('hides retry button when shouldShowRetryButton returns false', () => {
    mockIsCogsAfterLastCompletedWeek.mockReturnValue(false)
    render(
      <CalculationInProgressDisplay
        product={baseProduct}
        {...defaultProps}
        shouldShowRetryButton={vi.fn(() => false)}
      />
    )
    expect(screen.queryByText('Пересчитать вручную')).not.toBeInTheDocument()
  })

  it('disables retry button when recalculating', () => {
    mockIsCogsAfterLastCompletedWeek.mockReturnValue(false)
    render(
      <CalculationInProgressDisplay
        product={baseProduct}
        {...defaultProps}
        shouldShowRetryButton={vi.fn(() => true)}
        isRecalculating={true}
      />
    )
    const button = screen.getByRole('button', { name: /Пересчитать/ })
    expect(button).toBeDisabled()
  })

  it('retry button keeps full warn text, drops hover-darken (p2-80-sweep)', () => {
    // Measured hover (before): warn/80 over row-hover > hover-bg warn/10
    // = 2.95:1 light (FAIL 4.5). Remediation: ghost default accent pair on
    // hover (accent-fg on accent = 14.77/14.50 PASS); base = 4.61/12.14 PASS.
    mockIsCogsAfterLastCompletedWeek.mockReturnValue(false)
    render(
      <CalculationInProgressDisplay
        product={baseProduct}
        {...defaultProps}
        shouldShowRetryButton={vi.fn(() => true)}
      />
    )
    const button = screen.getByRole('button', { name: /Пересчитать/ })
    expect(button).toHaveClass('text-status-warning')
    expect(button.className).not.toContain('/80')
    expect(button.className).not.toContain('hover:bg-status-warning')
  })
})
