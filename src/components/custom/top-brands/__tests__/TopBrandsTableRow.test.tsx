import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { TopBrandsTableRow } from '../TopBrandsTableRow'
import type { TopBrandItem } from '@/types/analytics'

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

const baseBrand: TopBrandItem = {
  brand: 'TestBrand',
  revenue_net: 100000,
  profit: 25000,
  margin_pct: 25,
}

describe('TopBrandsTableRow', () => {
  const mockOnBrandClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders brand name', () => {
    render(
      <table>
        <tbody>
          <TopBrandsTableRow brand={baseBrand} index={0} onBrandClick={mockOnBrandClick} />
        </tbody>
      </table>
    )
    expect(screen.getByText('TestBrand')).toBeInTheDocument()
  })

  it('renders "Без бренда" for empty brand name', () => {
    const noBrand = { ...baseBrand, brand: '' }
    render(
      <table>
        <tbody>
          <TopBrandsTableRow brand={noBrand} index={0} onBrandClick={mockOnBrandClick} />
        </tbody>
      </table>
    )
    expect(screen.getByText('Без бренда')).toBeInTheDocument()
  })

  it('renders row number (index + 1)', () => {
    render(
      <table>
        <tbody>
          <TopBrandsTableRow brand={baseBrand} index={4} onBrandClick={mockOnBrandClick} />
        </tbody>
      </table>
    )
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('renders formatted revenue and profit', () => {
    render(
      <table>
        <tbody>
          <TopBrandsTableRow brand={baseBrand} index={0} onBrandClick={mockOnBrandClick} />
        </tbody>
      </table>
    )
    expect(screen.getByText('100 000 ₽')).toBeInTheDocument()
    expect(screen.getByText('25 000 ₽')).toBeInTheDocument()
  })

  it('renders em dash for null profit', () => {
    const nullProfit = { ...baseBrand, profit: null }
    render(
      <table>
        <tbody>
          <TopBrandsTableRow brand={nullProfit} index={0} onBrandClick={mockOnBrandClick} />
        </tbody>
      </table>
    )
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('renders formatted margin percentage', () => {
    render(
      <table>
        <tbody>
          <TopBrandsTableRow brand={baseBrand} index={0} onBrandClick={mockOnBrandClick} />
        </tbody>
      </table>
    )
    expect(screen.getByText('25%')).toBeInTheDocument()
  })

  it('renders em dash for null margin', () => {
    const nullMargin = { ...baseBrand, margin_pct: null }
    render(
      <table>
        <tbody>
          <TopBrandsTableRow brand={nullMargin} index={0} onBrandClick={mockOnBrandClick} />
        </tbody>
      </table>
    )
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('calls onBrandClick on row click', async () => {
    render(
      <table>
        <tbody>
          <TopBrandsTableRow brand={baseBrand} index={0} onBrandClick={mockOnBrandClick} />
        </tbody>
      </table>
    )
    const row = screen.getByRole('button')
    row.click()
    expect(mockOnBrandClick).toHaveBeenCalledWith('TestBrand')
  })

  it('has accessible aria-label', () => {
    render(
      <table>
        <tbody>
          <TopBrandsTableRow brand={baseBrand} index={0} onBrandClick={mockOnBrandClick} />
        </tbody>
      </table>
    )
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'Фильтровать по бренду TestBrand'
    )
  })
})
