import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ── Mock hooks ──────────────────────────────────────────────────────────────
vi.mock('@/hooks/useAiModels')
vi.mock('@/hooks/useAiEvaluations')
// Story 110.4-FE: FeedbackButtons (inside EvaluationsTable) needs these mocks
vi.mock('@/lib/api/ai/system')
vi.mock('@/stores/authStore')

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }))

import * as useAiModelsMod from '@/hooks/useAiModels'
import * as useAiEvaluationsMod from '@/hooks/useAiEvaluations'
import * as systemApi from '@/lib/api/ai/system'
import * as authStore from '@/stores/authStore'

const mockUseAiModels = vi.mocked(useAiModelsMod.useAiModels)
const mockUseAiEvaluations = vi.mocked(useAiEvaluationsMod.useAiEvaluations)
const mockPostFeedback = vi.mocked(systemApi.postFeedback)
const mockUseAuthStore = vi.mocked(authStore.useAuthStore)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

import { EvaluationsList } from '../EvaluationsList'
import { sortEvaluationsByMape, formatMapeDisplay } from '../evaluations-list-helpers'
import { ROUTES } from '@/lib/routes'
import type { AiModelListResponse } from '@/types/ai/models'
import type { AiEvaluationListResponse, EvaluationEntry } from '@/types/ai/evaluations'
import type { UseQueryResult } from '@tanstack/react-query'

// ── Fixtures ────────────────────────────────────────────────────────────────

function makeQueryResult<T>(partial: Record<string, unknown>): UseQueryResult<T, Error> {
  return {
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    isSuccess: false,
    isPending: false,
    isFetching: false,
    fetchStatus: 'idle',
    status: 'pending',
    ...partial,
  } as unknown as UseQueryResult<T, Error>
}

const baseModel = {
  id: 'model-1',
  modelType: 'sales_forecast' as const,
  engine: 'prophet' as const,
  version: 3,
  status: 'active' as const,
  metrics: { mape: 12.5, dataPointsCount: 100 },
}

const makeModelList = (overrides: Partial<AiModelListResponse> = {}): AiModelListResponse => ({
  models: [baseModel],
  ...overrides,
})

const skuEntry: EvaluationEntry = {
  forecastId: 'forecast-abc-123',
  modelId: 'model-1',
  nmId: 12345,
  forecastDate: '2026-05-01',
  horizonDays: 7,
  predictedUnits: 100,
  actualUnits: 90,
  predictedRevenue: 50000,
  actualRevenue: 45000,
  mapeUnits: 11.1,
  mapeRevenue: 8.5,
  evaluationDate: '2026-05-17',
}

const cabinetEntry: EvaluationEntry = {
  forecastId: 'forecast-cab-456',
  modelId: 'model-1',
  nmId: null,
  forecastDate: '2026-05-01',
  horizonDays: 7,
  predictedUnits: 500,
  actualUnits: 480,
  predictedRevenue: 250000,
  actualRevenue: 240000,
  mapeUnits: 4.0,
  mapeRevenue: null,
  evaluationDate: '2026-05-17',
}

const makeEvalData = (
  overrides: Partial<AiEvaluationListResponse> = {}
): AiEvaluationListResponse => ({
  evaluations: [skuEntry, cabinetEntry],
  cabinetMape: 15.2,
  evaluatedAt: '2026-05-17T10:00:00Z',
  skuCount: 42,
  ...overrides,
})

