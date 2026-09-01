import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { TopProductsTableRow } from '../TopProductsTableRow'
import type { TopProductItem } from '@/types/analytics'

// Mock formatting utils — absolute path to match component's import resolution.
// getMarginColor is NOT overridden: the row consumes the canonical shared helper
// (Story 174.2 dedupe), pulled from the real module via importOriginal.
vi.mock('@/components/custom/top-table-utils', async importOriginal => {
  const actual = await importOriginal<typeof import('@/components/custom/top-table-utils')>()
  return {
    ...actual,
    formatCurrency: (value: number) => `${value.toLocaleString('ru-RU')} ₽`,
    formatPercent: (value: number | null) => (value === null ? '—' : `${value}%`),
  }
})

const baseProduct: TopProductItem = {
  nm_id: '67890',
  sa_name: 'Test Product Name',
  revenue_net: 50000,
  profit: 15000,
  margin_pct: 30,
  contribution_pct: 12.5,
}

describe('TopProductsTableRow', () => {
  const mockOnProductClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders product name and nm_id', () => {
    render(
      <table>
        <tbody>
          <TopProductsTableRow
            product={baseProduct}
            index={0}
            onProductClick={mockOnProductClick}
          />
        </tbody>
      </table>
    )
    expect(screen.getByText('Test Product Name')).toBeInTheDocument()
    expect(screen.getByText('67890')).toBeInTheDocument()
  })

  it('renders fallback name when sa_name is empty', () => {
    const noName = { ...baseProduct, sa_name: '' }
    render(
      <table>
        <tbody>
          <TopProductsTableRow product={noName} index={0} onProductClick={mockOnProductClick} />
        </tbody>
      </table>
    )
    expect(screen.getByText('Артикул 67890')).toBeInTheDocument()
  })

  it('renders row number (index + 1)', () => {
    render(
      <table>
        <tbody>
          <TopProductsTableRow
            product={baseProduct}
            index={2}
            onProductClick={mockOnProductClick}
          />
        </tbody>
      </table>
    )
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders formatted revenue and profit', () => {
    render(
      <table>
        <tbody>
          <TopProductsTableRow
            product={baseProduct}
            index={0}
            onProductClick={mockOnProductClick}
          />
        </tbody>
      </table>
    )
    expect(screen.getByText('50 000 ₽')).toBeInTheDocument()
    expect(screen.getByText('15 000 ₽')).toBeInTheDocument()
  })

  it('renders em dash for null profit', () => {
    const nullProfit = { ...baseProduct, profit: null }
    render(
      <table>
        <tbody>
          <TopProductsTableRow product={nullProfit} index={0} onProductClick={mockOnProductClick} />
        </tbody>
      </table>
    )
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('renders margin and contribution percentages', () => {
    render(
      <table>
        <tbody>
          <TopProductsTableRow
            product={baseProduct}
            index={0}
            onProductClick={mockOnProductClick}
          />
        </tbody>
      </table>
    )
    expect(screen.getByText('30%')).toBeInTheDocument()
    expect(screen.getByText('12.5%')).toBeInTheDocument()
  })

  it('renders em dash for null margin', () => {
    const nullMargin = { ...baseProduct, margin_pct: null }
    render(
      <table>
        <tbody>
          <TopProductsTableRow product={nullMargin} index={0} onProductClick={mockOnProductClick} />
        </tbody>
      </table>
    )
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('keeps pointer row activation as a convenience action', () => {
    render(
      <table>
        <tbody>
          <TopProductsTableRow
            product={baseProduct}
            index={0}
            onProductClick={mockOnProductClick}
          />
        </tbody>
      </table>
    )
    screen.getByText('50 000 ₽').click()
    expect(mockOnProductClick).toHaveBeenCalledTimes(1)
    expect(mockOnProductClick).toHaveBeenCalledWith('67890')
  })

  it('activates the exact product from a real focused button while preserving native row cells', async () => {
    const user = userEvent.setup()
    render(
      <table>
        <tbody>
          <TopProductsTableRow
            product={baseProduct}
            index={0}
            onProductClick={mockOnProductClick}
          />
        </tbody>
      </table>
    )
    const action = screen.getByRole('button', { name: 'Перейти к товару Test Product Name' })
    const row = action.closest('tr')
    expect(row).toHaveRole('row')
    expect(row).not.toHaveAttribute('role')
    expect(row).not.toHaveAttribute('tabindex')
    expect(row?.querySelectorAll('td')).toHaveLength(6)
    action.focus()
    expect(action).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(mockOnProductClick).toHaveBeenCalledTimes(1)
    expect(mockOnProductClick).toHaveBeenCalledWith('67890')
  })
})
