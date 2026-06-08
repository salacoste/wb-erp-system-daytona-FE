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
    demandSource: 'ml',
    orderByDate: '2026-06-15',
    stockoutDate: '2026-06-20',
    totalReorderValue: 15000,
    status: 'pending',
  },
  {
    id: 'rec-2',
    nmId: 67890,
    recommendedQty: 20,
    currentStock: 2,
    demandSource: 'velocity',
    orderByDate: null,
    stockoutDate: null,
    totalReorderValue: null,
    status: 'ordered',
  },
]

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
