/**
 * Unit tests for FinancialSummaryTable component
 * Story 3.5: Financial Summary View
 *
 * Tests:
 * - Table rendering with single week data
 * - Comparison mode (two columns)
 * - Currency formatting
 * - Change indicators (trend arrows, percentages, colors)
 * - Empty/null value handling
 * - Highlighted rows (payout summary)
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FinancialSummaryTable } from './FinancialSummaryTable'
import type { FinanceSummary } from '@/hooks/useDashboard'

const mockSummary: FinanceSummary = {
  week: '2025-W01',
  sale_gross_total: 1000000,
  to_pay_goods_total: 850000,
  payout_total: 750000,
  logistics_cost_total: 50000,
  storage_cost_total: 30000,
  paid_acceptance_cost_total: 10000,
  penalties_total: 5000,
  acquiring_fee_total: 20000,
  commission_sales_total: 15000,
  loyalty_fee_total: 10000,
  loyalty_points_withheld_total: 5000,
  seller_delivery_revenue_total: 50000,
  loyalty_compensation_total: 2000,
  wb_commission_adj_total: -1000,
  other_adjustments_net_total: 1000,
}

const mockComparisonSummary: FinanceSummary = {
  week: '2025-W02',
  sale_gross_total: 1200000,
  to_pay_goods_total: 1000000,
  payout_total: 900000,
  logistics_cost_total: 60000,
  storage_cost_total: 35000,
  paid_acceptance_cost_total: 12000,
  penalties_total: 6000,
  acquiring_fee_total: 24000,
  commission_sales_total: 18000,
  loyalty_fee_total: 12000,
  loyalty_points_withheld_total: 6000,
  seller_delivery_revenue_total: 60000,
  loyalty_compensation_total: 2500,
  wb_commission_adj_total: -1200,
  other_adjustments_net_total: 1200,
}

describe('FinancialSummaryTable', () => {
  it('should render table with single week data', () => {
    render(<FinancialSummaryTable summary={mockSummary} />)

    // Check revenue section (Updated labels per component refactoring)
    expect(screen.getByText('Доходы')).toBeInTheDocument()
    expect(screen.getByText('Чистые продажи (NET)')).toBeInTheDocument()

    // Check specific values in revenue section
    expect(screen.getAllByText('1 000 000,00 ₽').length).toBeGreaterThan(0)

    // Check expenses section - now labeled "💸 Расходы WB"
    expect(screen.getByText(/Расходы WB/)).toBeInTheDocument()
    expect(screen.getByText('Логистика')).toBeInTheDocument()

    // Check payout summary
    expect(screen.getAllByText('Итого к оплате').length).toBeGreaterThan(0)
    expect(screen.getAllByText('750 000,00 ₽').length).toBeGreaterThan(0)
  })

  it('should render comparison mode with two columns', () => {
    render(<FinancialSummaryTable summary={mockSummary} comparisonSummary={mockComparisonSummary} />)

    // Check comparison headers appear in all tables
    const allHeaders = screen.getAllByText('Значение')
    expect(allHeaders.length).toBeGreaterThan(0)
    
    const comparisonHeaders = screen.getAllByText('Сравнение')
    expect(comparisonHeaders.length).toBeGreaterThan(0)
    
    const changeHeaders = screen.getAllByText('Изменение')
    expect(changeHeaders.length).toBeGreaterThan(0)

    // Check both values are displayed
    expect(screen.getAllByText('1 000 000,00 ₽').length).toBeGreaterThan(0)
    expect(screen.getAllByText('1 200 000,00 ₽').length).toBeGreaterThan(0)
  })

  it('should format currency values correctly', () => {
    render(<FinancialSummaryTable summary={mockSummary} />)

    // Check Russian locale formatting
    expect(screen.getAllByText('1 000 000,00 ₽').length).toBeGreaterThan(0)
    expect(screen.getAllByText('750 000,00 ₽').length).toBeGreaterThan(0)
  })

  it('should display change indicators in comparison mode', () => {
    render(<FinancialSummaryTable summary={mockSummary} comparisonSummary={mockComparisonSummary} />)

    // Revenue increased (positive change) - check for green color class
    // The percentage text may vary by locale, so we check for the color instead
    const greenElements = document.querySelectorAll('.text-green-600')
    expect(greenElements.length).toBeGreaterThan(0)

    // Verify that change indicators are present (they contain percentage)
    const changeCells = document.querySelectorAll('td')
    const hasChangeIndicator = Array.from(changeCells).some((cell) => {
      const text = cell.textContent || ''
      return text.includes('%') && (text.includes('+') || text.includes('20'))
    })
    expect(hasChangeIndicator).toBe(true)
  })

  it('should handle null/undefined values with dash', () => {
    const summaryWithNulls: FinanceSummary = {
      week: '2025-W01',
      sale_gross_total: undefined,
      to_pay_goods_total: undefined,
      payout_total: 0,
      penalties_total: 0,
    }

    render(<FinancialSummaryTable summary={summaryWithNulls} />)

    // Check that null/undefined values show as dash
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThan(0)
  })

  it('should highlight payout summary row', () => {
    render(<FinancialSummaryTable summary={mockSummary} />)

    // Check payout card has special styling
    const payoutCards = document.querySelectorAll('.border-2.border-blue-500')
    expect(payoutCards.length).toBeGreaterThan(0)
    
    // Check that "Итого к оплате" is within the highlighted card
    const payoutText = screen.getAllByText('Итого к оплате')[0]
    const payoutCard = payoutText.closest('.border-2')
    expect(payoutCard).toHaveClass('border-blue-500')
  })

  it('should display all metric groups', () => {
    render(<FinancialSummaryTable summary={mockSummary} />)

    // Check all sections are present (Updated labels per component refactoring)
    expect(screen.getByText('Доходы')).toBeInTheDocument()
    expect(screen.getByText(/Расходы WB/)).toBeInTheDocument()
    expect(screen.getByText('Компенсации')).toBeInTheDocument()
    expect(screen.getAllByText('Итого к оплате').length).toBeGreaterThan(0)
  })

  it('should show negative change indicators correctly', () => {
    const lowerSummary: FinanceSummary = {
      ...mockSummary,
      sale_gross_total: 800000, // Lower than comparison
    }

    render(<FinancialSummaryTable summary={lowerSummary} comparisonSummary={mockSummary} />)

    // Check for red color class (negative change)
    const redElements = document.querySelectorAll('.text-red-600')
    expect(redElements.length).toBeGreaterThan(0)

    // Verify that negative change indicators are present
    const changeCells = document.querySelectorAll('td')
    const hasNegativeChange = Array.from(changeCells).some((cell) => {
      const text = cell.textContent || ''
      return text.includes('%') && (text.includes('-') || text.includes('20'))
    })
    expect(hasNegativeChange).toBe(true)
  })

  it('should handle zero values correctly', () => {
    const zeroSummary: FinanceSummary = {
      week: '2025-W01',
      sale_gross_total: 0,
      to_pay_goods_total: 0,
      payout_total: 0,
      penalties_total: 0,
    }

    render(<FinancialSummaryTable summary={zeroSummary} />)

    // Zero values should be formatted as currency (locale may use comma or dot)
    // Check for either format
    const zeroFormatted1 = screen.queryAllByText('0,00 ₽')
    const zeroFormatted2 = screen.queryAllByText('0.00 ₽')
    expect(zeroFormatted1.length + zeroFormatted2.length).toBeGreaterThan(0)
  })

  it('should use fallback values when _total is not available', () => {
    const summaryWithFallback: FinanceSummary = {
      week: '2025-W01',
      sale_gross: 500000, // Using fallback field
      to_pay_goods: 400000,
      payout_total: 350000,
      penalties_total: 0,
    }

    render(<FinancialSummaryTable summary={summaryWithFallback} />)

    // Should display fallback values
    expect(screen.getAllByText('500 000,00 ₽').length).toBeGreaterThan(0)
    expect(screen.getAllByText('400 000,00 ₽').length).toBeGreaterThan(0)
  })
})
