/**
 * TDD Tests for Story 60.2-FE: Dashboard Period Selector Component
 * Epic 60-FE: Dashboard & Analytics UX Improvements
 *
 * GREEN Phase: Tests implemented after component creation
 *
 * @see docs/stories/epic-60/story-60.2-fe-period-selector-component.md
 */

import { describe, it, beforeEach, afterEach, vi, expect } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@/test/utils/test-utils'
import { DashboardPeriodSelector } from '../DashboardPeriodSelector'

// =============================================================================
// Mocks Setup
// =============================================================================

const mockUseDashboardPeriod = vi.fn()
vi.mock('@/hooks/useDashboardPeriod', () => ({
  useDashboardPeriod: () => mockUseDashboardPeriod(),
}))

// =============================================================================
// Test Fixtures
// =============================================================================

const createMockContextValue = (overrides = {}) => ({
  periodType: 'week' as const,
  selectedWeek: '2026-W05',
  selectedMonth: '2026-01',
  previousWeek: '2026-W04',
  previousMonth: '2025-12',
  lastRefresh: new Date('2026-01-29T10:00:00Z'),
  isLoading: false,
  setPeriodType: vi.fn(),
  setWeek: vi.fn(),
  setMonth: vi.fn(),
  refresh: vi.fn(),
  getDateRange: vi.fn(() => ({ startDate: '2026-01-27', endDate: '2026-02-02' })),
  ...overrides,
})

// =============================================================================
// Story 60.2-FE: AC1 - Period Type Toggle (Tabs)
// =============================================================================

describe('Story 60.2-FE: AC1 - Period Type Toggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseDashboardPeriod.mockReturnValue(createMockContextValue())
  })

  afterEach(() => cleanup())

  it('renders week/month tabs', () => {
    render(<DashboardPeriodSelector />)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /неделя/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /месяц/i })).toBeInTheDocument()
  })

  it('week tab is active by default when periodType is week', () => {
    render(<DashboardPeriodSelector />)
    const weekTab = screen.getByRole('tab', { name: /неделя/i })
    expect(weekTab).toHaveAttribute('data-state', 'active')
  })

  it('month tab is active when periodType is month', () => {
    mockUseDashboardPeriod.mockReturnValue(createMockContextValue({ periodType: 'month' }))
    render(<DashboardPeriodSelector />)
    const monthTab = screen.getByRole('tab', { name: /месяц/i })
    expect(monthTab).toHaveAttribute('data-state', 'active')
  })

  it('clicking month tab calls setPeriodType with "month"', async () => {
    const setPeriodType = vi.fn()
    mockUseDashboardPeriod.mockReturnValue(createMockContextValue({ setPeriodType }))
    render(<DashboardPeriodSelector />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('tab', { name: /месяц/i }))
    expect(setPeriodType).toHaveBeenCalledWith('month')
  })

  it('clicking week tab calls setPeriodType with "week"', async () => {
    const setPeriodType = vi.fn()
    mockUseDashboardPeriod.mockReturnValue(
      createMockContextValue({ periodType: 'month', setPeriodType })
    )
    render(<DashboardPeriodSelector />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('tab', { name: /неделя/i }))
    expect(setPeriodType).toHaveBeenCalledWith('week')
  })
})

// =============================================================================
// Story 60.2-FE: AC2 - Week Dropdown
// =============================================================================

