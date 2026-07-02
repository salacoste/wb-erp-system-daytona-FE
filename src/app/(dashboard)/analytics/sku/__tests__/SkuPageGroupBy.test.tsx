/**
 * FR-7 (#221) Phase 2 — page-level integration test for the SKU-page group-by toggle.
 *
 * Guards the single-week enforcement in
 * `src/app/(dashboard)/analytics/sku/page.tsx`:
 *
 *   const effectiveGroupBy =
 *     groupBy === 'variant' && !state.isRangeMode ? 'variant' : 'sku'
 *
 * The by-variant endpoint 400s on a range, so a regression that lets variant mode
 * mount in range mode would break the page. This file is the only test covering
 * that guard. Heavy child sections (SkuTableSection / SkuVariantSection /
 * SkuCashflowSection) are stubbed to `data-testid` markers, so the assertions
 * verify the page's BRANCHING only — not internals.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders } from '@/test/utils/test-utils'

// Minimal stub shape for useSkuPageState (see StubState below). Built permissive
// so the test never fights the real union types of skuFinancialsData / router.
interface StubState {
  isLoadingWeeks: boolean
  isInitialized: boolean
  isErrorWeeks: boolean
  errorWeeks: unknown
  isLoadingSkuFinancials: boolean
  isErrorSkuFinancials: boolean
  errorSkuFinancials: unknown
  skuFinancialsData: { data: unknown[] }
  cabinetExpenses: unknown
  isLoadingCabinetExpenses: boolean
  weekStart: string
  weekEnd: string
  nmIdFilter: string | null
  filteredProductName: string | null
  showExportDialog: boolean
  setShowExportDialog: ReturnType<typeof vi.fn>
  handleRangeChange: ReturnType<typeof vi.fn>
  handleClearFilter: ReturnType<typeof vi.fn>
  refetch: ReturnType<typeof vi.fn>
  router: { push: ReturnType<typeof vi.fn> }
  isRangeMode: boolean
}

// --- Hoisted mocks ---------------------------------------------------------
// `vi.hoisted` so the mock functions exist before the `vi.mock` factory runs.
const { searchParamsGetMock, stateMock } = vi.hoisted(() => ({
  searchParamsGetMock: vi.fn(),
  stateMock: vi.fn<[], StubState>(),
}))

// next/navigation: control `group_by` per test via searchParamsGetMock.
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => searchParamsGetMock(key),
    // Stable string so URLSearchParams construction inside the page never throws.
    toString: () => '',
  }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

// useSkuPageState: return a controlled stub. Only `isRangeMode` varies per test,
// but we expose the full minimal shape the page reads so it never short-circuits
// into a loading / error branch.
vi.mock('../components/useSkuPageState', () => ({
  useSkuPageState: () => stateMock(),
}))

// Section stubs — render minimal markers so the test only sees which branch mounted.
vi.mock('../components/SkuVariantSection', () => ({
  SkuVariantSection: ({ week }: { week: string }) => (
    <div data-testid="variant-section">{week}</div>
  ),
}))
vi.mock('../components/SkuTableSection', () => ({
  SkuTableSection: () => <div data-testid="sku-section" />,
}))
vi.mock('../components/SkuCashflowSection', () => ({
  SkuCashflowSection: () => <div data-testid="cashflow-section" />,
}))

// Pass-through / null stubs for auxiliaries that don't affect the branching under test.
vi.mock('@/components/custom/RequireWbToken', () => ({
  RequireWbToken: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
vi.mock('@/components/custom/ExportDialog', () => ({
  ExportDialog: () => <div />,
}))
vi.mock('../components/SkuFilterSection', () => ({
  SkuFilterSection: () => <div data-testid="filter-section" />,
}))
vi.mock('../components/SkuGroupByToggle', () => ({
  SkuGroupByToggle: () => <div data-testid="group-by-toggle" />,
}))
vi.mock('../components/SkuPageStates', () => ({
  SkuPageLoading: () => <div data-testid="sku-loading" />,
  SkuPageWeeksError: () => <div data-testid="sku-weeks-error" />,
  SkuPageDataError: () => <div data-testid="sku-data-error" />,
}))
vi.mock('../components/SkuPageAlerts', () => ({
  OperatingProfitInfoBanner: () => null,
  NmIdFilterAlert: () => null,
  PeriodLabel: () => null,
}))
vi.mock('../components/sku-page-stats', () => ({
  // The page calls calculateSkuPageStats(skuData, cabinetExpenses); return a stub.
  calculateSkuPageStats: () => ({}),
}))

// Import AFTER mocks are registered.
import SkuPage from '../page'

/** Build a stub state that never trips a loading/error branch in page.tsx. */
function makeState(overrides: Partial<StubState>): StubState {
  return {
    isLoadingWeeks: false,
    isInitialized: true,
    isErrorWeeks: false,
    errorWeeks: null,
    isLoadingSkuFinancials: false,
    isErrorSkuFinancials: false,
    errorSkuFinancials: null,
    skuFinancialsData: { data: [] },
    cabinetExpenses: null,
    isLoadingCabinetExpenses: false,
    weekStart: '2026-W26',
    weekEnd: '2026-W26',
    nmIdFilter: null,
    filteredProductName: null,
    showExportDialog: false,
    setShowExportDialog: vi.fn(),
    handleRangeChange: vi.fn(),
    handleClearFilter: vi.fn(),
    refetch: vi.fn(),
    router: { push: vi.fn() },
    isRangeMode: false,
    ...overrides,
  }
}

describe('SkuPage group-by branching (FR-7 Phase 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: no group_by param. Individual tests override.
    searchParamsGetMock.mockReturnValue(null)
    stateMock.mockReturnValue(makeState({}))
  })

  it('default = sku mode when group_by is absent and not in range mode', () => {
    searchParamsGetMock.mockImplementation((key: string) => (key === 'group_by' ? null : null))
    stateMock.mockReturnValue(makeState({ isRangeMode: false }))

    const { getByTestId, queryByTestId } = renderWithProviders(<SkuPage />)

    expect(getByTestId('sku-section')).toBeInTheDocument()
    expect(queryByTestId('variant-section')).toBeNull()
  })

  it('renders the variant section in variant mode on a single week (cashflow hidden)', () => {
    searchParamsGetMock.mockImplementation((key: string) => (key === 'group_by' ? 'variant' : null))
    stateMock.mockReturnValue(makeState({ isRangeMode: false }))

    const { getByTestId, queryByTestId } = renderWithProviders(<SkuPage />)

    expect(getByTestId('variant-section')).toBeInTheDocument()
    expect(queryByTestId('sku-section')).toBeNull()
    // Cashflow belongs to the by-SKU flow and must be hidden in variant mode.
    expect(queryByTestId('cashflow-section')).toBeNull()
  })

  it('falls back to sku mode when group_by=variant but a range is selected (400 guard)', () => {
    searchParamsGetMock.mockImplementation((key: string) => (key === 'group_by' ? 'variant' : null))
    // Range mode: the by-variant endpoint would 400 — page MUST downgrade to sku.
    stateMock.mockReturnValue(
      makeState({ isRangeMode: true, weekStart: '2026-W25', weekEnd: '2026-W27' })
    )

    const { getByTestId, queryByTestId } = renderWithProviders(<SkuPage />)

    expect(queryByTestId('variant-section')).toBeNull()
    expect(getByTestId('sku-section')).toBeInTheDocument()
  })
})
