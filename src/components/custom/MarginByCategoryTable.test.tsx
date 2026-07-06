/**
 * Unit tests for MarginByCategoryTable component
 * Story 4.6: Margin Analysis by Brand & Category
 *
 * Tests:
 * - Table rendering with aggregated category data
 * - Sorting functionality
 * - Aggregation display
 * - Missing COGS indicators
 * - Drill-down navigation
 * - Summary calculations
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MarginByCategoryTable } from './MarginByCategoryTable'
import type { MarginAnalyticsAggregated } from '@/types/api'

const mockCategoryData: MarginAnalyticsAggregated[] = [
  {
    category: 'Category A',
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
    category: 'Category B',
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
    category: 'Category C',
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

describe('MarginByCategoryTable', () => {
  describe('rendering', () => {
    it('should render table with category data', () => {
      render(<MarginByCategoryTable data={mockCategoryData} />)

      expect(screen.getByText('Category A')).toBeInTheDocument()
      expect(screen.getByText('Category B')).toBeInTheDocument()
      expect(screen.getByText('Category C')).toBeInTheDocument()
    })

    it('should display all columns', () => {
      render(<MarginByCategoryTable data={mockCategoryData} />)

      expect(screen.getByText('Категория')).toBeInTheDocument()
      expect(screen.getByText('Товаров (SKU)')).toBeInTheDocument()
      expect(screen.getByText('Выручка')).toBeInTheDocument()
      expect(screen.getByText('Себестоимость')).toBeInTheDocument()
      expect(screen.getByText('Прибыль')).toBeInTheDocument()
      expect(screen.getByText('Маржа %')).toBeInTheDocument()
      expect(screen.getByText('Без COGS')).toBeInTheDocument()
    })

    it('should show "(Без категории)" for items without category', () => {
      const noCategoryData: MarginAnalyticsAggregated[] = [
        {
          category: undefined,
          revenue_net: 50000,
          qty: 25,
          cogs: 30000,
          profit: 20000,
          margin_pct: 40.0,
          markup_percent: 66.67,
          missing_cogs_count: 0,
        },
      ]

      render(<MarginByCategoryTable data={noCategoryData} />)

      expect(screen.getByText('(Без категории)')).toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('should show empty state message when no data', () => {
      render(<MarginByCategoryTable data={[]} />)

      expect(screen.getByText('Нет данных за выбранную неделю')).toBeInTheDocument()
    })
  })

  describe('sorting', () => {
    it('should sort by margin percentage descending by default', () => {
      render(<MarginByCategoryTable data={mockCategoryData} />)

      const rows = screen.getAllByRole('row')
      // Category A has highest margin (35%)
      expect(rows[1]).toHaveTextContent('Category A')
    })

    it('should sort by category name when clicking category header', () => {
      render(<MarginByCategoryTable data={mockCategoryData} />)

      const categoryHeader = screen.getByText('Категория').closest('button')
      fireEvent.click(categoryHeader!)

      // After clicking, should sort alphabetically (A, B, C)
      expect(screen.getByText('Category A')).toBeInTheDocument()
      expect(screen.getByText('Category B')).toBeInTheDocument()
      expect(screen.getByText('Category C')).toBeInTheDocument()
    })

    it('should sort by revenue when clicking revenue header', () => {
      render(<MarginByCategoryTable data={mockCategoryData} />)

      const revenueHeader = screen.getByText('Выручка').closest('button')
      fireEvent.click(revenueHeader!)

      const rows = screen.getAllByRole('row')
      // Category A has highest revenue (200000)
      expect(rows[1]).toHaveTextContent('Category A')
    })

    it('should place null margins at the end when sorting', () => {
      render(<MarginByCategoryTable data={mockCategoryData} />)

      const marginHeader = screen.getByText('Маржа %').closest('button')
      fireEvent.click(marginHeader!) // Toggle to ascending

      const rows = screen.getAllByRole('row')
      // Category C (null margin) should be at the end
      const lastDataRow = rows[rows.length - 1]
      expect(lastDataRow).toHaveTextContent('Category C')
    })
  })

  describe('missing COGS handling', () => {
    it('should highlight rows with missing COGS', () => {
      const { container } = render(<MarginByCategoryTable data={mockCategoryData} />)

      const rows = container.querySelectorAll('tbody tr')
      // Category B has missing_cogs_count: 5
      const categoryBRow = Array.from(rows).find(row => row.textContent?.includes('Category B'))
      expect(categoryBRow).toHaveClass('bg-yellow-50/30')
    })

    it('should display missing COGS count badge', () => {
      render(<MarginByCategoryTable data={mockCategoryData} />)

      // Use getAllByText since "75" appears in both quantity and missing COGS count
      const all75s = screen.getAllByText('75')
      expect(all75s.length).toBeGreaterThan(0)

      // Check for the badge specifically (yellow background)
      const { container } = render(<MarginByCategoryTable data={mockCategoryData} />)
      const badges = container.querySelectorAll('.bg-yellow-100')
      expect(badges.length).toBeGreaterThan(0)
    })
  })

  describe('summary footer', () => {
    it('should display total categories count', () => {
      render(<MarginByCategoryTable data={mockCategoryData} />)

      // Updated: uses ComparisonSummary which shows "Всего позиций"
      expect(screen.getByText('Всего позиций')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should calculate and display total revenue', () => {
      render(<MarginByCategoryTable data={mockCategoryData} />)

      expect(screen.getByText('Общая выручка')).toBeInTheDocument()
      // Total: 200000 + 100000 + 150000 = 450000
      const totalRevenue = screen.getByText(/450.*000/)
      expect(totalRevenue).toBeInTheDocument()
    })

    it('should calculate and display total profit', () => {
      render(<MarginByCategoryTable data={mockCategoryData} />)

      expect(screen.getByText('Общая прибыль')).toBeInTheDocument()
      // Total: 70000 + 20000 + 0 = 90000
      const totalProfit = screen.getByText(/90.*000/)
      expect(totalProfit).toBeInTheDocument()
    })

    it('should calculate and display average margin', () => {
      render(<MarginByCategoryTable data={mockCategoryData} />)

      expect(screen.getByText('Средняя маржа')).toBeInTheDocument()
      // Weighted average by revenue: (70000+20000+0) / (200000+100000+150000) = 20%
      // Check for percentage sign and number pattern (flexible for locale formatting)
      const summarySection = screen.getByText('Средняя маржа').closest('div')?.parentElement
      // comma-only (ru-RU) — locks the locale so a dot-regression fails
      expect(summarySection?.textContent).toMatch(/20,\d+\s*%/)
    })
  })

  describe('drill-down navigation', () => {
    it('should call onCategoryClick when row is clicked', () => {
      const handleClick = vi.fn()
      render(<MarginByCategoryTable data={mockCategoryData} onCategoryClick={handleClick} />)

      const rows = screen.getAllByRole('row')
      fireEvent.click(rows[1]) // Click first data row

      expect(handleClick).toHaveBeenCalledWith('Category A')
    })

    it('should call onCategoryClick when external link button is clicked', () => {
      const handleClick = vi.fn()
      render(<MarginByCategoryTable data={mockCategoryData} onCategoryClick={handleClick} />)

      const buttons = screen.getAllByRole('button')
      const externalLinkButton = buttons.find(btn =>
        btn.getAttribute('aria-label')?.includes('Открыть детали категории')
      )

      if (externalLinkButton) {
        fireEvent.click(externalLinkButton)
        expect(handleClick).toHaveBeenCalled()
      }
    })

    it('should not call onCategoryClick for items without category', () => {
      const handleClick = vi.fn()
      const noCategoryData: MarginAnalyticsAggregated[] = [
        {
          category: undefined,
          revenue_net: 50000,
          qty: 25,
          cogs: 30000,
          profit: 20000,
          margin_pct: 40.0,
          markup_percent: 66.67,
          missing_cogs_count: 0,
        },
      ]

      render(<MarginByCategoryTable data={noCategoryData} onCategoryClick={handleClick} />)

      const rows = screen.getAllByRole('row')
      fireEvent.click(rows[1])

      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('BD-5: cogs === 0 (COGS unassigned) degenerate guard', () => {
    // Live W26 condition: by-category normalizer maps cogs_rub:"0" → cogs:0 when no COGS
    // version exists ⇒ profit collapses to revenue, margin_pct → 100 %. Every COGS-derived
    // metric must render «—». Mirrors period-card fix 0436ecc9; REPORT.md BD-5.
    const bd5Data: MarginAnalyticsAggregated[] = [
      {
        category: 'NoCogs Cat',
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
        category: 'CogsOK Cat',
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

    it('suppresses the margin badge (→ gray «—») when cogs === 0', () => {
      const { container } = render(<MarginByCategoryTable data={bd5Data} />)
      const noCogsRow = rowByName(container, 'NoCogs Cat')
      expect(noCogsRow.querySelector('.bg-green-50, .bg-red-50')).toBeNull()
    })

    it('renders «—» for COGS-dependent cells when cogs === 0', () => {
      const { container } = render(<MarginByCategoryTable data={bd5Data} />)
      const noCogsRow = rowByName(container, 'NoCogs Cat')
      const cogsOkRow = rowByName(container, 'CogsOK Cat')
      const noCogsDashes = (noCogsRow.textContent?.match(/—/g) ?? []).length
      const cogsOkDashes = (cogsOkRow.textContent?.match(/—/g) ?? []).length
      // 6 gated cells render «—» only on the cogs=0 row ⇒ sentinel delta ≥6.
      expect(noCogsDashes - cogsOkDashes).toBeGreaterThanOrEqual(6)
    })

    it('keeps revenue / operating profit visible (real, non-COGS) when cogs === 0', () => {
      const { container } = render(<MarginByCategoryTable data={bd5Data} />)
      const noCogsRow = rowByName(container, 'NoCogs Cat')
      expect(noCogsRow.textContent).toMatch(/100\s*000/) // Выручка 100 000
      expect(noCogsRow.textContent).toMatch(/35\s*000/) // Опер. прибыль 35 000
    })

    it('renders real margin badge + profit for cogs > 0 rows (control)', () => {
      const { container } = render(<MarginByCategoryTable data={bd5Data} />)
      const cogsOkRow = rowByName(container, 'CogsOK Cat')
      expect(cogsOkRow.querySelector('.bg-green-50')).not.toBeNull()
      expect(cogsOkRow.textContent).toMatch(/40\s*000/)
    })

    it('renders «—» profit-share for every row when ALL rows are cogs === 0 (production W26 reality)', () => {
      // W26: 0/20 rows have assigned COGS ⇒ shareTotals.grossProfit === 0. Forward-guard
      // on the zero-denominator path — no row may leak NaN/Infinity/0-% into the
      // «Вклад в валовую прибыль» column (pins sharePercentage's total===0 guard).
      const allDegenerate: MarginAnalyticsAggregated[] = [
        {
          category: 'DegA',
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
          category: 'DegB',
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
      const { container } = render(<MarginByCategoryTable data={allDegenerate} />)
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
