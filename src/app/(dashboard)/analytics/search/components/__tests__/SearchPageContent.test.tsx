import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { SearchPageContent } from '../SearchPageContent'

vi.mock('@/components/custom/jam/RequireJam', () => ({
  RequireJam: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/custom/DateRangePickerExtended', () => ({
  DateRangePickerExtended: ({ id }: { id: string }) => <div data-testid={id}>DateRangePicker</div>,
}))

vi.mock('../SearchSellerBadge', () => ({
  SearchSellerBadge: () => <span>Seller Badge</span>,
}))

vi.mock('../SearchOrdersTab', () => ({
  SearchOrdersTab: ({ from, to }: { from: string; to: string }) => (
    <div>
      OrdersTab: {from} - {to}
    </div>
  ),
}))

vi.mock('../SearchByProductTab', () => ({
  SearchByProductTab: ({ from, to }: { from: string; to: string }) => (
    <div>
      ByProductTab: {from} - {to}
    </div>
  ),
}))

vi.mock('../SearchByQueryTab', () => ({
  SearchByQueryTab: ({ from, to }: { from: string; to: string }) => (
    <div>
      ByQueryTab: {from} - {to}
    </div>
  ),
}))

vi.mock('../SearchPositionTrendsTab', () => ({
  SearchPositionTrendsTab: () => <div>PositionTrendsTab</div>,
}))

describe('SearchPageContent', () => {
  it('renders page title and description', () => {
    render(<SearchPageContent />)
    expect(screen.getByText('Поисковая аналитика')).toBeInTheDocument()
    expect(screen.getByText('Анализ поисковых запросов, позиций и заказов')).toBeInTheDocument()
  })

  it('renders seller badge', () => {
    render(<SearchPageContent />)
    expect(screen.getByText('Seller Badge')).toBeInTheDocument()
  })

  it('renders date range picker', () => {
    render(<SearchPageContent />)
    expect(screen.getByTestId('search-date-range')).toBeInTheDocument()
  })

  it('renders all four tab triggers', () => {
    render(<SearchPageContent />)
    expect(screen.getByText('Заказы')).toBeInTheDocument()
    expect(screen.getByText('По товарам')).toBeInTheDocument()
    expect(screen.getByText('По запросам')).toBeInTheDocument()
    expect(screen.getByText('Позиции')).toBeInTheDocument()
  })

  it('defaults to orders tab when no initialQuery', () => {
    render(<SearchPageContent />)
    // SearchOrdersTab is rendered in the orders tab content
    expect(screen.getByText(/OrdersTab:/)).toBeInTheDocument()
  })

  it('defaults to by-query tab when initialQuery is provided', () => {
    render(<SearchPageContent initialQuery="футболка" />)
    // The by-query tab is the default, so ByQueryTab should render
    expect(screen.getByText(/ByQueryTab:/)).toBeInTheDocument()
  })
})
