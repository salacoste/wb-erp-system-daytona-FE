/**
 * Tests for FbsStockAnalyticsSection — Story 96.13-FE
 *
 * Covers: null-state (section prop null), empty fixture, populated with null avgDaysOfCover → '—'.
 * Pattern 3 fixture wiring: emptyFbsStockAnalytics() imported from fbs-enhanced-empty.ts.
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { emptyFbsStockAnalytics } from '@/test/fixtures/fbs-enhanced-empty'
import { FbsStockAnalyticsSection } from '../FbsStockAnalyticsSection'

describe('FbsStockAnalyticsSection (Story 96.13-FE)', () => {
  it('renders empty state when stockAnalytics is null', () => {
    renderWithProviders(<FbsStockAnalyticsSection stockAnalytics={null} />)
    expect(screen.getByText(/Нет данных по остаткам/)).toBeInTheDocument()
  })

  it('renders 5 KPI cards from emptyFbsStockAnalytics() — Pattern 3 fixture wiring', () => {
    renderWithProviders(<FbsStockAnalyticsSection stockAnalytics={emptyFbsStockAnalytics()} />)
    expect(screen.getByText('Товары (SKU)')).toBeInTheDocument()
    expect(screen.getByText('Единиц на складе')).toBeInTheDocument()
    expect(screen.getByText('Мало остатков')).toBeInTheDocument()
    expect(screen.getByText('Нет в наличии')).toBeInTheDocument()
    expect(screen.getByText('Дней покрытия (ср.)')).toBeInTheDocument()
    // null avgDaysOfCover → exactly 1 '—' (avgDaysOfCover only; counts are 0, not null)
    // M2-3 fix: exact count locks design intent — regressions detectable
    expect(screen.getAllByText('—').length).toBe(1) // avgDaysOfCover only
  })

  it('renders null avgDaysOfCover as em-dash (CLAUDE.md anti-pattern #8)', () => {
    renderWithProviders(
      <FbsStockAnalyticsSection
        stockAnalytics={{
          totalSkus: 50,
          totalUnits: 500,
          lowStockSkus: 5,
          outOfStockSkus: 2,
          avgDaysOfCover: null,
        }}
      />
    )
    expect(screen.getByText('50')).toBeInTheDocument()
    expect(screen.getByText('500')).toBeInTheDocument()
    // M2-3 fix: exact count — only avgDaysOfCover is null here, so exactly 1 dash
    expect(screen.getAllByText('—').length).toBe(1) // avgDaysOfCover only
  })

  it('renders non-null avgDaysOfCover with ru-RU comma decimal (formatDecimal)', () => {
    renderWithProviders(
      <FbsStockAnalyticsSection
        stockAnalytics={{
          totalSkus: 50,
          totalUnits: 500,
          lowStockSkus: 5,
          outOfStockSkus: 2,
          avgDaysOfCover: 12.5,
        }}
      />
    )
    expect(screen.getByText('12,5')).toBeInTheDocument() // was dot-locale "12.5"
  })
})
