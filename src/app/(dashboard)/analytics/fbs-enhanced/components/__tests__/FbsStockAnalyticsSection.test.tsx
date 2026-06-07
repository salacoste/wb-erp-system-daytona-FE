/**
 * Tests for FbsStockAnalyticsSection — Epic 129-FE Story 129.3
 *
 * Updated to match real backend contract per Request #202.
 * Fields renamed: totalSkus→productCount, totalUnits→totalStock.
 * Dropped (no backend source): lowStockSkus, outOfStockSkus, avgDaysOfCover.
 * New fields: availableStock, reservedStock, inTransit.
 *
 * All fields are counts — no null ratio fields in this section.
 *
 * Covers: null-state (section prop null), empty fixture, populated counts.
 * Pattern 3 fixture wiring: emptyFbsStockAnalytics() imported from fbs-enhanced-empty.ts.
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { emptyFbsStockAnalytics } from '@/test/fixtures/fbs-enhanced-empty'
import { FbsStockAnalyticsSection } from '../FbsStockAnalyticsSection'

describe('FbsStockAnalyticsSection (Epic 129-FE)', () => {
  it('renders empty state when stockAnalytics is null', () => {
    renderWithProviders(<FbsStockAnalyticsSection stockAnalytics={null} />)
    expect(screen.getByText(/Нет данных по остаткам/)).toBeInTheDocument()
  })

  it('renders 5 KPI cards from emptyFbsStockAnalytics() — Pattern 3 fixture wiring', () => {
    renderWithProviders(<FbsStockAnalyticsSection stockAnalytics={emptyFbsStockAnalytics()} />)
    expect(screen.getByText('Товары (SKU)')).toBeInTheDocument()
    expect(screen.getByText('Единиц на складе')).toBeInTheDocument()
    expect(screen.getByText('Доступно')).toBeInTheDocument()
    expect(screen.getByText('Зарезервировано')).toBeInTheDocument()
    expect(screen.getByText('В пути')).toBeInTheDocument()
    // All fields are counts (0), no null ratio fields — no em-dashes expected
    expect(screen.queryAllByText('—').length).toBe(0)
  })

  it('renders populated stock analytics with all 5 count values', () => {
    renderWithProviders(
      <FbsStockAnalyticsSection
        stockAnalytics={{
          totalStock: 500,
          availableStock: 400,
          reservedStock: 80,
          inTransit: 20,
          productCount: 50,
        }}
      />
    )
    expect(screen.getByText('500')).toBeInTheDocument()
    expect(screen.getByText('400')).toBeInTheDocument()
    expect(screen.getByText('80')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.getByText('50')).toBeInTheDocument()
  })

  it('renders zero counts as "0" (not em-dash — counts are legitimate zeros)', () => {
    renderWithProviders(
      <FbsStockAnalyticsSection
        stockAnalytics={{
          totalStock: 0,
          availableStock: 0,
          reservedStock: 0,
          inTransit: 0,
          productCount: 0,
        }}
      />
    )
    // Zero is a meaningful value for counts — rendered as "0"
    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBe(5)
  })
})
