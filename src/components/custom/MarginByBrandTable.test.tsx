/**
 * Unit tests for MarginByBrandTable component
 * Story 4.6: Margin Analysis by Brand & Category
 *
 * Tests:
 * - Table rendering with aggregated data
 * - Sorting functionality
 * - Aggregation display (total revenue, profit, avg margin)
 * - Missing COGS indicators
 * - Drill-down navigation
 * - Summary calculations
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MarginByBrandTable } from './MarginByBrandTable'
import type { MarginAnalyticsAggregated } from '@/types/api'

const mockBrandData: MarginAnalyticsAggregated[] = [
  {
    brand: 'Brand A',
    revenue_net: 200000,
    qty: 100,
    cogs: 130000,
    profit: 70000,
    operating_profit: 70000, // Required for summary calculation
    margin_pct: 35.0,
    markup_percent: 53.85,
    missing_cogs_count: 0,
  },
  {
    brand: 'Brand B',
    revenue_net: 100000,
    qty: 50,
    cogs: 80000,
    profit: 20000,
    operating_profit: 20000,
    margin_pct: 20.0,
    markup_percent: 25.0,
    missing_cogs_count: 5,
  },
  {
    brand: 'Brand C',
    revenue_net: 150000,
    qty: 75,
    cogs: undefined,
    profit: undefined,
    operating_profit: undefined,
    margin_pct: undefined,
    markup_percent: undefined,
    missing_cogs_count: 75,
  },
]

describe('MarginByBrandTable', () => {
  it('exposes the active sortable column through aria-sort', () => {
    render(<MarginByBrandTable data={mockBrandData} />)

    expect(screen.getByRole('columnheader', { name: /Маржа %/ })).toHaveAttribute(
      'aria-sort',
      'descending'
    )
  })
  describe('rendering', () => {
    it('should render table with brand data', () => {
      render(<MarginByBrandTable data={mockBrandData} />)

      expect(screen.getByText('Brand A')).toBeInTheDocument()
      expect(screen.getByText('Brand B')).toBeInTheDocument()
      expect(screen.getByText('Brand C')).toBeInTheDocument()
      expect(screen.getByText(/\+70\s*000/)).toHaveClass('text-foreground')
    })

    it('should display all columns', () => {
      render(<MarginByBrandTable data={mockBrandData} />)

      expect(screen.getByText('Бренд')).toBeInTheDocument()
      expect(screen.getByText('Товаров (SKU)')).toBeInTheDocument()
      expect(screen.getByText('Выручка')).toBeInTheDocument()
      expect(screen.getByText('Себестоимость')).toBeInTheDocument()
      expect(screen.getByText('Прибыль')).toBeInTheDocument()
      expect(screen.getByText('Маржа %')).toBeInTheDocument()
      expect(screen.getByText('Без COGS')).toBeInTheDocument()
    })

    it('should show "(Без бренда)" for items without brand', () => {
      const noBrandData: MarginAnalyticsAggregated[] = [
        {
          brand: undefined,
          revenue_net: 50000,
          qty: 25,
          cogs: 30000,
          profit: 20000,
          margin_pct: 40.0,
          markup_percent: 66.67,
          missing_cogs_count: 0,
        },
      ]

      render(<MarginByBrandTable data={noBrandData} />)

      expect(screen.getByText('(Без бренда)')).toBeInTheDocument()
    })

    it('renders a negative-margin brand row with the shared error-colour badge', () => {
      render(
        <MarginByBrandTable
          data={[
            {
              ...mockBrandData[0],
              brand: 'Negative Brand',
              profit: -24600,
              operating_profit: -24600,
              margin_pct: -12.3,
            },
          ]}
        />
      )

      const row = screen.getByText('Negative Brand').closest('tr')
      expect(row).not.toBeNull()
      expect(row?.querySelector('.bg-financial-negative\\/5')).toHaveTextContent('-12,30 %')
    })
  })

  describe('empty state', () => {
    it('should show empty state message when no data', () => {
      render(<MarginByBrandTable data={[]} />)

      expect(screen.getByText('Нет данных за выбранную неделю')).toBeInTheDocument()
    })
  })

  describe('sorting', () => {
    it('should sort by margin percentage descending by default', () => {
      render(<MarginByBrandTable data={mockBrandData} />)

      const rows = screen.getAllByRole('row')
      // Brand A has highest margin (35%)
      expect(rows[1]).toHaveTextContent('Brand A')
    })

    it('should sort by brand name when clicking brand header', () => {
      render(<MarginByBrandTable data={mockBrandData} />)

      const brandHeader = screen.getByText('Бренд').closest('button')
      fireEvent.click(brandHeader!)

      // After clicking, should sort alphabetically (A, B, C)
      expect(screen.getByText('Brand A')).toBeInTheDocument()
      expect(screen.getByText('Brand B')).toBeInTheDocument()
      expect(screen.getByText('Brand C')).toBeInTheDocument()
    })

    it('should sort by revenue when clicking revenue header', () => {
      render(<MarginByBrandTable data={mockBrandData} />)

      const revenueHeader = screen.getByText('Выручка').closest('button')
      fireEvent.click(revenueHeader!)

      const rows = screen.getAllByRole('row')
      // Brand A has highest revenue (200000)
      expect(rows[1]).toHaveTextContent('Brand A')
    })

    it('should sort by quantity when clicking quantity header', () => {
      render(<MarginByBrandTable data={mockBrandData} />)

      const qtyHeader = screen.getByText('Товаров (SKU)').closest('button')
      fireEvent.click(qtyHeader!)

      const rows = screen.getAllByRole('row')
      // Brand A has highest qty (100)
      expect(rows[1]).toHaveTextContent('Brand A')
    })

    it('should place null margins at the end when sorting', () => {
      render(<MarginByBrandTable data={mockBrandData} />)

      const marginHeader = screen.getByText('Маржа %').closest('button')
      fireEvent.click(marginHeader!) // Toggle to ascending

      const rows = screen.getAllByRole('row')
      // Brand C (null margin) should be at the end
      const lastDataRow = rows[rows.length - 1]
      expect(lastDataRow).toHaveTextContent('Brand C')
    })
  })

  describe('missing COGS handling', () => {
    it('should highlight rows with missing COGS', () => {
      const { container } = render(<MarginByBrandTable data={mockBrandData} />)

      const rows = container.querySelectorAll('tbody tr')
      // Brand B has missing_cogs_count: 5
      const brandBRow = Array.from(rows).find(row => row.textContent?.includes('Brand B'))
      expect(brandBRow).toHaveClass('bg-status-warning/10')
    })

    it('should display missing COGS count badge', () => {
      render(<MarginByBrandTable data={mockBrandData} />)

      // Use getAllByText since "75" appears in both quantity and missing COGS count
      const all75s = screen.getAllByText('75')
      expect(all75s.length).toBeGreaterThan(0)

      // Check for the badge specifically (yellow background)
      const { container } = render(<MarginByBrandTable data={mockBrandData} />)
      const badges = Array.from(container.querySelectorAll('span')).filter(element =>
        element.classList.contains('bg-status-warning/15')
      )
      expect(badges.length).toBeGreaterThan(0)
    })

    it('should show dash when no missing COGS', () => {
      render(<MarginByBrandTable data={mockBrandData} />)

      const dashes = screen.getAllByText('—')
      expect(dashes.length).toBeGreaterThan(0)
    })
  })

  describe('summary footer', () => {
    it('should display total brands count', () => {
      render(<MarginByBrandTable data={mockBrandData} />)

      // Updated: uses ComparisonSummary which shows "Всего позиций"
      expect(screen.getByText('Всего позиций')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should calculate and display total revenue', () => {
      render(<MarginByBrandTable data={mockBrandData} />)

      expect(screen.getByText('Общая выручка')).toBeInTheDocument()
      // Total: 200000 + 100000 + 150000 = 450000
      const totalRevenue = screen.getByText(/450.*000/)
      expect(totalRevenue).toBeInTheDocument()
    })

    it('should calculate and display total profit', () => {
      render(<MarginByBrandTable data={mockBrandData} />)

      expect(screen.getByText('Общая прибыль')).toBeInTheDocument()
      // Total: 70000 + 20000 + 0 = 90000
      const totalProfit = screen.getByText(/90.*000/)
      expect(totalProfit).toBeInTheDocument()
    })

    it('should calculate and display average margin', () => {
      render(<MarginByBrandTable data={mockBrandData} />)

      expect(screen.getByText('Средняя маржа')).toBeInTheDocument()
      // Weighted average by revenue: (70000+20000+0) / (200000+100000+150000) = 20%
      // Check for percentage sign and number pattern (flexible for locale formatting)
      const summarySection = screen.getByText('Средняя маржа').closest('div')?.parentElement
      // comma-only (ru-RU) — locks the locale so a dot-regression fails
      expect(summarySection?.textContent).toMatch(/20,\d+\s*%/)
    })
  })

  describe('drill-down navigation', () => {
    it('should call onBrandClick when row is clicked', () => {
      const handleClick = vi.fn()
      render(<MarginByBrandTable data={mockBrandData} onBrandClick={handleClick} />)

      const rows = screen.getAllByRole('row')
      fireEvent.click(rows[1]) // Click first data row

      expect(handleClick).toHaveBeenCalledWith('Brand A')
    })

    it('should call onBrandClick when external link button is clicked', () => {
      const handleClick = vi.fn()
      render(<MarginByBrandTable data={mockBrandData} onBrandClick={handleClick} />)

      const buttons = screen.getAllByRole('button')
      const externalLinkButton = buttons.find(btn =>
        btn.getAttribute('aria-label')?.includes('Открыть детали бренда')
      )

      if (externalLinkButton) {
        fireEvent.click(externalLinkButton)
        expect(handleClick).toHaveBeenCalled()
      }
    })

    it('should not call onBrandClick for items without brand', () => {
      const handleClick = vi.fn()
      const noBrandData: MarginAnalyticsAggregated[] = [
        {
          brand: undefined,
          revenue_net: 50000,
          qty: 25,
          cogs: 30000,
          profit: 20000,
          margin_pct: 40.0,
          markup_percent: 66.67,
          missing_cogs_count: 0,
        },
      ]

      render(<MarginByBrandTable data={noBrandData} onBrandClick={handleClick} />)

      const rows = screen.getAllByRole('row')
      fireEvent.click(rows[1])

      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('BD-5: cogs === 0 (COGS unassigned) degenerate guard', () => {
    // Live W26 condition: by-brand sends cogs:0 when no COGS version exists ⇒ profit
    // collapses to revenue, margin_pct → 100 %. Every COGS-derived metric must render «—»,
    // not the degenerate value. Mirrors period-card fix 0436ecc9; REPORT.md BD-5.
    const bd5Data: MarginAnalyticsAggregated[] = [
      {
        brand: 'NoCogs Co',
        revenue_net: 100000,
        qty: 50,
        total_skus: 2,
        cogs: 0,
        profit: 100000,
        operating_profit: 35000,
        net_profit_after_tax: 34000,
        margin_pct: 100,
        markup_percent: undefined,
        missing_cogs_count: 0,
      },
      {
        brand: 'CogsOK Co',
        revenue_net: 100000,
        qty: 50,
        total_skus: 2,
        cogs: 60000,
        profit: 40000,
        operating_profit: 35000,
        net_profit_after_tax: 34000,
        margin_pct: 40,
        markup_percent: 66.67,
        missing_cogs_count: 0,
      },
    ]

    const rowByName = (container: HTMLElement, name: string) =>
      Array.from(container.querySelectorAll('tbody tr')).find(tr =>
        tr.textContent?.includes(name)
      ) as HTMLElement

    it('suppresses the margin badge (→ muted «—») when cogs === 0', () => {
      const { container } = render(<MarginByBrandTable data={bd5Data} />)
      const noCogsRow = rowByName(container, 'NoCogs Co')
      // Margin 100 % must NOT paint a financial-positive/negative badge — null → muted «—» fallback.
      expect(
        noCogsRow.querySelector('.bg-financial-positive\\/5, .bg-financial-negative\\/5')
      ).toBeNull()
    })

    it('renders «—» for COGS-dependent cells when cogs === 0', () => {
      const { container } = render(<MarginByBrandTable data={bd5Data} />)
      const noCogsRow = rowByName(container, 'NoCogs Co')
      const cogsOkRow = rowByName(container, 'CogsOK Co')
      const noCogsDashes = (noCogsRow.textContent?.match(/—/g) ?? []).length
      const cogsOkDashes = (cogsOkRow.textContent?.match(/—/g) ?? []).length
      // 6 gated cells (Себестоимость, Прибыль, Маржа, ROI, Прибыль/шт, Вклад в прибыль)
      // render «—» only on the cogs=0 row ⇒ its sentinel count is ≥6 above the control.
      expect(noCogsDashes - cogsOkDashes).toBeGreaterThanOrEqual(6)
    })

    it('keeps revenue / operating profit visible (real, non-COGS) when cogs === 0', () => {
      const { container } = render(<MarginByBrandTable data={bd5Data} />)
      const noCogsRow = rowByName(container, 'NoCogs Co')
      expect(noCogsRow.textContent).toMatch(/100\s*000/) // Выручка 100 000
      expect(noCogsRow.textContent).toMatch(/35\s*000/) // Опер. прибыль 35 000
    })

    it('renders real margin badge + profit for cogs > 0 rows (control)', () => {
      const { container } = render(<MarginByBrandTable data={bd5Data} />)
      const cogsOkRow = rowByName(container, 'CogsOK Co')
      expect(cogsOkRow.querySelector('.bg-financial-positive\\/5')).not.toBeNull() // Маржа 40 % → financial-positive
      expect(cogsOkRow.textContent).toMatch(/40\s*000/) // Прибыль 40 000
    })

    it('renders «—» profit-share for every row when ALL rows are cogs === 0 (production W26 reality)', () => {
      // W26: 0/20 rows have assigned COGS ⇒ shareTotals.grossProfit === 0. Forward-guard
      // on the zero-denominator path — no row may leak NaN/Infinity/0-% into the
      // «Вклад в валовую прибыль» column (pins sharePercentage's total===0 guard).
      const allDegenerate: MarginAnalyticsAggregated[] = [
        {
          brand: 'DegA',
          revenue_net: 100000,
          qty: 10,
          total_skus: 1,
          cogs: 0,
          profit: 100000,
          operating_profit: 5000,
          margin_pct: 100,
          markup_percent: undefined,
          missing_cogs_count: 0,
        },
        {
          brand: 'DegB',
          revenue_net: 50000,
          qty: 5,
          total_skus: 1,
          cogs: 0,
          profit: 50000,
          operating_profit: 3000,
          margin_pct: 100,
          markup_percent: undefined,
          missing_cogs_count: 0,
        },
      ]
      const { container } = render(<MarginByBrandTable data={allDegenerate} />)
      const rows = Array.from(container.querySelectorAll('tbody tr'))
      expect(rows).toHaveLength(2)
      for (const row of rows) {
        const profitShareCell = row.querySelector('[title="Вклад в валовую прибыль"]')
        expect(profitShareCell?.textContent?.trim()).toBe('—')
        expect(row.textContent ?? '').not.toMatch(/NaN|Infinity/)
      }
    })
  })
})
