/**
 * Tests for ReturnsSummaryCards
 * Epic 70-FE: Returns summary (total / rate / classification coverage).
 *
 * Focus: Defensive Frontend Principle — error & no-data states must INDICATE,
 * not fabricate "0 / 0,0 % / 0 %" (the pre-hardening behaviour, which only
 * handled isLoading and fell through to `summary?.field ?? 0`).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { ReturnsSummaryCards } from '../ReturnsSummaryCards'
import type { ReturnReasonsResponse } from '@/types/analytics-returns'

vi.mock('@/hooks/use-return-analytics', () => ({
  useReturnReasons: vi.fn(),
}))

import { useReturnReasons } from '@/hooks/use-return-analytics'
const mockUseReturnReasons = vi.mocked(useReturnReasons)

const mockData: ReturnReasonsResponse = {
  summary: {
    totalReturns: 56,
    cancelBeforeShipment: 0,
    refusalAtPvz: 0,
    returnAfterReceipt: 56,
    overallReturnRate: 1.49,
    classificationCoverage: 100,
  },
  byCategory: [],
  period: { from: '2026-05-01', to: '2026-05-31' },
}

function hookReturn(overrides: Record<string, unknown> = {}) {
  return { data: undefined, isLoading: false, isError: false, ...overrides } as ReturnType<
    typeof useReturnReasons
  >
}

describe('ReturnsSummaryCards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows skeletons while loading', () => {
    mockUseReturnReasons.mockReturnValue(hookReturn({ isLoading: true }))
    const { container } = renderWithProviders(<ReturnsSummaryCards from="a" to="b" />)
    expect(container.querySelector('[class*="h-24"]')).toBeInTheDocument()
  })

  it('shows an error alert (not fabricated zeros) when the request fails', () => {
    mockUseReturnReasons.mockReturnValue(hookReturn({ isError: true }))
    renderWithProviders(<ReturnsSummaryCards from="a" to="b" />)
    expect(screen.getByText('Не удалось загрузить сводку возвратов')).toBeInTheDocument()
    // Defensive Frontend: must NOT render a fabricated "0,0 %" return rate.
    expect(screen.queryByText(/0,0\s+%/)).not.toBeInTheDocument()
    expect(screen.queryByText('Всего возвратов')).not.toBeInTheDocument()
  })

  it('shows a no-data state (not fabricated zeros) when data is undefined', () => {
    mockUseReturnReasons.mockReturnValue(hookReturn({ data: undefined }))
    renderWithProviders(<ReturnsSummaryCards from="a" to="b" />)
    expect(screen.getByText('Нет данных о возвратах за выбранный период')).toBeInTheDocument()
    expect(screen.queryByText(/0,0\s+%/)).not.toBeInTheDocument()
    expect(screen.queryByText('Всего возвратов')).not.toBeInTheDocument()
  })

  // Distinct branch: backend returns a 200 body that lacks `summary` (e.g. shape
  // drift / partial response). `data?.summary` is undefined → must still indicate,
  // not fall through to fabricated zeros.
  it('shows a no-data state when data is present but summary is absent', () => {
    mockUseReturnReasons.mockReturnValue(
      hookReturn({ data: { byCategory: [], period: { from: 'a', to: 'b' } } })
    )
    renderWithProviders(<ReturnsSummaryCards from="a" to="b" />)
    expect(screen.getByText('Нет данных о возвратах за выбранный период')).toBeInTheDocument()
    expect(screen.queryByText(/0,0\s+%/)).not.toBeInTheDocument()
    expect(screen.queryByText('Всего возвратов')).not.toBeInTheDocument()
  })

  it('renders the three summary values in Russian locale when data is present', () => {
    mockUseReturnReasons.mockReturnValue(hookReturn({ data: mockData }))
    renderWithProviders(<ReturnsSummaryCards from="a" to="b" />)
    expect(screen.getByText('Всего возвратов')).toBeInTheDocument()
    expect(screen.getByText('56')).toBeInTheDocument()
    // overallReturnRate 1.49 → formatPercentage(n, 1) → "1,5 %" (comma + NBSP)
    expect(screen.getByText(/1,5\s+%/)).toBeInTheDocument()
    // classificationCoverage 100 → formatPercentageInt → "100 %"
    expect(screen.getByText(/100\s+%/)).toBeInTheDocument()
  })
})
