import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import {
  QuickSelectDropdown,
  WeekRangeSelectors,
  PeriodSummary,
  ValidationAlerts,
  DateRangeLoadingState,
  DateRangeErrorState,
} from '../DateRangeSelectors'

// Mock formatWeekWithDateRange to return predictable values
vi.mock('@/hooks/useFinancialSummary', () => ({
  formatWeekWithDateRange: (week: string) => `Formatted: ${week}`,
}))

const mockWeeks = [
  { week: '2025-W47', start_date: '2025-11-17', end_date: '2025-11-23' },
  { week: '2025-W46', start_date: '2025-11-10', end_date: '2025-11-16' },
  { week: '2025-W45', start_date: '2025-11-03', end_date: '2025-11-09' },
]

describe('QuickSelectDropdown', () => {
  it('renders placeholder when no option selected', () => {
    render(
      <QuickSelectDropdown
        matchedQuickOption={undefined}
        onQuickSelect={vi.fn()}
        disabled={false}
      />
    )
    expect(screen.getByText('Быстрый выбор периода...')).toBeInTheDocument()
  })

  it('is disabled when disabled prop is true', () => {
    render(
      <QuickSelectDropdown matchedQuickOption={undefined} onQuickSelect={vi.fn()} disabled={true} />
    )
    expect(screen.getByText('Быстрый выбор периода...')).toBeInTheDocument()
  })
})

describe('WeekRangeSelectors', () => {
  it('renders start and end labels', () => {
    render(
      <WeekRangeSelectors
        weekStart="2025-W45"
        weekEnd="2025-W47"
        weeks={mockWeeks}
        onStartChange={vi.fn()}
        onEndChange={vi.fn()}
        disabled={false}
      />
    )
    expect(screen.getByText('От')).toBeInTheDocument()
    expect(screen.getByText('До')).toBeInTheDocument()
  })

  it('renders formatted week options', () => {
    render(
      <WeekRangeSelectors
        weekStart="2025-W45"
        weekEnd="2025-W47"
        weeks={mockWeeks}
        onStartChange={vi.fn()}
        onEndChange={vi.fn()}
        disabled={false}
      />
    )
    expect(screen.getByText('Formatted: 2025-W47')).toBeInTheDocument()
    expect(screen.getByText('Formatted: 2025-W45')).toBeInTheDocument()
  })
})

describe('PeriodSummary', () => {
  it('shows selected week count for valid range', () => {
    render(<PeriodSummary weeksInRange={4} isStartAfterEnd={false} isRangeTooLarge={false} />)
    expect(screen.getByText(/Выбрано:\s*4\s*недели/)).toBeInTheDocument()
  })

  it('shows singular form for 1 week', () => {
    render(<PeriodSummary weeksInRange={1} isStartAfterEnd={false} isRangeTooLarge={false} />)
    expect(screen.getByText(/Выбрано:\s*1\s*неделя/)).toBeInTheDocument()
  })

  it('shows plural for 5+ weeks', () => {
    render(<PeriodSummary weeksInRange={8} isStartAfterEnd={false} isRangeTooLarge={false} />)
    expect(screen.getByText(/Выбрано:\s*8\s*недель/)).toBeInTheDocument()
  })

  it('renders nothing when start is after end', () => {
    const { container } = render(
      <PeriodSummary weeksInRange={4} isStartAfterEnd={true} isRangeTooLarge={false} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when range is too large', () => {
    const { container } = render(
      <PeriodSummary weeksInRange={60} isStartAfterEnd={false} isRangeTooLarge={true} />
    )
    expect(container.innerHTML).toBe('')
  })
})

describe('ValidationAlerts', () => {
  it('shows start-after-end error', () => {
    render(
      <ValidationAlerts
        isStartAfterEnd={true}
        isRangeTooLarge={false}
        maxWeeks={52}
        weeksInRange={4}
      />
    )
    expect(screen.getByText('Начальная неделя не может быть позже конечной')).toBeInTheDocument()
  })

  it('shows range-too-large error', () => {
    render(
      <ValidationAlerts
        isStartAfterEnd={false}
        isRangeTooLarge={true}
        maxWeeks={52}
        weeksInRange={60}
      />
    )
    expect(screen.getByText(/Диапазон не может превышать 52 недель/)).toBeInTheDocument()
    expect(screen.getByText(/Выбрано: 60/)).toBeInTheDocument()
  })

  it('shows nothing when no validation errors', () => {
    const { container } = render(
      <ValidationAlerts
        isStartAfterEnd={false}
        isRangeTooLarge={false}
        maxWeeks={52}
        weeksInRange={4}
      />
    )
    expect(container.querySelectorAll('[role="alert"]')).toHaveLength(0)
  })

  it('hides range-too-large when start is after end', () => {
    render(
      <ValidationAlerts
        isStartAfterEnd={true}
        isRangeTooLarge={true}
        maxWeeks={52}
        weeksInRange={60}
      />
    )
    expect(screen.getByText('Начальная неделя не может быть позже конечной')).toBeInTheDocument()
    expect(screen.queryByText(/Диапазон не может превышать/)).not.toBeInTheDocument()
  })
})

describe('DateRangeLoadingState', () => {
  it('renders skeleton with label', () => {
    render(<DateRangeLoadingState />)
    expect(screen.getByText('Период')).toBeInTheDocument()
  })
})

describe('DateRangeErrorState', () => {
  it('renders error message for error state', () => {
    render(<DateRangeErrorState isError={true} />)
    expect(screen.getByText('Не удалось загрузить список недель')).toBeInTheDocument()
  })

  it('renders empty message for no-weeks state', () => {
    render(<DateRangeErrorState isError={false} />)
    expect(screen.getByText('Нет доступных недель для отображения')).toBeInTheDocument()
  })
})
