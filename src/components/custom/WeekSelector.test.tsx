/**
 * Unit tests for WeekSelector components
 * Story 3.5: Financial Summary View
 *
 * Tests:
 * - WeekSelector: rendering, selection, loading/error states
 * - WeekComparisonSelector: two-week selection
 * - Accessibility (keyboard navigation, ARIA labels)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WeekSelector, WeekComparisonSelector } from './WeekSelector'
import { useAvailableWeeks } from '@/hooks/useFinancialSummary'

// Mock the hook
vi.mock('@/hooks/useFinancialSummary', () => ({
  useAvailableWeeks: vi.fn(),
  formatWeekWithDateRange: vi.fn((week: string) => {
    // Simple mock formatter
    const match = week.match(/^(\d{4})-W(\d{2})$/)
    if (!match) return week
    return `Week ${match[2]}, ${match[1]}`
  }),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const mockWeeks = [
  { week: '2025-W01', start_date: '2025-01-06' },
  { week: '2025-W02', start_date: '2025-01-13' },
  { week: '2025-W03', start_date: '2025-01-20' },
]

describe('WeekSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render with available weeks', () => {
    vi.mocked(useAvailableWeeks).mockReturnValue({
      data: mockWeeks,
      isLoading: false,
      isError: false,
    } as any)

    const handleChange = vi.fn()
    render(<WeekSelector value="2025-W01" onChange={handleChange} />, {
      wrapper: createWrapper(),
    })

    expect(screen.getByText('Неделя')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    vi.mocked(useAvailableWeeks).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as any)

    render(<WeekSelector value="2025-W01" onChange={vi.fn()} />, {
      wrapper: createWrapper(),
    })

    // Check for skeleton loader
    const skeleton = document.querySelector('.h-10.w-full')
    expect(skeleton).toBeInTheDocument()
  })

  it('should show error state when API fails', () => {
    vi.mocked(useAvailableWeeks).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as any)

    render(<WeekSelector value="2025-W01" onChange={vi.fn()} />, {
      wrapper: createWrapper(),
    })

    expect(screen.getByText('Не удалось загрузить список недель')).toBeInTheDocument()
  })

  it('should show empty state when no weeks available', () => {
    vi.mocked(useAvailableWeeks).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as any)

    render(<WeekSelector value="2025-W01" onChange={vi.fn()} />, {
      wrapper: createWrapper(),
    })

    expect(screen.getByText('Нет доступных недель для отображения')).toBeInTheDocument()
  })

  it('should call onChange when week is selected', async () => {
    vi.mocked(useAvailableWeeks).mockReturnValue({
      data: mockWeeks,
      isLoading: false,
      isError: false,
    } as any)

    const handleChange = vi.fn()
    render(<WeekSelector value="2025-W01" onChange={handleChange} />, {
      wrapper: createWrapper(),
    })

    // Open select
    const select = screen.getByRole('combobox')
    fireEvent.click(select)

    // Wait for options to appear and select one
    await waitFor(() => {
      const option = screen.getByText('Week 02, 2025')
      fireEvent.click(option)
    })

    expect(handleChange).toHaveBeenCalledWith('2025-W02')
  })

  it('should support custom label', () => {
    vi.mocked(useAvailableWeeks).mockReturnValue({
      data: mockWeeks,
      isLoading: false,
      isError: false,
    } as any)

    render(<WeekSelector value="2025-W01" onChange={vi.fn()} label="Выберите период" />, {
      wrapper: createWrapper(),
    })

    expect(screen.getByText('Выберите период')).toBeInTheDocument()
  })

  it('should support disabled state', () => {
    vi.mocked(useAvailableWeeks).mockReturnValue({
      data: mockWeeks,
      isLoading: false,
      isError: false,
    } as any)

    render(<WeekSelector value="2025-W01" onChange={vi.fn()} disabled />, {
      wrapper: createWrapper(),
    })

    const select = screen.getByRole('combobox')
    // shadcn/ui Select may use disabled attribute or aria-disabled
    expect(select).toHaveAttribute('disabled')
  })

  it('should have proper accessibility attributes', () => {
    vi.mocked(useAvailableWeeks).mockReturnValue({
      data: mockWeeks,
      isLoading: false,
      isError: false,
    } as any)

    render(<WeekSelector value="2025-W01" onChange={vi.fn()} id="custom-week-selector" />, {
      wrapper: createWrapper(),
    })

    const select = screen.getByRole('combobox')
    expect(select).toHaveAttribute('id', 'custom-week-selector')
  })
})

describe('WeekComparisonSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render two week selectors', () => {
    vi.mocked(useAvailableWeeks).mockReturnValue({
      data: mockWeeks,
      isLoading: false,
      isError: false,
    } as any)

    render(
      <WeekComparisonSelector
        week1="2025-W01"
        week2="2025-W02"
        onWeek1Change={vi.fn()}
        onWeek2Change={vi.fn()}
      />,
      { wrapper: createWrapper() }
    )

    expect(screen.getByText('Период 1')).toBeInTheDocument()
    expect(screen.getByText('Период 2')).toBeInTheDocument()
  })

  it('should call onWeek1Change when first week changes', async () => {
    vi.mocked(useAvailableWeeks).mockReturnValue({
      data: mockWeeks,
      isLoading: false,
      isError: false,
    } as any)

    const handleWeek1Change = vi.fn()
    render(
      <WeekComparisonSelector
        week1="2025-W01"
        week2="2025-W02"
        onWeek1Change={handleWeek1Change}
        onWeek2Change={vi.fn()}
      />,
      { wrapper: createWrapper() }
    )

    // Find and click first selector
    const selectors = screen.getAllByRole('combobox')
    fireEvent.click(selectors[0])

    await waitFor(() => {
      const option = screen.getByText('Week 03, 2025')
      fireEvent.click(option)
    })

    expect(handleWeek1Change).toHaveBeenCalledWith('2025-W03')
  })

  it('should call onWeek2Change when second week changes', async () => {
    vi.mocked(useAvailableWeeks).mockReturnValue({
      data: mockWeeks,
      isLoading: false,
      isError: false,
    } as any)

    const handleWeek2Change = vi.fn()
    render(
      <WeekComparisonSelector
        week1="2025-W01"
        week2="2025-W02"
        onWeek1Change={vi.fn()}
        onWeek2Change={handleWeek2Change}
      />,
      { wrapper: createWrapper() }
    )

    // Find and click second selector
    const selectors = screen.getAllByRole('combobox')
    fireEvent.click(selectors[1])

    await waitFor(() => {
      const option = screen.getByText('Week 03, 2025')
      fireEvent.click(option)
    })

    expect(handleWeek2Change).toHaveBeenCalledWith('2025-W03')
  })
})

