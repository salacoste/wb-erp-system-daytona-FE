/**
 * Tests for FbsStockSizesSection — Story 96.11-FE
 *
 * Covers the 4 state-machine branches:
 *   1. Loading (skeleton)
 *   2. Full error (no cached data)
 *   3. Empty state (data: sizes=[])
 *   4. Populated state (sizes with null daysOfCover → '—')
 *
 * Hook mocked per anti-pattern #4 (typed override builder, no `as any`).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { emptyFbsStockSizesResponse } from '@/test/fixtures/fbs-stock-empty'

vi.mock('@/hooks/use-fbs-stock-sizes', () => ({
  useFbsStockSizes: vi.fn(),
}))

import { useFbsStockSizes } from '@/hooks/use-fbs-stock-sizes'
import { FbsStockSizesSection } from '../FbsStockSizesSection'

type HookReturn = ReturnType<typeof useFbsStockSizes>

interface HookOverrides {
  data?: ReturnType<typeof emptyFbsStockSizesResponse> | undefined
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
  vi.mocked(useFbsStockSizes).mockReturnValue(partial as unknown as HookReturn)
}

describe('FbsStockSizesSection (Story 96.11-FE)', () => {
  beforeEach(() => {
    // M-4: lock system clock for deterministic getDefaultRange() calculations
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-08T12:00:00Z'))
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders skeleton when loading with no cached data', () => {
    mockHook({ isLoading: true, data: undefined })
    renderWithProviders(<FbsStockSizesSection />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders full error alert when error and no cached data', () => {
    mockHook({ isError: true, data: undefined })
    renderWithProviders(<FbsStockSizesSection />)
    expect(screen.getByText(/Не удалось загрузить данные по размерам/)).toBeInTheDocument()
  })

  it('renders empty state from emptyFbsStockSizesResponse()', () => {
    mockHook({ data: emptyFbsStockSizesResponse(), isLoading: false, isError: false })
    renderWithProviders(<FbsStockSizesSection />)
    expect(screen.getByText(/Нет данных по размерам/)).toBeInTheDocument()
  })

  it('renders populated table with null daysOfCover as em-dash and nm_id input visible', () => {
    const populatedResponse = {
      ...emptyFbsStockSizesResponse(),
      data: {
        sizes: [
          {
            size: 'XL',
            nmId: 123456,
            skuCount: 2,
            stockUnits: 15,
            averageDailyOutgoing: 1,
            daysOfCover: null,
          },
        ],
      },
    }
    mockHook({ data: populatedResponse, isLoading: false, isError: false })
    renderWithProviders(<FbsStockSizesSection />)
    expect(screen.getByText('XL')).toBeInTheDocument()
    expect(screen.getByText('123456')).toBeInTheDocument()
    // null daysOfCover → '—' (anti-pattern #8)
    expect(screen.getByText('—')).toBeInTheDocument()
    // nm_id filter input should always be rendered
    expect(screen.getByPlaceholderText(/Артикул WB/)).toBeInTheDocument()
  })

  it('renders non-null daysOfCover with Russian comma decimal ("12,5", not "12.5")', () => {
    const populatedResponse = {
      ...emptyFbsStockSizesResponse(),
      data: {
        sizes: [
          {
            size: 'M',
            nmId: 654321,
            skuCount: 3,
            stockUnits: 20,
            averageDailyOutgoing: 2,
            daysOfCover: 12.5,
          },
        ],
      },
    }
    mockHook({ data: populatedResponse, isLoading: false, isError: false })
    renderWithProviders(<FbsStockSizesSection />)
    expect(screen.getByText('12,5')).toBeInTheDocument()
    expect(screen.queryByText('12.5')).not.toBeInTheDocument()
  })
})
