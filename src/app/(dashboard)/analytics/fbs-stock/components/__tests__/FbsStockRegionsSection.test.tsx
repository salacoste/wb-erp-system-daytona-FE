/**
 * Tests for FbsStockRegionsSection — Story 96.11-FE
 *
 * Covers the 4 state-machine branches:
 *   1. Loading (skeleton)
 *   2. Full error (no cached data)
 *   3. Empty state (data: regions=[])
 *   4. Populated state (regions with null stockValue → '—', generatedAt displayed)
 *
 * Hook mocked per anti-pattern #4 (typed override builder, no `as any`).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { emptyFbsStockRegionsResponse } from '@/test/fixtures/fbs-stock-empty'

vi.mock('@/hooks/use-fbs-stock-regions', () => ({
  useFbsStockRegions: vi.fn(),
}))

import { useFbsStockRegions } from '@/hooks/use-fbs-stock-regions'
import { FbsStockRegionsSection } from '../FbsStockRegionsSection'

type HookReturn = ReturnType<typeof useFbsStockRegions>

interface HookOverrides {
  data?: ReturnType<typeof emptyFbsStockRegionsResponse> | undefined
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
  vi.mocked(useFbsStockRegions).mockReturnValue(partial as unknown as HookReturn)
}

describe('FbsStockRegionsSection (Story 96.11-FE)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // M2-1 fix: pin system clock so formatDate renders the same DD.MM.YYYY
    // across all timezones (UTC, UTC+3, UTC-7, UTC+9).
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-08T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders skeleton when loading with no cached data', () => {
    mockHook({ isLoading: true, data: undefined })
    renderWithProviders(<FbsStockRegionsSection />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders full error alert when error and no cached data', () => {
    mockHook({ isError: true, data: undefined })
    renderWithProviders(<FbsStockRegionsSection />)
    expect(screen.getByText(/Не удалось загрузить данные по регионам/)).toBeInTheDocument()
  })

  it('renders empty state from emptyFbsStockRegionsResponse()', () => {
    mockHook({ data: emptyFbsStockRegionsResponse(), isLoading: false, isError: false })
    renderWithProviders(<FbsStockRegionsSection />)
    expect(screen.getByText(/Нет данных по регионам/)).toBeInTheDocument()
  })

  it('renders populated table with generatedAt timestamp and null stockValue as em-dash', () => {
    const populatedResponse = {
      data: {
        regions: [
          {
            regionName: 'Центральный',
            warehouseCount: 3,
            stockUnits: 200,
            stockValue: null,
            shareOfTotalPct: 55.0,
          },
        ],
      },
      generatedAt: '2026-05-01T12:00:00Z', // noon UTC — resolves to 01.05.2026 in all major TZs (M2-1 fix)
    }
    mockHook({ data: populatedResponse, isLoading: false, isError: false })
    renderWithProviders(<FbsStockRegionsSection />)
    expect(screen.getByText('Центральный')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    // generatedAt freshness indicator — formatDate renders DD.MM.YYYY (M-1 fix)
    expect(screen.getByText(/Данные актуальны на:/)).toBeInTheDocument()
    expect(screen.getByText(/01\.05\.2026/)).toBeInTheDocument()
    // null stockValue → '—' (anti-pattern #8)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('does not show stale-warning chip when generatedAt is in the future (L2-1 clock-skew)', () => {
    // System time pinned to 2026-05-08T12:00:00Z (beforeEach).
    // generatedAt is 1 hour in the future → elapsedMs < 0 → null → not stale.
    const futureResponse = {
      data: {
        regions: [
          {
            regionName: 'Северный',
            warehouseCount: 1,
            stockUnits: 50,
            stockValue: 10000,
            shareOfTotalPct: 10.0,
          },
        ],
      },
      generatedAt: '2026-05-08T13:00:00Z', // 1 hour ahead of pinned system time
    }
    mockHook({ data: futureResponse, isLoading: false, isError: false })
    renderWithProviders(<FbsStockRegionsSection />)
    // Stale warning chip must NOT appear for future-dated snapshots (clock skew treated as fresh)
    expect(screen.queryByText(/Данные обновлены/)).not.toBeInTheDocument()
  })
})
