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

  // ─── Epic 169.7 shadcn migration pins ───────────────────────────────────────

  it('169.7: cached-data banner uses status-warning token classes (exact pins)', () => {
    const populatedResponse = {
      data: {
        regions: [
          {
            regionName: 'Центральный',
            warehouseCount: 3,
            stockUnits: 200,
            stockValue: 1000,
            shareOfTotalPct: 55.0,
          },
        ],
      },
      generatedAt: '2026-05-08T12:00:00Z', // fresh — isolate the cached-data banner from the stale chip
    }
    mockHook({ data: populatedResponse, isLoading: false, isError: true })
    renderWithProviders(<FbsStockRegionsSection />)
    const banner = screen
      .getByText('Не удалось обновить. Показаны кэшированные данные.')
      .closest('div')
    expect(banner).not.toBeNull()
    expect(banner?.classList.contains('border-status-warning/30')).toBe(true)
    expect(banner?.classList.contains('bg-status-warning/15')).toBe(true)
    expect(banner?.classList.contains('text-status-warning')).toBe(true)
  })

  it('169.7: stale-warning chip (>24h old snapshot) uses status-warning token classes (exact pins)', () => {
    // Pinned system time = 2026-05-08T12:00:00Z; generatedAt 25h in the past → stale
    const staleResponse = {
      data: {
        regions: [
          {
            regionName: 'Центральный',
            warehouseCount: 3,
            stockUnits: 200,
            stockValue: 1000,
            shareOfTotalPct: 55.0,
          },
        ],
      },
      generatedAt: '2026-05-07T11:00:00Z',
    }
    mockHook({ data: staleResponse, isLoading: false, isError: false })
    renderWithProviders(<FbsStockRegionsSection />)
    const chip = screen.getByText(/Данные обновлены/).closest('div')
    expect(chip).not.toBeNull()
    expect(chip?.classList.contains('border-status-warning/30')).toBe(true)
    expect(chip?.classList.contains('bg-status-warning/15')).toBe(true)
    expect(chip?.classList.contains('text-status-warning')).toBe(true)
  })

  it('169.7: renders static TableCaption naming the table', () => {
    const populatedResponse = {
      data: {
        regions: [
          {
            regionName: 'Центральный',
            warehouseCount: 3,
            stockUnits: 200,
            stockValue: 1000,
            shareOfTotalPct: 55.0,
          },
        ],
      },
      generatedAt: '2026-05-08T12:00:00Z',
    }
    mockHook({ data: populatedResponse, isLoading: false, isError: false })
    renderWithProviders(<FbsStockRegionsSection />)
    const caption = screen.getByText('Остатки FBS по регионам')
    expect(caption.tagName).toBe('CAPTION')
    expect(screen.getByRole('region', { name: 'Остатки FBS по регионам' })).toHaveAttribute(
      'tabindex',
      '0'
    )
  })

  it('169.7: numeric cells carry tabular-nums («Складов» column representative)', () => {
    const populatedResponse = {
      data: {
        regions: [
          {
            regionName: 'Центральный',
            warehouseCount: 3,
            stockUnits: 200,
            stockValue: 1000,
            shareOfTotalPct: 55.0,
          },
        ],
      },
      generatedAt: '2026-05-08T12:00:00Z',
    }
    mockHook({ data: populatedResponse, isLoading: false, isError: false })
    renderWithProviders(<FbsStockRegionsSection />)
    const warehousesCell = screen.getByText('3').closest('td')
    expect(warehousesCell?.classList.contains('tabular-nums')).toBe(true)
    // 4 numeric columns: Складов, Остатки, Стоимость, Доля от всех (%)
    expect(document.querySelectorAll('td.tabular-nums')).toHaveLength(4)
  })

  it('169.7: null shareOfTotalPct renders muted em-dash (text-muted-foreground pin)', () => {
    const populatedResponse = {
      data: {
        regions: [
          {
            regionName: 'Центральный',
            warehouseCount: 3,
            stockUnits: 200,
            stockValue: 1000,
            shareOfTotalPct: null,
          },
        ],
      },
      generatedAt: '2026-05-08T12:00:00Z',
    }
    mockHook({ data: populatedResponse, isLoading: false, isError: false })
    renderWithProviders(<FbsStockRegionsSection />)
    const dash = screen.getByText('—')
    expect(dash.textContent).toBe('—')
    expect(dash.classList.contains('text-muted-foreground')).toBe(true)
  })
})
