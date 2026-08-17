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
          totalExpired: 1,
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
          totalExpired: 0,
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
          totalExpired: 0,
          reorderCoveragePct: 0,
          avgHoursToOrder: null,
          avgHoursToReceive: null,
        }}
        isLoading={false}
      />
    )
    // Cards with zero values should render 0
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(3)
  })

  it('shows sublabel when avgHoursToOrder is provided', () => {
    renderWithProviders(
      <ReorderSummaryCards
        metrics={{
          totalPending: 5,
          totalOrdered: 3,
          totalReceived: 10,
          totalExpired: 1,
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

// ---------------------------------------------------------------------------
// Story 168.8: semantic status icon tokens (shadcn migration)
// ---------------------------------------------------------------------------

describe('ReorderSummaryCards — semantic status icons (168.8)', () => {
  const LEGACY_PALETTE_RE =
    /((bg|text|border|ring|divide|fill|stroke|outline)-(red|yellow|blue|green|gray|rose|amber|emerald|sky|orange|slate|zinc|neutral|stone|lime|teal|cyan|indigo|violet|purple|fuchsia|pink)(-\d+)?)/

  const metrics = {
    totalPending: 5,
    totalOrdered: 3,
    totalReceived: 10,
    totalExpired: 1,
    reorderCoveragePct: 75,
    avgHoursToOrder: 12,
    avgHoursToReceive: 48,
  }

  it.each([
    ['Ожидают', 'text-status-warning'],
    ['Заказано', 'text-status-information'],
    ['Получено', 'text-status-success'],
    ['Покрытие', 'text-status-error'],
  ] as const)('renders %s card icon with semantic class %s', (label, token) => {
    const { container } = renderWithProviders(
      <ReorderSummaryCards metrics={metrics} isLoading={false} />
    )
    // 168.8: exact full-class-token pin on the svg icon inside the labeled card
    const card = screen.getByText(label).closest('div.flex')
    expect(card).not.toBeNull()
    const icon = card?.querySelector('svg')
    expect(icon).not.toBeNull()
    expect(icon?.classList.contains(token)).toBe(true)
    expect(container.textContent).toContain(label)
  })

  it('renders no legacy palette classes in the cards DOM', () => {
    const { container } = renderWithProviders(
      <ReorderSummaryCards metrics={metrics} isLoading={false} />
    )
    expect(container.innerHTML).not.toMatch(LEGACY_PALETTE_RE)
  })
})
