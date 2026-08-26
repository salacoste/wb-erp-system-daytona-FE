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
  it('returns text-financial-positive for "+" prefix', () => {
    expect(getAiVsNaiveColor('+12.3%')).toBe('text-financial-positive')
  })
  it('returns text-financial-negative for "-" prefix', () => {
    expect(getAiVsNaiveColor('-5.1%')).toBe('text-financial-negative')
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
  // iter-78: naiveBaseline is UNITS (same scale as predictedSales), not currency.
  naiveBaseline: 38.5,
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

// Epic 113 I1: revenue-target models (daily_revenue_forecast) send predictedSales:null.
const revenueModelPrediction: AiForecastPrediction = {
  date: '2025-01-22',
  horizonDays: 7,
  predictedSales: null,
  predictedRevenue: 145811.61,
  confidence: 0.8,
  naiveBaseline: null,
  aiVsNaive: null,
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

  it('renders naiveBaseline as UNITS (not currency) — matches predictedSales scale', () => {
    renderTable([basePrediction])
    // iter-78: naiveBaseline is units (backend assigns it to predictedUnits), rendered .toFixed(1)
    expect(screen.getByText('38,5')).toBeTruthy() // ru-RU comma (formatDecimal)
    // only predictedRevenue carries ₽ now — naiveBaseline must NOT
    expect(screen.getAllByText(/₽/)).toHaveLength(1)
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

  it('renders confidence as a Russian-locale percent (comma + NBSP)', () => {
    renderTable([basePrediction]) // confidence 0.85 → "85 %" (was dot-locale "85%"); \s matches NBSP
    expect(screen.getByText(/85\s%/)).toBeTruthy()
  })

  it('renders predictedRevenue as currency when non-null', () => {
    renderTable([basePrediction])
    // iter-78: only predictedRevenue renders ₽ now (naiveBaseline is units)
    const cells = screen.getAllByText(/₽/)
    expect(cells).toHaveLength(1)
  })

  it('renders predictedRevenue as "—" when null (Anti-Pattern #8 compliance)', () => {
    renderTable([nullablePrediction])
    // predictedRevenue null → '—', NOT '0' or '0,00 ₽'
    expect(screen.queryByText(/0,00/)).toBeNull()
    expect(screen.queryByText(/0 ₽/)).toBeNull()
  })

  it('confidence null renders "—" not 0% (anti-pattern #8)', () => {
    renderTable([nullablePrediction])
    expect(screen.queryByText('0%')).toBeNull() // legacy dot form
    expect(screen.queryByText(/0\s%/)).toBeNull() // new ru-RU form must not appear either
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1) // dash IS rendered
  })

  // Epic 113 I1: revenue-target model (daily_revenue_forecast) sends predictedSales:null.
  // Must render '—' in the "Прогноз продаж" column, NOT crash on null.toFixed(1).
  it('renders predictedSales as "—" when null (revenue-target model) without crashing', () => {
    expect(() => renderTable([revenueModelPrediction])).not.toThrow()
    // predictedSales null → '—' in the units column; revenue still renders as currency
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/₽/)).toHaveLength(1)
    // never a fabricated "0.0" units value
    expect(screen.queryByText('0.0')).toBeNull()
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
