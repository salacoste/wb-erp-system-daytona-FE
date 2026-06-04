/**
 * Russian-locale guard for ForecastMetrics "Средняя уверенность" (iter-88).
 *
 * avgConfidence (0-1 ratio) * 100 → formatPercentageInt → "80 %" (NBSP before %). The migration
 * replaced `${(avgConfidence * 100).toFixed(0)}%` (dot-locale "80%"). ForecastPageContent.test
 * mocks ForecastMetrics out, so this is the only coverage of this path — it also locks the *100
 * (a future drop would render "1 %" and fail here). `\s` matches the NBSP.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ForecastMetrics } from '../ForecastMetrics'
import type { AiForecastResponse } from '@/types/ai-forecast'

const data: AiForecastResponse = {
  predictions: [
    {
      date: '2025-01-20',
      horizonDays: 1,
      predictedSales: 40,
      predictedRevenue: 1000,
      confidence: 0.85,
      naiveBaseline: 35,
      aiVsNaive: '+10%',
    },
    {
      date: '2025-01-21',
      horizonDays: 2,
      predictedSales: 42,
      predictedRevenue: 1100,
      confidence: 0.75,
      naiveBaseline: 36,
      aiVsNaive: '+12%',
    },
  ],
  modelVersion: 3,
  engine: 'mindsdb',
  cached: false,
  generatedAt: '2025-01-20T00:00:00Z',
  explanation: null,
  rollbackNotice: null,
}

describe('ForecastMetrics', () => {
  it('renders avgConfidence as a Russian-locale integer percent (avg 0.85/0.75 → "80 %")', () => {
    render(<ForecastMetrics data={data} />)
    expect(screen.getByText(/80\s%/)).toBeTruthy() // was dot-locale "80%"; \s matches NBSP
  })
})
