import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// ── JSDOM: mock window.matchMedia ──────────────────────────────────────────
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// ── Mock recharts (Pattern 2 jsdom, from FunnelOverlayChart.test.tsx:6-33) ─
vi.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// ── Mock hooks ──────────────────────────────────────────────────────────────
vi.mock('@/hooks/useModelPerformance')
vi.mock('@/hooks/useAiModels')
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

import * as useModelPerformanceMod from '@/hooks/useModelPerformance'
import * as useAiModelsMod from '@/hooks/useAiModels'

const mockUseModelPerformance = vi.mocked(useModelPerformanceMod.useModelPerformance)
const mockUseAiModels = vi.mocked(useAiModelsMod.useAiModels)

import {
  ModelPerformanceDetail,
  DRIFT_BADGE_CONFIG,
  DRIFT_NULL_CONFIG,
  getMapeDeltaColor,
  formatMapeDelta,
  getCurrentMape,
} from '../ModelPerformanceDetail'
import { MapeTrendTooltip } from '../MapeTrendChart'
import { formatMapeTick } from '../model-performance-helpers'
import { ROUTES } from '@/lib/routes'
import type { ModelPerformanceResponse, AiModelListResponse } from '@/types/ai/models'
import type { UseQueryResult } from '@tanstack/react-query'

// ── Fixtures ────────────────────────────────────────────────────────────────

const makeModelListResponse = (
  overrides: Partial<AiModelListResponse> = {}
): AiModelListResponse => ({
  models: [
    {
      id: 'model-1',
      modelType: 'sales_forecast',
      engine: 'prophet',
      version: 2,
      status: 'active',
      metrics: { mape: 12.5, dataPointsCount: 100 },
    },
  ],
  ...overrides,
})

const makePerformanceResponse = (
  overrides: Partial<ModelPerformanceResponse> = {}
): ModelPerformanceResponse => ({
  driftStatus: 'stable',
  mapeTrend: [
    { evaluationDate: '2026-05-10', cabinetMape: 14.0, skuCount: 50 },
    { evaluationDate: '2026-05-17', cabinetMape: 12.5, skuCount: 52 },
  ],
  ...overrides,
})

// UseQueryResult is a discriminated union — cast via unknown to avoid TS strictness in tests.
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

