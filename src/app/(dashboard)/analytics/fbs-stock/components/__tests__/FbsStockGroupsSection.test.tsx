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
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
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

  it('renders a valid zero stock balance as 0 instead of missing data', () => {
    const populatedResponse = {
      ...emptyFbsStockGroupsResponse(),
      data: {
        groups: [
          {
            groupName: 'Нулевой остаток',
            skuCount: 1,
            stockUnits: 0,
            stockValue: 0,
            averageDailyOutgoing: 0,
            daysOfCover: 0,
          },
        ],
      },
    }
    mockHook({ data: populatedResponse, isLoading: false, isError: false })

    renderWithProviders(<FbsStockGroupsSection />)

    expect(screen.getByText('Нулевой остаток')).toBeInTheDocument()
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(2)
    expect(screen.queryByText('—')).not.toBeInTheDocument()
  })

  // ─── Epic 169.7 shadcn migration pins ───────────────────────────────────────

  it('169.7: cached-data banner uses status-warning token classes (exact pins)', () => {
    const populatedResponse = {
      ...emptyFbsStockGroupsResponse(),
      data: {
        groups: [
          {
            groupName: 'Одежда',
            skuCount: 10,
            stockUnits: 50,
            stockValue: 1000,
            averageDailyOutgoing: 2,
            daysOfCover: 12.5,
          },
        ],
      },
    }
    mockHook({ data: populatedResponse, isLoading: false, isError: true })
    renderWithProviders(<FbsStockGroupsSection />)
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
      ...emptyFbsStockGroupsResponse(),
      data: {
        groups: [
          {
            groupName: 'Одежда',
            skuCount: 1,
            stockUnits: 5,
            stockValue: 100,
            averageDailyOutgoing: 1,
            daysOfCover: 5,
          },
        ],
      },
    }
    mockHook({ data: populatedResponse, isLoading: false, isError: false })
    renderWithProviders(<FbsStockGroupsSection />)
    const caption = screen.getByText('Остатки FBS по товарным группам')
    expect(caption.tagName).toBe('CAPTION')
    expect(screen.getByRole('region', { name: 'Остатки FBS по товарным группам' })).toHaveAttribute(
      'tabindex',
      '0'
    )
  })

  it('169.7: numeric cells carry tabular-nums (SKU column representative)', () => {
    const populatedResponse = {
      ...emptyFbsStockGroupsResponse(),
      data: {
        groups: [
          {
            groupName: 'Одежда',
            skuCount: 10,
            stockUnits: 50,
            stockValue: 1000,
            averageDailyOutgoing: 2,
            daysOfCover: 12.5,
          },
        ],
      },
    }
    mockHook({ data: populatedResponse, isLoading: false, isError: false })
    renderWithProviders(<FbsStockGroupsSection />)
    const skuCell = screen.getByText('10').closest('td')
    expect(skuCell?.classList.contains('tabular-nums')).toBe(true)
    // 5 numeric columns = SKU, Остатки, Стоимость, Расход/день, Дней покрытия
    expect(document.querySelectorAll('td.tabular-nums')).toHaveLength(5)
  })
})

// Epic 169.7 no-hex guard — owned component sources must not carry raw hex color
// literals (dark-mode regression guard; comments are exempt). Mechanism copied
// verbatim from 169-6 (FbsRegionalDataSection no-hex guard).
// Hex width 3-8: catches 3-digit shorthand (#000) and 8-digit with alpha (#RRGGBBAA).
describe('FbsStock source no-hex guard (Epic 169.7)', () => {
  it('owned component sources contain no raw hex color literals outside comments', () => {
    const componentsDir = join(dirname(fileURLToPath(import.meta.url)), '..')
    const routeDir = dirname(componentsDir)
    // Scan components dir + top-level .tsx files in the route dir (page.tsx)
    const scanDirs = [componentsDir, routeDir]
    for (const dir of scanDirs) {
      for (const file of readdirSync(dir)) {
        if (!file.endsWith('.tsx')) continue
        // route dir: top-level files only (components/ subdir covered by its own loop)
        if (dir === routeDir && file !== 'page.tsx') continue
        const source = readFileSync(join(dir, file), 'utf-8')
        const codeOnly = source
          .split('\n')
          .filter(line => !line.trim().startsWith('//') && !line.trim().startsWith('*'))
          .join('\n')
        expect(codeOnly, `${file} must not contain raw hex colors`).not.toMatch(
          /#[0-9A-Fa-f]{3,8}\b/
        )
      }
    }
  })
})
