import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import userEvent from '@testing-library/user-event'
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

  it('keeps pointer row activation as a convenience action', () => {
    render(
      <table>
        <tbody>
          <TopBrandsTableRow brand={baseBrand} index={0} onBrandClick={mockOnBrandClick} />
        </tbody>
      </table>
    )
    screen.getByText('100 000 ₽').click()
    expect(mockOnBrandClick).toHaveBeenCalledTimes(1)
    expect(mockOnBrandClick).toHaveBeenCalledWith('TestBrand')
  })

  it('activates the exact brand from a real focused button while preserving native row cells', async () => {
    const user = userEvent.setup()
    render(
      <table>
        <tbody>
          <TopBrandsTableRow brand={baseBrand} index={0} onBrandClick={mockOnBrandClick} />
        </tbody>
      </table>
    )
    const action = screen.getByRole('button', { name: 'Фильтровать по бренду TestBrand' })
    const row = action.closest('tr')
    expect(row).toHaveRole('row')
    expect(row).not.toHaveAttribute('role')
    expect(row).not.toHaveAttribute('tabindex')
    expect(row?.querySelectorAll('td')).toHaveLength(5)
    action.focus()
    expect(action).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(mockOnBrandClick).toHaveBeenCalledTimes(1)
    expect(mockOnBrandClick).toHaveBeenCalledWith('TestBrand')
  })
})
