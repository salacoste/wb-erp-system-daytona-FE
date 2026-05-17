/**
 * ModelListSection tests — Story 109.3-FE.
 * Covers: STATUS_BADGE_CONFIG labels, ENGINE_LABELS, loading/error/empty states,
 * happy-path columns + badges + MAPE null, row click + keyboard navigation.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ModelListSection } from '../ModelListSection'
import {
  STATUS_BADGE_CONFIG,
  ENGINE_LABELS,
  formatMape,
  formatTrainedAt,
} from '../model-list-helpers'
import type { AiModel } from '@/types/ai/models'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string
    children: React.ReactNode
    className?: string
  }) => React.createElement('a', { href, className }, children),
}))

vi.mock('@/hooks/useAiModels', () => ({
  useAiModels: vi.fn(),
}))

import { useAiModels } from '@/hooks/useAiModels'

// ── Fixtures ─────────────────────────────────────────────────────────────────

const modelActive: AiModel = {
  id: 'model-1',
  modelType: 'sales_forecast',
  engine: 'prophet',
  version: 3,
  status: 'active',
  metrics: { mape: 12.4, dataPointsCount: 500 },
  trainedAt: '2026-01-15T12:00:00Z',
}

const modelTraining: AiModel = {
  id: 'model-2',
  modelType: 'demand_forecast',
  engine: 'mindsdb',
  version: 1,
  status: 'training',
  metrics: { mape: null, dataPointsCount: 0 },
  trainedAt: undefined,
}

// ── Pure-function tests (no React render) ────────────────────────────────────

describe('STATUS_BADGE_CONFIG', () => {
  it('active → Активна', () => {
    expect(STATUS_BADGE_CONFIG.active.label).toBe('Активна')
  })
  it('training → Обучается', () => {
    expect(STATUS_BADGE_CONFIG.training.label).toBe('Обучается')
  })
  it('degraded → Деградировала', () => {
    expect(STATUS_BADGE_CONFIG.degraded.label).toBe('Деградировала')
  })
  it('retired → Снята', () => {
    expect(STATUS_BADGE_CONFIG.retired.label).toBe('Снята')
  })
  it('training has pulse=true, others do not', () => {
    expect(STATUS_BADGE_CONFIG.training.pulse).toBe(true)
    expect(STATUS_BADGE_CONFIG.active.pulse).toBe(false)
    expect(STATUS_BADGE_CONFIG.degraded.pulse).toBe(false)
    expect(STATUS_BADGE_CONFIG.retired.pulse).toBe(false)
  })
})

describe('ENGINE_LABELS', () => {
  it('prophet → Prophet', () => {
    expect(ENGINE_LABELS.prophet).toBe('Prophet')
  })
  it('mindsdb → MindsDB', () => {
    expect(ENGINE_LABELS.mindsdb).toBe('MindsDB')
  })
})

describe('formatMape', () => {
  it('null → —  (AP#8: null means unknown, not zero)', () => {
    expect(formatMape(null)).toBe('—')
  })
  it('12.4 → 12.4% (0-100 scale, no ×100)', () => {
    expect(formatMape(12.4)).toBe('12.4%')
  })
  it('0 → 0.0% (perfect accuracy)', () => {
    expect(formatMape(0)).toBe('0.0%')
  })
})

describe('formatTrainedAt', () => {
  it('undefined → — (never trained)', () => {
    expect(formatTrainedAt(undefined)).toBe('—')
  })
  it('valid ISO date → DD.MM.YYYY (post-1st-pass M-1)', () => {
    // Locks the positive branch — without this, a regression in `formatDate`
    // upstream would not be caught by this story's tests.
    expect(formatTrainedAt('2026-01-15T12:00:00Z')).toBe('15.01.2026')
  })
})

// ── Component tests ───────────────────────────────────────────────────────────

const mockUseAiModels = vi.mocked(useAiModels)

beforeEach(() => {
  vi.clearAllMocks()
  mockPush.mockClear()
})

function renderSection() {
  return render(React.createElement(ModelListSection))
}

describe('ModelListSection — loading state', () => {
  it('renders Skeletons (positive + negative) when isLoading=true (post-2nd-pass F-2)', () => {
    mockUseAiModels.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useAiModels>)
    const { container } = renderSection()
    // Negative: no table present.
    expect(container.querySelector('table')).toBeNull()
    // Positive: at least 1 animate-pulse skeleton rendered — a regression to
    // `return null` would have passed the negative assertion alone.
    expect(container.querySelectorAll('[class*="animate-pulse"]').length).toBeGreaterThanOrEqual(1)
  })
})

describe('ModelListSection — error state', () => {
  it('renders destructive Alert with error message', () => {
    mockUseAiModels.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('boom'),
    } as unknown as ReturnType<typeof useAiModels>)
    renderSection()
    expect(screen.getByText(/Ошибка загрузки списка моделей/)).toBeTruthy()
    expect(screen.getByText(/boom/)).toBeTruthy()
  })
})

describe('ModelListSection — empty state', () => {
  it('renders non-destructive Alert with link to Forecast page', () => {
    mockUseAiModels.mockReturnValue({
      data: { models: [] },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useAiModels>)
    renderSection()
    expect(screen.getByText(/Модели ещё не обучены/)).toBeTruthy()
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('/analytics/forecast')
  })
})

describe('ModelListSection — happy path', () => {
  beforeEach(() => {
    mockUseAiModels.mockReturnValue({
      data: { models: [modelActive, modelTraining] },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useAiModels>)
  })

  it('renders all 6 column headers', () => {
    renderSection()
    expect(screen.getByText('Тип')).toBeTruthy()
    expect(screen.getByText('Движок')).toBeTruthy()
    expect(screen.getByText('Версия')).toBeTruthy()
    expect(screen.getByText('Статус')).toBeTruthy()
    expect(screen.getByText('MAPE')).toBeTruthy()
    expect(screen.getByText('Обучен')).toBeTruthy()
  })

  it('renders 2 data rows', () => {
    renderSection()
    // Each row has a role="button"
    const rows = screen.getAllByRole('button')
    expect(rows).toHaveLength(2)
  })

  it('status badges show correct Russian labels', () => {
    renderSection()
    expect(screen.getByText('Активна')).toBeTruthy()
    expect(screen.getByText('Обучается')).toBeTruthy()
  })

  it('MAPE non-null renders value without ×100 (post-1st-pass M-2)', () => {
    renderSection()
    // modelActive.metrics.mape = 12.4 → '12.4%' (0-100 scale confirmed)
    expect(screen.getByText('12.4%')).toBeTruthy()
  })

  it('trainedAt valid date renders DD.MM.YYYY (post-1st-pass M-1/M-2)', () => {
    renderSection()
    // modelActive.trainedAt = '2026-01-15T12:00:00Z' → '15.01.2026'
    // Scope-asserted so a regression in formatMape doesn't pass by virtue of
    // formatTrainedAt's '—' being adjacent (and vice versa).
    expect(screen.getByText('15.01.2026')).toBeTruthy()
  })

  it('exactly 2 cells render — (mape null + trainedAt undefined, both from modelTraining)', () => {
    renderSection()
    // Specific count locks the formatter — if `formatMape(null)` regresses
    // to '0%' or `formatTrainedAt(undefined)` regresses to '', this fails.
    const dashes = screen.getAllByText('—')
    expect(dashes).toHaveLength(2)
  })

  it('engine labels are capitalised correctly', () => {
    renderSection()
    expect(screen.getByText('Prophet')).toBeTruthy()
    expect(screen.getByText('MindsDB')).toBeTruthy()
  })

  it('version=0 renders as v0 (semantic-zero — post-1st-pass M-3)', () => {
    // AP#8 exemption: version is a count, semantic-zero OK. A regression like
    // `${version || '—'}` would render '—' instead of 'v0' and fail this test.
    const modelV0: AiModel = {
      id: 'model-3',
      modelType: 'sales_forecast',
      engine: 'prophet',
      version: 0,
      status: 'retired',
      metrics: { mape: null, dataPointsCount: 0 },
    }
    mockUseAiModels.mockReturnValue({
      data: { models: [modelV0] },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useAiModels>)
    renderSection()
    expect(screen.getByText('v0')).toBeTruthy()
  })

  it('version renders as v{n}', () => {
    renderSection()
    expect(screen.getByText('v3')).toBeTruthy()
    expect(screen.getByText('v1')).toBeTruthy()
  })
})

describe('ModelListSection — row navigation', () => {
  beforeEach(() => {
    mockUseAiModels.mockReturnValue({
      data: { models: [modelActive] },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useAiModels>)
  })

  it('click navigates to /analytics/models/{id}/performance', () => {
    renderSection()
    const row = screen.getByRole('button')
    fireEvent.click(row)
    expect(mockPush).toHaveBeenCalledWith('/analytics/models/model-1/performance')
  })

  it('Enter key navigates to /analytics/models/{id}/performance', () => {
    renderSection()
    const row = screen.getByRole('button')
    fireEvent.keyDown(row, { key: 'Enter' })
    expect(mockPush).toHaveBeenCalledWith('/analytics/models/model-1/performance')
  })

  it('Space key navigates to /analytics/models/{id}/performance', () => {
    renderSection()
    const row = screen.getByRole('button')
    fireEvent.keyDown(row, { key: ' ' })
    expect(mockPush).toHaveBeenCalledWith('/analytics/models/model-1/performance')
  })
})
