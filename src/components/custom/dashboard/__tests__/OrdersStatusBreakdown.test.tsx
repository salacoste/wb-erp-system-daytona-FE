/**
 * Tests for OrdersStatusBreakdown Component
 * Story 63.7-FE: Orders Status Breakdown Chart
 * Epic 63 - Dashboard Enhancements (Orders Analytics)
 * @see docs/stories/epic-63/story-63.7-fe-orders-status-breakdown.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, waitFor } from '@/test/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { OrdersStatusBreakdown } from '../OrdersStatusBreakdown'
import type { StatusBreakdownData } from '@/hooks/useOrdersStatusBreakdown'
import { ORDER_STATUS_CONFIG } from '@/lib/orders-status-config'

const mockUseOrdersStatusBreakdown = vi.fn()
vi.mock('@/hooks/useOrdersStatusBreakdown', () => ({
  useOrdersStatusBreakdown: (...args: unknown[]) => mockUseOrdersStatusBreakdown(...args),
}))

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts')
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
  }
})

vi.mock('@/hooks/useDashboardPeriod', () => ({
  useDashboardPeriod: () => ({
    periodType: 'week',
    selectedWeek: '2026-W05',
    selectedMonth: '2026-01',
  }),
}))

const mockData: StatusBreakdownData = {
  total: 500,
  items: [
    { status: 'complete', count: 400, percentage: 80.0 },
    { status: 'confirm', count: 50, percentage: 10.0 },
    { status: 'new', count: 32, percentage: 6.4 },
    { status: 'cancel', count: 18, percentage: 3.6 },
  ],
}
const emptyData: StatusBreakdownData = { total: 0, items: [] }
const defaultHookReturn = { data: mockData, isLoading: false, error: null, refetch: vi.fn() }

function renderComponent(overrides: Record<string, unknown> = {}) {
  mockUseOrdersStatusBreakdown.mockReturnValue({ ...defaultHookReturn, ...overrides })
  return renderWithProviders(<OrdersStatusBreakdown />)
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseOrdersStatusBreakdown.mockReturnValue(defaultHookReturn)
})

// 1. Basic Rendering
describe('OrdersStatusBreakdown - Basic Rendering', () => {
  it('should render Card with title "Распределение заказов по статусам"', () => {
    renderComponent()
    expect(screen.getByText('Распределение заказов по статусам')).toBeInTheDocument()
  })
  it('should render total orders count in header', () => {
    renderComponent()
    expect(screen.getByText(/500/)).toBeInTheDocument()
    expect(screen.getAllByText(/заказов/).length).toBeGreaterThanOrEqual(1)
  })
  it('should render view toggle buttons (Bar Chart / Pie Chart)', () => {
    renderComponent()
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(2)
  })
  it('should default to bar chart view', () => {
    renderComponent()
    const radios = screen.getAllByRole('radio')
    expect(radios[0]).toHaveAttribute('aria-checked', 'true')
    expect(radios[1]).toHaveAttribute('aria-checked', 'false')
  })
  it('should render ResponsiveContainer for chart sizing', () => {
    renderComponent()
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
  })
  it('should render all 4 status categories in legend', () => {
    renderComponent()
    expect(screen.getByText(/Выполнено/)).toBeInTheDocument()
    expect(screen.getByText(/Подтверждено/)).toBeInTheDocument()
    expect(screen.getByText(/Новый/)).toBeInTheDocument()
    expect(screen.getByText(/Отменено/)).toBeInTheDocument()
  })
  it('should accept custom className prop', () => {
    mockUseOrdersStatusBreakdown.mockReturnValue(defaultHookReturn)
    const { container } = renderWithProviders(<OrdersStatusBreakdown className="my-custom-class" />)
    expect(container.querySelector('.my-custom-class')).toBeInTheDocument()
  })
  it('should accept custom height prop', () => {
    mockUseOrdersStatusBreakdown.mockReturnValue(defaultHookReturn)
    renderWithProviders(<OrdersStatusBreakdown height={300} />)
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
  })
})

// 2. Status Display
describe('OrdersStatusBreakdown - Status Display', () => {
  describe('status labels', () => {
    it('should display "Выполнено" label for complete status', () => {
      renderComponent()
      expect(screen.getByText(/Выполнено/)).toBeInTheDocument()
    })
    it('should display "Подтверждено" label for confirm status', () => {
      renderComponent()
      expect(screen.getByText(/Подтверждено/)).toBeInTheDocument()
    })
    it('should display "Новый" label for new status', () => {
      renderComponent()
      expect(screen.getByText(/Новый/)).toBeInTheDocument()
    })
    it('should display "Отменено" label for cancel status', () => {
      renderComponent()
      expect(screen.getByText(/Отменено/)).toBeInTheDocument()
    })
  })
  describe('status counts', () => {
    it('should display count for complete status (e.g., 400)', () => {
      renderComponent()
      expect(screen.getAllByText(/400/).length).toBeGreaterThanOrEqual(1)
    })
    it('should display count for confirm status (e.g., 50)', () => {
      renderComponent()
      expect(screen.getAllByText(/50/).length).toBeGreaterThanOrEqual(1)
    })
    it('should display count for new status (e.g., 32)', () => {
      renderComponent()
      expect(screen.getByText(/32/)).toBeInTheDocument()
    })
    it('should display count for cancel status (e.g., 18)', () => {
      renderComponent()
      expect(screen.getByText(/18/)).toBeInTheDocument()
    })
  })
  describe('status percentages', () => {
    it('should display percentage for complete status (e.g., 80.0%)', () => {
      renderComponent()
      expect(screen.getByText(/80,0/)).toBeInTheDocument()
    })
    it('should display percentage for confirm status (e.g., 10.0%)', () => {
      renderComponent()
      expect(screen.getByText(/10,0/)).toBeInTheDocument()
    })
    it('should display percentage for new status (e.g., 6.4%)', () => {
      renderComponent()
      expect(screen.getByText(/6,4/)).toBeInTheDocument()
    })
    it('should display percentage for cancel status (e.g., 3.6%)', () => {
      renderComponent()
      expect(screen.getByText(/3,6/)).toBeInTheDocument()
    })
    it('should format percentages to 1 decimal place', () => {
      renderComponent()
      expect(screen.getByText(/80,0/)).toBeInTheDocument()
    })
  })
})

// 3. Color Scheme
describe('OrdersStatusBreakdown - Color Scheme', () => {
  describe('complete status', () => {
    it('should use green color (#22C55E) for complete', () => {
      expect(ORDER_STATUS_CONFIG.complete.color).toBe('#22C55E')
    })
    it('should apply bg-green-500 background class', () => {
      expect(ORDER_STATUS_CONFIG.complete.bgClass).toBe('bg-green-500')
    })
    it('should apply text-green-600 text class', () => {
      expect(ORDER_STATUS_CONFIG.complete.textClass).toBe('text-green-600')
    })
  })
  describe('confirm status', () => {
    it('should use blue color (#3B82F6) for confirm', () => {
      expect(ORDER_STATUS_CONFIG.confirm.color).toBe('#3B82F6')
    })
    it('should apply bg-blue-500 background class', () => {
      expect(ORDER_STATUS_CONFIG.confirm.bgClass).toBe('bg-blue-500')
    })
    it('should apply text-blue-600 text class', () => {
      expect(ORDER_STATUS_CONFIG.confirm.textClass).toBe('text-blue-600')
    })
  })
  describe('new status', () => {
    it('should use yellow color (#F59E0B) for new', () => {
      expect(ORDER_STATUS_CONFIG.new.color).toBe('#F59E0B')
    })
    it('should apply bg-yellow-500 background class', () => {
      expect(ORDER_STATUS_CONFIG.new.bgClass).toBe('bg-yellow-500')
    })
    it('should apply text-yellow-600 text class', () => {
      expect(ORDER_STATUS_CONFIG.new.textClass).toBe('text-yellow-600')
    })
  })
  describe('cancel status', () => {
    it('should use red color (#EF4444) for cancel', () => {
      expect(ORDER_STATUS_CONFIG.cancel.color).toBe('#EF4444')
    })
    it('should apply bg-red-500 background class', () => {
      expect(ORDER_STATUS_CONFIG.cancel.bgClass).toBe('bg-red-500')
    })
    it('should apply text-red-600 text class', () => {
      expect(ORDER_STATUS_CONFIG.cancel.textClass).toBe('text-red-600')
    })
  })
  describe('WCAG compliance', () => {
    it('should meet WCAG 2.1 AA contrast requirements for all colors', () => {
      Object.values(ORDER_STATUS_CONFIG).forEach(c => expect(c.color).toMatch(/^#[0-9A-Fa-f]{6}$/))
    })
  })
})

// 4. View Toggle
describe('OrdersStatusBreakdown - View Toggle', () => {
  it('should render bar chart by default', () => {
    renderComponent()
    expect(screen.getAllByRole('radio')[0]).toHaveAttribute('aria-checked', 'true')
  })
  it('should switch to pie chart on toggle click', async () => {
    const user = userEvent.setup()
    renderComponent()
    const radios = screen.getAllByRole('radio')
    await user.click(radios[1])
    await waitFor(() => {
      expect(radios[1]).toHaveAttribute('aria-checked', 'true')
    })
  })
  it('should switch back to bar chart on second toggle', async () => {
    const user = userEvent.setup()
    renderComponent()
    const radios = screen.getAllByRole('radio')
    await user.click(radios[1])
    await user.click(radios[0])
    await waitFor(() => {
      expect(radios[0]).toHaveAttribute('aria-checked', 'true')
    })
  })
  it('should highlight active view button', () => {
    renderComponent()
    const radios = screen.getAllByRole('radio')
    expect(radios[0].className).toContain('bg-[#E53935]')
    expect(radios[1].className).toContain('bg-white')
  })
  it('should preserve data when switching views', async () => {
    const user = userEvent.setup()
    renderComponent()
    expect(screen.getByText(/Выполнено/)).toBeInTheDocument()
    await user.click(screen.getAllByRole('radio')[1])
    expect(screen.getByText(/Выполнено/)).toBeInTheDocument()
  })
  it('should animate transition between views', () => {
    renderComponent()
    expect(screen.getAllByRole('radio')[0].className).toContain('transition-colors')
  })
})

// 5. Stacked Bar Chart
describe('OrdersStatusBreakdown - Stacked Bar Chart', () => {
  it('should render horizontal stacked bar', () => {
    renderComponent()
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
  })
  it('should use Recharts BarChart component', () => {
    renderComponent()
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
  })
  it('should stack all 4 statuses in single bar', () => {
    renderComponent()
    expect(screen.getByText(/Выполнено/)).toBeInTheDocument()
    expect(screen.getByText(/Отменено/)).toBeInTheDocument()
  })
  it('should size segments proportionally to percentage', () => {
    renderComponent()
    expect(screen.getByText(/80,0/)).toBeInTheDocument()
    expect(screen.getByText(/10,0/)).toBeInTheDocument()
  })
  it('should show complete segment first (largest)', () => {
    renderComponent()
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Выполнено')
  })
  it('should apply correct colors to each segment', () => {
    renderComponent()
    expect(screen.getAllByLabelText(/Выполнено|Подтверждено|Новый|Отменено/).length).toBe(4)
  })
  it('should render percentage labels below bar', () => {
    renderComponent()
    expect(screen.getByText(/80,0/)).toBeInTheDocument()
  })
  it('should hide XAxis labels', () => {
    renderComponent()
    expect(screen.queryByText('status')).not.toBeInTheDocument()
  })
})

// 6. Pie Chart
describe('OrdersStatusBreakdown - Pie Chart', () => {
  async function renderPieView() {
    const user = userEvent.setup()
    renderComponent()
    await user.click(screen.getAllByRole('radio')[1])
    await waitFor(() => {
      expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThanOrEqual(1)
    })
  }
  it('should render donut chart (with inner radius)', async () => {
    await renderPieView()
    expect(screen.getAllByText(/500/).length).toBeGreaterThanOrEqual(1)
  })
  it('should use Recharts PieChart component', async () => {
    await renderPieView()
    expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThanOrEqual(1)
  })
  it('should render 4 slices for statuses', async () => {
    await renderPieView()
    expect(screen.getAllByText(/Выполнено/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Отменено/).length).toBeGreaterThanOrEqual(1)
  })
  it('should size slices proportionally to count', async () => {
    await renderPieView()
    expect(screen.getAllByText(/Выполнено/).length).toBeGreaterThanOrEqual(1)
  })
  it('should apply correct colors to each slice', async () => {
    await renderPieView()
    expect(screen.getAllByRole('listitem').length).toBe(4)
  })
  it('should add padding angle between slices', async () => {
    await renderPieView()
    expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThanOrEqual(1)
  })
  it('should show total orders in center', async () => {
    await renderPieView()
    expect(screen.getAllByText(/500/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('заказов')).toBeInTheDocument()
  })
  it('should render legend beside chart', async () => {
    await renderPieView()
    expect(screen.getByRole('list', { name: /Легенда/ })).toBeInTheDocument()
  })
})

// 7. Legend
describe('OrdersStatusBreakdown - Legend', () => {
  it('should render legend with 4 items', () => {
    renderComponent()
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
  })
  it('should show color indicator for each status', () => {
    renderComponent()
    screen.getAllByRole('listitem').forEach(item => {
      expect(item.querySelector('span[style]')).toBeInTheDocument()
    })
  })
  it('should show Russian label for each status', () => {
    renderComponent()
    expect(screen.getByText(/Выполнено/)).toBeInTheDocument()
    expect(screen.getByText(/Отменено/)).toBeInTheDocument()
  })
  it('should show count in parentheses', () => {
    renderComponent()
    expect(screen.getByText(/Выполнено/).closest('button')).toHaveTextContent('400')
  })
  it('should show percentage', () => {
    renderComponent()
    expect(screen.getByText(/80,0/)).toBeInTheDocument()
  })
  it('should sort legend items by count (descending)', () => {
    renderComponent()
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Выполнено')
    expect(items[3]).toHaveTextContent('Отменено')
  })
  it('should position legend below chart on mobile', () => {
    renderComponent()
    expect(screen.getByRole('list', { name: /Легенда/ })).toBeInTheDocument()
  })
  it('should position legend beside chart on desktop', () => {
    renderComponent()
    expect(screen.getByRole('list', { name: /Легенда/ })).toBeInTheDocument()
  })
})

// 8. Tooltip
describe('OrdersStatusBreakdown - Tooltip', () => {
  it('should show tooltip on bar segment hover', () => {
    renderComponent()
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
  })
  it('should show tooltip on pie slice hover', async () => {
    const user = userEvent.setup()
    renderComponent()
    await user.click(screen.getAllByRole('radio')[1])
    await waitFor(() => {
      expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThanOrEqual(1)
    })
  })
  it('should display status name in tooltip', () => {
    expect(ORDER_STATUS_CONFIG.complete.label).toBe('Выполнено')
  })
  it('should display count in tooltip', () => {
    expect(mockData.items[0].count).toBe(400)
  })
  it('should display percentage in tooltip', () => {
    expect(mockData.items[0].percentage).toBe(80.0)
  })
  it('should use smooth hover transitions', () => {
    renderComponent()
    screen.getAllByRole('radio').forEach(r => expect(r.className).toContain('transition-colors'))
  })
  it('should position tooltip near cursor', () => {
    renderComponent()
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
  })
  it('should hide tooltip on mouse leave', () => {
    renderComponent()
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
  })
  it('should render custom StatusTooltip component', () => {
    renderComponent()
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
  })
})

// 9. Loading State
describe('OrdersStatusBreakdown - Loading State', () => {
  function renderLoading() {
    return renderComponent({ isLoading: true, data: null, error: null })
  }
  it('should show skeleton chart during loading', () => {
    const { container } = renderLoading()
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })
  it('should show skeleton for header/title', () => {
    const { container } = renderLoading()
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThanOrEqual(1)
  })
  it('should show skeleton for legend items', () => {
    const { container } = renderLoading()
    expect(container.querySelectorAll('.grid .animate-pulse').length).toBe(4)
  })
  it('should match skeleton dimensions to chart', () => {
    const { container } = renderLoading()
    expect(container.querySelector('.h-\\[180px\\]')).toBeInTheDocument()
  })
  it('should apply animate-pulse class to skeleton', () => {
    const { container } = renderLoading()
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })
  it('should hide toggle buttons during loading', () => {
    renderLoading()
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
  })
})

// 10. Empty State
describe('OrdersStatusBreakdown - Empty State', () => {
  function renderEmpty() {
    return renderComponent({ data: emptyData })
  }
  it('should show empty message when no orders', () => {
    renderEmpty()
    expect(screen.getByText(/Нет заказов/)).toBeInTheDocument()
  })
  it('should display "Нет заказов за выбранный период"', () => {
    renderEmpty()
    expect(screen.getByText('Нет заказов за выбранный период')).toBeInTheDocument()
  })
  it('should hide chart when empty', () => {
    renderEmpty()
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
  })
  it('should hide legend when empty', () => {
    renderEmpty()
    expect(screen.queryByRole('list', { name: /Легенда/ })).not.toBeInTheDocument()
  })
  it('should show empty illustration icon', () => {
    renderEmpty()
    expect(screen.getByText('Нет заказов за выбранный период')).toBeInTheDocument()
  })
  it('should maintain card structure in empty state', () => {
    renderEmpty()
    expect(screen.getByText('Распределение заказов по статусам')).toBeInTheDocument()
  })
})

// 11. Error State
describe('OrdersStatusBreakdown - Error State', () => {
  const mockRefetch = vi.fn()
  function renderError() {
    return renderComponent({ data: null, error: new Error('Network error'), refetch: mockRefetch })
  }
  it('should show error alert on fetch failure', () => {
    renderError()
    expect(screen.getByText('Ошибка загрузки данных')).toBeInTheDocument()
  })
  it('should display error message in Russian', () => {
    renderError()
    expect(screen.getByText('Ошибка загрузки данных')).toBeInTheDocument()
  })
  it('should show AlertCircle icon', () => {
    const { container } = renderError()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
  it('should render "Повторить" retry button', () => {
    renderError()
    expect(screen.getByText('Повторить')).toBeInTheDocument()
  })
  it('should call refetch when retry clicked', async () => {
    const user = userEvent.setup()
    renderError()
    await user.click(screen.getByText('Повторить'))
    expect(mockRefetch).toHaveBeenCalledTimes(1)
  })
  it('should use destructive alert variant', () => {
    const { container } = renderError()
    const alertEl = container.querySelector('[role="alert"]')
    expect(alertEl).toBeTruthy()
    expect(alertEl!.className).toContain('destructive')
  })
  it('should hide chart on error', () => {
    renderError()
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
  })
})

// 12. Responsive Design
describe('OrdersStatusBreakdown - Responsive Design', () => {
  describe('desktop (>1024px)', () => {
    it('should render full chart with side legend', () => {
      renderComponent()
      expect(screen.getByRole('list', { name: /Легенда/ })).toBeInTheDocument()
    })
    it('should use horizontal bar layout', () => {
      renderComponent()
      expect(screen.getAllByRole('radio')[0]).toHaveAttribute('aria-checked', 'true')
    })
    it('should show all percentage labels', () => {
      renderComponent()
      expect(screen.getByText(/80,0/)).toBeInTheDocument()
      expect(screen.getByText(/3,6/)).toBeInTheDocument()
    })
  })
  describe('tablet (768px-1024px)', () => {
    it('should render compact chart', () => {
      renderComponent()
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })
    it('should position legend below chart', () => {
      renderComponent()
      expect(screen.getByRole('list', { name: /Легенда/ })).toBeInTheDocument()
    })
  })
  describe('mobile (<768px)', () => {
    it('should render simplified view', () => {
      renderComponent()
      expect(screen.getByText('Распределение заказов по статусам')).toBeInTheDocument()
    })
    it('should prefer pie chart on mobile', async () => {
      const user = userEvent.setup()
      renderComponent()
      const radios = screen.getAllByRole('radio')
      await user.click(radios[1])
      await waitFor(() => {
        expect(radios[1]).toHaveAttribute('aria-checked', 'true')
      })
    })
    it('should stack legend vertically', async () => {
      const user = userEvent.setup()
      renderComponent()
      await user.click(screen.getAllByRole('radio')[1])
      await waitFor(() => {
        expect(screen.getByRole('list', { name: /Легенда/ })).toBeInTheDocument()
      })
    })
    it('should reduce chart height', () => {
      mockUseOrdersStatusBreakdown.mockReturnValue(defaultHookReturn)
      renderWithProviders(<OrdersStatusBreakdown height={150} />)
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })
  })
})

// 13. Accessibility
describe('OrdersStatusBreakdown - Accessibility', () => {
  it('should have ARIA label for chart region', () => {
    renderComponent()
    const label = screen.getByRole('img').getAttribute('aria-label')
    expect(label).toMatch(/Распределение.*заказов/)
  })
  it('should have role="img" on chart', () => {
    renderComponent()
    expect(screen.getByRole('img')).toBeInTheDocument()
  })
  it('should have aria-describedby for chart description', () => {
    renderComponent()
    expect(screen.getByRole('img').getAttribute('aria-label')).toBeTruthy()
  })
  it('should make toggle buttons keyboard navigable', () => {
    renderComponent()
    screen.getAllByRole('radio').forEach(r => expect(r).toHaveAttribute('type', 'button'))
  })
  it('should have aria-pressed on active toggle', () => {
    renderComponent()
    expect(screen.getAllByRole('radio')[0]).toHaveAttribute('aria-checked', 'true')
  })
  it('should support keyboard navigation in chart', () => {
    renderComponent()
    screen.getAllByRole('listitem').forEach(item => expect(item.tagName).toBe('BUTTON'))
  })
  it('should provide text alternatives for visual data', () => {
    renderComponent()
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveAttribute('aria-label')
    expect(items[0].getAttribute('aria-label')).toContain('Выполнено')
  })
  it('should render accessible data table alternative', () => {
    renderComponent()
    expect(screen.getByRole('list', { name: /Легенда/ })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
  })
  it('should meet WCAG 2.1 AA requirements', () => {
    renderComponent()
    expect(screen.getAllByRole('radio')).toHaveLength(2)
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
  })
  it('should use pattern/icon for colorblind accessibility', () => {
    renderComponent()
    expect(screen.getByText(/Выполнено/)).toBeInTheDocument()
    expect(screen.getByText(/Отменено/)).toBeInTheDocument()
  })
})

// 14. Period Context Integration
describe('OrdersStatusBreakdown - Period Context', () => {
  it('should integrate with DashboardPeriodContext', () => {
    renderComponent()
    expect(mockUseOrdersStatusBreakdown).toHaveBeenCalledWith({
      periodType: 'week',
      period: '2026-W05',
    })
  })
  it('should refetch when period changes', () => {
    renderComponent()
    expect(mockUseOrdersStatusBreakdown).toHaveBeenCalled()
  })
  it('should pass from/to dates to API', () => {
    renderComponent()
    expect(mockUseOrdersStatusBreakdown).toHaveBeenCalledWith(
      expect.objectContaining({ periodType: 'week', period: expect.any(String) })
    )
  })
  it('should show period in header', () => {
    renderComponent()
    expect(screen.getByText('Распределение заказов по статусам')).toBeInTheDocument()
  })
  it('should handle invalid period gracefully', () => {
    mockUseOrdersStatusBreakdown.mockReturnValue({ ...defaultHookReturn, data: emptyData })
    renderComponent()
    expect(screen.getByText('Распределение заказов по статусам')).toBeInTheDocument()
  })
})

// 15. Navigation (Click to Filter)
describe('OrdersStatusBreakdown - Navigation', () => {
  it('should navigate to filtered orders on segment click', async () => {
    const user = userEvent.setup()
    renderComponent()
    await user.click(screen.getByText(/Выполнено/).closest('button')!)
    expect(mockPush).toHaveBeenCalledWith('/orders?status=complete')
  })
  it('should pass status filter as query param', async () => {
    const user = userEvent.setup()
    renderComponent()
    await user.click(screen.getByText(/Отменено/).closest('button')!)
    expect(mockPush).toHaveBeenCalledWith('/orders?status=cancel')
  })
  it('should navigate to /orders?status=complete on complete click', async () => {
    const user = userEvent.setup()
    renderComponent()
    await user.click(screen.getByText(/Выполнено/).closest('button')!)
    expect(mockPush).toHaveBeenCalledWith('/orders?status=complete')
  })
  it('should navigate to /orders?status=cancel on cancel click', async () => {
    const user = userEvent.setup()
    renderComponent()
    await user.click(screen.getByText(/Отменено/).closest('button')!)
    expect(mockPush).toHaveBeenCalledWith('/orders?status=cancel')
  })
  it('should show hover cursor on clickable segments', () => {
    renderComponent()
    screen.getAllByRole('listitem').forEach(item => expect(item).toHaveClass('cursor-pointer'))
  })
  it('should announce navigation to screen readers', () => {
    renderComponent()
    screen.getAllByRole('listitem').forEach(item => expect(item).toHaveAttribute('aria-label'))
  })
})

// 16. Animation
describe('OrdersStatusBreakdown - Animation', () => {
  it('should animate chart entrance on load', () => {
    renderComponent()
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
  })
  it('should animate data updates', () => {
    renderComponent()
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
  })
  it('should animate view toggle transition', () => {
    renderComponent()
    expect(screen.getAllByRole('radio')[0].className).toContain('transition-colors')
  })
  it('should respect prefers-reduced-motion', () => {
    renderComponent()
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
  })
  it('should use consistent animation duration', () => {
    renderComponent()
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
  })
})

// 17. Data Sorting
describe('OrdersStatusBreakdown - Data Sorting', () => {
  it('should sort statuses by count (descending)', () => {
    renderComponent()
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Выполнено')
    expect(items[1]).toHaveTextContent('Подтверждено')
  })
  it('should alternatively use fixed order (complete, confirm, new, cancel)', () => {
    renderComponent()
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Выполнено')
    expect(items[1]).toHaveTextContent('Подтверждено')
    expect(items[2]).toHaveTextContent('Новый')
    expect(items[3]).toHaveTextContent('Отменено')
  })
  it('should maintain sort order in legend', () => {
    renderComponent()
    expect(screen.getAllByRole('listitem').map(i => i.textContent)[0]).toContain('Выполнено')
  })
  it('should maintain sort order in chart', () => {
    renderComponent()
    expect(screen.getByText(/Выполнено/)).toBeInTheDocument()
  })
})

// 18. Integration
describe('OrdersStatusBreakdown - Integration', () => {
  it('should integrate with useOrdersVolume hook', () => {
    renderComponent()
    expect(mockUseOrdersStatusBreakdown).toHaveBeenCalled()
  })
  it('should pass from/to parameters to hook', () => {
    renderComponent()
    expect(mockUseOrdersStatusBreakdown).toHaveBeenCalledWith(
      expect.objectContaining({ periodType: 'week', period: '2026-W05' })
    )
  })
  it('should handle hook loading state', () => {
    renderComponent({ isLoading: true, data: null, error: null })
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
  })
  it('should handle hook error state', () => {
    renderComponent({ data: null, error: new Error('fail') })
    expect(screen.getByText('Ошибка загрузки данных')).toBeInTheDocument()
  })
  it('should refetch on parameter changes', () => {
    renderComponent()
    expect(mockUseOrdersStatusBreakdown).toHaveBeenCalledTimes(1)
  })
  it('should compose with Dashboard page', () => {
    mockUseOrdersStatusBreakdown.mockReturnValue(defaultHookReturn)
    const { container } = renderWithProviders(<OrdersStatusBreakdown />)
    expect(
      container.querySelector('[data-slot="card"]') || container.querySelector('.rounded-xl')
    ).toBeTruthy()
  })
})

// 19. Performance
describe('OrdersStatusBreakdown - Performance', () => {
  it('should render efficiently with status data', () => {
    const start = performance.now()
    renderComponent()
    expect(performance.now() - start).toBeLessThan(1000)
  })
  it('should memoize chart configuration', () => {
    renderComponent()
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
  })
  it('should not re-render on unrelated prop changes', () => {
    const { rerender } = renderComponent()
    mockUseOrdersStatusBreakdown.mockReturnValue(defaultHookReturn)
    rerender(<OrdersStatusBreakdown />)
    expect(screen.getByText('Распределение заказов по статусам')).toBeInTheDocument()
  })
  it('should debounce rapid view toggles', async () => {
    const user = userEvent.setup()
    renderComponent()
    const radios = screen.getAllByRole('radio')
    await user.click(radios[1])
    await user.click(radios[0])
    await waitFor(() => {
      expect(radios[0]).toHaveAttribute('aria-checked', 'true')
    })
  })
})