function setup(
  modelsPartial: Record<string, unknown> = {},
  evalPartial: Record<string, unknown> = {}
) {
  mockUseAiModels.mockReturnValue(
    makeQueryResult<AiModelListResponse>({
      data: makeModelList(),
      isSuccess: true,
      status: 'success',
      ...modelsPartial,
    })
  )
  mockUseAiEvaluations.mockReturnValue(
    makeQueryResult<AiEvaluationListResponse>({
      data: makeEvalData(),
      isSuccess: true,
      status: 'success',
      ...evalPartial,
    })
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Pure-helper unit tests
// ═══════════════════════════════════════════════════════════════════════════

const newFields = {
  modelId: 'model-1',
  forecastDate: '2026-05-01',
  horizonDays: 7,
  predictedRevenue: 0,
  actualRevenue: 0,
  evaluationDate: '2026-05-17',
}

describe('sortEvaluationsByMape', () => {
  const entries: EvaluationEntry[] = [
    {
      forecastId: 'a',
      ...newFields,
      nmId: 1,
      predictedUnits: 10,
      actualUnits: 9,
      mapeUnits: 20.0,
      mapeRevenue: null,
    },
    {
      forecastId: 'b',
      ...newFields,
      nmId: 2,
      predictedUnits: 10,
      actualUnits: 9,
      mapeUnits: 5.0,
      mapeRevenue: 3.0,
    },
    {
      forecastId: 'c',
      ...newFields,
      nmId: null,
      predictedUnits: 10,
      actualUnits: 9,
      mapeUnits: null,
      mapeRevenue: null,
    },
  ]

  it('asc: nulls last, lower MAPE first', () => {
    const result = sortEvaluationsByMape(entries, 'mapeUnits', 'asc')
    expect(result.map(e => e.forecastId)).toEqual(['b', 'a', 'c'])
  })

  it('desc: nulls last, higher MAPE first', () => {
    const result = sortEvaluationsByMape(entries, 'mapeUnits', 'desc')
    expect(result.map(e => e.forecastId)).toEqual(['a', 'b', 'c'])
  })
})

describe('formatMapeDisplay', () => {
  it('null → em-dash (AP#8)', () => {
    expect(formatMapeDisplay(null)).toBe('—')
  })
  it('number → Russian locale percentage (F-2: no English decimal dot)', () => {
    // formatPercentage uses Intl ru-RU: 12.5 → "12,5 %" (comma, space before %)
    const result = formatMapeDisplay(12.5)
    expect(result).toMatch(/\d/)
    expect(result).not.toBe('—')
    // Must not use English decimal dot format like "12.5%"
    expect(result).not.toBe('12.5%')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// Component render tests
// ═══════════════════════════════════════════════════════════════════════════

describe('EvaluationsList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPush.mockReset()
    // Story 110.4-FE: FeedbackButtons needs auth + api mocks (rendered inside EvaluationsTable)
    mockPostFeedback.mockResolvedValue(undefined)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) => selector({ cabinetId: 'cab-1' }))
  })

  it('renders Skeleton when loading', () => {
    setup(
      { isLoading: true, data: undefined, isSuccess: false, status: 'pending' },
      { isLoading: true, data: undefined, isSuccess: false, status: 'pending' }
    )
    render(<EvaluationsList modelId="model-1" />, { wrapper: createWrapper() })
    // F-5: unique testid per skeleton container (no collision with other skeleton instances)
    expect(screen.getByTestId('evaluations-skeleton')).toBeTruthy()
  })

  it('list-error: renders destructive Alert with list error message', () => {
    setup({
      isError: true,
      isSuccess: false,
      status: 'error',
      data: undefined,
      error: new Error('Network unreachable'),
    })
    render(<EvaluationsList modelId="model-1" />, { wrapper: createWrapper() })
    expect(screen.getByText(/Ошибка загрузки списка моделей/)).toBeTruthy()
    expect(screen.getByText(/Network unreachable/)).toBeTruthy()
    // Negative: must NOT silently show model-not-found (F-17 state-precedence)
    expect(screen.queryByText(/Модель не найдена/)).toBeNull()
  })

  it('evaluations-error: renders destructive Alert with evaluations error message', () => {
    setup(
      {},
      {
        isError: true,
        isSuccess: false,
        status: 'error',
        data: undefined,
        error: new Error('Eval fetch failed'),
      }
    )
    render(<EvaluationsList modelId="model-1" />, { wrapper: createWrapper() })
    expect(screen.getByText(/Ошибка загрузки оценок модели/)).toBeTruthy()
    expect(screen.getByText(/Eval fetch failed/)).toBeTruthy()
  })

  it('model-not-found: renders Alert with link to MODELS list', () => {
    setup({ data: makeModelList({ models: [] }) })
    render(<EvaluationsList modelId="model-1" />, { wrapper: createWrapper() })
    expect(screen.getByText(/Модель не найдена/)).toBeTruthy()
    const link = screen.getByRole('link', { name: /Вернуться к списку моделей/ })
    expect(link.getAttribute('href')).toBe(ROUTES.ANALYTICS.MODELS)
  })

  it('empty evaluations: renders non-destructive Alert', () => {
    setup({}, { data: makeEvalData({ evaluations: [] }) })
    render(<EvaluationsList modelId="model-1" />, { wrapper: createWrapper() })
    expect(screen.getByText(/Нет оценок этой модели/)).toBeTruthy()
  })

  it('happy path: header renders modelType label + version + status badge', () => {
    setup()
    render(<EvaluationsList modelId="model-1" />, { wrapper: createWrapper() })
    expect(screen.getByText('Оценки точности модели')).toBeTruthy()
    expect(screen.getByText('Прогноз продаж')).toBeTruthy()
    expect(screen.getByText('v3')).toBeTruthy()
    expect(screen.getByText('Активна')).toBeTruthy()
  })

  it('happy path: aggregate summary cards show correct values', () => {
    setup()
    render(<EvaluationsList modelId="model-1" />, { wrapper: createWrapper() })
    // cabinetMape = 15.2 → formatPercentage(15.2)
    expect(screen.getByText('Средняя точность (MAPE)')).toBeTruthy()
    expect(screen.getByText('Последняя оценка')).toBeTruthy()
    expect(screen.getByText('SKU оценено')).toBeTruthy()
    // skuCount = 42
    expect(screen.getByText('42')).toBeTruthy()
  })

  it('AP#8: cabinetMape null renders em-dash not 0', () => {
    setup({}, { data: makeEvalData({ cabinetMape: null, evaluations: [] }) })
    render(<EvaluationsList modelId="model-1" />, { wrapper: createWrapper() })
    // The MAPE summary card should render '—'
    const cards = screen.getAllByText('—')
    expect(cards.length).toBeGreaterThanOrEqual(1)
  })

  it('cabinetMape 0 renders "0,0 %" — shadow-eval avg, a real (implausible) value, NOT the #185 sentinel', () => {
    setup({}, { data: makeEvalData({ cabinetMape: 0, evaluations: [] }) })
    render(<EvaluationsList modelId="model-1" />, { wrapper: createWrapper() })
    // cabinetMape is the shadow-eval average (null when un-evaluated, never the model-level
    // metrics.mape:0 sentinel), so a real 0 must render as "0,0 %", not be hidden as "—".
    expect(screen.getByText(/0,0\s%/)).toBeTruthy()
  })

  it('AP#8: evaluatedAt null renders em-dash', () => {
    setup({}, { data: makeEvalData({ evaluatedAt: null, evaluations: [] }) })
    render(<EvaluationsList modelId="model-1" />, { wrapper: createWrapper() })
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(1)
  })

  it('happy path: column headers render including forecast columns', () => {
    setup()
    render(<EvaluationsList modelId="model-1" />, { wrapper: createWrapper() })
    expect(screen.getByText('Дата оценки')).toBeTruthy()
    expect(screen.getByText('Дата прогноза')).toBeTruthy()
    expect(screen.getByText('Горизонт')).toBeTruthy()
    expect(screen.getByText('Артикул')).toBeTruthy()
    expect(screen.getByText('Прогноз (ед.)')).toBeTruthy()
    expect(screen.getByText('Факт (ед.)')).toBeTruthy()
    expect(screen.getByText('Прогноз (₽)')).toBeTruthy()
    expect(screen.getByText('Факт (₽)')).toBeTruthy()
    // Sort buttons
    expect(screen.getByRole('button', { name: /Сортировать по MAPE единиц/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Сортировать по MAPE выручки/ })).toBeTruthy()
  })

  it('nmId null renders "По кабинету"', () => {
    setup()
    render(<EvaluationsList modelId="model-1" />, { wrapper: createWrapper() })
    expect(screen.getByText('По кабинету')).toBeTruthy()
  })

  it('AP#8: mapeUnits null renders em-dash in table row', () => {
    const nullMapeEntry: EvaluationEntry = {
      forecastId: 'no-mape-entry',
      ...newFields,
      nmId: 99,
      predictedUnits: 10,
      actualUnits: 8,
      mapeUnits: null,
      mapeRevenue: null,
    }
    setup({}, { data: makeEvalData({ evaluations: [nullMapeEntry] }) })
    render(<EvaluationsList modelId="model-1" />, { wrapper: createWrapper() })
    const dashes = screen.getAllByText('—')
    // Both mapeUnits and mapeRevenue null → 2 dashes in the table
    expect(dashes.length).toBeGreaterThanOrEqual(2)
  })

  it('sort-by-mapeUnits click reverses direction and reorders rows (F-3)', () => {
    // skuEntry mapeUnits=11.1, cabinetEntry mapeUnits=4.0
    // ASC default: cabinetEntry (4.0) first, skuEntry (11.1) second
    setup()
    const { container } = render(<EvaluationsList modelId="model-1" />, {
      wrapper: createWrapper(),
    })
    const sortBtn = screen.getByRole('button', { name: /Сортировать по MAPE единиц/ })

    // Default asc → shows ↑
    expect(sortBtn.textContent).toContain('↑')

    // Verify row order ASC: cabinetEntry (mapeUnits=4.0) first, skuEntry (11.1) second.
    // The SKU <tr> has role="button" so getAllByRole('row') excludes it.
    // Use querySelectorAll('tr') to get ALL rows in DOM order regardless of ARIA role.
    const allRowsBefore = Array.from(container.querySelectorAll('tr'))
    const cabinetRowIndexBefore = allRowsBefore.findIndex(r =>
      r.textContent?.includes('По кабинету')
    )
    const skuRowIndexBefore = allRowsBefore.findIndex(r =>
      r.getAttribute('aria-label')?.includes('Перейти к детализации')
    )
    expect(cabinetRowIndexBefore).toBeGreaterThan(0) // found, not header
    expect(skuRowIndexBefore).toBeGreaterThan(0) // found
    expect(cabinetRowIndexBefore).toBeLessThan(skuRowIndexBefore)

    fireEvent.click(sortBtn)
    // After click: desc → shows ↓
    expect(sortBtn.textContent).toContain('↓')

    // Verify row order DESC: skuEntry (mapeUnits=11.1) now appears before cabinetEntry (4.0)
    const allRowsAfter = Array.from(container.querySelectorAll('tr'))
    const cabinetRowIndexAfter = allRowsAfter.findIndex(r => r.textContent?.includes('По кабинету'))
    const skuRowIndexAfter = allRowsAfter.findIndex(r =>
      r.getAttribute('aria-label')?.includes('Перейти к детализации')
    )
    expect(skuRowIndexAfter).toBeLessThan(cabinetRowIndexAfter)
  })

  it('row navigation: click on non-null nmId calls router.push with expected URL', () => {
    setup()
    render(<EvaluationsList modelId="model-1" />, { wrapper: createWrapper() })
    // Find the row for nmId=12345 (skuEntry)
    const skuRow = screen.getByRole('button', { name: /Перейти к детализации по артикулу 12345/ })
    fireEvent.click(skuRow)
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('model-1'))
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('nmId=12345'))
  })

  it('row navigation: cabinet-level row (nmId null) does NOT navigate', () => {
    setup({}, { data: makeEvalData({ evaluations: [cabinetEntry] }) })
    render(<EvaluationsList modelId="model-1" />, { wrapper: createWrapper() })
    // Cabinet row has no role=button and no aria-label for navigation
    expect(screen.queryByRole('button', { name: /Перейти к детализации/ })).toBeNull()
    // Clicking it should not push
    const cabinetCell = screen.getByText('По кабинету')
    fireEvent.click(cabinetCell)
    expect(mockPush).not.toHaveBeenCalled()
  })
})
