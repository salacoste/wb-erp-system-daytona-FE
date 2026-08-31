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
import { fireEvent, screen } from '@testing-library/react'
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

  // ─── Epic 169.7 shadcn migration pins ───────────────────────────────────────

  it('169.7: cached-data banner uses status-warning token classes (exact pins)', () => {
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
            daysOfCover: 12.5,
          },
        ],
      },
    }
    mockHook({ data: populatedResponse, isLoading: false, isError: true })
    renderWithProviders(<FbsStockSizesSection />)
    const banner = screen
      .getByText('Не удалось обновить. Показаны кэшированные данные.')
      .closest('div')
    expect(banner).not.toBeNull()
    expect(banner?.classList.contains('border-status-warning/30')).toBe(true)
    expect(banner?.classList.contains('bg-status-warning/15')).toBe(true)
    expect(banner?.classList.contains('text-status-warning')).toBe(true)
  })

  it('169.7: renders static TableCaption naming the table', () => {
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
            daysOfCover: 12.5,
          },
        ],
      },
    }
    mockHook({ data: populatedResponse, isLoading: false, isError: false })
    renderWithProviders(<FbsStockSizesSection />)
    const caption = screen.getByText('Остатки FBS по размерам')
    expect(caption.tagName).toBe('CAPTION')
    expect(screen.getByRole('region', { name: 'Остатки FBS по размерам' })).toHaveAttribute(
      'tabindex',
      '0'
    )
  })

  it('169.7: numeric cells carry tabular-nums; nmId ID column stays mono WITHOUT tabular-nums', () => {
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
            daysOfCover: 12.5,
          },
        ],
      },
    }
    mockHook({ data: populatedResponse, isLoading: false, isError: false })
    renderWithProviders(<FbsStockSizesSection />)
    // non-nmId numeric column representative (SKU)
    const skuCell = screen.getByText('2').closest('td')
    expect(skuCell?.classList.contains('tabular-nums')).toBe(true)
    // 4 numeric columns: SKU, Остатки, Расход/день, Дней покрытия (nmId excluded — ID=mono idiom)
    expect(document.querySelectorAll('td.tabular-nums')).toHaveLength(4)
    const nmIdCell = screen.getByText('123456').closest('td')
    expect(nmIdCell?.classList.contains('font-mono')).toBe(true)
    expect(nmIdCell?.classList.contains('tabular-nums')).toBe(false)
  })

  it('169.7: nmId validation hint uses text-status-warning (exact pin)', () => {
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
            daysOfCover: 12.5,
          },
        ],
      },
    }
    mockHook({ data: populatedResponse, isLoading: false, isError: false })
    renderWithProviders(<FbsStockSizesSection />)
    const input = screen.getByLabelText('Фильтр по артикулу WB')
    fireEvent.change(input, { target: { value: '12.5abc' } })
    const hint = screen.getByText('Должно быть положительное целое число')
    expect(hint.classList.contains('text-status-warning')).toBe(true)
  })
})
