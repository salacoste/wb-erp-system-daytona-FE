import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { TopProductsTableRow } from '../TopProductsTableRow'
import type { TopProductItem } from '@/types/analytics'

// Mock formatting utils — absolute path to match component's import resolution
vi.mock('@/components/custom/top-table-utils', () => ({
  formatCurrency: (value: number) => `${value.toLocaleString('ru-RU')} ₽`,
  formatPercent: (value: number | null) => (value === null ? '—' : `${value}%`),
  getMarginColor: (margin: number | null) => {
    if (margin === null) return 'text-gray-400'
    if (margin >= 30) return 'text-green-600'
    if (margin >= 15) return 'text-yellow-600'
    if (margin >= 0) return 'text-orange-500'
    return 'text-red-600'
  },
}))

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

  it('calls onProductClick on row click', () => {
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
    screen.getByRole('button').click()
    expect(mockOnProductClick).toHaveBeenCalledWith('67890')
  })

  it('has accessible aria-label with product name', () => {
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
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'Перейти к товару Test Product Name'
    )
  })
})
