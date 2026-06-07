/**
 * Unit Tests for History Timeline Components
 * Story 40.5-FE: History Timeline Components
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Tests for FullHistoryTab, WbHistoryTab, LocalHistoryTab,
 * history-utils, and LocalHistoryEntryItem components.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

import { FullHistoryTab } from '../FullHistoryTab'
import { WbHistoryTab } from '../WbHistoryTab'
import { LocalHistoryTab } from '../LocalHistoryTab'
import { formatDuration, EmptyState, TabErrorState, TimelineSkeleton } from '../history-utils'
import {
  SummarySection,
  CurrentStatusSection,
  LocalHistoryTimelineEntry,
  StatusBadge,
  TabLoadingSkeleton,
} from '../LocalHistoryEntryItem'

import {
  mockFullHistoryResponse,
  mockWbHistoryResponse,
  mockLocalHistoryResponse,
  mockEmptyFullHistoryResponse,
  mockEmptyWbHistoryResponse,
  mockEmptyLocalHistoryResponse,
} from '@/test/fixtures/orders'
import {
  mockFullHistoryStandard,
  mockWbHistoryStandard,
  mockLocalHistoryStandard,
  mockLocalHistoryPartialChange,
} from '@/test/fixtures/order-history'
import {
  getWbStatusConfig,
  getWbStatusLabel,
  isWbStatusFinal,
  WB_STATUS_CONFIG,
  WB_STATUS_CATEGORY_LABELS,
} from '@/lib/wb-status-mapping'
import type {
  WbHistoryResponse,
  LocalHistoryResponse,
  LocalHistoryEntry,
  FullHistoryResponse,
} from '@/types/orders-history'

// Helper: single-entry WB response factory
function singleWbEntry(code: string): WbHistoryResponse {
  return {
    orderId: 'test',
    orderUid: 'uid',
    wbHistory: [
      {
        id: '1',
        wbStatusCode: code,
        wbStatusChangedAt: '2026-01-02T10:00:00.000Z',
        durationMinutes: null,
      },
    ],
    summary: {
      totalTransitions: 1,
      totalDurationMinutes: null,
      currentWbStatus: code,
      createdAt: '2026-01-02T10:00:00.000Z',
      lastUpdatedAt: null,
    },
  }
}

// =============================================================================
// formatDuration
// =============================================================================

describe('formatDuration', () => {
  it('formats minutes-only duration', () => expect(formatDuration(5)).toBe('5 мин'))
  it('formats hours-only duration', () => expect(formatDuration(120)).toBe('2 ч'))
  it('formats hours and minutes', () => expect(formatDuration(90)).toBe('1 ч 30 мин'))
  it('formats days-only duration', () => expect(formatDuration(2880)).toBe('2 д'))
  it('formats days and hours', () => expect(formatDuration(1500)).toBe('1 д 1 ч'))
  it('handles 0 minutes', () => expect(formatDuration(0)).toBe('0 мин'))
  it('handles 1 minute', () => expect(formatDuration(1)).toBe('1 мин'))
  it('handles exactly 60 minutes', () => expect(formatDuration(60)).toBe('1 ч'))
  it('handles exactly 1440 minutes', () => expect(formatDuration(1440)).toBe('1 д'))
})

// =============================================================================
// Shared UI Components (history-utils + LocalHistoryEntryItem)
// =============================================================================

describe('EmptyState', () => {
  it('renders the provided message', () => {
    render(<EmptyState message="История статусов пока пуста" />)
    expect(screen.getByText('История статусов пока пуста')).toBeInTheDocument()
  })
  it('has muted text styling', () => {
    const { container } = render(<EmptyState message="No data" />)
    expect(container.firstChild).toHaveClass('text-muted-foreground')
  })
})

describe('TabErrorState', () => {
  it('shows error message and retry button', () => {
    render(<TabErrorState onRetry={vi.fn()} />)
    expect(screen.getByText(/Не удалось загрузить данные/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /повторить/i })).toBeInTheDocument()
  })
  it('calls onRetry when retry button clicked', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(<TabErrorState onRetry={onRetry} />)
    await user.click(screen.getByRole('button', { name: /повторить/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})

describe('TimelineSkeleton', () => {
  it('renders default skeleton rows', () => {
    const { container } = render(<TimelineSkeleton />)
    expect(container.querySelectorAll('.rounded-full').length).toBeGreaterThanOrEqual(3)
  })
  it('renders custom row count', () => {
    const { container } = render(<TimelineSkeleton rows={5} />)
    expect(container.querySelectorAll('[class*="animate"]').length).toBeGreaterThan(0)
  })
})

describe('StatusBadge', () => {
  it('renders supplier variant with blue styling', () => {
    render(<StatusBadge label="new" variant="supplier" />)
    const badge = screen.getByText('new')
    expect(badge).toHaveClass('bg-blue-50', 'text-blue-700')
  })
  it('renders wb variant with purple styling', () => {
    render(<StatusBadge label="waiting" variant="wb" />)
    const badge = screen.getByText('waiting')
    expect(badge).toHaveClass('bg-purple-50', 'text-purple-700')
  })
})

describe('SummarySection', () => {
  const mockSummary = mockLocalHistoryResponse.summary
  it('shows total transitions count and duration when provided', () => {
    render(<SummarySection summary={mockSummary} totalDuration="6 ч" />)
    expect(screen.getByText(/Всего переходов: 3/)).toBeInTheDocument()
    expect(screen.getByText(/Общее время: 6 ч/)).toBeInTheDocument()
  })
  it('hides duration when null and shows created/completed dates', () => {
    render(<SummarySection summary={mockSummary} totalDuration={null} />)
    expect(screen.queryByText(/Общее время/)).not.toBeInTheDocument()
    expect(screen.getByText(/Создан:/)).toBeInTheDocument()
    expect(screen.getByText(/Завершён:/)).toBeInTheDocument()
  })
})

describe('CurrentStatusSection', () => {
  it('shows current statuses and final badge when isFinal=true', () => {
    render(<CurrentStatusSection currentStatus={mockLocalHistoryResponse.currentStatus} />)
    expect(screen.getByText('complete')).toBeInTheDocument()
    expect(screen.getByText('sold')).toBeInTheDocument()
    expect(screen.getByText('Финал')).toBeInTheDocument()
  })
  it('hides final badge when isFinal=false', () => {
    render(<CurrentStatusSection currentStatus={mockEmptyLocalHistoryResponse.currentStatus} />)
    expect(screen.queryByText('Финал')).not.toBeInTheDocument()
  })
})

describe('LocalHistoryTimelineEntry', () => {
  const entry = mockLocalHistoryResponse.history[1] // has duration
  it('renders timestamp, transitions, and duration', () => {
    render(<LocalHistoryTimelineEntry entry={entry} isLast={false} />)
    expect(screen.getByText(/\d{2}\.\d{2}\.\d{4}/)).toBeInTheDocument()
    expect(screen.getByText('Статус продавца:')).toBeInTheDocument()
    expect(screen.getByText('WB статус:')).toBeInTheDocument()
    expect(screen.getByText(/2 ч 30 мин/)).toBeInTheDocument()
  })
  it('hides duration for last entry', () => {
    render(<LocalHistoryTimelineEntry entry={entry} isLast={true} />)
    expect(screen.queryByText(/2 ч 30 мин/)).not.toBeInTheDocument()
  })
  it('shows "null" for null old status values (initial state)', () => {
    const firstEntry = mockLocalHistoryResponse.history[0]
    render(<LocalHistoryTimelineEntry entry={firstEntry} isLast={false} />)
    expect(screen.getAllByText('null').length).toBeGreaterThanOrEqual(1)
  })
})

describe('TabLoadingSkeleton', () => {
  it('renders loading skeleton structure', () => {
    const { container } = render(<TabLoadingSkeleton />)
    expect(container.querySelectorAll('[class*="animate"]').length).toBeGreaterThan(0)
  })
})

// =============================================================================
// FullHistoryTab
// =============================================================================

describe('FullHistoryTab', () => {
  const defaultProps = { isLoading: false, isError: false, refetch: vi.fn() }

  describe('AC1: Merged View Rendering', () => {
    it('renders entries with source badges, labels, and summary', () => {
      render(<FullHistoryTab data={mockFullHistoryResponse} {...defaultProps} />)

      expect(screen.getByText(/Итого: 5 записей/)).toBeInTheDocument()
      expect(screen.getAllByText('WB').length).toBe(3)
      expect(screen.getAllByText('Локальная').length).toBe(2)
      expect(screen.getByText('Создан')).toBeInTheDocument()
      expect(screen.getByText('На сборке')).toBeInTheDocument()
      expect(screen.getByText(/WB: 3/)).toBeInTheDocument()
      expect(screen.getByText(/Локальная: 2/)).toBeInTheDocument()
      expect(screen.getAllByText('Статус продавца:').length).toBeGreaterThan(0)
    })

    it('shows WB status code alongside translated label', () => {
      render(<FullHistoryTab data={mockFullHistoryResponse} {...defaultProps} />)
      expect(screen.getByText('(created)')).toBeInTheDocument()
      expect(screen.getByText('(assembling)')).toBeInTheDocument()
    })
  })

  describe('Timeline Structure', () => {
    it('renders correct dot colors and trailing lines', () => {
      const { container } = render(
        <FullHistoryTab data={mockFullHistoryResponse} {...defaultProps} />
      )
      const dots = container.querySelectorAll('.rounded-full')
      expect(dots.length).toBe(5)
      expect(Array.from(dots).filter(d => d.classList.contains('bg-purple-500')).length).toBe(3)
      expect(Array.from(dots).filter(d => d.classList.contains('bg-blue-500')).length).toBe(2)
      // Trailing lines = entries - 1
      expect(container.querySelectorAll('.bg-border').length).toBe(4)
    })
  })

  describe('Empty and Loading States', () => {
    it('shows empty message with no markers when no entries', () => {
      const { container } = render(
        <FullHistoryTab data={mockEmptyFullHistoryResponse} {...defaultProps} />
      )
      expect(screen.getByText('История статусов пока пуста')).toBeInTheDocument()
      expect(container.querySelectorAll('.rounded-full').length).toBe(0)
    })

    it('shows skeleton loader when isLoading=true', () => {
      const { container } = render(
        <FullHistoryTab data={undefined} isLoading={true} isError={false} refetch={vi.fn()} />
      )
      expect(container.querySelectorAll('[class*="animate"]').length).toBeGreaterThan(0)
    })
  })

  describe('Error State', () => {
    it('shows error message with retry button', () => {
      render(<FullHistoryTab data={undefined} isLoading={false} isError={true} refetch={vi.fn()} />)
      expect(screen.getByText(/Не удалось загрузить данные/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /повторить/i })).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <FullHistoryTab data={mockFullHistoryResponse} {...defaultProps} />
      )
      expect(await axe(container)).toHaveNoViolations()
    })
  })
})

// =============================================================================
// WbHistoryTab
// =============================================================================

describe('WbHistoryTab', () => {
  const defaultProps = { isLoading: false, isError: false, refetch: vi.fn() }

  describe('AC2: WB-Only View Rendering', () => {
    it('displays WB entries with labels, codes, durations, and summary', () => {
      render(<WbHistoryTab data={mockWbHistoryResponse} {...defaultProps} />)
      expect(screen.getByText('Создан')).toBeInTheDocument()
      expect(screen.getByText('На сборке')).toBeInTheDocument()
      expect(screen.getByText('(created)')).toBeInTheDocument()
      expect(screen.getAllByText(/30 мин/).length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText(/Всего переходов: 4/)).toBeInTheDocument()
      expect(screen.getByText(/Текущий: Получен клиентом/)).toBeInTheDocument()
    })
  })

  describe('Final Status Indicators', () => {
    it('shows exactly one "Финал" badge for received_by_client', () => {
      render(<WbHistoryTab data={mockWbHistoryResponse} {...defaultProps} />)
      expect(screen.getAllByText('Финал').length).toBe(1)
    })
  })

  describe('WB Status Code Display', () => {
    const statusCases: Array<{ code: string; label: string }> = [
      { code: 'created', label: 'Создан' },
      { code: 'assembling', label: 'На сборке' },
      { code: 'assembled', label: 'Собран' },
      { code: 'sorted_by_wh', label: 'Отсортирован на складе' },
      { code: 'on_way_to_client', label: 'В пути к клиенту' },
      { code: 'received_by_client', label: 'Получен клиентом' },
      { code: 'canceled', label: 'Отменён' },
      { code: 'return_requested', label: 'Запрошен возврат' },
    ]

    it.each(statusCases)('shows $code as $label', ({ code, label }) => {
      render(<WbHistoryTab data={singleWbEntry(code)} {...defaultProps} />)
      expect(screen.getByText(label)).toBeInTheDocument()
    })
  })

  describe('Unknown Status Code Handling (AC8)', () => {
    it('shows raw code for unknown statuses and does not crash', () => {
      const data: WbHistoryResponse = {
        orderId: 'test',
        orderUid: 'uid',
        wbHistory: [
          {
            id: '1',
            wbStatusCode: 'future_wb_status_v2',
            wbStatusChangedAt: '2026-01-02T10:00:00.000Z',
            durationMinutes: null,
          },
          {
            id: '2',
            wbStatusCode: 'another_bad_one',
            wbStatusChangedAt: '2026-01-02T11:00:00.000Z',
            durationMinutes: 60,
          },
        ],
        summary: {
          totalTransitions: 2,
          totalDurationMinutes: 60,
          currentWbStatus: 'another_bad_one',
          createdAt: '2026-01-02T10:00:00.000Z',
          lastUpdatedAt: '2026-01-02T11:00:00.000Z',
        },
      }
      expect(() => render(<WbHistoryTab data={data} {...defaultProps} />)).not.toThrow()
      expect(screen.getAllByText(/future_wb_status_v2/).length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Empty State (AC2)', () => {
    it('shows WB sync message with timing', () => {
      render(<WbHistoryTab data={mockEmptyWbHistoryResponse} {...defaultProps} />)
      expect(screen.getByText(/WB история ещё не загружена/i)).toBeInTheDocument()
      expect(screen.getByText(/Синхронизация происходит каждые 15 минут/i)).toBeInTheDocument()
    })
  })

  describe('Loading, Error, and Accessibility', () => {
    it('shows skeleton when isLoading=true', () => {
      const { container } = render(
        <WbHistoryTab data={undefined} isLoading={true} isError={false} refetch={vi.fn()} />
      )
      expect(container.querySelectorAll('[class*="animate"]').length).toBeGreaterThan(0)
    })
    it('shows error with retry button and refetch works', async () => {
      const user = userEvent.setup()
      const refetch = vi.fn()
      render(<WbHistoryTab data={undefined} isLoading={false} isError={true} refetch={refetch} />)
      expect(screen.getByText(/Не удалось загрузить данные/i)).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /повторить/i }))
      expect(refetch).toHaveBeenCalledTimes(1)
    })
    it('has no accessibility violations', async () => {
      const { container } = render(<WbHistoryTab data={mockWbHistoryResponse} {...defaultProps} />)
      expect(await axe(container)).toHaveNoViolations()
    })
  })
})

// =============================================================================
// LocalHistoryTab
// =============================================================================

describe('LocalHistoryTab', () => {
  const defaultProps = { isLoading: false, isError: false, refetch: vi.fn() }

  describe('AC3: Local-Only View Rendering', () => {
    it('displays entries with transitions, arrows, null handling, and duration', () => {
      render(<LocalHistoryTab data={mockLocalHistoryResponse} {...defaultProps} />)

      expect(screen.getAllByText('Статус продавца:').length).toBe(3)
      expect(screen.getAllByText('WB статус:').length).toBe(3)
      expect(screen.getAllByText('→').length).toBeGreaterThan(0)
      expect(screen.getAllByText('null').length).toBeGreaterThanOrEqual(2)
      expect(screen.getByText(/2 ч 30 мин/)).toBeInTheDocument()
    })

    it('shows summary with transitions count and current status', () => {
      render(<LocalHistoryTab data={mockLocalHistoryResponse} {...defaultProps} />)
      expect(screen.getByText(/Всего переходов: 3/)).toBeInTheDocument()
      expect(screen.getByText('Текущий статус:')).toBeInTheDocument()
    })

    it('shows created and completed dates', () => {
      render(<LocalHistoryTab data={mockLocalHistoryResponse} {...defaultProps} />)
      expect(screen.getByText(/Создан:/)).toBeInTheDocument()
      expect(screen.getByText(/Завершён:/)).toBeInTheDocument()
    })

    it('does not show completed date when not final', () => {
      render(<LocalHistoryTab data={mockEmptyLocalHistoryResponse} {...defaultProps} />)
      expect(screen.queryByText(/Завершён:/)).not.toBeInTheDocument()
    })
  })

  describe('Partial Status Changes', () => {
    it('handles entries where only supplierStatus changed', () => {
      const data: LocalHistoryResponse = {
        ...mockLocalHistoryResponse,
        history: mockLocalHistoryPartialChange as unknown as LocalHistoryEntry[],
      }
      render(<LocalHistoryTab data={data} {...defaultProps} />)
      expect(screen.getAllByText('Статус продавца:').length).toBe(2)
    })
  })

  describe('Empty, Loading, Error, and Accessibility', () => {
    it('shows empty message when no entries', () => {
      render(<LocalHistoryTab data={mockEmptyLocalHistoryResponse} {...defaultProps} />)
      expect(screen.getByText('История статусов пока пуста')).toBeInTheDocument()
    })
    it('shows skeleton when isLoading=true', () => {
      const { container } = render(
        <LocalHistoryTab data={undefined} isLoading={true} isError={false} refetch={vi.fn()} />
      )
      expect(container.querySelectorAll('[class*="animate"]').length).toBeGreaterThan(0)
    })
    it('shows error with retry and refetch works', async () => {
      const user = userEvent.setup()
      const refetch = vi.fn()
      render(
        <LocalHistoryTab data={undefined} isLoading={false} isError={true} refetch={refetch} />
      )
      expect(screen.getByText(/Не удалось загрузить данные/i)).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /повторить/i }))
      expect(refetch).toHaveBeenCalledTimes(1)
    })
    it('has no accessibility violations', async () => {
      const { container } = render(
        <LocalHistoryTab data={mockLocalHistoryResponse} {...defaultProps} />
      )
      expect(await axe(container)).toHaveNoViolations()
    })
  })
})

// =============================================================================
// Integration: Edge Cases
// =============================================================================

describe('Timeline Integration - Edge Cases', () => {
  const defaultProps = { isLoading: false, isError: false, refetch: vi.fn() }

  it('handles single entry timeline with no trailing line', () => {
    const single: FullHistoryResponse = {
      orderId: 'test',
      orderUid: 'uid',
      fullHistory: [
        { source: 'wb_native', wbStatusCode: 'created', timestamp: '2026-01-02T10:00:00.000Z' },
      ],
      summary: { localEntriesCount: 0, wbNativeEntriesCount: 1, totalEntriesCount: 1 },
    }
    const { container } = render(<FullHistoryTab data={single} {...defaultProps} />)
    expect(screen.getByText(/Итого: 1 запис/)).toBeInTheDocument()
    expect(container.querySelectorAll('.bg-border').length).toBe(0)
  })

  it('handles timeline with only WB entries', () => {
    const wbOnly: FullHistoryResponse = {
      orderId: 'test',
      orderUid: 'uid',
      fullHistory: [
        { source: 'wb_native', wbStatusCode: 'created', timestamp: '2026-01-02T10:00:00.000Z' },
        { source: 'wb_native', wbStatusCode: 'assembling', timestamp: '2026-01-02T10:30:00.000Z' },
      ],
      summary: { localEntriesCount: 0, wbNativeEntriesCount: 2, totalEntriesCount: 2 },
    }
    render(<FullHistoryTab data={wbOnly} {...defaultProps} />)
    expect(screen.getAllByText('WB').length).toBe(2)
    expect(screen.queryByText('Локальная')).not.toBeInTheDocument()
  })

  it('handles timeline with only local entries', () => {
    const localOnly: FullHistoryResponse = {
      orderId: 'test',
      orderUid: 'uid',
      fullHistory: [
        {
          source: 'local',
          oldSupplierStatus: null,
          newSupplierStatus: 'new',
          oldWbStatus: null,
          newWbStatus: 'waiting',
          timestamp: '2026-01-02T10:00:00.000Z',
        },
      ],
      summary: { localEntriesCount: 1, wbNativeEntriesCount: 0, totalEntriesCount: 1 },
    }
    render(<FullHistoryTab data={localOnly} {...defaultProps} />)
    expect(screen.getByText('Локальная')).toBeInTheDocument()
    expect(screen.queryByText('WB')).not.toBeInTheDocument()
  })

  it('handles undefined data gracefully', () => {
    render(<FullHistoryTab data={undefined} {...defaultProps} />)
    expect(screen.getByText('История статусов пока пуста')).toBeInTheDocument()
  })

  it('each local entry card shows both supplier and WB status labels', () => {
    render(<FullHistoryTab data={mockFullHistoryResponse} {...defaultProps} />)
    expect(screen.getAllByText('Статус продавца:').length).toBe(
      screen.getAllByText('WB статус:').length
    )
  })
})

// =============================================================================
// TDD Verification - Test Setup
// =============================================================================

describe('TDD Verification - Test Setup', () => {
  it('should have test fixtures available', () => {
    expect(mockFullHistoryStandard).toBeDefined()
    expect(mockFullHistoryStandard.length).toBe(8)
    expect(mockWbHistoryStandard).toBeDefined()
    expect(mockLocalHistoryStandard).toBeDefined()
  })

  it('should have WB status mapping available', () => {
    expect(WB_STATUS_CONFIG).toBeDefined()
    expect(Object.keys(WB_STATUS_CONFIG).length).toBeGreaterThanOrEqual(27)
  })

  it('should have helper functions available', () => {
    expect(getWbStatusConfig).toBeDefined()
    expect(getWbStatusLabel).toBeDefined()
    expect(isWbStatusFinal).toBeDefined()
  })

  it('getWbStatusConfig returns correct label for known status', () => {
    const config = getWbStatusConfig('created')
    expect(config.label).toBe('Создан')
    expect(config.category).toBe('creation')
  })

  it('getWbStatusConfig returns fallback for unknown status', () => {
    const config = getWbStatusConfig('unknown_status_2026')
    expect(config.label).toBe('unknown_status_2026')
    expect(config.category).toBe('other')
  })

  it('isWbStatusFinal returns correct values', () => {
    expect(isWbStatusFinal('received_by_client')).toBe(true)
    expect(isWbStatusFinal('sold')).toBe(true)
    expect(isWbStatusFinal('canceled')).toBe(true)
    expect(isWbStatusFinal('created')).toBe(false)
    expect(isWbStatusFinal('assembling')).toBe(false)
  })

  it('should have all 8 categories defined', () => {
    const categories = [
      'creation',
      'seller_processing',
      'warehouse',
      'logistics',
      'delivery',
      'cancellation',
      'return',
      'other',
    ]
    categories.forEach(cat => expect(WB_STATUS_CATEGORY_LABELS).toHaveProperty(cat))
  })

  it('fixtures contain expected data structure', () => {
    const wbEntry = mockFullHistoryStandard.find(e => e.source === 'wb_native')
    expect(wbEntry?.wbStatusCode).toBeDefined()
    const localEntry = mockFullHistoryStandard.find(e => e.source === 'local')
    expect(localEntry?.newSupplierStatus).toBeDefined()
  })
})
