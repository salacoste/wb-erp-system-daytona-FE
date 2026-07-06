/**
 * Tests for FbsCalculatedMetricsSection — Story 96.13-FE
 *
 * Covers: null-state (section prop null), empty fixture (all null ratios → '—'), populated.
 * Pattern 3 fixture wiring: emptyFbsCalculatedMetrics() imported from fbs-enhanced-empty.ts.
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { emptyFbsCalculatedMetrics } from '@/test/fixtures/fbs-enhanced-empty'
import { FbsCalculatedMetricsSection } from '../FbsCalculatedMetricsSection'

describe('FbsCalculatedMetricsSection (Story 96.13-FE)', () => {
  it('renders empty state when calculatedMetrics is null', () => {
    renderWithProviders(<FbsCalculatedMetricsSection calculatedMetrics={null} />)
    expect(screen.getByText(/Нет расчётных метрик/)).toBeInTheDocument()
  })

  it('renders 3 KPI cards with all-null values as em-dash — Pattern 3 fixture wiring', () => {
    renderWithProviders(
      <FbsCalculatedMetricsSection calculatedMetrics={emptyFbsCalculatedMetrics()} />
    )
    expect(screen.getByText('Оборачиваемость')).toBeInTheDocument()
    expect(screen.getByText('Дней покрытия остатков')).toBeInTheDocument()
    expect(screen.getByText('Заказов на товар')).toBeInTheDocument()
    // All 3 null ratios → '—'
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBe(3)
  })

  it('renders numeric values when all metrics are populated', () => {
    renderWithProviders(
      <FbsCalculatedMetricsSection
        calculatedMetrics={{
          turnoverRate: 2.5,
          stockCoverageDays: 30.0,
          ordersPerProduct: 1.8,
        }}
      />
    )
    expect(screen.getByText('2,50')).toBeInTheDocument() // ru-RU comma (formatDecimal)
    expect(screen.getByText('30,0')).toBeInTheDocument()
    expect(screen.getByText('1,80')).toBeInTheDocument()
  })

  it('BD-43: renders «—» for stockCoverageDays >= 999 (BE "never-sells" sentinel)', () => {
    renderWithProviders(
      <FbsCalculatedMetricsSection
        calculatedMetrics={{
          turnoverRate: 2.5,
          stockCoverageDays: 999,
          ordersPerProduct: 1.8,
        }}
      />
    )
    // 999 sentinel must NOT render as "999,0"
    expect(screen.queryByText('999,0')).toBeNull()
    // The coverage card renders «—» (the only dash — the other two have real values)
    expect(screen.getAllByText('—')).toHaveLength(1)
  })
})
