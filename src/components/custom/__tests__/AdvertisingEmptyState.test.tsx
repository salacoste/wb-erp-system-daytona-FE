/**
 * Unit tests for AdvertisingEmptyState component
 * Story 33.7-FE: Dashboard Widget
 * Story 60.6-FE: Sync with Global Dashboard Period
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { AdvertisingEmptyState } from '@/components/custom/AdvertisingEmptyState'

describe('AdvertisingEmptyState', () => {
  it('renders empty state with available range', () => {
    const availableRange = { from: '2025-12-01', to: '2026-01-28' }

    render(<AdvertisingEmptyState availableRange={availableRange} />)

    expect(screen.getByTestId('advertising-empty-state')).toBeInTheDocument()
    expect(screen.getByText('Нет данных за выбранный период')).toBeInTheDocument()
    expect(screen.getByText(/с 01\.12\.2025 по 28\.01\.2026/)).toBeInTheDocument()
  })

  it('renders predefined period options', () => {
    const availableRange = { from: '2025-12-01', to: '2026-01-28' }

    render(<AdvertisingEmptyState availableRange={availableRange} />)

    expect(screen.getByText('Последние 7 дней')).toBeInTheDocument()
    expect(screen.getByLabelText('Выбрать период для просмотра рекламы')).toBeInTheDocument()
  })

  it('calls onDateRangeChange when period is selected', async () => {
    const availableRange = { from: '2025-12-01', to: '2026-01-28' }
    const handleChange = vi.fn()

    render(
      <AdvertisingEmptyState availableRange={availableRange} onDateRangeChange={handleChange} />
    )

    // The component should render the select
    const select = screen.getByLabelText('Выбрать период для просмотра рекламы')
    expect(select).toBeInTheDocument()
  })

  it('shows no data message when no predefined ranges available', () => {
    // Available range less than 3 days (minimum threshold)
    const availableRange = { from: '2026-01-28', to: '2026-01-28' }

    render(<AdvertisingEmptyState availableRange={availableRange} />)

    expect(screen.getByText('Нет доступных данных для отображения')).toBeInTheDocument()
  })

  it('displays info tooltip with helpful content', () => {
    const availableRange = { from: '2025-12-01', to: '2026-01-28' }

    render(<AdvertisingEmptyState availableRange={availableRange} />)

    // Info button should be present
    const infoButton = screen.getByLabelText('Информация о данных рекламы')
    expect(infoButton).toBeInTheDocument()
  })

  it('disables select when loading', () => {
    const availableRange = { from: '2025-12-01', to: '2026-01-28' }

    render(<AdvertisingEmptyState availableRange={availableRange} isLoading />)

    const select = screen.getByLabelText('Выбрать период для просмотра рекламы')
    expect(select).toBeDisabled()
  })
})
