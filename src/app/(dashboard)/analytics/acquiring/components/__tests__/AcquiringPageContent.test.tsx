/**
 * Tests for AcquiringPageContent — Story 96.9-FE
 *
 * Two responsibilities here:
 *   1. Pattern 3 wiring proof — at least one consumer imports from
 *      `src/test/fixtures/acquiring-empty.ts` (Story 96.9-FE AC-2).
 *   2. 503 + Retry-After banner branch coverage (Story 96.9-FE AC-3).
 *
 * Hook is mocked rather than driving the real apiClient — keeps the test
 * focused on the page's state-machine branches (anti-pattern #4 avoided
 * by using a typed override builder, no `as any`).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { ApiError } from '@/types/api'
import { emptyAcquiringListResponse } from '@/test/fixtures/acquiring-empty'

vi.mock('@/hooks/use-acquiring-reports', () => ({
  useAcquiringReports: vi.fn(),
}))

import { useAcquiringReports } from '@/hooks/use-acquiring-reports'
import { AcquiringPageContent } from '../AcquiringPageContent'

type HookReturn = ReturnType<typeof useAcquiringReports>

interface HookOverrides {
  data?: ReturnType<typeof emptyAcquiringListResponse> | undefined
  isLoading?: boolean
  isError?: boolean
  error?: Error | null
  refetch?: () => void
}

function mockHook(overrides: HookOverrides) {
  const partial = {
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  }
  vi.mocked(useAcquiringReports).mockReturnValue(partial as unknown as HookReturn)
}

describe('AcquiringPageContent (Story 96.9-FE)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty-state from emptyAcquiringListResponse() — Pattern 3 fixture wiring', () => {
    // AC-1 + AC-2: shared fixture wired into a real consumer
    mockHook({ data: emptyAcquiringListResponse(), isLoading: false, isError: false })
    renderWithProviders(<AcquiringPageContent />)
    expect(screen.getByText(/Отчёты за выбранный период не найдены/)).toBeInTheDocument()
  })

  it('renders the rate-limit retry-after banner on 503 with Retry-After header', () => {
    // AC-3: 503 must produce a distinct amber banner (NOT the generic destructive Alert).
    const error = new ApiError('Rate limited', 503)
    error.retryAfter = 30
    mockHook({ data: undefined, isLoading: false, isError: true, error })
    renderWithProviders(<AcquiringPageContent />)
    // Russian copy includes both the localized prefix and the parsed countdown number.
    // Use getByTestId to scope /30/ check to the banner — the date picker also renders "30 дней".
    const banner = screen.getByTestId('acquiring-rate-limit-banner')
    expect(banner).toBeInTheDocument()
    expect(banner).toHaveTextContent(/WB временно недоступна/)
    expect(banner).toHaveTextContent(/30/)
    // Generic "Не удалось загрузить отчёты" must NOT appear when the 503 banner takes over.
    expect(screen.queryByText(/Не удалось загрузить отчёты/)).not.toBeInTheDocument()
  })

  it('falls back to fallback countdown when Retry-After header is missing on 503', () => {
    // AC-3 fallback path — null/undefined retryAfter must still render a sensible countdown.
    mockHook({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new ApiError('Rate limited (no header)', 503),
    })
    renderWithProviders(<AcquiringPageContent />)
    // Fallback is 60 sec — see use-acquiring-rate-limit.ts.
    const banner = screen.getByTestId('acquiring-rate-limit-banner')
    expect(banner).toHaveTextContent(/WB временно недоступна/)
    expect(banner).toHaveTextContent(/60/)
  })

  it('renders the generic error alert for non-503 errors', () => {
    mockHook({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new ApiError('Internal server error', 500),
    })
    renderWithProviders(<AcquiringPageContent />)
    expect(screen.getByText(/Не удалось загрузить отчёты/)).toBeInTheDocument()
    expect(screen.queryByText(/WB временно недоступна/)).not.toBeInTheDocument()
  })
})
