import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import {
  EventBreakdownTable,
  FailuresSection,
  PreferencesSection,
  NotConfiguredBlock,
  DetailPanelSkeleton,
} from '../TelegramDetailSections'
import type {
  TelegramEventBreakdown,
  TelegramFailure,
  TelegramPreferences,
} from '../../types/monitoring'

// ============================================================================
// EventBreakdownTable
// ============================================================================

describe('EventBreakdownTable', () => {
  it('shows empty message when no events', () => {
    render(<EventBreakdownTable events={[]} />)
    expect(screen.getByText('Нет включённых типов событий')).toBeInTheDocument()
  })

  it('renders table with event breakdown', () => {
    const events: TelegramEventBreakdown[] = [
      { eventType: 'pipeline_failed', enabled: true, sentCount: 10, failedCount: 1 },
      { eventType: 'data_gap', enabled: true, sentCount: 25, failedCount: 0 },
    ]
    render(<EventBreakdownTable events={events} />)
    expect(screen.getByText('События (включённые)')).toBeInTheDocument()
    expect(screen.getByText('pipeline_failed')).toBeInTheDocument()
    expect(screen.getByText('data_gap')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
  })

  it('highlights failed count in red when > 0', () => {
    const events: TelegramEventBreakdown[] = [
      { eventType: 'pipeline_failed', enabled: true, sentCount: 10, failedCount: 3 },
    ]
    render(<EventBreakdownTable events={events} />)
    const failedCell = screen.getByText('3')
    expect(failedCell.className).toContain('text-red-600')
  })

  it('renders table headers', () => {
    const events: TelegramEventBreakdown[] = [
      { eventType: 'test', enabled: true, sentCount: 1, failedCount: 0 },
    ]
    render(<EventBreakdownTable events={events} />)
    expect(screen.getByText('Тип события')).toBeInTheDocument()
    expect(screen.getByText('Отправлено')).toBeInTheDocument()
    expect(screen.getByText('Ошибки')).toBeInTheDocument()
  })
})

// ============================================================================
// FailuresSection
// ============================================================================

describe('FailuresSection', () => {
  const mockFailures: TelegramFailure[] = [
    { timestamp: '2026-03-01T10:30:00Z', eventType: 'pipeline_failed', errorMessage: 'Timeout' },
    {
      timestamp: '2026-03-02T14:00:00Z',
      eventType: 'data_gap',
      errorMessage: 'Connection refused',
    },
  ]

  it('renders failure list', () => {
    render(<FailuresSection failures={mockFailures} />)
    expect(screen.getByText('Недавние ошибки')).toBeInTheDocument()
    expect(screen.getByText('Timeout')).toBeInTheDocument()
    expect(screen.getByText('Connection refused')).toBeInTheDocument()
  })

  it('renders event type badges for each failure', () => {
    render(<FailuresSection failures={mockFailures} />)
    expect(screen.getByText('pipeline_failed')).toBeInTheDocument()
    expect(screen.getByText('data_gap')).toBeInTheDocument()
  })

  it('renders accessible list', () => {
    render(<FailuresSection failures={mockFailures} />)
    expect(screen.getByLabelText('Список недавних ошибок доставки')).toBeInTheDocument()
  })

  it('renders empty list', () => {
    render(<FailuresSection failures={[]} />)
    expect(screen.getByText('Недавние ошибки')).toBeInTheDocument()
  })
})

// ============================================================================
// PreferencesSection
// ============================================================================

describe('PreferencesSection', () => {
  const mockPreferences: TelegramPreferences = {
    telegramEnabled: true,
    quietHoursEnabled: true,
    quietHoursFrom: '22:00',
    quietHoursTo: '08:00',
    language: 'ru',
    enabledEvents: ['pipeline_failed', 'data_gap'],
    disabledEvents: ['weekly_report'],
  }

  it('renders quiet hours when enabled', () => {
    render(<PreferencesSection preferences={mockPreferences} />)
    expect(screen.getByText('22:00 — 08:00')).toBeInTheDocument()
  })

  it('renders language', () => {
    render(<PreferencesSection preferences={mockPreferences} />)
    expect(screen.getByText('RU')).toBeInTheDocument()
  })

  it('renders enabled events count', () => {
    render(<PreferencesSection preferences={mockPreferences} />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('shows "Выкл." when quiet hours disabled', () => {
    const prefs: TelegramPreferences = {
      ...mockPreferences,
      quietHoursEnabled: false,
    }
    render(<PreferencesSection preferences={prefs} />)
    expect(screen.getByText('Выкл.')).toBeInTheDocument()
  })
})

// ============================================================================
// NotConfiguredBlock
// ============================================================================

describe('NotConfiguredBlock', () => {
  it('renders not configured message', () => {
    render(<NotConfiguredBlock />)
    expect(screen.getByText('Telegram не настроен')).toBeInTheDocument()
  })

  it('renders setup link', () => {
    render(<NotConfiguredBlock />)
    expect(screen.getByText('Настроить Telegram')).toBeInTheDocument()
  })

  it('link points to settings page', () => {
    render(<NotConfiguredBlock />)
    const link = screen.getByText('Настроить Telegram')
    expect(link.getAttribute('href')).toBe('/settings/notifications')
  })

  it('renders description text', () => {
    render(<NotConfiguredBlock />)
    expect(screen.getByText(/подключите telegram-бота/i)).toBeInTheDocument()
  })
})

// ============================================================================
// DetailPanelSkeleton
// ============================================================================

describe('DetailPanelSkeleton', () => {
  it('renders loading skeleton', () => {
    const { container } = render(<DetailPanelSkeleton />)
    // Skeleton renders aria-busy on the card content area
    const busyEl = container.querySelector('[aria-busy="true"]')
    expect(busyEl).toBeTruthy()
  })

  it('has aria-busy attribute', () => {
    const { container } = render(<DetailPanelSkeleton />)
    const busyEl = container.querySelector('[aria-busy="true"]')
    expect(busyEl).toBeTruthy()
  })
})
