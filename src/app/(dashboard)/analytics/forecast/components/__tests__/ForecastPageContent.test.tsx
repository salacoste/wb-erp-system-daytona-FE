/**
 * ForecastPageContent regression tests — Story 109.1-FE.
 * Locks AC-5 (explanation subtitle) + AC-6 (rollbackNotice Alert) against silent removal.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ForecastPageContent } from '../ForecastPageContent'

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => 'cab-test-123'),
}))

vi.mock('@/hooks/useAiPreferences', () => ({
  useAiPreferences: vi.fn(() => ({ data: { aiEnabled: true } })),
}))

vi.mock('@/hooks/useAiStatus', () => ({
  useAiStatus: vi.fn(() => ({
    data: { readinessLevel: 'ready' },
    isError: false,
  })),
}))

vi.mock('@/hooks/useAiForecast', () => ({
  useAiForecast: vi.fn(),
}))

// Mock child components — this test focuses solely on AC-5 (explanation) + AC-6 (rollbackNotice)
// rendering logic in the parent. Children have their own dedicated tests.
vi.mock('../AiEngineStatusBadge', () => ({
  AiEngineStatusBadge: () => React.createElement('div', { 'data-testid': 'engine-badge' }),
}))
vi.mock('../AiPreferencesToggle', () => ({
  AiPreferencesToggle: () => React.createElement('div', { 'data-testid': 'prefs-toggle' }),
}))
vi.mock('../CollectingProgressTracker', () => ({
  CollectingProgressTracker: () => React.createElement('div', { 'data-testid': 'collecting' }),
}))
vi.mock('../SneakPreviewSection', () => ({
  SneakPreviewSection: () => React.createElement('div', { 'data-testid': 'sneak-preview' }),
}))
vi.mock('../ForecastParamsCard', () => ({
  ForecastParamsCard: () => React.createElement('div', { 'data-testid': 'params-card' }),
}))
vi.mock('../ForecastMetrics', () => ({
  ForecastMetrics: () => React.createElement('div', { 'data-testid': 'metrics' }),
}))
vi.mock('../ForecastTable', () => ({
  ForecastTable: () => React.createElement('div', { 'data-testid': 'table' }),
}))

import { useAiForecast } from '@/hooks/useAiForecast'

const renderPage = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    React.createElement(QueryClientProvider, { client }, React.createElement(ForecastPageContent))
  )
}

const basePrediction = {
  date: '2025-01-20',
  horizonDays: 7,
  predictedSales: 42,
  predictedRevenue: 125000,
  confidence: 0.85,
  naiveBaseline: 35.5,
  aiVsNaive: '+12.3%',
}

const baseForecastResult = {
  data: {
    predictions: [basePrediction],
    modelVersion: 3,
    engine: 'mindsdb',
    cached: false,
    generatedAt: '2025-01-20T00:00:00Z',
    explanation: null,
    rollbackNotice: null,
  },
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
  isFetching: false,
}

describe('ForecastPageContent — AC-5 (explanation subtitle)', () => {
  beforeEach(() => {
    cleanup()
    vi.mocked(useAiForecast).mockReset()
  })

  it('renders explanation as CardDescription when non-null and non-empty', () => {
    vi.mocked(useAiForecast).mockReturnValue({
      ...baseForecastResult,
      data: { ...baseForecastResult.data, explanation: 'AI прогнозирует рост спроса на 12%' },
    } as unknown as ReturnType<typeof useAiForecast>)

    renderPage()
    expect(screen.getByText('AI прогнозирует рост спроса на 12%')).toBeTruthy()
  })

  it('does NOT render explanation node when null', () => {
    vi.mocked(useAiForecast).mockReturnValue({
      ...baseForecastResult,
      data: { ...baseForecastResult.data, explanation: null },
    } as unknown as ReturnType<typeof useAiForecast>)

    renderPage()
    // Assert the specific seeded explanation text is absent (vs broad /AI прогноз/ which
    // would also match the page header h1).
    expect(screen.queryByText('AI прогнозирует рост спроса на 12%')).toBeNull()
  })

  it('does NOT render explanation node for empty-string explanation', () => {
    vi.mocked(useAiForecast).mockReturnValue({
      ...baseForecastResult,
      data: { ...baseForecastResult.data, explanation: '' },
    } as unknown as ReturnType<typeof useAiForecast>)

    renderPage()
    expect(screen.queryByText('AI прогнозирует рост спроса на 12%')).toBeNull()
  })
})

describe('ForecastPageContent — AC-6 (rollbackNotice Alert regression lock)', () => {
  beforeEach(() => {
    cleanup()
    vi.mocked(useAiForecast).mockReset()
  })

  it('renders rollbackNotice Alert with reason + version when present', () => {
    vi.mocked(useAiForecast).mockReturnValue({
      ...baseForecastResult,
      data: {
        ...baseForecastResult.data,
        rollbackNotice: {
          previousVersion: 5,
          rollbackDate: '2025-01-15',
          reason: 'MAPE деградация выше порога',
        },
      },
    } as unknown as ReturnType<typeof useAiForecast>)

    renderPage()
    expect(screen.getByText(/Откат модели/)).toBeTruthy()
    expect(screen.getByText(/MAPE деградация выше порога/)).toBeTruthy()
    expect(screen.getByText(/v5/)).toBeTruthy()
    expect(screen.getByText(/2025-01-15/)).toBeTruthy()
  })

  it('does NOT render rollbackNotice Alert when null', () => {
    vi.mocked(useAiForecast).mockReturnValue({
      ...baseForecastResult,
      data: { ...baseForecastResult.data, rollbackNotice: null },
    } as unknown as ReturnType<typeof useAiForecast>)

    renderPage()
    expect(screen.queryByText(/Откат модели/)).toBeNull()
  })
})
