/**
 * ForecastTable Tests — Story 109.1-FE.
 * Covers: new column headers, null → '—' for nullable fields,
 * getAiVsNaiveColor helper, column order.
 */
import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ForecastTable, getAiVsNaiveColor } from '../ForecastTable'
import type { AiForecastPrediction } from '@/types/ai-forecast'

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

describe('ForecastTable', () => {
  it('renders all 7 column headers in correct order', () => {
    render(React.createElement(ForecastTable, { predictions: [basePrediction] }))

    const headers = screen.getAllByRole('columnheader')
    expect(headers).toHaveLength(7)
    expect(headers[0].textContent).toBe('Дата')
    expect(headers[1].textContent).toBe('Прогноз продаж')
    expect(headers[2].textContent).toBe('Базовая оценка')
    expect(headers[3].textContent).toBe('AI vs базовая')
    expect(headers[4].textContent).toBe('Прогноз выручки')
    expect(headers[5].textContent).toBe('Уверенность')
    expect(headers[6].textContent).toBe('Диапазон')
  })

  it('renders naiveBaseline value when non-null (currency with ₽)', () => {
    render(React.createElement(ForecastTable, { predictions: [basePrediction] }))
    // formatCurrency uses Russian locale — match ₽ suffix (CLAUDE.md regex-for-locale rule)
    const cell = screen.getAllByText(/₽/)
    expect(cell.length).toBeGreaterThanOrEqual(1)
  })

  it('renders naiveBaseline as "—" when null', () => {
    render(React.createElement(ForecastTable, { predictions: [nullablePrediction] }))
    // Multiple '—' expected — at least one for each null field
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(3)
  })

  it('renders aiVsNaive value when non-null', () => {
    render(React.createElement(ForecastTable, { predictions: [basePrediction] }))
    expect(screen.getByText('+12.3%')).toBeTruthy()
  })

  it('renders predictedRevenue as currency when non-null', () => {
    render(React.createElement(ForecastTable, { predictions: [basePrediction] }))
    // Both naiveBaseline and predictedRevenue now render ₽ — use getAllByText
    const cells = screen.getAllByText(/₽/)
    expect(cells.length).toBeGreaterThanOrEqual(2)
  })

  it('renders predictedRevenue as "—" when null (Anti-Pattern #8 compliance)', () => {
    render(React.createElement(ForecastTable, { predictions: [nullablePrediction] }))
    // predictedRevenue null → '—', NOT '0' or '0,00 ₽'
    expect(screen.queryByText(/0,00/)).toBeNull()
    expect(screen.queryByText(/0 ₽/)).toBeNull()
  })

  it('confidence null renders "—" not 0%', () => {
    render(React.createElement(ForecastTable, { predictions: [nullablePrediction] }))
    expect(screen.queryByText('0%')).toBeNull()
  })

  it('renders Прогноз выручки column header even when all rows have null predictedRevenue', () => {
    render(React.createElement(ForecastTable, { predictions: [nullablePrediction] }))
    expect(screen.getByText('Прогноз выручки')).toBeTruthy()
  })
})
