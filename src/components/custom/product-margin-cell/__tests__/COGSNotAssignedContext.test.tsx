import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { COGSNotAssignedContext } from '../COGSNotAssignedContext'
import type { ProductListItem } from '@/types/api'

vi.mock('@/lib/margin-helpers', () => ({
  getLastCompletedWeek: vi.fn(() => '2025-W46'),
  isCogsAfterLastCompletedWeek: vi.fn(() => false),
}))

vi.mock('@/lib/utils', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
  formatWeeksAgoShort: (weeks: number | null | undefined) =>
    weeks != null ? `${weeks} нед. назад` : '',
  formatPercentage: (value: number, decimals?: number) => `${value.toFixed(decimals ?? 1)} %`,
}))

vi.mock('@/hooks/useSingleCogsAssignment-utils', () => ({
  formatCogs: (value: string | number) => `${value} ₽`,
}))

const baseProduct: ProductListItem = {
  nm_id: '12345',
  sa_name: 'Test Product',
  has_cogs: false,
  last_sale_date: null,
  total_sales_qty: 0,
}

describe('COGSNotAssignedContext', () => {
  it('shows "Нет COGS" when product has no cogs at all', () => {
    render(<COGSNotAssignedContext product={baseProduct} enableMarginDisplay={true} />)
    expect(screen.getByText('Нет COGS')).toBeInTheDocument()
  })

  it('shows history link with correct href', () => {
    render(<COGSNotAssignedContext product={baseProduct} enableMarginDisplay={true} />)
    const link = screen.getByRole('link', { name: /История продаж/ })
    expect(link).toHaveAttribute('href', '/analytics/sku?nm_id=12345')
  })

  it('shows "Нет продаж" message when no historical data', () => {
    render(<COGSNotAssignedContext product={baseProduct} enableMarginDisplay={true} />)
    expect(screen.getByText('Нет продаж за последние 12 недель')).toBeInTheDocument()
  })

  it('shows historical sales data when available', () => {
    const product: ProductListItem = {
      ...baseProduct,
      last_sales_week: '2025-W44',
      last_sales_margin_pct: 25.5,
      last_sales_qty: 10,
      weeks_since_last_sale: 2,
    }
    render(<COGSNotAssignedContext product={product} enableMarginDisplay={true} />)
    expect(screen.getByText('W44')).toBeInTheDocument()
    expect(screen.getByText('10 шт')).toBeInTheDocument()
    expect(screen.getByText('2 нед. назад')).toBeInTheDocument()
  })

  it('hides margin when enableMarginDisplay is false', () => {
    const product: ProductListItem = {
      ...baseProduct,
      last_sales_week: '2025-W44',
      last_sales_margin_pct: 25.5,
      weeks_since_last_sale: 2,
    }
    render(<COGSNotAssignedContext product={product} enableMarginDisplay={false} />)
    expect(screen.queryByText('25.5 %')).not.toBeInTheDocument()
  })

  it('shows margin when enableMarginDisplay is true', () => {
    const product: ProductListItem = {
      ...baseProduct,
      last_sales_week: '2025-W44',
      last_sales_margin_pct: 25.5,
      weeks_since_last_sale: 2,
    }
    render(<COGSNotAssignedContext product={product} enableMarginDisplay={true} />)
    expect(screen.getByText('25.5 %')).toBeInTheDocument()
  })
})
