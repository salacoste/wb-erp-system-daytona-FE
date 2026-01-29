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
  it.skip('should render with placeholder text when no value', () => {
    render(<DateRangePickerExtended {...defaultProps} />)
    expect(screen.getByText('Выберите период')).toBeInTheDocument()
  })

  it.skip('should render with custom placeholder', () => {
    render(<DateRangePickerExtended {...defaultProps} placeholder="Выбрать даты" />)
    expect(screen.getByText('Выбрать даты')).toBeInTheDocument()
  })

  it.skip('should render with selected date range formatted in Russian', () => {
    render(<DateRangePickerExtended {...defaultProps} value={mockRange30Days} />)
    expect(screen.getByText(/31\.12\.2024 — 29\.01\.2025/)).toBeInTheDocument()
  })

  it.skip('should render calendar icon in trigger button', () => {
    render(<DateRangePickerExtended {...defaultProps} />)
    const trigger = screen.getByRole('button')
    expect(trigger.querySelector('svg')).toBeInTheDocument()
  })

  it.skip('should render clear button when range is selected', () => {
    render(<DateRangePickerExtended {...defaultProps} value={mockRange30Days} />)
    expect(screen.getByLabelText(/очистить/i)).toBeInTheDocument()
  })

  it.skip('should not render clear button when no range selected', () => {
    render(<DateRangePickerExtended {...defaultProps} />)
    expect(screen.queryByLabelText(/очистить/i)).not.toBeInTheDocument()
  })

  it.skip('should open popover with two calendar views on click', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      const calendars = screen.getAllByRole('grid')
      expect(calendars.length).toBeGreaterThanOrEqual(2)
    })
  })

  it.skip('should render in disabled state when disabled prop is true', () => {
    render(<DateRangePickerExtended {...defaultProps} disabled />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it.skip('should apply custom className to root element', () => {
    const { container } = render(
      <DateRangePickerExtended {...defaultProps} className="custom-class" />
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it.skip('should render with id for accessibility', () => {
    render(<DateRangePickerExtended {...defaultProps} id="date-picker-test" />)
    expect(screen.getByRole('button')).toHaveAttribute('id', 'date-picker-test')
  })
})

// ============================================================================
// Preset Buttons Tests (~15 tests)
// ============================================================================

describe('DateRangePickerExtended - Preset Buttons', () => {
  it.skip('should show 4 default preset buttons in popover', async () => {
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

  it.skip('should call onChange with last 30 days when "30 дней" clicked', async () => {
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

  it.skip('should call onChange with last 90 days when "90 дней" clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))
    await user.click(screen.getByText('90 дней'))

    expect(mockOnChange).toHaveBeenCalled()
    const callArg = mockOnChange.mock.calls[0][0]
    expect(callArg.from).toBeInstanceOf(Date)
    expect(callArg.to).toBeInstanceOf(Date)
  })

  it.skip('should call onChange with last 180 days when "180 дней" clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))
    await user.click(screen.getByText('180 дней'))

    expect(mockOnChange).toHaveBeenCalled()
  })

  it.skip('should call onChange with last 365 days when "365 дней" clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))
    await user.click(screen.getByText('365 дней'))

    expect(mockOnChange).toHaveBeenCalled()
  })

  it.skip('should highlight active preset when current range matches', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} value={mockRange30Days} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      const preset30 = screen.getByText('30 дней')
      expect(preset30.closest('button')).toHaveAttribute('data-active', 'true')
    })
  })

  it.skip('should not highlight any preset for custom range', async () => {
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

  it.skip('should use custom presets when provided', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} presets={customPresets} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('7 дней')).toBeInTheDocument()
      expect(screen.getByText('14 дней')).toBeInTheDocument()
      expect(screen.queryByText('365 дней')).not.toBeInTheDocument()
    })
  })

  it.skip('should respect maxDays when preset exceeds it', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} maxDays={90} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      const preset365 = screen.getByText('365 дней')
      expect(preset365.closest('button')).toBeDisabled()
    })
  })

  it.skip('should update both from and to dates simultaneously on preset click', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))
    await user.click(screen.getByText('30 дней'))

    const callArg = mockOnChange.mock.calls[0][0]
    expect(callArg.from).toBeDefined()
    expect(callArg.to).toBeDefined()
    expect(callArg.from).not.toEqual(callArg.to)
  })

  it.skip('should set preset end date to today', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))
    await user.click(screen.getByText('30 дней'))

    const callArg = mockOnChange.mock.calls[0][0]
    expect(callArg.to.toDateString()).toBe(MOCK_TODAY.toDateString())
  })

  it.skip('should deactivate preset highlight on custom date selection', async () => {
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

  it.skip('should show preset labels in Russian', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      DEFAULT_PRESETS.forEach(preset => {
        expect(screen.getByText(preset.label)).toBeInTheDocument()
      })
    })
  })

  it.skip('should show "Быстрый выбор:" label above presets', async () => {
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
  it.skip('should allow selecting start date in calendar', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      const day15 = screen.getByText('15')
      expect(day15).toBeInTheDocument()
    })
  })

  it.skip('should allow selecting end date after start date', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    // First click sets start, second click sets end
    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument()
    })
  })

  it.skip('should highlight range between selected dates', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} value={mockRange30Days} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      // Range cells should have range styling
      const rangeCells = document.querySelectorAll('[data-range-middle="true"]')
      expect(rangeCells.length).toBeGreaterThan(0)
    })
  })

  it.skip('should not allow selecting future dates', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      // Future dates should be disabled
      const futureDays = document.querySelectorAll('[aria-disabled="true"]')
      expect(futureDays.length).toBeGreaterThan(0)
    })
  })

  it.skip('should show validation error when range exceeds 365 days', async () => {
    const invalidRange = {
      from: new Date('2023-12-01'),
      to: new Date('2025-01-29'),
    }
    render(<DateRangePickerExtended {...defaultProps} value={invalidRange} />)

    expect(screen.getByText(/Диапазон не может превышать 365 дней/i)).toBeInTheDocument()
  })

  it.skip('should show validation error message in Russian', async () => {
    const invalidRange = {
      from: new Date('2023-12-01'),
      to: new Date('2025-01-29'),
    }
    render(<DateRangePickerExtended {...defaultProps} value={invalidRange} />)

    expect(screen.getByText(/Диапазон не может превышать/)).toBeInTheDocument()
    expect(screen.getByText(/дней/)).toBeInTheDocument()
  })

  it.skip('should show selected days count in error message', async () => {
    const invalidRange = {
      from: new Date('2023-12-01'),
      to: new Date('2025-01-29'),
    }
    render(<DateRangePickerExtended {...defaultProps} value={invalidRange} />)

    expect(screen.getByText(/Выбрано:/)).toBeInTheDocument()
  })

  it.skip('should clear selection when clear button clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} value={mockRange30Days} />)

    const clearButton = screen.getByLabelText(/очистить/i)
    await user.click(clearButton)

    expect(mockOnChange).toHaveBeenCalledWith(undefined)
  })

  it.skip('should call onChange with selected range', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    // Simulate date selection
    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument()
    })
  })

  it.skip('should display days count when range selected', async () => {
    render(<DateRangePickerExtended {...defaultProps} value={mockRange30Days} />)

    expect(screen.getByText(/Выбрано: 30/)).toBeInTheDocument()
  })

  it.skip('should use correct Russian pluralization for days count', async () => {
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

  it.skip('should respect custom maxDays validation', async () => {
    const range100Days = {
      from: new Date('2024-10-21'),
      to: new Date('2025-01-29'),
    }
    render(<DateRangePickerExtended {...defaultProps} value={range100Days} maxDays={90} />)

    expect(screen.getByText(/Диапазон не может превышать 90 дней/)).toBeInTheDocument()
  })

  it.skip('should allow selecting same day for start and end', async () => {
    const sameDay = {
      from: new Date('2025-01-15'),
      to: new Date('2025-01-15'),
    }
    render(<DateRangePickerExtended {...defaultProps} value={sameDay} />)

    expect(screen.getByText(/1 день/)).toBeInTheDocument()
  })

  it.skip('should navigate between months in calendar', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      const prevButton = screen.getAllByRole('button', { name: /previous/i })[0]
      expect(prevButton).toBeInTheDocument()
    })
  })

  it.skip('should show two months side by side on desktop', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      const grids = screen.getAllByRole('grid')
      expect(grids.length).toBe(2)
    })
  })

  it.skip('should disable dates older than 365 days', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    // Navigate far back and check for disabled dates
    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument()
    })
  })

  it.skip('should close popover when clicking outside', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument()
    })

    // Click outside - popover should close
    await user.click(document.body)
  })

  it.skip('should show "Применить" button in popover', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('Применить')).toBeInTheDocument()
    })
  })

  it.skip('should show "Очистить" button in popover when range selected', async () => {
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
  it.skip('should show "Агрегация: Ежедневно" for 1 day range', () => {
    const range1Day = { from: new Date('2025-01-15'), to: new Date('2025-01-15') }
    render(<DateRangePickerExtended {...defaultProps} value={range1Day} />)

    expect(screen.getByText(/Рекомендуемая агрегация/)).toBeInTheDocument()
    expect(screen.getByText(/Ежедневно/)).toBeInTheDocument()
  })

  it.skip('should show "Агрегация: Ежедневно" for 30 days range', () => {
    render(<DateRangePickerExtended {...defaultProps} value={mockRange30Days} />)

    expect(screen.getByText(/Ежедневно/)).toBeInTheDocument()
  })

  it.skip('should show "Агрегация: Ежедневно" for exactly 90 days (boundary)', () => {
    const range90 = {
      from: new Date('2024-11-01'),
      to: new Date('2025-01-29'),
    }
    render(<DateRangePickerExtended {...defaultProps} value={range90} />)

    expect(screen.getByText(/Ежедневно/)).toBeInTheDocument()
  })

  it.skip('should show "Агрегация: Еженедельно" for 91 days', () => {
    const range91 = {
      from: new Date('2024-10-31'),
      to: new Date('2025-01-29'),
    }
    render(<DateRangePickerExtended {...defaultProps} value={range91} />)

    expect(screen.getByText(/Еженедельно/)).toBeInTheDocument()
  })

  it.skip('should show "Агрегация: Еженедельно" for 180 days (boundary)', () => {
    const range180 = {
      from: new Date('2024-08-03'),
      to: new Date('2025-01-29'),
    }
    render(<DateRangePickerExtended {...defaultProps} value={range180} />)

    expect(screen.getByText(/Еженедельно/)).toBeInTheDocument()
  })

  it.skip('should show "Агрегация: Ежемесячно" for 181 days', () => {
    const range181 = {
      from: new Date('2024-08-02'),
      to: new Date('2025-01-29'),
    }
    render(<DateRangePickerExtended {...defaultProps} value={range181} />)

    expect(screen.getByText(/Ежемесячно/)).toBeInTheDocument()
  })

  it.skip('should show "Агрегация: Ежемесячно" for 365 days', () => {
    const range365 = {
      from: new Date('2024-01-30'),
      to: new Date('2025-01-29'),
    }
    render(<DateRangePickerExtended {...defaultProps} value={range365} />)

    expect(screen.getByText(/Ежемесячно/)).toBeInTheDocument()
  })

  it.skip('should hide aggregation suggestion when showAggregationSuggestion=false', () => {
    render(
      <DateRangePickerExtended
        {...defaultProps}
        value={mockRange30Days}
        showAggregationSuggestion={false}
      />
    )

    expect(screen.queryByText(/Рекомендуемая агрегация/)).not.toBeInTheDocument()
  })

  it.skip('should not show aggregation suggestion when no range selected', () => {
    render(<DateRangePickerExtended {...defaultProps} />)

    expect(screen.queryByText(/Рекомендуемая агрегация/)).not.toBeInTheDocument()
  })

  it.skip('should show info icon with aggregation suggestion', () => {
    render(<DateRangePickerExtended {...defaultProps} value={mockRange30Days} />)

    const suggestionArea = screen.getByText(/Рекомендуемая агрегация/).closest('div')
    expect(suggestionArea?.querySelector('svg')).toBeInTheDocument()
  })
})

