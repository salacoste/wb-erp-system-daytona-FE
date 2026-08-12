/**
 * Tests for Dashboard Period Selector Component
 * Story 60.2-FE: Period Selector Component
 * Story 163.6-FE: Period type toggle migrated from Tabs to RadioGroup (FR13/UX-DR5).
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

const mockUseAvailableWeeks = vi.fn()
vi.mock('@/hooks/useFinancialSummary', () => ({
  useAvailableWeeks: () => mockUseAvailableWeeks(),
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

const availableWeeks = ['2026-W05', '2026-W04'].map(week => ({
  week,
  start_date: '2026-01-01',
  end_date: '2026-01-07',
}))

beforeEach(() => {
  mockUseAvailableWeeks.mockReturnValue({
    data: availableWeeks,
    isLoading: false,
    isError: false,
  })
})

// =============================================================================
// Story 163.6-FE: Period type RadioGroup toggle (replacing Tabs)
// =============================================================================

describe('Story 163.6-FE: Period type RadioGroup toggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseDashboardPeriod.mockReturnValue(createMockContextValue())
  })

  afterEach(() => cleanup())

  it('renders a radiogroup with week/month options (no tablist/tabpanel)', () => {
    render(<DashboardPeriodSelector />)
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /неделя/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /месяц/i })).toBeInTheDocument()
    // AC1/AC5: no tab-panel semantics remain after the migration.
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument()
  })

  it('week option is checked when periodType is week', () => {
    render(<DashboardPeriodSelector />)
    expect(screen.getByRole('radio', { name: /неделя/i })).toBeChecked()
    expect(screen.getByRole('radio', { name: /месяц/i })).not.toBeChecked()
  })

  it('month option is checked when periodType is month', () => {
    mockUseDashboardPeriod.mockReturnValue(createMockContextValue({ periodType: 'month' }))
    render(<DashboardPeriodSelector />)
    expect(screen.getByRole('radio', { name: /месяц/i })).toBeChecked()
    expect(screen.getByRole('radio', { name: /неделя/i })).not.toBeChecked()
  })

  it('clicking "Месяц" calls setPeriodType exactly once with "month" (AC2)', async () => {
    const setPeriodType = vi.fn()
    mockUseDashboardPeriod.mockReturnValue(createMockContextValue({ setPeriodType }))
    render(<DashboardPeriodSelector />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('radio', { name: /месяц/i }))
    expect(setPeriodType).toHaveBeenCalledTimes(1)
    expect(setPeriodType).toHaveBeenCalledWith('month')
  })

  it('clicking "Неделя" calls setPeriodType exactly once with "week" (AC3)', async () => {
    const setPeriodType = vi.fn()
    mockUseDashboardPeriod.mockReturnValue(
      createMockContextValue({ periodType: 'month', setPeriodType })
    )
    render(<DashboardPeriodSelector />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('radio', { name: /неделя/i }))
    expect(setPeriodType).toHaveBeenCalledTimes(1)
    expect(setPeriodType).toHaveBeenCalledWith('week')
  })

  it('re-activating the already-selected option keeps value week (single-choice, AC4)', async () => {
    const setPeriodType = vi.fn()
    mockUseDashboardPeriod.mockReturnValue(createMockContextValue({ setPeriodType }))
    render(<DashboardPeriodSelector />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('radio', { name: /неделя/i }))
    // Radix radio does not fire onValueChange when the already-checked item is
    // re-activated, so setPeriodType is NOT called — the value stays 'week' and
    // never becomes undefined (single-choice no-op, AC4).
    expect(setPeriodType).not.toHaveBeenCalled()
    expect(screen.getByRole('radio', { name: /неделя/i })).toBeChecked()
    expect(screen.getByRole('radio', { name: /месяц/i })).not.toBeChecked()
  })

  it('selected week is preserved when switching month -> week (AC3, context behavior)', async () => {
    // setPeriodType only changes periodType; selectedWeek lives in independent context state
    // (src/contexts/dashboard-period-state.ts), so it is preserved across the switch.
    const setPeriodType = vi.fn()
    mockUseDashboardPeriod.mockReturnValue(
      createMockContextValue({
        periodType: 'month',
        selectedWeek: '2026-W03',
        setPeriodType,
      })
    )
    render(<DashboardPeriodSelector />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('radio', { name: /неделя/i }))
    // The component only asks the context to switch type; it never touches the week.
    // The fully-mocked context preserves selectedWeek='2026-W03' across the switch
    // (real context behavior: src/contexts/dashboard-period-state.ts keeps them independent).
    expect(setPeriodType).toHaveBeenCalledTimes(1)
    expect(setPeriodType).toHaveBeenCalledWith('week')
    expect(setPeriodType).not.toHaveBeenCalledWith('month')
    // setWeek is never invoked by a type switch -> the previously-selected week survives.
    const setWeek = mockUseDashboardPeriod.mock.results[0].value.setWeek
    expect(setWeek).not.toHaveBeenCalled()
  })

  it('keyboard: arrow keys move focus between options (AC5 visible focus)', async () => {
    mockUseDashboardPeriod.mockReturnValue(createMockContextValue())
    render(<DashboardPeriodSelector />)
    const user = userEvent.setup()
    const weekRadio = screen.getByRole('radio', { name: /неделя/i })
    const monthRadio = screen.getByRole('radio', { name: /месяц/i })
    await user.tab()
    expect(weekRadio).toHaveFocus()
    // Radix radiogroup supports arrow-key roving between options.
    await user.keyboard('{ArrowRight}')
    expect(monthRadio).toHaveFocus()
  })

  it('keyboard: Space/Enter on the unselected option selects it (AC5)', async () => {
    const setPeriodType = vi.fn()
    mockUseDashboardPeriod.mockReturnValue(createMockContextValue({ setPeriodType }))
    render(<DashboardPeriodSelector />)
    const user = userEvent.setup()
    const monthRadio = screen.getByRole('radio', { name: /месяц/i })
    monthRadio.focus()
    await user.keyboard('{ }')
    expect(setPeriodType).toHaveBeenCalledWith('month')
  })

  it('radiogroup exposes a group label via aria-label (AC5)', () => {
    render(<DashboardPeriodSelector />)
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-label', 'Тип периода')
  })

  it('disabled prop disables both radio options (AC6)', () => {
    render(<DashboardPeriodSelector disabled />)
    expect(screen.getByRole('radio', { name: /неделя/i })).toBeDisabled()
    expect(screen.getByRole('radio', { name: /месяц/i })).toBeDisabled()
  })
})

// =============================================================================
// Story 60.2-FE: AC2 - Week Dropdown
// =============================================================================

describe('Story 60.2-FE: AC2 - Week Dropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-29T10:00:00Z'))
    mockUseDashboardPeriod.mockReturnValue(createMockContextValue())
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('shows week dropdown when periodType is week', () => {
    render(<DashboardPeriodSelector />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('displays available weeks in dropdown', async () => {
    render(<DashboardPeriodSelector />)
    // userEvent v14 hangs under fake timers unless advanceTimers is wired (Story 89.5 review M-1).
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await user.click(screen.getByRole('combobox'))
    // Multiple elements match (trigger + dropdown), use getAllByText
    expect(screen.getAllByText(/Неделя 5, 2026/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Неделя 4, 2026/).length).toBeGreaterThanOrEqual(1)
  })

  it('selecting week calls setWeek with correct value', async () => {
    const setWeek = vi.fn()
    mockUseDashboardPeriod.mockReturnValue(createMockContextValue({ setWeek }))
    render(<DashboardPeriodSelector />)
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
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
    // Aligned with AC2 + Callback Props describes on the fixture anchor (10:00:00Z).
    vi.setSystemTime(new Date('2026-01-29T10:00:00Z'))
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

  it('hides refresh button when compact prop is true (AC6)', () => {
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

  it('shows skeleton when isLoading is true (AC6)', () => {
    mockUseDashboardPeriod.mockReturnValue(createMockContextValue({ isLoading: true }))
    render(<DashboardPeriodSelector />)
    expect(screen.getByTestId('period-selector-skeleton')).toBeInTheDocument()
  })

  it('preserves the formatted current week and exposes loading status', () => {
    mockUseDashboardPeriod.mockReturnValue(
      createMockContextValue({ isLoading: true, selectedWeek: '2026-W05' })
    )

    render(<DashboardPeriodSelector />)

    const loadingState = screen.getByTestId('period-selector-skeleton')
    expect(loadingState).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText(/Неделя 5, 2026/)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Загрузка доступных периодов')
  })

  it('preserves the formatted current month and exposes loading status', () => {
    mockUseDashboardPeriod.mockReturnValue(
      createMockContextValue({
        isLoading: true,
        periodType: 'month',
        selectedMonth: '2026-01',
      })
    )

    render(<DashboardPeriodSelector />)

    expect(screen.getByText('Месяц')).toBeInTheDocument()
    expect(screen.getByText('Январь 2026')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Загрузка доступных периодов')
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

  it('week select is named by its persistent visible label', () => {
    render(<DashboardPeriodSelector />)
    expect(screen.getByText('Выбор недели')).toBeVisible()
    expect(screen.getByRole('combobox', { name: 'Выбор недели' })).toBeInTheDocument()
  })

  it('month select is named by its persistent visible label', () => {
    mockUseDashboardPeriod.mockReturnValue(createMockContextValue({ periodType: 'month' }))

    render(<DashboardPeriodSelector />)

    expect(screen.getByText('Выбор месяца')).toBeVisible()
    expect(screen.getByRole('combobox', { name: 'Выбор месяца' })).toBeInTheDocument()
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
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-29T10:00:00Z'))
    mockUseDashboardPeriod.mockReturnValue(createMockContextValue())
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('calls onPeriodChange when week is selected', async () => {
    const onPeriodChange = vi.fn()
    render(<DashboardPeriodSelector onPeriodChange={onPeriodChange} />)
    // userEvent v14 hangs under fake timers unless advanceTimers is wired (Story 89.5 review M-1).
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByText(/Неделя 4, 2026/))
    expect(onPeriodChange).toHaveBeenCalledWith('2026-W04', 'week')
  })
})
