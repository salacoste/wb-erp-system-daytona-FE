/**
 * ForecastTable Tests — Story 109.1-FE.
 * Story 110.4-FE: added Оценка column assertions + QueryClient wrapper for FeedbackButtons.
 * Covers: new column headers, null → '—' for nullable fields,
 * getAiVsNaiveColor helper, column order, feedback buttons.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ForecastTable, getAiVsNaiveColor } from '../ForecastTable'
import type { AiForecastPrediction } from '@/types/ai-forecast'
import * as systemApi from '@/lib/api/ai/system'
import * as authStore from '@/stores/authStore'

vi.mock('@/lib/api/ai/system')
vi.mock('@/stores/authStore')

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

function renderTable(predictions: AiForecastPrediction[], props?: { modelId?: string }) {
  return render(React.createElement(ForecastTable, { predictions, ...props }), {
    wrapper: createWrapper(),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(authStore.useAuthStore).mockImplementation((selector: any) =>
    selector({ cabinetId: 'cab-1' })
  )
  vi.mocked(systemApi.postFeedback).mockResolvedValue(undefined)
})

// ---------------------------------------------------------------------------
// Pure helper — getAiVsNaiveColor
// ---------------------------------------------------------------------------
describe('getAiVsNaiveColor', () => {
  it('returns text-green-600 for "+" prefix', () => {
    expect(getAiVsNaiveColor('+12.3%')).toBe('text-green-600')
  })
  it('returns text-red-600 for "-" prefix', () => {
    expect(getAiVsNaiveColor('-5.1%')).toBe('text-red-600')
  })
  it('returns text-muted-foreground for null', () => {
    expect(getAiVsNaiveColor(null)).toBe('text-muted-foreground')
  })
  it('returns text-muted-foreground for neutral string (no sign)', () => {
    expect(getAiVsNaiveColor('0.0%')).toBe('text-muted-foreground')
  })
  it('returns text-muted-foreground for non-numeric backend strings (e.g. "N/A")', () => {
    expect(getAiVsNaiveColor('N/A')).toBe('text-muted-foreground')
  })
})

// ---------------------------------------------------------------------------
// ForecastTable component
// ---------------------------------------------------------------------------
const basePrediction: AiForecastPrediction = {
  date: '2025-01-20',
  horizonDays: 7,
  predictedSales: 42,
  predictedRevenue: 125000,
  confidence: 0.85,
  naiveBaseline: 35500,
  aiVsNaive: '+12.3%',
}

const nullablePrediction: AiForecastPrediction = {
  date: '2025-01-21',
  horizonDays: 7,
  predictedSales: 10,
  predictedRevenue: null,
  confidence: null,
  naiveBaseline: null,
  aiVsNaive: null,
}

const predictionWithForecastId: AiForecastPrediction = {
  ...basePrediction,
  forecastId: 'fc-uuid-abc',
}

describe('ForecastTable', () => {
  it('renders all 8 column headers in correct order (Story 110.4-FE: Оценка added)', () => {
    renderTable([basePrediction])

    const headers = screen.getAllByRole('columnheader')
    expect(headers).toHaveLength(8)
    expect(headers[0].textContent).toBe('Дата')
    expect(headers[1].textContent).toBe('Прогноз продаж')
    expect(headers[2].textContent).toBe('Базовая оценка')
    expect(headers[3].textContent).toBe('AI vs базовая')
    expect(headers[4].textContent).toBe('Прогноз выручки')
    expect(headers[5].textContent).toBe('Уверенность')
    expect(headers[6].textContent).toBe('Диапазон')
    expect(headers[7].textContent).toBe('Оценка')
  })

  it('renders naiveBaseline value when non-null (currency with ₽)', () => {
    renderTable([basePrediction])
    // formatCurrency uses Russian locale — match ₽ suffix (CLAUDE.md regex-for-locale rule)
    const cell = screen.getAllByText(/₽/)
    expect(cell.length).toBeGreaterThanOrEqual(1)
  })

  it('renders naiveBaseline as "—" when null', () => {
    renderTable([nullablePrediction])
    // Multiple '—' expected — at least one for each null field
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(3)
  })

  it('renders aiVsNaive value when non-null', () => {
    renderTable([basePrediction])
    expect(screen.getByText('+12.3%')).toBeTruthy()
  })

  it('renders predictedRevenue as currency when non-null', () => {
    renderTable([basePrediction])
    // Both naiveBaseline and predictedRevenue now render ₽ — use getAllByText
    const cells = screen.getAllByText(/₽/)
    expect(cells.length).toBeGreaterThanOrEqual(2)
  })

  it('renders predictedRevenue as "—" when null (Anti-Pattern #8 compliance)', () => {
    renderTable([nullablePrediction])
    // predictedRevenue null → '—', NOT '0' or '0,00 ₽'
    expect(screen.queryByText(/0,00/)).toBeNull()
    expect(screen.queryByText(/0 ₽/)).toBeNull()
  })

  it('confidence null renders "—" not 0%', () => {
    renderTable([nullablePrediction])
    expect(screen.queryByText('0%')).toBeNull()
  })

  it('renders Прогноз выручки column header even when all rows have null predictedRevenue', () => {
    renderTable([nullablePrediction])
    expect(screen.getByText('Прогноз выручки')).toBeTruthy()
  })

  // Story 110.4-FE: Оценка column
  it('renders feedback buttons when forecastId is present', () => {
    renderTable([predictionWithForecastId])
    expect(screen.getByRole('button', { name: 'Полезный прогноз' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Бесполезный прогноз' })).toBeTruthy()
  })

  it('renders no feedback buttons when forecastId is absent', () => {
    renderTable([basePrediction])
    expect(screen.queryByRole('button', { name: 'Полезный прогноз' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Бесполезный прогноз' })).toBeNull()
  })

  it('feedback buttons have correct aria-labels (WCAG)', () => {
    renderTable([predictionWithForecastId])
    const up = screen.getByRole('button', { name: 'Полезный прогноз' })
    const down = screen.getByRole('button', { name: 'Бесполезный прогноз' })
    expect(up).toHaveAttribute('aria-label', 'Полезный прогноз')
    expect(down).toHaveAttribute('aria-label', 'Бесполезный прогноз')
  })
})
