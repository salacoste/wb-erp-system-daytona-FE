import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { HealthHistoryChart } from '../HealthHistoryChart'
import {
  formatDayLabel,
  countByStatus,
  PERIOD_OPTIONS,
  STATUS_COLORS,
  STATUS_EMOJI,
} from '../health-history-helpers'
import type { HealthReportSummary } from '../../types/monitoring'

// Mock auth store
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector: (s: { cabinetId: string | null }) => unknown) =>
    selector({ cabinetId: 'cab-123' })
  ),
}))

// Mock API call
vi.mock('@/lib/api/monitoring', () => ({
  getHealthReports: vi.fn(() => Promise.resolve([])),
  monitoringQueryKeys: {
    all: ['monitoring'],
    healthReports: (cabId: string, days: number) => ['monitoring', 'health-reports', cabId, days],
  },
}))

// Mock HealthReportSheet (relative to __tests__ -> ../HealthReportSheet)
vi.mock('../HealthReportSheet', () => ({
  HealthReportSheet: () => <div data-testid="report-sheet" />,
}))

// ============================================================================
// Pure function tests
// ============================================================================

describe('formatDayLabel', () => {
  it('formats ISO date to day abbreviation and short date', () => {
    // 2026-03-01 is a Sunday
    const result = formatDayLabel('2026-03-01')
    expect(result.day).toBe('Вс')
    expect(result.date).toBeTruthy()
  })

  it('handles Monday correctly', () => {
    // 2026-03-02 is a Monday
    const result = formatDayLabel('2026-03-02')
    expect(result.day).toBe('Пн')
  })
})

describe('countByStatus', () => {
  it('counts reports by status', () => {
    const reports: HealthReportSummary[] = [
      { date: '2026-03-01', status: 'healthy', issues: 0 },
      { date: '2026-03-02', status: 'healthy', issues: 0 },
      { date: '2026-03-03', status: 'degraded', issues: 2 },
      { date: '2026-03-04', status: 'critical', issues: 5 },
    ]
    const counts = countByStatus(reports)
    expect(counts.healthy).toBe(2)
    expect(counts.degraded).toBe(1)
    expect(counts.critical).toBe(1)
  })

  it('returns zeros for empty array', () => {
    const counts = countByStatus([])
    expect(counts.healthy).toBe(0)
    expect(counts.degraded).toBe(0)
    expect(counts.critical).toBe(0)
  })
})

describe('PERIOD_OPTIONS', () => {
  it('has 3 options: 7, 14, 30 days', () => {
    expect(PERIOD_OPTIONS).toHaveLength(3)
    expect(PERIOD_OPTIONS.map(o => o.days)).toEqual([7, 14, 30])
  })
})

describe('STATUS_COLORS', () => {
  it('defines colors for all statuses', () => {
    expect(STATUS_COLORS.healthy).toBeTruthy()
    expect(STATUS_COLORS.degraded).toBeTruthy()
    expect(STATUS_COLORS.critical).toBeTruthy()
  })
})

describe('STATUS_EMOJI', () => {
  it('defines emojis for all statuses', () => {
    expect(STATUS_EMOJI.healthy).toBe('✅')
    expect(STATUS_EMOJI.degraded).toBe('⚠️')
    expect(STATUS_EMOJI.critical).toBe('❌')
  })
})

// ============================================================================
// Component tests
// ============================================================================

describe('HealthHistoryChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders period selector buttons', () => {
    render(<HealthHistoryChart enabled={true} />)
    expect(screen.getByText('7 дней')).toBeInTheDocument()
    expect(screen.getByText('14 дней')).toBeInTheDocument()
    expect(screen.getByText('30 дней')).toBeInTheDocument()
  })

  it('renders with accessible region label', () => {
    render(<HealthHistoryChart enabled={true} />)
    expect(screen.getByRole('region', { name: /история здоровья/i })).toBeInTheDocument()
  })

  it('renders period selector as radiogroup', () => {
    render(<HealthHistoryChart enabled={true} />)
    expect(screen.getByRole('radiogroup', { name: 'Период' })).toBeInTheDocument()
  })

  it('shows loading state with aria-busy', () => {
    const { container } = render(<HealthHistoryChart enabled={true} />)
    const busyEl = container.querySelector('[aria-busy="true"]')
    expect(busyEl).toBeTruthy()
  })
})