function setup(
  perfPartial: Record<string, unknown> = {},
  modelsPartial: Record<string, unknown> = {}
) {
  mockUseModelPerformance.mockReturnValue(
    makeQueryResult<ModelPerformanceResponse>({
      data: makePerformanceResponse(),
      isSuccess: true,
      status: 'success',
      ...perfPartial,
    })
  )
  mockUseAiModels.mockReturnValue(
    makeQueryResult<AiModelListResponse>({
      data: makeModelListResponse(),
      isSuccess: true,
      status: 'success',
      ...modelsPartial,
    })
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Pure-helper unit tests (no React render needed)
// ═══════════════════════════════════════════════════════════════════════════

describe('DRIFT_BADGE_CONFIG', () => {
  it('improving → green class + Russian label Улучшается', () => {
    expect(DRIFT_BADGE_CONFIG.improving.label).toBe('Улучшается')
    expect(DRIFT_BADGE_CONFIG.improving.className).toContain('green')
  })

  it('stable → blue class + Russian label Стабильно', () => {
    expect(DRIFT_BADGE_CONFIG.stable.label).toBe('Стабильно')
    expect(DRIFT_BADGE_CONFIG.stable.className).toContain('blue')
  })

  it('degrading → red class + Russian label Деградирует', () => {
    expect(DRIFT_BADGE_CONFIG.degrading.label).toBe('Деградирует')
    expect(DRIFT_BADGE_CONFIG.degrading.className).toContain('red')
  })

  it('null case → DRIFT_NULL_CONFIG is gray + Недостаточно данных', () => {
    expect(DRIFT_NULL_CONFIG.label).toBe('Недостаточно данных')
    expect(DRIFT_NULL_CONFIG.className).toContain('gray')
  })
})

describe('getMapeDeltaColor', () => {
  it('negative delta → text-green-600 (MAPE improved)', () => {
    expect(getMapeDeltaColor(-3.5)).toBe('text-green-600')
  })

  it('positive delta → text-red-600 (MAPE regressed)', () => {
    expect(getMapeDeltaColor(5.0)).toBe('text-red-600')
  })

  it('zero delta → text-muted-foreground', () => {
    expect(getMapeDeltaColor(0)).toBe('text-muted-foreground')
  })
})

describe('formatMapeDelta', () => {
  it('returns Russian-locale string with + sign for positive delta', () => {
    // formatPercentage → comma+NBSP ("4,0 %"); regex per locale-assertion rule
    expect(formatMapeDelta(10.0, 14.0)).toMatch(/\+4,0\s%/)
  })

  it('returns Russian-locale string with minus for negative delta', () => {
    // Intl ru-RU uses ASCII hyphen '-' (U+002D); char class [-−] is robust to U+2212
    expect(formatMapeDelta(14.0, 10.0)).toMatch(/[-−]4,0\s%/)
  })

  it('returns Russian-locale "0,0 %" with no + sign for zero delta', () => {
    expect(formatMapeDelta(12.5, 12.5)).toMatch(/^0,0\s%/)
  })

  it('returns null when prevMape is null (AP#8 compliance)', () => {
    expect(formatMapeDelta(null, 12.5)).toBeNull()
  })

  it('returns null when currentMape is null (AP#8 compliance)', () => {
    expect(formatMapeDelta(12.5, null)).toBeNull()
  })
})

describe('formatMapeTick', () => {
  it('rounds and appends %', () => {
    expect(formatMapeTick(12.4)).toBe('12%')
    expect(formatMapeTick(0)).toBe('0%')
    expect(formatMapeTick(99.9)).toBe('100%')
  })
})

describe('getCurrentMape', () => {
  it('returns last entry cabinetMape when present (insertion-order baseline)', () => {
    expect(
      getCurrentMape([
        { evaluationDate: '2026-05-10', cabinetMape: 14.0 },
        { evaluationDate: '2026-05-17', cabinetMape: 12.5 },
      ])
    ).toBe(12.5)
  })

  it('returns the entry with the most recent evaluationDate, NOT the last by insertion order', () => {
    expect(
      getCurrentMape([
        { evaluationDate: '2026-05-10', cabinetMape: 14.0 },
        { evaluationDate: '2026-05-17', cabinetMape: 8.0 },
        { evaluationDate: '2026-05-13', cabinetMape: 11.0 },
      ])
    ).toBe(8.0)
  })

  it('returns null for empty array', () => {
    expect(getCurrentMape([])).toBeNull()
  })

  it('returns null when most-recent entry cabinetMape is null (AP#8)', () => {
    expect(getCurrentMape([{ evaluationDate: '2026-05-17', cabinetMape: null }])).toBeNull()
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// MapeTrendTooltip unit tests (F-8: named export for direct testing)
// ═══════════════════════════════════════════════════════════════════════════

describe('MapeTrendTooltip', () => {
  it('renders nothing when inactive', () => {
    const { container } = render(<MapeTrendTooltip active={false} payload={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when payload is empty', () => {
    const { container } = render(<MapeTrendTooltip active={true} payload={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('active with non-null mape: renders Дата, MAPE percentage, and SKU count', () => {
    const payload = [
      {
        payload: { evaluationDate: '2026-05-17', cabinetMape: 12.4, skuCount: 500 },
      },
    ]
    render(<MapeTrendTooltip active={true} payload={payload} />)
    expect(screen.getByText(/Дата:/)).toBeTruthy()
    // formatPercentage → Russian comma+NBSP locale ("12,4 %"); regex per locale-assertion rule
    expect(screen.getByText(/MAPE: 12,4\s%/)).toBeTruthy()
    expect(screen.getByText(/SKU: 500/)).toBeTruthy()
  })

  it('active with null mape: renders em-dash for MAPE (AP#8)', () => {
    const payload = [
      {
        payload: { evaluationDate: '2026-05-17', cabinetMape: null, skuCount: 0 },
      },
    ]
    render(<MapeTrendTooltip active={true} payload={payload} />)
    expect(screen.getByText(/MAPE: —/)).toBeTruthy()
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// Component render tests
// ═══════════════════════════════════════════════════════════════════════════

describe('ModelPerformanceDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Skeleton when loading', () => {
    setup({ isLoading: true, data: undefined, isSuccess: false, status: 'pending' })
    render(<ModelPerformanceDetail modelId="model-1" />)
    // F-12: use data-testid instead of fragile CSS class query.
    expect(screen.getByTestId('skeleton')).toBeTruthy()
  })

  it('renders destructive Alert on error', () => {
    setup({
      isError: true,
      isSuccess: false,
      status: 'error',
      data: undefined,
      error: new Error('Network error'),
    })
    render(<ModelPerformanceDetail modelId="model-1" />)
    expect(screen.getByText(/Ошибка загрузки производительности модели/)).toBeTruthy()
    expect(screen.getByText(/Network error/)).toBeTruthy()
  })

  it('renders model-not-found Alert with link when model absent from list', () => {
    setup({}, { data: { models: [] } })
    render(<ModelPerformanceDetail modelId="model-1" />)
    expect(screen.getByText(/Модель не найдена/)).toBeTruthy()
    expect(mockUseModelPerformance).toHaveBeenCalledWith('model-1', { enabled: false })
    const link = screen.getByRole('link', { name: /Вернуться к списку моделей/ })
    expect(link).toBeTruthy()
    expect(link.getAttribute('href')).toBe(ROUTES.ANALYTICS.MODELS)
  })

  it('F-10: deleted-model deep-link shows model-not-found (not generic error) when model missing', () => {
    // When model is not in list AND perf query errors (deleted-model deep-link scenario),
    // model-not-found check runs BEFORE error check → friendly Alert with back-link.
    setup(
      { isError: true, isSuccess: false, status: 'error', data: undefined },
      { data: { models: [] } }
    )
    render(<ModelPerformanceDetail modelId="model-1" />)
    expect(screen.getByText(/Модель не найдена/)).toBeTruthy()
    expect(screen.queryByText(/Ошибка загрузки производительности модели/)).toBeNull()
  })

  it('renders empty mapeTrend Alert when trend is empty', () => {
    setup({ data: makePerformanceResponse({ mapeTrend: [] }) })
    render(<ModelPerformanceDetail modelId="model-1" />)
    expect(screen.getByText(/Нет данных истории MAPE для построения тренда/)).toBeTruthy()
  })

  it('happy path: renders CardTitle and model identity', () => {
    setup()
    render(<ModelPerformanceDetail modelId="model-1" />)
    expect(mockUseModelPerformance).toHaveBeenCalledWith('model-1', { enabled: true })
    expect(screen.getByText('Производительность модели')).toBeTruthy()
    // version
    expect(screen.getByText('v2')).toBeTruthy()
    // F-11: status renders Russian label from STATUS_BADGE_CONFIG, not raw 'active'.
    expect(screen.getByText('Активна')).toBeTruthy()
  })

  it('F-11: status badge renders Russian labels for all statuses', () => {
    const cases: Array<[string, string]> = [
      ['active', 'Активна'],
      ['training', 'Обучается'],
      ['degraded', 'Деградировала'],
      ['retired', 'Снята'],
    ]
    for (const [status, label] of cases) {
      vi.clearAllMocks()
      setup(
        {},
        {
          data: {
            models: [
              {
                id: 'model-1',
                modelType: 'sales_forecast',
                engine: 'prophet',
                version: 2,
                status,
                metrics: { mape: 12.5, dataPointsCount: 100 },
              },
            ],
          },
        }
      )
      render(<ModelPerformanceDetail modelId="model-1" />)
      expect(screen.getByText(label)).toBeTruthy()
    }
  })

  it('happy path: drift badge renders with correct Russian label', () => {
    setup({ data: makePerformanceResponse({ driftStatus: 'improving' }) })
    render(<ModelPerformanceDetail modelId="model-1" />)
    expect(screen.getByText('Улучшается')).toBeTruthy()
    expect(screen.getByText('Тренд точности:')).toBeTruthy()
  })

  it('happy path: drift badge null → Недостаточно данных', () => {
    setup({ data: makePerformanceResponse({ driftStatus: null }) })
    render(<ModelPerformanceDetail modelId="model-1" />)
    expect(screen.getByText('Недостаточно данных')).toBeTruthy()
  })

  it('happy path: recharts LineChart rendered (mocked)', () => {
    setup()
    render(<ModelPerformanceDetail modelId="model-1" />)
    expect(screen.getByTestId('line-chart')).toBeTruthy()
  })

  it('F-7: chart container has accessible name via aria-label', () => {
    setup()
    render(<ModelPerformanceDetail modelId="model-1" />)
    expect(screen.getByRole('img', { name: /График тренда точности модели MAPE/ })).toBeTruthy()
  })

  it('happy path: previous-version comparison rendered when prevMetrics present', () => {
    setup({
      data: makePerformanceResponse({
        previousVersionMetrics: { mape: 14.0, dataPointsCount: 80 },
      }),
    })
    render(<ModelPerformanceDetail modelId="model-1" />)
    // The comparison <p> contains "Сравнение с v1" and both MAPE values inline.
    // F-5 (2nd-pass): formatPercentage uses Russian locale (comma decimal) — use regex not exact string.
    const comparisonPara = screen.getByText(/Сравнение с v1/)
    expect(comparisonPara.textContent).toMatch(/14[,.]0\s*%/)
    expect(comparisonPara.textContent).toMatch(/12[,.]5\s*%/)
  })

  it('previous-version comparison hidden when prevMetrics absent', () => {
    setup({ data: makePerformanceResponse({ previousVersionMetrics: undefined }) })
    render(<ModelPerformanceDetail modelId="model-1" />)
    expect(screen.queryByText(/Сравнение с v/)).toBeNull()
  })

  it('AP#8: null prevMape renders em-dash not 0', () => {
    setup({
      data: makePerformanceResponse({
        previousVersionMetrics: { mape: null, dataPointsCount: 0 },
        mapeTrend: [{ evaluationDate: '2026-05-17', cabinetMape: 12.5, skuCount: 52 }],
      }),
    })
    render(<ModelPerformanceDetail modelId="model-1" />)
    // The comparison paragraph should contain '—' for the null prevMape, not '0' or '0%'.
    const comparisonPara = screen.getByText(/Сравнение с v1/)
    expect(comparisonPara.textContent).toContain('—')
    expect(comparisonPara.textContent).not.toContain('0%')
  })

  it('F-3: prev present, current null → delta renders em-dash, color is neutral', () => {
    setup({
      data: makePerformanceResponse({
        previousVersionMetrics: { mape: 10, dataPointsCount: 80 },
        mapeTrend: [{ evaluationDate: '2026-05-17', cabinetMape: null, skuCount: 0 }],
      }),
    })
    render(<ModelPerformanceDetail modelId="model-1" />)
    const comparisonPara = screen.getByText(/Сравнение с v1/)
    // currentMape is null → shows '—' for current value, no delta span rendered.
    expect(comparisonPara.textContent).toContain('—')
    // Delta span must NOT appear when currentMape is null.
    expect(screen.queryByText(/[+-]\d+\.\d+%/)).toBeNull()
  })

  it('evaluation table renders rows in descending date order', () => {
    setup({
      data: makePerformanceResponse({
        mapeTrend: [
          { evaluationDate: '2026-05-10', cabinetMape: 14.0, skuCount: 50 },
          { evaluationDate: '2026-05-17', cabinetMape: 12.5, skuCount: 52 },
        ],
      }),
    })
    render(<ModelPerformanceDetail modelId="model-1" />)
    const rows = screen.getAllByRole('row')
    // rows[0] is the header; rows[1] should be the most recent date
    expect(rows[1].textContent).toContain('17.05.2026')
    expect(rows[2].textContent).toContain('10.05.2026')
  })

  it('evaluation table: null cabinetMape renders em-dash (AP#8)', () => {
    setup({
      data: makePerformanceResponse({
        mapeTrend: [{ evaluationDate: '2026-05-17', cabinetMape: null, skuCount: 0 }],
      }),
    })
    render(<ModelPerformanceDetail modelId="model-1" />)
    const cells = screen.getAllByRole('cell')
    const mapeCell = cells.find(c => c.textContent === '—')
    expect(mapeCell).toBeTruthy()
  })

  it('post-2nd-pass F-17: useAiModels error surfaces as destructive Alert (NOT silent model-not-found)', () => {
    // F-10 inversion previously misclassified useAiModels failures as "deleted model".
    // F-17 fix: list errors must surface explicitly so users see a retry signal.
    setup(
      {},
      {
        isError: true,
        isSuccess: false,
        status: 'error',
        data: undefined,
        error: new Error('Network unreachable'),
      }
    )
    render(<ModelPerformanceDetail modelId="model-1" />)
    expect(screen.getByText(/Ошибка загрузки списка моделей/)).toBeTruthy()
    expect(screen.getByText(/Network unreachable/)).toBeTruthy()
    // Negative: model-not-found Alert must NOT render (it would mislead the user).
    expect(screen.queryByText(/Модель не найдена/)).toBeNull()
  })

  it('post-2nd-pass F-19: v0 model with stray previousVersionMetrics hides comparison row (no v-1)', () => {
    // Defensive Frontend Principle: never render nonsensical "v-1" if backend
    // sends previousVersionMetrics for a v0 (initial) model.
    setup(
      {
        data: makePerformanceResponse({
          previousVersionMetrics: { mape: 15.0, dataPointsCount: 100 },
          mapeTrend: [{ evaluationDate: '2026-05-17', cabinetMape: 10.0, skuCount: 50 }],
        }),
      },
      {
        data: {
          models: [
            {
              id: 'model-1',
              modelType: 'sales_forecast' as const,
              engine: 'prophet' as const,
              version: 0,
              status: 'active' as const,
              metrics: { mape: 10.0, dataPointsCount: 50 },
            },
          ],
        },
      }
    )
    render(<ModelPerformanceDetail modelId="model-1" />)
    expect(screen.queryByText(/Сравнение с v/)).toBeNull()
  })

  it('AC-7 (Story 110.2): "Подробные оценки" button renders with correct href', () => {
    setup()
    render(<ModelPerformanceDetail modelId="model-1" />)
    const link = screen.getByRole('link', { name: 'Подробные оценки' })
    expect(link).toBeTruthy()
    expect(link.getAttribute('href')).toContain('model-1')
    expect(link.getAttribute('href')).toContain('evaluations')
  })
})
