/**
 * ReorderSummaryCards Unit Tests
 *
 * Verifies reorder summary metric cards:
 * - Renders loading skeletons when isLoading
 * - Renders metric cards with data
 * - Shows dash for null values
 * - Shows sublabel when avg hours available
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { ReorderSummaryCards } from '../ReorderSummaryCards'

describe('ReorderSummaryCards', () => {
  it('renders loading skeletons when isLoading', () => {
    const { container } = renderWithProviders(
      <ReorderSummaryCards metrics={undefined} isLoading={true} />
    )
    // Skeleton uses animate-pulse class
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders metric cards with data', () => {
    renderWithProviders(
      <ReorderSummaryCards
        metrics={{
          totalPending: 5,
          totalOrdered: 3,
          totalReceived: 10,
          reorderCoveragePct: 75,
          avgHoursToOrder: 12,
          avgHoursToReceive: 48,
        }}
        isLoading={false}
      />
    )
    expect(screen.getByText('Ожидают')).toBeInTheDocument()
    expect(screen.getByText('Заказано')).toBeInTheDocument()
    expect(screen.getByText('Получено')).toBeInTheDocument()
    expect(screen.getByText('Покрытие')).toBeInTheDocument()
  })

  it('renders numeric values from metrics', () => {
    renderWithProviders(
      <ReorderSummaryCards
        metrics={{
          totalPending: 5,
          totalOrdered: 3,
          totalReceived: 10,
          reorderCoveragePct: 75,
          avgHoursToOrder: null,
          avgHoursToReceive: null,
        }}
        isLoading={false}
      />
    )
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('shows dash for null coverage', () => {
    renderWithProviders(
      <ReorderSummaryCards
        metrics={{
          totalPending: 0,
          totalOrdered: 0,
          totalReceived: 0,
          reorderCoveragePct: null,
          avgHoursToOrder: null,
          avgHoursToReceive: null,
        }}
        isLoading={false}
      />
    )
    // Coverage card should show dash since pct is null
    const cards = screen.getAllByText('—')
    expect(cards.length).toBeGreaterThanOrEqual(1)
  })

  it('shows sublabel when avgHoursToOrder is provided', () => {
    renderWithProviders(
      <ReorderSummaryCards
        metrics={{
          totalPending: 5,
          totalOrdered: 3,
          totalReceived: 10,
          reorderCoveragePct: 75,
          avgHoursToOrder: 12.5,
          avgHoursToReceive: 48,
        }}
        isLoading={false}
      />
    )
    // Math.round(12.5) = 13
    expect(screen.getByText(/Ср\. 13 ч до заказа/)).toBeInTheDocument()
    expect(screen.getByText(/Ср\. 48 ч до получения/)).toBeInTheDocument()
  })
})
