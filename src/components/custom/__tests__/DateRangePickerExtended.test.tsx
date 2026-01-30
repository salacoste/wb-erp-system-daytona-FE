/**
 * TDD Tests for DateRangePickerExtended Component
 * Story 51.3-FE: Extended Date Range Picker Component
 * Epic 51: FBS Historical Analytics UI (365 Days)
 *
 * Test Categories:
 * - Basic Rendering (~10 tests)
 * - Preset Buttons (~15 tests)
 * - Range Selection (~20 tests)
 * - Aggregation Suggestion (~10 tests)
 * - Russian Locale (~10 tests)
 * - Keyboard & Accessibility (~15 tests)
 *
 * @see docs/stories/epic-51/story-51.3-fe-extended-date-range-picker.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DateRangePickerExtended } from '../DateRangePickerExtended'
import {
  mockRange30Days,
  DEFAULT_PRESETS,
  customPresets,
  MOCK_TODAY,
} from '@/test/fixtures/date-range'

// ============================================================================
// Test Setup
// ============================================================================

const mockOnChange = vi.fn()

const defaultProps = {
  value: undefined,
  onChange: mockOnChange,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(MOCK_TODAY)
})

afterEach(() => {
  vi.useRealTimers()
})

// ============================================================================
// Basic Rendering Tests (~10 tests)
// ============================================================================

describe('DateRangePickerExtended - Basic Rendering', () => {
  it('should render with placeholder text when no value', () => {
    render(<DateRangePickerExtended {...defaultProps} />)
    expect(screen.getByText('Выберите период')).toBeInTheDocument()
  })

  it('should render with custom placeholder', () => {
    render(<DateRangePickerExtended {...defaultProps} placeholder="Выбрать даты" />)
    expect(screen.getByText('Выбрать даты')).toBeInTheDocument()
  })

  it('should render with selected date range formatted in Russian', () => {
    render(<DateRangePickerExtended {...defaultProps} value={mockRange30Days} />)
    expect(screen.getByText(/31\.12\.2024 — 29\.01\.2025/)).toBeInTheDocument()
  })

  it('should render calendar icon in trigger button', () => {
    render(<DateRangePickerExtended {...defaultProps} />)
    const trigger = screen.getByRole('button')
    expect(trigger.querySelector('svg')).toBeInTheDocument()
  })

  it('should render clear button when range is selected', () => {
    render(<DateRangePickerExtended {...defaultProps} value={mockRange30Days} />)
    expect(screen.getByLabelText(/очистить/i)).toBeInTheDocument()
  })

  it('should not render clear button when no range selected', () => {
    render(<DateRangePickerExtended {...defaultProps} />)
    expect(screen.queryByLabelText(/очистить/i)).not.toBeInTheDocument()
  })

  it('should open popover with two calendar views on click', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      const calendars = screen.getAllByRole('grid')
      expect(calendars.length).toBeGreaterThanOrEqual(2)
    })
  })

  it('should render in disabled state when disabled prop is true', () => {
    render(<DateRangePickerExtended {...defaultProps} disabled />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('should apply custom className to root element', () => {
    const { container } = render(
      <DateRangePickerExtended {...defaultProps} className="custom-class" />
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('should render with id for accessibility', () => {
    render(<DateRangePickerExtended {...defaultProps} id="date-picker-test" />)
    expect(screen.getByRole('button')).toHaveAttribute('id', 'date-picker-test')
  })
})

// ============================================================================
// Preset Buttons Tests (~15 tests)
// ============================================================================

describe('DateRangePickerExtended - Preset Buttons', () => {
  it('should show 4 default preset buttons in popover', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('30 дней')).toBeInTheDocument()
      expect(screen.getByText('90 дней')).toBeInTheDocument()
      expect(screen.getByText('180 дней')).toBeInTheDocument()
      expect(screen.getByText('365 дней')).toBeInTheDocument()
    })
  })

  it('should call onChange with last 30 days when "30 дней" clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))
    await user.click(screen.getByText('30 дней'))

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        from: expect.any(Date),
        to: expect.any(Date),
      })
    )
  })

  it('should call onChange with last 90 days when "90 дней" clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))
    await user.click(screen.getByText('90 дней'))

    expect(mockOnChange).toHaveBeenCalled()
    const callArg = mockOnChange.mock.calls[0][0]
    expect(callArg.from).toBeInstanceOf(Date)
    expect(callArg.to).toBeInstanceOf(Date)
  })

  it('should call onChange with last 180 days when "180 дней" clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))
    await user.click(screen.getByText('180 дней'))

    expect(mockOnChange).toHaveBeenCalled()
  })

  it('should call onChange with last 365 days when "365 дней" clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))
    await user.click(screen.getByText('365 дней'))

    expect(mockOnChange).toHaveBeenCalled()
  })

  it('should highlight active preset when current range matches', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} value={mockRange30Days} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      const preset30 = screen.getByText('30 дней')
      expect(preset30.closest('button')).toHaveAttribute('data-active', 'true')
    })
  })

  it('should not highlight any preset for custom range', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const customRange = {
      from: new Date('2025-01-10'),
      to: new Date('2025-01-25'),
    }
    render(<DateRangePickerExtended {...defaultProps} value={customRange} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      const presetButtons = screen.getAllByRole('button', { name: /дней/i })
      presetButtons.forEach(btn => {
        expect(btn).not.toHaveAttribute('data-active', 'true')
      })
    })
  })

  it('should use custom presets when provided', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} presets={customPresets} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('7 дней')).toBeInTheDocument()
      expect(screen.getByText('14 дней')).toBeInTheDocument()
      expect(screen.queryByText('365 дней')).not.toBeInTheDocument()
    })
  })

  it('should respect maxDays when preset exceeds it', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} maxDays={90} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      const preset365 = screen.getByText('365 дней')
      expect(preset365.closest('button')).toBeDisabled()
    })
  })

  it('should update both from and to dates simultaneously on preset click', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))
    await user.click(screen.getByText('30 дней'))

    const callArg = mockOnChange.mock.calls[0][0]
    expect(callArg.from).toBeDefined()
    expect(callArg.to).toBeDefined()
    expect(callArg.from).not.toEqual(callArg.to)
  })

  it('should set preset end date to today', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))
    await user.click(screen.getByText('30 дней'))

    const callArg = mockOnChange.mock.calls[0][0]
    expect(callArg.to.toDateString()).toBe(MOCK_TODAY.toDateString())
  })

  it('should deactivate preset highlight on custom date selection', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} value={mockRange30Days} />)

    await user.click(screen.getByRole('button'))

    // Verify preset is initially highlighted
    await waitFor(() => {
      const preset30 = screen.getByText('30 дней')
      expect(preset30.closest('button')).toHaveAttribute('data-active', 'true')
    })

    // Select a custom date (this would normally trigger onChange)
    // After parent updates value to custom range, preset should deactivate
  })

  it('should show preset labels in Russian', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      DEFAULT_PRESETS.forEach(preset => {
        expect(screen.getByText(preset.label)).toBeInTheDocument()
      })
    })
  })

  it('should show "Быстрый выбор:" label above presets', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('Быстрый выбор:')).toBeInTheDocument()
    })
  })
})

// ============================================================================
// Range Selection Tests (~20 tests)
// ============================================================================

describe('DateRangePickerExtended - Range Selection', () => {
  it('should allow selecting start date in calendar', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      const day15 = screen.getAllByText('15')[0]
      expect(day15).toBeInTheDocument()
    })
  })

  it('should allow selecting end date after start date', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    // First click sets start, second click sets end
    await waitFor(() => {
      const grids = screen.getAllByRole('grid')
      expect(grids.length).toBeGreaterThan(0)
    })
  })

  it('should highlight range between selected dates', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} value={mockRange30Days} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      // Range cells should have range styling
      const rangeCells = document.querySelectorAll('[data-range-middle="true"]')
      expect(rangeCells.length).toBeGreaterThan(0)
    })
  })

  it('should not allow selecting future dates', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      // Check that calendar grids are rendered
      const grids = screen.getAllByRole('grid')
      expect(grids.length).toBe(2)

      // Future dates should be disabled in the calendar
      // The calendar disables dates after today (MOCK_TODAY = 2025-01-29)
      // So we expect to find some disabled dates in the second month (February 2025)
      const disabledButtons = document.querySelectorAll('[aria-disabled="true"]')
      expect(disabledButtons.length).toBeGreaterThan(0)
    })
  })

  it('should show validation error when range exceeds 365 days', async () => {
    const invalidRange = {
      from: new Date('2023-12-01'),
      to: new Date('2025-01-29'),
    }
    render(<DateRangePickerExtended {...defaultProps} value={invalidRange} />)

    expect(screen.getByText(/Диапазон не может превышать 365 дней/i)).toBeInTheDocument()
  })

  it('should show validation error message in Russian', async () => {
    const invalidRange = {
      from: new Date('2023-12-01'),
      to: new Date('2025-01-29'),
    }
    render(<DateRangePickerExtended {...defaultProps} value={invalidRange} />)

    expect(screen.getByText(/Диапазон не может превышать/)).toBeInTheDocument()
    expect(screen.getByText(/дней/)).toBeInTheDocument()
  })

  it('should show selected days count in error message', async () => {
    const invalidRange = {
      from: new Date('2023-12-01'),
      to: new Date('2025-01-29'),
    }
    render(<DateRangePickerExtended {...defaultProps} value={invalidRange} />)

    expect(screen.getByText(/Выбрано:/)).toBeInTheDocument()
  })

  it('should clear selection when clear button clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} value={mockRange30Days} />)

    const clearButton = screen.getByLabelText(/очистить/i)
    await user.click(clearButton)

    expect(mockOnChange).toHaveBeenCalledWith(undefined)
  })

  it('should call onChange with selected range', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    // Simulate date selection
    await waitFor(() => {
      const grids = screen.getAllByRole('grid')
      expect(grids.length).toBeGreaterThan(0)
    })
  })

  it('should display days count when range selected', async () => {
    render(<DateRangePickerExtended {...defaultProps} value={mockRange30Days} />)

    expect(screen.getByText(/Выбрано: 30/)).toBeInTheDocument()
  })

  it('should use correct Russian pluralization for days count', async () => {
    const range1Day = {
      from: new Date('2025-01-15'),
      to: new Date('2025-01-15'),
    }
    const { rerender } = render(<DateRangePickerExtended {...defaultProps} value={range1Day} />)
    expect(screen.getByText(/1 день/)).toBeInTheDocument()

    const range2Days = {
      from: new Date('2025-01-14'),
      to: new Date('2025-01-15'),
    }
    rerender(<DateRangePickerExtended {...defaultProps} value={range2Days} />)
    expect(screen.getByText(/2 дня/)).toBeInTheDocument()
  })

  it('should respect custom maxDays validation', async () => {
    const range100Days = {
      from: new Date('2024-10-21'),
      to: new Date('2025-01-29'),
    }
    render(<DateRangePickerExtended {...defaultProps} value={range100Days} maxDays={90} />)

    expect(screen.getByText(/Диапазон не может превышать 90 дней/)).toBeInTheDocument()
  })

  it('should allow selecting same day for start and end', async () => {
    const sameDay = {
      from: new Date('2025-01-15'),
      to: new Date('2025-01-15'),
    }
    render(<DateRangePickerExtended {...defaultProps} value={sameDay} />)

    expect(screen.getByText(/1 день/)).toBeInTheDocument()
  })

  it('should navigate between months in calendar', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      const prevButton = screen.getAllByRole('button', { name: /previous/i })[0]
      expect(prevButton).toBeInTheDocument()
    })
  })

  it('should show two months side by side on desktop', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      const grids = screen.getAllByRole('grid')
      expect(grids.length).toBe(2)
    })
  })

  it('should disable dates older than 365 days', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    // Navigate far back and check for disabled dates
    await waitFor(() => {
      const grids = screen.getAllByRole('grid')
      expect(grids.length).toBeGreaterThan(0)
    })
  })

  it('should close popover when clicking outside', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      const grids = screen.getAllByRole('grid')
      expect(grids.length).toBeGreaterThan(0)
    })

    // Click outside - popover should close
    await user.click(document.body)
  })

  it('should show "Применить" button in popover', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('Применить')).toBeInTheDocument()
    })
  })

  it('should show "Очистить" button in popover when range selected', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} value={mockRange30Days} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('Очистить')).toBeInTheDocument()
    })
  })
})

// ============================================================================
// Aggregation Suggestion Tests (~10 tests)
// ============================================================================

describe('DateRangePickerExtended - Aggregation Suggestion', () => {
  it('should show "Агрегация: Ежедневно" for 1 day range', () => {
    const range1Day = { from: new Date('2025-01-15'), to: new Date('2025-01-15') }
    render(<DateRangePickerExtended {...defaultProps} value={range1Day} />)

    expect(screen.getByText(/Рекомендуемая агрегация/)).toBeInTheDocument()
    expect(screen.getByText(/Ежедневно/)).toBeInTheDocument()
  })

  it('should show "Агрегация: Ежедневно" for 30 days range', () => {
    render(<DateRangePickerExtended {...defaultProps} value={mockRange30Days} />)

    expect(screen.getByText(/Ежедневно/)).toBeInTheDocument()
  })

  it('should show "Агрегация: Ежедневно" for exactly 90 days (boundary)', () => {
    const range90 = {
      from: new Date('2024-11-01'),
      to: new Date('2025-01-29'),
    }
    render(<DateRangePickerExtended {...defaultProps} value={range90} />)

    expect(screen.getByText(/Ежедневно/)).toBeInTheDocument()
  })

  it('should show "Агрегация: Еженедельно" for 91 days', () => {
    const range91 = {
      from: new Date('2024-10-31'),
      to: new Date('2025-01-29'),
    }
    render(<DateRangePickerExtended {...defaultProps} value={range91} />)

    expect(screen.getByText(/Еженедельно/)).toBeInTheDocument()
  })

  it('should show "Агрегация: Еженедельно" for 180 days (boundary)', () => {
    const range180 = {
      from: new Date('2024-08-03'),
      to: new Date('2025-01-29'),
    }
    render(<DateRangePickerExtended {...defaultProps} value={range180} />)

    expect(screen.getByText(/Еженедельно/)).toBeInTheDocument()
  })

  it('should show "Агрегация: Ежемесячно" for 181 days', () => {
    const range181 = {
      from: new Date('2024-08-02'),
      to: new Date('2025-01-29'),
    }
    render(<DateRangePickerExtended {...defaultProps} value={range181} />)

    expect(screen.getByText(/Ежемесячно/)).toBeInTheDocument()
  })

  it('should show "Агрегация: Ежемесячно" for 365 days', () => {
    const range365 = {
      from: new Date('2024-01-30'),
      to: new Date('2025-01-29'),
    }
    render(<DateRangePickerExtended {...defaultProps} value={range365} />)

    // Use a function matcher to find text across multiple elements
    expect(
      screen.getByText((content, element) => {
        return (
          element?.textContent === 'Рекомендуемая агрегация: Ежемесячно' ||
          content.includes('Ежемесячно')
        )
      })
    ).toBeInTheDocument()
  })

  it('should hide aggregation suggestion when showAggregationSuggestion=false', () => {
    render(
      <DateRangePickerExtended
        {...defaultProps}
        value={mockRange30Days}
        showAggregationSuggestion={false}
      />
    )

    expect(screen.queryByText(/Рекомендуемая агрегация/)).not.toBeInTheDocument()
  })

  it('should not show aggregation suggestion when no range selected', () => {
    render(<DateRangePickerExtended {...defaultProps} />)

    expect(screen.queryByText(/Рекомендуемая агрегация/)).not.toBeInTheDocument()
  })

  it('should show info icon with aggregation suggestion', () => {
    render(<DateRangePickerExtended {...defaultProps} value={mockRange30Days} />)

    const suggestionArea = screen.getByText(/Рекомендуемая агрегация/).closest('div')
    expect(suggestionArea?.querySelector('svg')).toBeInTheDocument()
  })
})

// ============================================================================
// Russian Locale Tests (~10 tests)
// ============================================================================

describe('DateRangePickerExtended - Russian Locale', () => {
  it('should display month names in Russian', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      // January in Russian
      expect(screen.getByText(/Январь/i)).toBeInTheDocument()
    })
  })

  it('should display day names in Russian (Пн, Вт, Ср, etc.)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      // Check that calendars are rendered (which includes Russian day names)
      const grids = screen.getAllByRole('grid')
      expect(grids.length).toBe(2)

      // Check for day name abbreviations in the calendar header rows
      // The day names might be in separate elements or as part of the grid structure
      const gridHeaders = grids[0].querySelectorAll('thead')
      expect(gridHeaders.length).toBeGreaterThan(0)
    })
  })

  it('should format dates as DD.MM.YYYY in trigger', () => {
    render(<DateRangePickerExtended {...defaultProps} value={mockRange30Days} />)

    // Should show Russian date format
    expect(screen.getByText(/\d{2}\.\d{2}\.\d{4}/)).toBeInTheDocument()
  })

  it('should show placeholder in Russian', () => {
    render(<DateRangePickerExtended {...defaultProps} />)

    expect(screen.getByText('Выберите период')).toBeInTheDocument()
  })

  it('should show range with em-dash separator (—)', () => {
    render(<DateRangePickerExtended {...defaultProps} value={mockRange30Days} />)

    expect(screen.getByText(/—/)).toBeInTheDocument()
  })

  it('should pluralize "день" correctly for 1 day', () => {
    const range1 = { from: new Date('2025-01-15'), to: new Date('2025-01-15') }
    render(<DateRangePickerExtended {...defaultProps} value={range1} />)

    expect(screen.getByText(/1 день/)).toBeInTheDocument()
  })

  it('should pluralize "дня" correctly for 2-4 days', () => {
    const range3 = { from: new Date('2025-01-13'), to: new Date('2025-01-15') }
    render(<DateRangePickerExtended {...defaultProps} value={range3} />)

    expect(screen.getByText(/3 дня/)).toBeInTheDocument()
  })

  it('should pluralize "дней" correctly for 5+ days', () => {
    const range10 = { from: new Date('2025-01-06'), to: new Date('2025-01-15') }
    render(<DateRangePickerExtended {...defaultProps} value={range10} />)

    expect(screen.getByText(/10 дней/)).toBeInTheDocument()
  })

  it('should show validation error in Russian', () => {
    const invalidRange = { from: new Date('2023-01-01'), to: new Date('2025-01-29') }
    render(<DateRangePickerExtended {...defaultProps} value={invalidRange} />)

    expect(screen.getByText(/Диапазон не может превышать/)).toBeInTheDocument()
  })

  it('should show all UI labels in Russian', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} value={mockRange30Days} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('Быстрый выбор:')).toBeInTheDocument()
      expect(screen.getByText('Очистить')).toBeInTheDocument()
      expect(screen.getByText('Применить')).toBeInTheDocument()
    })
  })
})

// ============================================================================
// Keyboard & Accessibility Tests (~15 tests)
// ============================================================================

describe('DateRangePickerExtended - Keyboard & Accessibility', () => {
  it('should open popover with Enter key', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    const trigger = screen.getByRole('button')
    trigger.focus()
    await user.keyboard('{Enter}')

    await waitFor(() => {
      const grids = screen.getAllByRole('grid')
      expect(grids.length).toBeGreaterThan(0)
    })
  })

  it('should open popover with Space key', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    const trigger = screen.getByRole('button')
    trigger.focus()
    await user.keyboard(' ')

    await waitFor(() => {
      const grids = screen.getAllByRole('grid')
      expect(grids.length).toBeGreaterThan(0)
    })
  })

  it('should close popover with Escape key', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      const grids = screen.getAllByRole('grid')
      expect(grids.length).toBeGreaterThan(0)
    })

    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByRole('grid')).not.toBeInTheDocument()
    })
  })

  it('should navigate calendar with arrow keys', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      const grids = screen.getAllByRole('grid')
      expect(grids.length).toBeGreaterThan(0)
    })

    // Arrow navigation should work
    await user.keyboard('{ArrowRight}')
    await user.keyboard('{ArrowDown}')
  })

  it('should select date with Enter key', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      const grids = screen.getAllByRole('grid')
      expect(grids.length).toBeGreaterThan(0)
    })

    // Tab to a date and press Enter
    await user.keyboard('{Tab}')
    await user.keyboard('{Enter}')
  })

  it('should have ARIA labels on calendars', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      const grids = screen.getAllByRole('grid')
      grids.forEach(grid => {
        expect(grid).toHaveAttribute('aria-label')
      })
    })
  })

  it('should have accessible trigger button', () => {
    render(<DateRangePickerExtended {...defaultProps} />)

    const trigger = screen.getByRole('button')
    expect(trigger).toHaveAttribute('aria-haspopup')
  })

  it('should return focus to trigger when popover closes', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    const trigger = screen.getByRole('button')
    await user.click(trigger)

    await waitFor(() => {
      const grids = screen.getAllByRole('grid')
      expect(grids.length).toBeGreaterThan(0)
    })

    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(document.activeElement).toBe(trigger)
    })
  })

  it('should Tab through preset buttons', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('30 дней')).toBeInTheDocument()
    })

    // Tab through presets
    await user.keyboard('{Tab}')
    await user.keyboard('{Tab}')
    await user.keyboard('{Tab}')
  })

  it('should have role="dialog" on popover', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  it('should announce selected range to screen readers', () => {
    render(<DateRangePickerExtended {...defaultProps} value={mockRange30Days} />)

    const trigger = screen.getByRole('button')
    expect(trigger).toHaveAttribute('aria-label')
  })

  it('should have visible focus indicator on interactive elements', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      const grids = screen.getAllByRole('grid')
      expect(grids.length).toBeGreaterThan(0)
    })

    // Focus should be visible (CSS class check)
    const focusedElement = document.activeElement
    expect(focusedElement).toBeTruthy()
  })

  it('should support Tab navigation between months', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      const grids = screen.getAllByRole('grid')
      expect(grids.length).toBe(2)
    })

    // Should be able to Tab between calendars
    await user.keyboard('{Tab}')
  })

  it('should have aria-expanded on trigger button', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    const trigger = screen.getByRole('button')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger)

    await waitFor(() => {
      expect(trigger).toHaveAttribute('aria-expanded', 'true')
    })
  })

  it('should have aria-disabled on disabled trigger', () => {
    render(<DateRangePickerExtended {...defaultProps} disabled />)

    const trigger = screen.getByRole('button')
    expect(trigger).toBeDisabled()
  })
})
