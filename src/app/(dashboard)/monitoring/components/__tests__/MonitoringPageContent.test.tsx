import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { MonitoringDashboard } from '../../types/monitoring'
import { MonitoringPageContent } from '../MonitoringPageContent'

const mocks = vi.hoisted(() => ({
  useMonitoringDashboard: vi.fn(),
  refetch: vi.fn(),
}))

vi.mock('../../hooks/use-monitoring-dashboard', () => ({
  useMonitoringDashboard: () => mocks.useMonitoringDashboard(),
}))

vi.mock('../HealthScoreWidget', () => ({
  HealthScoreWidget: () => <div data-testid="health-score-widget" />,
}))

vi.mock('../TelegramStatusCard', () => ({
  TelegramStatusCard: () => <div data-testid="telegram-status-card" />,
}))

vi.mock('../PipelineStatusGrid', () => ({
  PipelineStatusGrid: () => <div data-testid="pipeline-status-grid" />,
}))

vi.mock('../DataCompletenessTable', () => ({
  DataCompletenessTable: () => <div data-testid="data-completeness-table" />,
}))

vi.mock('../PipelineHeatmap', () => ({
  PipelineHeatmap: ({ enabled }: { enabled: boolean }) => (
    <div data-testid="pipeline-heatmap" data-enabled={String(enabled)} />
  ),
}))

vi.mock('../RecoveryPanel', () => ({
  RecoveryPanel: ({ enabled }: { enabled: boolean }) => (
    <div data-testid="recovery-panel" data-enabled={String(enabled)} />
  ),
}))

vi.mock('../HealthHistoryChart', () => ({
  HealthHistoryChart: ({ enabled }: { enabled: boolean }) => (
    <div data-testid="health-history-chart" data-enabled={String(enabled)} />
  ),
}))

const dashboard = {
  cabinetId: 'cabinet-story-174-3',
  generatedAt: '2026-08-31T00:00:00Z',
  system: {
    overallStatus: 'healthy',
    healthScore: 96,
    lastReportDate: '2026-08-31',
    activeAlerts: 0,
  },
  pipelines: [
    {
      pipelineId: 'orders',
      displayName: 'Заказы',
      category: 'daily',
      status: 'healthy',
      lastSuccessAt: '2026-08-31T00:00:00Z',
      dataLagMinutes: 5,
      dataLagDisplay: '5 минут',
      successRate24h: 100,
    },
  ],
  telegram: {
    status: 'active',
    deliveryRate7d: 100,
    recentFailures: 0,
  },
  dataCompleteness: {
    overallHealth: 'healthy',
    tables: [],
  },
} satisfies MonitoringDashboard

describe('MonitoringPageContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.refetch.mockResolvedValue({})
    mocks.useMonitoringDashboard.mockReturnValue({
      data: dashboard,
      isLoading: false,
      isError: false,
      refetch: mocks.refetch,
    })
  })

  it('renders the monitoring dashboard skeleton while the route query is loading', () => {
    mocks.useMonitoringDashboard.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: mocks.refetch,
    })

    const { container } = render(<MonitoringPageContent />)

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(4)
    expect(screen.queryByRole('tab', { name: 'Обзор' })).not.toBeInTheDocument()
  })

  it('renders a recoverable monitoring error and retries the dashboard query', () => {
    mocks.useMonitoringDashboard.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: mocks.refetch,
    })

    render(<MonitoringPageContent />)

    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось загрузить данные мониторинга')
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))
    expect(mocks.refetch).toHaveBeenCalledTimes(1)
  })

  it('renders the new-cabinet empty state when health is zero and every pipeline has no data', () => {
    const emptyDashboard: MonitoringDashboard = {
      ...dashboard,
      system: {
        overallStatus: 'critical',
        healthScore: 0,
        lastReportDate: null,
        activeAlerts: 0,
      },
      pipelines: dashboard.pipelines.map(pipeline => ({
        ...pipeline,
        status: 'no_data' as const,
        lastSuccessAt: null,
        dataLagMinutes: null,
        dataLagDisplay: null,
        successRate24h: 0,
      })),
    }
    mocks.useMonitoringDashboard.mockReturnValue({
      data: emptyDashboard,
      isLoading: false,
      isError: false,
      refetch: mocks.refetch,
    })

    render(<MonitoringPageContent />)

    expect(screen.getByText('Данные ещё не загружены')).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Обзор' })).not.toBeInTheDocument()
  })

  it('renders the overview dashboard when monitoring data is available', () => {
    render(<MonitoringPageContent />)

    expect(screen.getByRole('tab', { name: 'Обзор' })).toHaveAttribute('data-state', 'active')
    expect(screen.getByTestId('health-score-widget')).toBeInTheDocument()
    expect(screen.getByTestId('telegram-status-card')).toBeInTheDocument()
    expect(screen.getByTestId('pipeline-status-grid')).toBeInTheDocument()
    expect(screen.getByTestId('data-completeness-table')).toBeInTheDocument()
  })

  it('enables only the selected monitoring panel when switching tabs', async () => {
    const user = userEvent.setup()
    render(<MonitoringPageContent />)

    await user.click(screen.getByRole('tab', { name: 'Карта активности' }))
    expect(screen.getByTestId('pipeline-heatmap')).toHaveAttribute('data-enabled', 'true')
    expect(screen.queryByTestId('recovery-panel')).not.toBeInTheDocument()
    expect(screen.queryByTestId('health-history-chart')).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Восстановление' }))
    expect(screen.getByTestId('recovery-panel')).toHaveAttribute('data-enabled', 'true')
    expect(screen.queryByTestId('pipeline-heatmap')).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'История' }))
    expect(screen.getByTestId('health-history-chart')).toHaveAttribute('data-enabled', 'true')
    expect(screen.queryByTestId('recovery-panel')).not.toBeInTheDocument()
  })
})
