/**
 * Tests for FbsStockGroupsSection — Story 96.11-FE
 *
 * Covers the 4 state-machine branches:
 *   1. Loading (skeleton)
 *   2. Full error (no cached data)
 *   3. Empty state (data: groups=[])
 *   4. Populated state (groups with null money/ratio → '—')
 *
 * Also proves Pattern 3 fixture wiring: emptyFbsStockGroupsResponse() is consumed here.
 * Hook mocked per anti-pattern #4 (typed override builder, no `as any`).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { emptyFbsStockGroupsResponse } from '@/test/fixtures/fbs-stock-empty'

vi.mock('@/hooks/use-fbs-stock-groups', () => ({
  useFbsStockGroups: vi.fn(),
}))

import { useFbsStockGroups } from '@/hooks/use-fbs-stock-groups'
import { FbsStockGroupsSection } from '../FbsStockGroupsSection'

type HookReturn = ReturnType<typeof useFbsStockGroups>

interface HookOverrides {
  data?: ReturnType<typeof emptyFbsStockGroupsResponse> | undefined
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
  vi.mocked(useFbsStockGroups).mockReturnValue(partial as unknown as HookReturn)
}

describe('FbsStockGroupsSection (Story 96.11-FE)', () => {
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
    renderWithProviders(<FbsStockGroupsSection />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders full error alert when error and no cached data', () => {
    mockHook({ isError: true, data: undefined })
    renderWithProviders(<FbsStockGroupsSection />)
    expect(screen.getByText(/Не удалось загрузить данные по группам/)).toBeInTheDocument()
  })

  it('renders empty state from emptyFbsStockGroupsResponse() — Pattern 3 fixture wiring', () => {
    mockHook({ data: emptyFbsStockGroupsResponse(), isLoading: false, isError: false })
    renderWithProviders(<FbsStockGroupsSection />)
    expect(screen.getByText(/Нет данных по товарным группам/)).toBeInTheDocument()
  })

  it('renders populated table with null stockValue/daysOfCover as em-dash', () => {
    const populatedResponse = {
      ...emptyFbsStockGroupsResponse(),
      data: {
        groups: [
          {
            groupName: 'Одежда',
            skuCount: 10,
            stockUnits: 50,
            stockValue: null,
            averageDailyOutgoing: 2,
            daysOfCover: null,
          },
        ],
      },
    }
    mockHook({ data: populatedResponse, isLoading: false, isError: false })
    renderWithProviders(<FbsStockGroupsSection />)
    expect(screen.getByText('Одежда')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    // null money → '—' (anti-pattern #8)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(2) // stockValue + daysOfCover
  })

  it('renders non-null daysOfCover with Russian comma decimal ("12,5", not "12.5")', () => {
    const populatedResponse = {
      ...emptyFbsStockGroupsResponse(),
      data: {
        groups: [
          {
            groupName: 'Обувь',
            skuCount: 5,
            stockUnits: 30,
            stockValue: 1000,
            averageDailyOutgoing: 2,
            daysOfCover: 12.5,
          },
        ],
      },
    }
    mockHook({ data: populatedResponse, isLoading: false, isError: false })
    renderWithProviders(<FbsStockGroupsSection />)
    expect(screen.getByText('12,5')).toBeInTheDocument()
    expect(screen.queryByText('12.5')).not.toBeInTheDocument()
  })
})
