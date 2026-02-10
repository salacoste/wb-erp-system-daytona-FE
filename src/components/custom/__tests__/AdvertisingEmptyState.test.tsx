/**
 * Unit tests for AdvertisingEmptyState component
 * Story 33.7-FE: Dashboard Widget
 * Story 60.6-FE: Sync with Global Dashboard Period
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { format, subDays } from 'date-fns'
import { AdvertisingEmptyState } from '@/components/custom/AdvertisingEmptyState'

/**
 * Build an availableRange that always includes "yesterday" and extends
 * far enough into the past so all predefined periods (7d, 14d, 30d)
 * pass the 3-day minimum threshold.
 */
function buildAvailableRange() {
  const today = new Date()
  const from = subDays(today, 90) // 90 days ago
  const to = subDays(today, 0) // today (includes yesterday)
  return {
    from: format(from, 'yyyy-MM-dd'),
    to: format(to, 'yyyy-MM-dd'),
  }
}

describe('AdvertisingEmptyState', () => {
  it('renders empty state with available range', () => {
    const availableRange = buildAvailableRange()

    render(<AdvertisingEmptyState availableRange={availableRange} />)

    expect(screen.getByTestId('advertising-empty-state')).toBeInTheDocument()
    expect(screen.getByText('Нет данных за выбранный период')).toBeInTheDocument()
    // Verify the range text is displayed (format: DD.MM.YYYY)
    const fromDate = new Date(availableRange.from)
    const toDate = new Date(availableRange.to)
    const fromFormatted = format(fromDate, 'dd.MM.yyyy')
    const toFormatted = format(toDate, 'dd.MM.yyyy')
    expect(
      screen.getByText(
        new RegExp(
          `с ${fromFormatted.replace(/\./g, '\\.')} по ${toFormatted.replace(/\./g, '\\.')}`
        )
      )
    ).toBeInTheDocument()
  })

  it('renders predefined period options', () => {
    const availableRange = buildAvailableRange()

    render(<AdvertisingEmptyState availableRange={availableRange} />)

    // The select trigger should be present with the default selected value
    const select = screen.getByLabelText('Выбрать период для просмотра рекламы')
    expect(select).toBeInTheDocument()
    // The trigger renders the currently selected option (first = 7d).
    // Radix Select renders selected ItemText in the trigger.
    expect(screen.getByText('Последние 7 дней')).toBeInTheDocument()
  })

  it('calls onDateRangeChange when period is selected', async () => {
    const availableRange = buildAvailableRange()
    const handleChange = vi.fn()

    render(
      <AdvertisingEmptyState availableRange={availableRange} onDateRangeChange={handleChange} />
    )

    // The component should render the select
    const select = screen.getByLabelText('Выбрать период для просмотра рекламы')
    expect(select).toBeInTheDocument()
  })

  it('shows no data message when no predefined ranges available', () => {
    // Available range far in the past: all options get filtered out
    const availableRange = { from: '2020-01-01', to: '2020-01-01' }

    render(<AdvertisingEmptyState availableRange={availableRange} />)

    expect(screen.getByText('Нет доступных данных для отображения')).toBeInTheDocument()
  })

  it('displays info tooltip with helpful content', () => {
    const availableRange = buildAvailableRange()

    render(<AdvertisingEmptyState availableRange={availableRange} />)

    // Info button should be present
    const infoButton = screen.getByLabelText('Информация о данных рекламы')
    expect(infoButton).toBeInTheDocument()
  })

  it('disables select when loading', () => {
    const availableRange = buildAvailableRange()

    render(<AdvertisingEmptyState availableRange={availableRange} isLoading />)

    const select = screen.getByLabelText('Выбрать период для просмотра рекламы')
    expect(select).toBeDisabled()
  })
})
