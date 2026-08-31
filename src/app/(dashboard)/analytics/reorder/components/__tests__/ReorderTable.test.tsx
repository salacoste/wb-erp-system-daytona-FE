/**
 * ReorderTable Unit Tests
 *
 * Verifies reorder recommendations table:
 * - Renders loading skeletons when isLoading
 * - Renders empty message when no data
 * - Renders table rows with data
 * - Shows status badges correctly
 * - Shows action buttons per status
 */

import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { ReorderTable } from '../ReorderTable'
import type { ReorderRecommendation } from '@/types/reorder-recommendations'

const mockData: ReorderRecommendation[] = [
  {
    id: 'rec-1',
    nmId: 12345,
    recommendedQty: 10,
    currentStock: 5,
    inTransitQty: 0,
    avgDailyDemand: 2,
    leadTimeDays: 7,
    coverageDays: 3,
    demandSource: 'ml',
    orderByDate: '2026-06-15',
    stockoutDate: '2026-06-20',
    unitCostRub: 1500,
    totalReorderValue: 15000,
    computedAt: '2026-06-08T12:00:00Z',
    status: 'pending',
  },
  {
    id: 'rec-2',
    nmId: 67890,
    recommendedQty: 20,
    currentStock: 2,
    inTransitQty: 5,
    avgDailyDemand: 3,
    leadTimeDays: 5,
    coverageDays: 1,
    demandSource: 'velocity',
    orderByDate: null,
    stockoutDate: null,
    unitCostRub: null,
    totalReorderValue: null,
    computedAt: '2026-06-08T12:00:00Z',
    status: 'ordered',
  },
]

// 168.8: helper — single-row item with status override (behavior-lock for badge chips)
const makeItem = (status: ReorderRecommendation['status']): ReorderRecommendation => ({
  ...mockData[0],
  id: `rec-${status}`,
  status,
})

describe('ReorderTable', () => {
  it('renders loading state', () => {
    const { container } = renderWithProviders(
      <ReorderTable
        data={[]}
        isLoading={true}
        onMarkOrdered={vi.fn()}
        onMarkReceived={vi.fn()}
        isUpdating={false}
      />
    )
    // Skeleton uses animate-pulse class
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders empty message when no data', () => {
    renderWithProviders(
      <ReorderTable
        data={[]}
        isLoading={false}
        onMarkOrdered={vi.fn()}
        onMarkReceived={vi.fn()}
        isUpdating={false}
      />
    )
    expect(screen.getByText('Нет рекомендаций по пополнению')).toBeInTheDocument()
  })

  it('renders table rows with data', () => {
    renderWithProviders(
      <ReorderTable
        data={mockData}
        isLoading={false}
        onMarkOrdered={vi.fn()}
        onMarkReceived={vi.fn()}
        isUpdating={false}
      />
    )
    expect(screen.getByText('12345')).toBeInTheDocument()
    expect(screen.getByText('67890')).toBeInTheDocument()
  })

  it('renders column headers', () => {
    renderWithProviders(
      <ReorderTable
        data={[]}
        isLoading={false}
        onMarkOrdered={vi.fn()}
        onMarkReceived={vi.fn()}
        isUpdating={false}
      />
    )
    expect(screen.getByText('Артикул')).toBeInTheDocument()
    expect(screen.getByText('Статус')).toBeInTheDocument()
    expect(screen.getByText('Действия')).toBeInTheDocument()
  })

  it('shows status badges', () => {
    renderWithProviders(
      <ReorderTable
        data={mockData}
        isLoading={false}
        onMarkOrdered={vi.fn()}
        onMarkReceived={vi.fn()}
        isUpdating={false}
      />
    )
    expect(screen.getByText('Ожидает')).toBeInTheDocument()
    // "Заказано" appears as badge AND action button — use getAllByText
    const orderedElements = screen.getAllByText('Заказано')
    expect(orderedElements.length).toBeGreaterThanOrEqual(1)
  })

  it('shows action button for pending status', () => {
    renderWithProviders(
      <ReorderTable
        data={[mockData[0]]}
        isLoading={false}
        onMarkOrdered={vi.fn()}
        onMarkReceived={vi.fn()}
        isUpdating={false}
      />
    )
    expect(screen.getByText('Заказано')).toBeInTheDocument()
  })

  it('shows ML demand source label', () => {
    renderWithProviders(
      <ReorderTable
        data={[mockData[0]]}
        isLoading={false}
        onMarkOrdered={vi.fn()}
        onMarkReceived={vi.fn()}
        isUpdating={false}
      />
    )
    expect(screen.getByText('ML')).toBeInTheDocument()
  })

  it('shows dash for null dates', () => {
    renderWithProviders(
      <ReorderTable
        data={[mockData[1]]}
        isLoading={false}
        onMarkOrdered={vi.fn()}
        onMarkReceived={vi.fn()}
        isUpdating={false}
      />
    )
    // null dates should show dash — multiple dashes in the row
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(1)
  })
})

// ---------------------------------------------------------------------------
// Story 168.8: semantic status chips (shadcn migration)
// ---------------------------------------------------------------------------

describe('ReorderTable — semantic status chips (168.8)', () => {
  const LEGACY_PALETTE_RE =
    /((bg|text|border|ring|divide|fill|stroke|outline)-(red|yellow|blue|green|gray|rose|amber|emerald|sky|orange|slate|zinc|neutral|stone|lime|teal|cyan|indigo|violet|purple|fuchsia|pink)(-\d+)?)/

  const renderRow = (status: ReorderRecommendation['status']) =>
    renderWithProviders(
      <ReorderTable
        data={[makeItem(status)]}
        isLoading={false}
        onMarkOrdered={vi.fn()}
        onMarkReceived={vi.fn()}
        isUpdating={false}
      />
    )

  it('exposes a named table and a keyboard-focusable horizontal scroll region', () => {
    renderRow('pending')
    expect(
      screen.getByRole('table', { name: 'Рекомендации по пополнению запасов' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Рекомендации по пополнению запасов' })
    ).toHaveAttribute('tabindex', '0')
  })

  it.each([
    // 168.8: exact full-class-token pins (classList.contains) — no substring false-pass
    ['pending', 'Ожидает', 'bg-status-warning/15', 'text-foreground'],
    ['ordered', 'Заказано', 'bg-status-information/15', 'text-status-information'],
    ['received', 'Получено', 'bg-status-success/15', 'text-status-success'],
  ] as const)('renders %s badge with semantic classes %s/%s', (status, label, bg, text) => {
    renderRow(status)
    // Badge renders label as direct text child → getByText returns the Badge element
    const badge = screen.getByText(label)
    expect(badge.classList.contains(bg)).toBe(true)
    expect(badge.classList.contains(text)).toBe(true)
  })

  it('keeps expired badge on muted semantic classes (untouched by 168.8)', () => {
    renderRow('expired')
    const badge = screen.getByText('Просрочено')
    expect(badge.classList.contains('bg-muted')).toBe(true)
    expect(badge.classList.contains('text-muted-foreground')).toBe(true)
    // expired must NOT get a status-tinted chip
    expect(badge.classList.contains('bg-status-warning/15')).toBe(false)
  })

  it('renders no legacy palette classes in the table DOM', () => {
    const { container } = renderRow('pending')
    expect(container.innerHTML).not.toMatch(LEGACY_PALETTE_RE)
  })
})
