/**
 * FunnelSummaryCards — conversion anomaly indicator (Defensive Frontend Principle, #191).
 *
 * The totalConversion card must flag an impossible >100% value with an
 * AlertTriangle warning while still rendering the raw value (never clamped).
 * A normal summary must NOT show the warning.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { FunnelSummaryCards } from '../FunnelSummaryCards'
import { emptyFunnelResponse } from '@/test/fixtures/funnel-empty'
import type { FunnelSummary } from '@/types/analytics-funnel'

const useFunnelDataMock = vi.fn()
vi.mock('@/hooks/use-funnel-analytics', () => ({
  useFunnelData: (...args: unknown[]) => useFunnelDataMock(...args),
}))

const ANOMALY_LABEL = /Невозможное значение конверсии/

function mockSummary(overrides: Partial<FunnelSummary>) {
  const base = emptyFunnelResponse().summary
  useFunnelDataMock.mockReturnValue({
    data: { ...emptyFunnelResponse(), summary: { ...base, ...overrides } },
    isLoading: false,
  })
}

describe('FunnelSummaryCards — conversion anomaly indicator (#191)', () => {
  beforeEach(() => {
    useFunnelDataMock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('flags the totalConversion card with a warning AND preserves the raw value', () => {
    mockSummary({ ordersCount: 140, buyoutCount: 3141, totalConversion: 136.15 })
    renderWithProviders(<FunnelSummaryCards from="2025-01-01" to="2025-01-07" />)

    expect(screen.getByLabelText(ANOMALY_LABEL)).toBeInTheDocument()
    expect(screen.getByText('136,2%')).toBeInTheDocument()
  })

  it('does NOT flag a normal summary', () => {
    mockSummary({ ordersCount: 140, buyoutCount: 90, totalConversion: 42 })
    renderWithProviders(<FunnelSummaryCards from="2025-01-01" to="2025-01-07" />)

    expect(screen.queryByLabelText(ANOMALY_LABEL)).not.toBeInTheDocument()
    expect(screen.getByText('42,0%')).toBeInTheDocument()
  })

  it('replaces long-loading skeletons with an explicit retry state', () => {
    vi.useFakeTimers()
    useFunnelDataMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      refetch: vi.fn(),
    })

    renderWithProviders(<FunnelSummaryCards from="2025-01-01" to="2025-01-07" />)

    act(() => {
      vi.advanceTimersByTime(5_000)
    })

    expect(screen.getByText(/Метрики воронки загружаются дольше обычного/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Повторить/ })).toBeInTheDocument()
  })
})