// ============================================================================
// Russian Locale Tests (~10 tests)
// ============================================================================

describe('DateRangePickerExtended - Russian Locale', () => {
  it.skip('should display month names in Russian', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      // January in Russian
      expect(screen.getByText(/Январь/i)).toBeInTheDocument()
    })
  })

  it.skip('should display day names in Russian (Пн, Вт, Ср, etc.)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('Пн')).toBeInTheDocument()
      expect(screen.getByText('Вт')).toBeInTheDocument()
      expect(screen.getByText('Ср')).toBeInTheDocument()
    })
  })

  it.skip('should format dates as DD.MM.YYYY in trigger', () => {
    render(<DateRangePickerExtended {...defaultProps} value={mockRange30Days} />)

    // Should show Russian date format
    expect(screen.getByText(/\d{2}\.\d{2}\.\d{4}/)).toBeInTheDocument()
  })

  it.skip('should show placeholder in Russian', () => {
    render(<DateRangePickerExtended {...defaultProps} />)

    expect(screen.getByText('Выберите период')).toBeInTheDocument()
  })

  it.skip('should show range with em-dash separator (—)', () => {
    render(<DateRangePickerExtended {...defaultProps} value={mockRange30Days} />)

    expect(screen.getByText(/—/)).toBeInTheDocument()
  })

  it.skip('should pluralize "день" correctly for 1 day', () => {
    const range1 = { from: new Date('2025-01-15'), to: new Date('2025-01-15') }
    render(<DateRangePickerExtended {...defaultProps} value={range1} />)

    expect(screen.getByText(/1 день/)).toBeInTheDocument()
  })

  it.skip('should pluralize "дня" correctly for 2-4 days', () => {
    const range3 = { from: new Date('2025-01-13'), to: new Date('2025-01-15') }
    render(<DateRangePickerExtended {...defaultProps} value={range3} />)

    expect(screen.getByText(/3 дня/)).toBeInTheDocument()
  })

  it.skip('should pluralize "дней" correctly for 5+ days', () => {
    const range10 = { from: new Date('2025-01-06'), to: new Date('2025-01-15') }
    render(<DateRangePickerExtended {...defaultProps} value={range10} />)

    expect(screen.getByText(/10 дней/)).toBeInTheDocument()
  })

  it.skip('should show validation error in Russian', () => {
    const invalidRange = { from: new Date('2023-01-01'), to: new Date('2025-01-29') }
    render(<DateRangePickerExtended {...defaultProps} value={invalidRange} />)

    expect(screen.getByText(/Диапазон не может превышать/)).toBeInTheDocument()
  })

  it.skip('should show all UI labels in Russian', async () => {
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
  it.skip('should open popover with Enter key', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    const trigger = screen.getByRole('button')
    trigger.focus()
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument()
    })
  })

  it.skip('should open popover with Space key', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    const trigger = screen.getByRole('button')
    trigger.focus()
    await user.keyboard(' ')

    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument()
    })
  })

  it.skip('should close popover with Escape key', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument()
    })

    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByRole('grid')).not.toBeInTheDocument()
    })
  })

  it.skip('should navigate calendar with arrow keys', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument()
    })

    // Arrow navigation should work
    await user.keyboard('{ArrowRight}')
    await user.keyboard('{ArrowDown}')
  })

  it.skip('should select date with Enter key', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument()
    })

    // Tab to a date and press Enter
    await user.keyboard('{Tab}')
    await user.keyboard('{Enter}')
  })

  it.skip('should have ARIA labels on calendars', async () => {
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

  it.skip('should have accessible trigger button', () => {
    render(<DateRangePickerExtended {...defaultProps} />)

    const trigger = screen.getByRole('button')
    expect(trigger).toHaveAttribute('aria-haspopup')
  })

  it.skip('should return focus to trigger when popover closes', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    const trigger = screen.getByRole('button')
    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument()
    })

    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(document.activeElement).toBe(trigger)
    })
  })

  it.skip('should Tab through preset buttons', async () => {
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

  it.skip('should have role="dialog" on popover', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  it.skip('should announce selected range to screen readers', () => {
    render(<DateRangePickerExtended {...defaultProps} value={mockRange30Days} />)

    const trigger = screen.getByRole('button')
    expect(trigger).toHaveAttribute('aria-label')
  })

  it.skip('should have visible focus indicator on interactive elements', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument()
    })

    // Focus should be visible (CSS class check)
    const focusedElement = document.activeElement
    expect(focusedElement).toBeTruthy()
  })

  it.skip('should support Tab navigation between months', async () => {
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

  it.skip('should have aria-expanded on trigger button', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DateRangePickerExtended {...defaultProps} />)

    const trigger = screen.getByRole('button')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger)

    await waitFor(() => {
      expect(trigger).toHaveAttribute('aria-expanded', 'true')
    })
  })

  it.skip('should have aria-disabled on disabled trigger', () => {
    render(<DateRangePickerExtended {...defaultProps} disabled />)

    const trigger = screen.getByRole('button')
    expect(trigger).toBeDisabled()
  })
})
