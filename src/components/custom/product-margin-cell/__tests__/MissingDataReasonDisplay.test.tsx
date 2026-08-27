import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { MissingDataReasonDisplay } from '../MissingDataReasonDisplay'
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

vi.mock('../COGSNotAssignedContext', () => ({
  COGSNotAssignedContext: ({ product }: { product: ProductListItem }) => (
    <div data-testid="cogs-not-assigned">COGS context for {product.nm_id}</div>
  ),
}))

vi.mock('@/components/custom/HistoricalMarginContext', () => ({
  HistoricalMarginContext: ({ nmId }: { nmId: string }) => (
    <div data-testid="historical-margin">Historical margin for {nmId}</div>
  ),
}))

const baseProduct: ProductListItem = {
  nm_id: '12345',
  sa_name: 'Test Product',
  has_cogs: false,
  last_sale_date: null,
  total_sales_qty: 0,
}

describe('MissingDataReasonDisplay', () => {
  it('shows "no sales" text for NO_SALES_IN_PERIOD', () => {
    render(
      <MissingDataReasonDisplay
        product={{ ...baseProduct, missing_data_reason: 'NO_SALES_IN_PERIOD' }}
        enableMarginDisplay={true}
      />
    )
    expect(screen.getByText('(нет продаж за неделю)')).toBeInTheDocument()
  })

  it('shows "unavailable" text for ANALYTICS_UNAVAILABLE', () => {
    render(
      <MissingDataReasonDisplay
        product={{ ...baseProduct, missing_data_reason: 'ANALYTICS_UNAVAILABLE' }}
        enableMarginDisplay={true}
      />
    )
    expect(screen.getByText('(недоступно)')).toBeInTheDocument()
  })

  it('renders HistoricalMarginContext for NO_SALES_DATA', () => {
    render(
      <MissingDataReasonDisplay
        product={{
          ...baseProduct,
          missing_data_reason: 'NO_SALES_DATA',
          current_margin_period: '2025-W46',
        }}
        enableMarginDisplay={true}
      />
    )
    expect(screen.getByTestId('historical-margin')).toBeInTheDocument()
  })

  it('renders COGSNotAssignedContext for COGS_NOT_ASSIGNED', () => {
    render(
      <MissingDataReasonDisplay
        product={{
          ...baseProduct,
          missing_data_reason: 'COGS_NOT_ASSIGNED',
        }}
        enableMarginDisplay={false}
      />
    )
    expect(screen.getByTestId('cogs-not-assigned')).toBeInTheDocument()
  })

  it('renders empty fallback for null reason', () => {
    const { container } = render(
      <MissingDataReasonDisplay
        product={{ ...baseProduct, missing_data_reason: null }}
        enableMarginDisplay={true}
      />
    )
    const div = container.querySelector('.text-muted-foreground')
    expect(div).toBeInTheDocument()
  })
})
