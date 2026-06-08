/**
 * AlertsPage Unit Tests
 *
 * Verifies alerts dashboard page:
 * - Renders page header with create rule button
 * - Renders tab triggers for all three tabs
 * - Default tab is summary (Обзор)
 * - Create dialog opens/closes
 */

import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'

// Mock the page state hook
vi.mock('../components/useAlertsPageState', () => ({
  useAlertsPageState: () => ({
    activeTab: 'summary',
    setActiveTab: vi.fn(),
    historyParams: { limit: 50 },
    updateHistoryParams: vi.fn(),
    rules: { data: [], isLoading: false },
    history: { data: [], isLoading: false },
    summary: {
      data: {
        total_rules: 5,
        active_rules: 3,
        triggered_today: 2,
        critical_alerts: 1,
      },
      isLoading: false,
    },
  }),
}))

// Mock sub-components that may have complex deps
vi.mock('../components/AlertsPageHeader', () => ({
  AlertsPageHeader: ({ onCreateRule }: { onCreateRule: () => void }) => (
    <div data-testid="alerts-header">
      <h1>Оповещения</h1>
      <button data-testid="create-rule-btn" onClick={onCreateRule}>
        Создать правило
      </button>
    </div>
  ),
}))

vi.mock('../components/AlertSummaryCards', () => ({
  AlertSummaryCards: ({ summary }: { summary: unknown }) => (
    <div data-testid="alert-summary-cards">{summary ? 'Summary loaded' : 'No summary'}</div>
  ),
}))

vi.mock('../components/AlertRulesList', () => ({
  AlertRulesList: () => <div data-testid="alert-rules-list">Rules list</div>,
}))

vi.mock('../components/AlertHistoryTable', () => ({
  AlertHistoryTable: () => <div data-testid="alert-history-table">History table</div>,
}))

vi.mock('../components/CreateAlertRuleDialog', () => ({
  CreateAlertRuleDialog: ({
    isOpen,
    onOpenChange,
  }: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }) =>
    isOpen ? (
      <div data-testid="create-dialog">
        Create Dialog
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    ) : null,
}))

vi.mock('../components/EditAlertRuleDialog', () => ({
  EditAlertRuleDialog: () => null,
}))

// Must import after mocks
import AlertsPage from '../page'

describe('AlertsPage', () => {
  it('renders page header', () => {
    renderWithProviders(<AlertsPage />)
    expect(screen.getByTestId('alerts-header')).toBeInTheDocument()
    expect(screen.getByText('Оповещения')).toBeInTheDocument()
  })

  it('renders tab triggers for all tabs', () => {
    renderWithProviders(<AlertsPage />)
    expect(screen.getByRole('tab', { name: 'Обзор' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Активные правила' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'История' })).toBeInTheDocument()
  })

  it('renders summary cards as default tab content', () => {
    renderWithProviders(<AlertsPage />)
    expect(screen.getByTestId('alert-summary-cards')).toBeInTheDocument()
  })

  it('opens create dialog when button clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AlertsPage />)

    await user.click(screen.getByTestId('create-rule-btn'))
    expect(screen.getByTestId('create-dialog')).toBeInTheDocument()
  })

  it('renders create rule button', () => {
    renderWithProviders(<AlertsPage />)
    expect(screen.getByTestId('create-rule-btn')).toBeInTheDocument()
  })
})
