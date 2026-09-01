/**
 * Unit tests for CogsHistoryTable component
 * Story 5.1-fe: View COGS History
 *
 * Reference: frontend/docs/stories/epic-5/story-5.1-fe-cogs-history-view.md
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CogsHistoryTable } from './CogsHistoryTable'
import type { CogsHistoryItem } from '@/types/cogs'
import React from 'react'

// Mock data
const mockData: CogsHistoryItem[] = [
  {
    cogs_id: 'cogs_001',
    nm_id: '12345678',
    unit_cost_rub: 450.0,
    currency: 'RUB',
    valid_from: '2025-11-01',
    valid_to: null,
    source: 'manual',
    notes: 'Current version',
    created_by: 'user_123',
    created_at: '2025-11-01T10:00:00Z',
    updated_at: '2025-11-01T10:00:00Z',
    is_active: true,
    affected_weeks: ['2025-W44', '2025-W45', '2025-W46'],
  },
  {
    cogs_id: 'cogs_002',
    nm_id: '12345678',
    unit_cost_rub: 320.0,
    currency: 'RUB',
    valid_from: '2025-10-01',
    valid_to: '2025-11-01',
    source: 'import',
    notes: null,
    created_by: 'user_123',
    created_at: '2025-10-01T10:00:00Z',
    updated_at: '2025-10-01T10:00:00Z',
    is_active: true,
    affected_weeks: ['2025-W40', '2025-W41', '2025-W42', '2025-W43'],
  },
  {
    cogs_id: 'cogs_003',
    nm_id: '12345678',
    unit_cost_rub: 280.0,
    currency: 'RUB',
    valid_from: '2025-09-01',
    valid_to: '2025-10-01',
    source: 'system',
    notes: 'Deleted record',
    created_by: 'user_123',
    created_at: '2025-09-01T10:00:00Z',
    updated_at: '2025-09-15T10:00:00Z',
    is_active: false,
    affected_weeks: ['2025-W36', '2025-W37', '2025-W38', '2025-W39'],
  },
]

// Helper to create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

const defaultProps = {
  data: mockData.filter(d => d.is_active),
  includeDeleted: false,
  onIncludeDeletedChange: () => {},
  userRole: 'Manager' as const,
}

describe('CogsHistoryTable', () => {
  it('renders table with correct columns', () => {
    render(
      React.createElement(
        createWrapper(),
        null,
        React.createElement(CogsHistoryTable, defaultProps)
      )
    )

    expect(screen.getByText('Дата начала')).toBeInTheDocument()
    expect(screen.getByText('Дата окончания')).toBeInTheDocument()
    expect(screen.getByText('Себестоимость')).toBeInTheDocument()
    expect(screen.getByText('Источник')).toBeInTheDocument()
    expect(screen.getByText('Затронуто недель')).toBeInTheDocument()
    expect(screen.getByText('Примечание')).toBeInTheDocument()
    expect(screen.getByText('Действия')).toBeInTheDocument()
  })

  it('displays COGS records correctly', () => {
    render(
      React.createElement(
        createWrapper(),
        null,
        React.createElement(CogsHistoryTable, defaultProps)
      )
    )

    // Check first record values - format may vary
    expect(screen.getByText('Current version')).toBeInTheDocument()
    // Currency formatted values
    expect(screen.getByText(/450/)).toBeInTheDocument()
    expect(screen.getByText(/320/)).toBeInTheDocument()
  })

  it('shows source icons with correct tooltips', () => {
    render(
      React.createElement(
        createWrapper(),
        null,
        React.createElement(CogsHistoryTable, defaultProps)
      )
    )

    // Source icons should be present
    expect(screen.getByText('✏️')).toBeInTheDocument() // manual
    expect(screen.getByText('📥')).toBeInTheDocument() // import
  })

  it('shows affected weeks as collapsible', () => {
    render(
      React.createElement(
        createWrapper(),
        null,
        React.createElement(CogsHistoryTable, defaultProps)
      )
    )

    // Should show collapsed weeks count
    expect(screen.getByText('3 недели')).toBeInTheDocument() // First record
    expect(screen.getByText('4 недели')).toBeInTheDocument() // Second record
  })

  it('expands affected weeks on click', () => {
    render(
      React.createElement(
        createWrapper(),
        null,
        React.createElement(CogsHistoryTable, defaultProps)
      )
    )

    // Click to expand
    const expandButton = screen.getByText('3 недели')
    fireEvent.click(expandButton)

    // Should show week list
    expect(screen.getByText('2025-W44, 2025-W45, 2025-W46')).toBeInTheDocument()
  })

  it('hides "Show deleted" checkbox for analyst role', () => {
    render(
      React.createElement(
        createWrapper(),
        null,
        React.createElement(CogsHistoryTable, { ...defaultProps, userRole: 'Analyst' })
      )
    )

    expect(screen.queryByText('Показать удалённые записи')).not.toBeInTheDocument()
  })

  it('shows "Show deleted" checkbox for Owner role', () => {
    render(
      React.createElement(
        createWrapper(),
        null,
        React.createElement(CogsHistoryTable, { ...defaultProps, userRole: 'Owner' })
      )
    )

    expect(screen.getByText('Показать удалённые записи')).toBeInTheDocument()
  })

  it('shows "Show deleted" checkbox for Service role', () => {
    render(
      React.createElement(
        createWrapper(),
        null,
        React.createElement(CogsHistoryTable, { ...defaultProps, userRole: 'Service' })
      )
    )

    expect(screen.getByText('Показать удалённые записи')).toBeInTheDocument()
  })

  it('hides "Show deleted" checkbox for Manager role (BD-14: Owner/Service only)', () => {
    render(
      React.createElement(
        createWrapper(),
        null,
        React.createElement(CogsHistoryTable, { ...defaultProps, userRole: 'Manager' })
      )
    )

    // Manager can edit COGS but must NOT view soft-deleted versions.
    expect(screen.queryByText('Показать удалённые записи')).not.toBeInTheDocument()
  })

  it('hides actions column for analyst role', () => {
    render(
      React.createElement(
        createWrapper(),
        null,
        React.createElement(CogsHistoryTable, { ...defaultProps, userRole: 'Analyst' })
      )
    )

    expect(screen.queryByText('Действия')).not.toBeInTheDocument()
  })

  it('shows actions column for Manager role (BD-14: canEdit via canManageOperationalData)', () => {
    render(
      React.createElement(
        createWrapper(),
        null,
        React.createElement(CogsHistoryTable, { ...defaultProps, userRole: 'Manager' })
      )
    )

    expect(screen.getByText('Действия')).toBeInTheDocument()
  })

  it('displays deleted records with strikethrough when included', () => {
    render(
      React.createElement(
        createWrapper(),
        null,
        React.createElement(CogsHistoryTable, {
          ...defaultProps,
          data: mockData, // Include deleted record
          includeDeleted: true,
          userRole: 'Service',
        })
      )
    )

    // Deleted record note should be visible
    expect(screen.getByText('Deleted record')).toBeInTheDocument()
  })

  it('calls onIncludeDeletedChange when checkbox is toggled', () => {
    const onIncludeDeletedChange = vi.fn()
    render(
      React.createElement(
        createWrapper(),
        null,
        React.createElement(CogsHistoryTable, {
          ...defaultProps,
          onIncludeDeletedChange,
          userRole: 'Service',
        })
      )
    )

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    expect(onIncludeDeletedChange).toHaveBeenCalledWith(true)
  })

  it('shows dash for empty notes', () => {
    render(
      React.createElement(
        createWrapper(),
        null,
        React.createElement(CogsHistoryTable, defaultProps)
      )
    )

    // Second record has null notes, should show dash
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThan(0)
  })

  it('renders partial history rows with explicit unavailable fields', () => {
    const partialRecord = {
      ...mockData[0],
      cogs_id: 'cogs-partial',
      unit_cost_rub: Number.NaN,
      notes: null,
      affected_weeks: [],
    }

    render(
      React.createElement(
        createWrapper(),
        null,
        React.createElement(CogsHistoryTable, { ...defaultProps, data: [partialRecord] })
      )
    )

    expect(screen.getByText(/Данные записи доступны не полностью/)).toBeInTheDocument()
    expect(screen.getAllByText('—')).toHaveLength(3)
  })

  it('formats valid_to as "Текущий" when null', () => {
    render(
      React.createElement(
        createWrapper(),
        null,
        React.createElement(CogsHistoryTable, defaultProps)
      )
    )

    expect(screen.getByText('Текущий')).toBeInTheDocument()
  })

  // Story 172.7: the RTC a11y contract — a product-named caption renders as a
  // semantic <caption> when provided, and nothing renders without it
  // (171.9 behavioral canon).
  it('renders the caption element when captionText is provided', () => {
    render(
      React.createElement(
        createWrapper(),
        null,
        React.createElement(CogsHistoryTable, {
          ...defaultProps,
          captionText: 'История себестоимости — тест',
        })
      )
    )
    expect(screen.getByRole('caption')).toHaveTextContent('История себестоимости — тест')
  })

  it('renders no caption element without captionText', () => {
    render(
      React.createElement(
        createWrapper(),
        null,
        React.createElement(CogsHistoryTable, defaultProps)
      )
    )
    expect(screen.queryByRole('caption')).not.toBeInTheDocument()
  })
})