describe('Story 60.2-FE: AC2 - Week Dropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseDashboardPeriod.mockReturnValue(createMockContextValue())
  })

  afterEach(() => cleanup())

  it('shows week dropdown when periodType is week', () => {
    render(<DashboardPeriodSelector />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('displays available weeks in dropdown', async () => {
    render(<DashboardPeriodSelector />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('combobox'))
    // Multiple elements match (trigger + dropdown), use getAllByText
    expect(screen.getAllByText(/Неделя 5, 2026/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Неделя 4, 2026/).length).toBeGreaterThanOrEqual(1)
  })

  it('selecting week calls setWeek with correct value', async () => {
    const setWeek = vi.fn()
    mockUseDashboardPeriod.mockReturnValue(createMockContextValue({ setWeek }))
    render(<DashboardPeriodSelector />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByText(/Неделя 4, 2026/))
    expect(setWeek).toHaveBeenCalledWith('2026-W04')
  })
})

// =============================================================================
// Story 60.2-FE: AC4 - Refresh Button
// =============================================================================

describe('Story 60.2-FE: AC4 - Refresh Button', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-29T10:05:00Z'))
    mockUseDashboardPeriod.mockReturnValue(createMockContextValue())
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('renders refresh button', () => {
    render(<DashboardPeriodSelector />)
    expect(screen.getByRole('button', { name: /обновить/i })).toBeInTheDocument()
  })

  it('clicking refresh calls refresh() action', async () => {
    const refresh = vi.fn()
    mockUseDashboardPeriod.mockReturnValue(createMockContextValue({ refresh }))
    render(<DashboardPeriodSelector />)
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await user.click(screen.getByRole('button', { name: /обновить/i }))
    expect(refresh).toHaveBeenCalled()
  })

  it('displays last update time in Russian', () => {
    render(<DashboardPeriodSelector />)
    expect(screen.getByText(/Обновлено:/)).toBeInTheDocument()
  })

  it('hides refresh button when compact prop is true', () => {
    render(<DashboardPeriodSelector compact />)
    expect(screen.queryByRole('button', { name: /обновить/i })).not.toBeInTheDocument()
  })
})

// =============================================================================
// Story 60.2-FE: AC5 - Loading State
// =============================================================================

describe('Story 60.2-FE: AC5 - Loading State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => cleanup())

  it('shows skeleton when isLoading is true', () => {
    mockUseDashboardPeriod.mockReturnValue(createMockContextValue({ isLoading: true }))
    render(<DashboardPeriodSelector />)
    expect(screen.getByTestId('period-selector-skeleton')).toBeInTheDocument()
  })

  it('hides skeleton when isLoading is false', () => {
    mockUseDashboardPeriod.mockReturnValue(createMockContextValue({ isLoading: false }))
    render(<DashboardPeriodSelector />)
    expect(screen.queryByTestId('period-selector-skeleton')).not.toBeInTheDocument()
  })
})

// =============================================================================
// Story 60.2-FE: AC6 - Responsive Design
// =============================================================================

describe('Story 60.2-FE: AC6 - Responsive Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseDashboardPeriod.mockReturnValue(createMockContextValue())
  })

  afterEach(() => cleanup())

  it('has responsive flex classes', () => {
    render(<DashboardPeriodSelector />)
    const container = screen.getByTestId('period-selector-container')
    expect(container).toHaveClass('flex-col')
    expect(container).toHaveClass('md:flex-row')
  })

  it('applies custom className prop', () => {
    render(<DashboardPeriodSelector className="custom-class" />)
    const container = screen.getByTestId('period-selector-container')
    expect(container).toHaveClass('custom-class')
  })
})

// =============================================================================
// Story 60.2-FE: AC10 - ARIA Labels
// =============================================================================

describe('Story 60.2-FE: AC10 - ARIA Labels', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseDashboardPeriod.mockReturnValue(createMockContextValue())
  })

  afterEach(() => cleanup())

  it('select has aria-label for period selection', () => {
    render(<DashboardPeriodSelector />)
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-label', 'Выбор недели')
  })

  it('refresh button has aria-label', () => {
    render(<DashboardPeriodSelector />)
    expect(screen.getByRole('button', { name: /обновить данные/i })).toBeInTheDocument()
  })
})

// =============================================================================
// Story 60.2-FE: Callback Props
// =============================================================================

describe('Story 60.2-FE: Callback Props', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseDashboardPeriod.mockReturnValue(createMockContextValue())
  })

  afterEach(() => cleanup())

  it('calls onPeriodChange when week is selected', async () => {
    const onPeriodChange = vi.fn()
    render(<DashboardPeriodSelector onPeriodChange={onPeriodChange} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByText(/Неделя 4, 2026/))
    expect(onPeriodChange).toHaveBeenCalledWith('2026-W04', 'week')
  })
})
