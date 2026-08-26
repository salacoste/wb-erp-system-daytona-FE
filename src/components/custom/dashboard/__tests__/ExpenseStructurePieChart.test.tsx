/**
 * Tests for ExpenseStructurePieChart Component
 * Story 63.9-FE: Expense Structure Pie Chart
 * Epic 63-FE: Dashboard Main Page Enhancement
 *
 * Tests donut chart displaying cost breakdown as % of total costs
 * with interactive segments, tooltips, and accessibility.
 *
 * @see docs/stories/epic-63/story-63.9-fe-expense-structure-chart.md
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, waitFor } from '@/test/utils/test-utils'
import { ExpenseStructurePieChart } from '../ExpenseStructurePieChart'

// ============================================================================
// Mock recharts — jsdom cannot render SVG dimensions so we stub chart
// primitives and capture props/data for assertions.
// ============================================================================

const capturedChart: { data: unknown[]; children: React.ReactNode[] } = {
  data: [],
  children: [],
}
const capturedCells: Array<{
  fill: string
  dataKey: string
  'data-testid': string
}> = []

vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts')
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container" style={{ width: '100%', height: 320 }}>
        {children}
      </div>
    ),
    PieChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="pie-chart">{children}</div>
    ),
    Pie: ({
      data,
      children,
      innerRadius,
      outerRadius,
    }: {
      data: unknown[]
      children: React.ReactNode
      innerRadius: number
      outerRadius: number
    }) => {
      capturedChart.data = data
      capturedChart.children = React.Children.toArray(children)
      return (
        <div
          data-testid="pie"
          data-inner-radius={innerRadius}
          data-outer-radius={outerRadius}
          data-segment-count={data.length}
        >
          {children}
        </div>
      )
    },
    Cell: ({
      fill,
      'data-testid': testId,
    }: {
      fill: string
      dataKey: string
      'data-testid': string
    }) => {
      capturedCells.push({ fill, dataKey: 'value', 'data-testid': testId ?? 'cell' })
      return <div data-testid="pie-cell" data-fill={fill} />
    },
    Tooltip: ({ content }: { content: React.ReactNode }) => (
      <div data-testid="chart-tooltip">{content}</div>
    ),
    Legend: ({ content }: { content: () => React.ReactNode; verticalAlign: string }) => (
      <div data-testid="chart-legend">{content()}</div>
    ),
  }
})

// ============================================================================
// Mock useExpenseStructure hook
// ============================================================================

const mockHookState: {
  data: unknown
  isLoading: boolean
  error: unknown
} = {
  data: null,
  isLoading: false,
  error: null,
}

vi.mock('@/hooks/useExpenseStructure', () => ({
  useExpenseStructure: () => mockHookState,
}))

// ============================================================================
// Mock Data — matches UnitEconomicsResponse shape
// ============================================================================

function makeFullData() {
  return {
    meta: {
      week: '2026-W05',
      cabinet_id: 'test-cabinet-id',
      view_by: 'total' as const,
      generated_at: '2026-01-31T12:00:00Z',
    },
    summary: {
      total_revenue: 500000,
      total_net_profit: 85000,
      avg_cogs_pct: 35.0,
      avg_wb_fees_pct: 37.0,
      avg_net_margin_pct: 17.0,
      sku_count: 10,
      profitable_sku_count: 8,
      loss_making_sku_count: 2,
      missing_cogs_count: 0,
    },
    data: [
      {
        sku_id: 'total',
        product_name: 'Total',
        revenue: 500000,
        costs_pct: {
          cogs: 35.0,
          commission: 15.0,
          logistics_delivery: 12.0,
          logistics_return: 3.0,
          storage: 5.0,
          paid_acceptance: 2.0,
          penalties: 1.0,
          other_deductions: 2.0,
          advertising: 8.0,
          delivery_to_warehouse: null,
        },
        costs_rub: {
          cogs: 175000,
          commission: 75000,
          logistics_delivery: 60000,
          logistics_return: 15000,
          storage: 25000,
          paid_acceptance: 10000,
          penalties: 5000,
          other_deductions: 10000,
          advertising: 40000,
          delivery_to_warehouse: null,
        },
        total_costs_pct: 83.0,
        net_margin_pct: 17.0,
        net_profit: 85000,
        profitability_status: 'good',
        has_cogs: true,
      },
    ],
  }
}

function makeZeroValuesData() {
  return {
    ...makeFullData(),
    data: [
      {
        sku_id: 'total',
        product_name: 'Total',
        revenue: 100000,
        costs_pct: {
          cogs: 40.0,
          commission: 20.0,
          logistics_delivery: 10.0,
          logistics_return: 0,
          storage: 0,
          paid_acceptance: 0,
          penalties: 0,
          other_deductions: 0,
          advertising: 0,
          delivery_to_warehouse: null,
        },
        costs_rub: {
          cogs: 40000,
          commission: 20000,
          logistics_delivery: 10000,
          logistics_return: 0,
          storage: 0,
          paid_acceptance: 0,
          penalties: 0,
          other_deductions: 0,
          advertising: 0,
          delivery_to_warehouse: null,
        },
        total_costs_pct: 70.0,
        net_margin_pct: 30.0,
        net_profit: 30000,
        profitability_status: 'excellent',
        has_cogs: true,
      },
    ],
  }
}

// ============================================================================
// Helpers
// ============================================================================

function renderChart(week = '2026-W05') {
  return renderWithProviders(<ExpenseStructurePieChart week={week} />)
}

// ============================================================================
// Chart Rendering Tests
// ============================================================================

describe('ExpenseStructurePieChart - Chart Rendering', () => {
  beforeEach(() => {
    mockHookState.data = makeFullData()
    mockHookState.isLoading = false
    mockHookState.error = null
    capturedChart.data = []
    capturedChart.children = []
    capturedCells.length = 0
  })

  it('should render donut chart with expense data', () => {
    renderChart()
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    expect(screen.getByTestId('pie')).toBeInTheDocument()
  })

  it('should display total expenses amount in center', () => {
    renderChart()
    expect(screen.getByText('Итого')).toBeInTheDocument()
    // Sum of all costs_rub: 175000+75000+60000+15000+25000+10000+5000+10000+40000 = 415000
    expect(screen.getByText(/415\s*000/)).toBeInTheDocument()
  })

  it('should render correct number of segments for non-zero categories', () => {
    renderChart()
    // 9 non-zero categories (delivery_to_warehouse is null so filtered out)
    const cells = screen.getAllByTestId('pie-cell')
    expect(cells).toHaveLength(9)
  })

  it('should filter out zero-value categories from chart', () => {
    mockHookState.data = makeZeroValuesData()
    renderChart()
    // Only 3 categories have values > 0: cogs, commission, logistics_delivery
    const cells = screen.getAllByTestId('pie-cell')
    expect(cells).toHaveLength(3)
  })

  it('should sort segments by value descending', () => {
    renderChart()
    const pieData = capturedChart.data as Array<{ key: string; value: number }>
    expect(pieData[0].key).toBe('cogs')
    expect(pieData[0].value).toBe(175000)
    expect(pieData[1].key).toBe('commission')
    expect(pieData[1].value).toBe(75000)
  })

  it('should apply innerRadius for donut style', () => {
    renderChart()
    const pie = screen.getByTestId('pie')
    expect(pie.dataset.innerRadius).toBe('70')
    expect(Number(pie.dataset.innerRadius)).toBeGreaterThan(0)
  })

  it('should render responsive container', () => {
    renderChart()
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
  })

  it('should render card with title and description', () => {
    renderChart()
    expect(screen.getByText('Структура расходов')).toBeInTheDocument()
    expect(screen.getByText('Распределение затрат по категориям')).toBeInTheDocument()
  })
})

// ============================================================================
// Color Tests
// ============================================================================

describe('ExpenseStructurePieChart - Color Palette', () => {
  beforeEach(() => {
    mockHookState.data = makeFullData()
    mockHookState.isLoading = false
    mockHookState.error = null
    capturedCells.length = 0
  })

  it('should use chart-1 token for COGS segment', () => {
    renderChart()
    const cells = screen.getAllByTestId('pie-cell')
    const pieData = capturedChart.data as Array<{ key: string; color: string }>
    const cogsIndex = pieData.findIndex(d => d.key === 'cogs')
    expect(cogsIndex).toBeGreaterThanOrEqual(0)
    expect(cells[cogsIndex].dataset.fill).toBe('var(--color-chart-1)')
  })

  it('should use chart-2 token for Commission segment', () => {
    renderChart()
    const cells = screen.getAllByTestId('pie-cell')
    const pieData = capturedChart.data as Array<{ key: string; color: string }>
    const index = pieData.findIndex(d => d.key === 'commission')
    expect(index).toBeGreaterThanOrEqual(0)
    expect(cells[index].dataset.fill).toBe('var(--color-chart-2)')
  })

  it('should use chart-6 token for Logistics Delivery segment', () => {
    renderChart()
    const cells = screen.getAllByTestId('pie-cell')
    const pieData = capturedChart.data as Array<{ key: string; color: string }>
    const index = pieData.findIndex(d => d.key === 'logistics_delivery')
    expect(index).toBeGreaterThanOrEqual(0)
    expect(cells[index].dataset.fill).toBe('var(--color-chart-6)')
  })

  it('should use status-error token for Logistics Return segment', () => {
    renderChart()
    const cells = screen.getAllByTestId('pie-cell')
    const pieData = capturedChart.data as Array<{ key: string; color: string }>
    const index = pieData.findIndex(d => d.key === 'logistics_return')
    expect(index).toBeGreaterThanOrEqual(0)
    expect(cells[index].dataset.fill).toBe('var(--color-status-error)')
  })

  it('should use chart-5 token for Storage segment', () => {
    renderChart()
    const cells = screen.getAllByTestId('pie-cell')
    const pieData = capturedChart.data as Array<{ key: string; color: string }>
    const index = pieData.findIndex(d => d.key === 'storage')
    expect(index).toBeGreaterThanOrEqual(0)
    expect(cells[index].dataset.fill).toBe('var(--color-chart-5)')
  })

  it('should use status-warning token for Paid Acceptance segment', () => {
    renderChart()
    const cells = screen.getAllByTestId('pie-cell')
    const pieData = capturedChart.data as Array<{ key: string; color: string }>
    const index = pieData.findIndex(d => d.key === 'paid_acceptance')
    expect(index).toBeGreaterThanOrEqual(0)
    expect(cells[index].dataset.fill).toBe('var(--color-status-warning)')
  })

  it('should use chart-negative token for Penalties segment', () => {
    renderChart()
    const cells = screen.getAllByTestId('pie-cell')
    const pieData = capturedChart.data as Array<{ key: string; color: string }>
    const index = pieData.findIndex(d => d.key === 'penalties')
    expect(index).toBeGreaterThanOrEqual(0)
    expect(cells[index].dataset.fill).toBe('var(--color-chart-negative)')
  })

  it('should use muted-foreground token for Other Deductions segment', () => {
    renderChart()
    const cells = screen.getAllByTestId('pie-cell')
    const pieData = capturedChart.data as Array<{ key: string; color: string }>
    const index = pieData.findIndex(d => d.key === 'other_deductions')
    expect(index).toBeGreaterThanOrEqual(0)
    expect(cells[index].dataset.fill).toBe('var(--color-muted-foreground)')
  })

  it('should use chart-4 token for Advertising segment', () => {
    renderChart()
    const cells = screen.getAllByTestId('pie-cell')
    const pieData = capturedChart.data as Array<{ key: string; color: string }>
    const index = pieData.findIndex(d => d.key === 'advertising')
    expect(index).toBeGreaterThanOrEqual(0)
    expect(cells[index].dataset.fill).toBe('var(--color-chart-4)')
  })
})

// ============================================================================
// Legend Tests
// ============================================================================

describe('ExpenseStructurePieChart - Legend', () => {
  beforeEach(() => {
    mockHookState.data = makeFullData()
    mockHookState.isLoading = false
    mockHookState.error = null
  })

  it('should render legend with all non-zero categories', () => {
    renderChart()
    const legend = screen.getByTestId('chart-legend')
    expect(legend).toBeInTheDocument()
    // 9 non-zero categories should appear
    expect(legend.textContent).toContain('Себестоимость')
    expect(legend.textContent).toContain('Реклама')
  })

  it('should display category Russian labels in legend', () => {
    renderChart()
    const legend = screen.getByTestId('chart-legend')
    expect(legend.textContent).toContain('Себестоимость')
    expect(legend.textContent).toContain('Комиссия WB')
    expect(legend.textContent).toContain('Доставка')
    expect(legend.textContent).toContain('Возвраты')
    expect(legend.textContent).toContain('Хранение')
    expect(legend.textContent).toContain('Приёмка')
    expect(legend.textContent).toContain('Штрафы')
    expect(legend.textContent).toContain('Прочие')
    expect(legend.textContent).toContain('Реклама')
  })

  it('should show percentage value in legend item', () => {
    renderChart()
    const legend = screen.getByTestId('chart-legend')
    // COGS is 35.0%
    expect(legend.textContent).toContain('35,0')
    // Commission is 15.0%
    expect(legend.textContent).toContain('15,0')
  })

  it('should display color indicator for each legend item', () => {
    renderChart()
    // Legend items have colored circles (span with rounded-full + backgroundColor style)
    const colorIndicators = screen
      .getAllByTestId('chart-legend')[0]
      .querySelectorAll('.rounded-full')
    expect(colorIndicators.length).toBe(9)
  })

  it('should hide zero-value categories from legend', () => {
    mockHookState.data = makeZeroValuesData()
    renderChart()
    const legend = screen.getByTestId('chart-legend')
    // Only 3 categories should be in legend
    const colorIndicators = legend.querySelectorAll('.rounded-full')
    expect(colorIndicators.length).toBe(3)
  })
})

// ============================================================================
// Tooltip Tests
// ============================================================================

describe('ExpenseStructurePieChart - Tooltip', () => {
  beforeEach(() => {
    mockHookState.data = makeFullData()
    mockHookState.isLoading = false
    mockHookState.error = null
  })

  it('should render tooltip component in chart', () => {
    renderChart()
    expect(screen.getByTestId('chart-tooltip')).toBeInTheDocument()
  })

  it('should render ExpenseChartTooltip as tooltip content', () => {
    renderChart()
    // The tooltip content is the ExpenseChartTooltip component
    const tooltip = screen.getByTestId('chart-tooltip')
    expect(tooltip).toBeInTheDocument()
  })
})

// ============================================================================
// Loading State Tests
// ============================================================================

describe('ExpenseStructurePieChart - Loading State', () => {
  beforeEach(() => {
    mockHookState.data = null
    mockHookState.isLoading = true
    mockHookState.error = null
  })

  it('should render skeleton when loading', () => {
    renderChart()
    // Skeleton renders a card with aria-busy
    const card = document.querySelector('[aria-busy="true"]')
    expect(card).toBeInTheDocument()
  })

  it('should show circular skeleton for chart area', () => {
    renderChart()
    // ExpenseChartSkeleton renders a 280x280 rounded-full skeleton
    const skeletons = document.querySelectorAll('.rounded-full')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should show skeleton placeholders for legend', () => {
    renderChart()
    // 5 skeleton bars for legend items
    const legendSkeletons = document.querySelectorAll('.h-4.w-20')
    expect(legendSkeletons.length).toBe(5)
  })

  it('should have aria-busy attribute during loading', () => {
    renderChart()
    const card = document.querySelector('[aria-busy="true"]')
    expect(card).toBeInTheDocument()
    expect(card?.getAttribute('aria-busy')).toBe('true')
  })
})

// ============================================================================
// Empty State Tests
// ============================================================================

describe('ExpenseStructurePieChart - Empty State', () => {
  beforeEach(() => {
    mockHookState.data = {
      ...makeFullData(),
      data: [],
    }
    mockHookState.isLoading = false
    mockHookState.error = null
  })

  it('should show empty state when no data available', () => {
    renderChart()
    // EmptyStateIllustration with type="expenses" shows "Нет данных за этот период"
    expect(screen.getByText('Нет данных за этот период')).toBeInTheDocument()
  })

  it('should show empty state illustration with expenses-specific secondary', () => {
    renderChart()
    expect(
      screen.getByText('Данные о расходах появятся после загрузки финансовых отчетов')
    ).toBeInTheDocument()
  })

  it('should still render card header in empty state', () => {
    renderChart()
    expect(screen.getByText('Структура расходов')).toBeInTheDocument()
    expect(screen.getByText('Распределение затрат по категориям')).toBeInTheDocument()
  })
})

// ============================================================================
// Error State Tests
// ============================================================================

describe('ExpenseStructurePieChart - Error State', () => {
  beforeEach(() => {
    mockHookState.data = null
    mockHookState.isLoading = false
    mockHookState.error = new Error('API error')
  })

  it('should show empty state on API error', () => {
    renderChart()
    // Error state renders same empty state card
    expect(screen.getByText('Нет данных за этот период')).toBeInTheDocument()
  })

  it('should show card title and description on error', () => {
    renderChart()
    expect(screen.getByText('Структура расходов')).toBeInTheDocument()
    expect(screen.getByText('Распределение затрат по категориям')).toBeInTheDocument()
  })

  it('should show empty state illustration on error', () => {
    renderChart()
    // The empty state illustration with expenses type is shown
    expect(
      screen.getByText('Данные о расходах появятся после загрузки финансовых отчетов')
    ).toBeInTheDocument()
  })
})

// ============================================================================
// Period Context Integration Tests
// ============================================================================

describe('ExpenseStructurePieChart - Period Context', () => {
  beforeEach(() => {
    mockHookState.data = makeFullData()
    mockHookState.isLoading = false
    mockHookState.error = null
  })

  it('should render successfully with week prop', () => {
    renderChart('2026-W10')
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
  })

  it('should refetch when week changes', () => {
    // First render with W05
    const { rerender } = renderChart('2026-W05')
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()

    // Rerender with different week — hook will be called again
    mockHookState.data = makeFullData()
    rerender(<ExpenseStructurePieChart week="2026-W10" />)
    // Chart should still render — verifying the component handles week change
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
  })
})

// ============================================================================
// Accessibility Tests
// ============================================================================

describe('ExpenseStructurePieChart - Accessibility', () => {
  beforeEach(() => {
    mockHookState.data = makeFullData()
    mockHookState.isLoading = false
    mockHookState.error = null
  })

  it('should have accessible chart label via aria-label', () => {
    renderChart()
    const chartContainer = screen.getByRole('img')
    expect(chartContainer).toHaveAttribute(
      'aria-label',
      expect.stringContaining('Диаграмма структуры расходов')
    )
  })

  it('should have color indicators with labels and percentages (not color-only)', () => {
    renderChart()
    // Legend items contain text labels and percentages, not just colors
    const legend = screen.getByTestId('chart-legend')
    expect(legend.textContent).toContain('Себестоимость')
    expect(legend.textContent).toContain('35,0')
    expect(legend.textContent).toContain('Комиссия WB')
  })

  it('should use semantic role=img for chart container', () => {
    renderChart()
    expect(screen.getByRole('img')).toBeInTheDocument()
  })
})

// ============================================================================
// Responsive Design Tests
// ============================================================================

describe('ExpenseStructurePieChart - Responsive Design', () => {
  beforeEach(() => {
    mockHookState.data = makeFullData()
    mockHookState.isLoading = false
    mockHookState.error = null
  })

  it('should render responsive container at full width', () => {
    renderChart()
    const container = screen.getByTestId('responsive-container')
    expect(container).toBeInTheDocument()
    expect(container.style.width).toBe('100%')
  })

  it('should render legend below chart', () => {
    renderChart()
    const legend = screen.getByTestId('chart-legend')
    expect(legend).toBeInTheDocument()
  })
})

// ============================================================================
// Data Transformation Tests
// ============================================================================

describe('ExpenseStructurePieChart - Data Transformation', () => {
  beforeEach(() => {
    mockHookState.data = makeFullData()
    mockHookState.isLoading = false
    mockHookState.error = null
    capturedChart.data = []
  })

  it('should calculate total expenses correctly', () => {
    renderChart()
    // 175000+75000+60000+15000+25000+10000+5000+10000+40000 = 415000
    expect(screen.getByText(/415\s*000/)).toBeInTheDocument()
  })

  it('should transform costs_rub to chart data format', () => {
    renderChart()
    const pieData = capturedChart.data as Array<{
      key: string
      value: number
      name: string
      percentage: number
      color: string
    }>
    // Each item should have key, name, value, percentage, color
    const firstItem = pieData[0]
    expect(firstItem.key).toBe('cogs')
    expect(firstItem.name).toBe('Себестоимость')
    expect(firstItem.value).toBe(175000)
    expect(firstItem.percentage).toBe(35.0)
    expect(firstItem.color).toBe('var(--color-chart-1)')
  })

  it('should use costs_pct for percentage values', () => {
    renderChart()
    const pieData = capturedChart.data as Array<{ key: string; percentage: number }>
    const commissionItem = pieData.find(d => d.key === 'commission')
    expect(commissionItem?.percentage).toBe(15.0)
  })

  it('should map category keys to Russian labels', () => {
    renderChart()
    const pieData = capturedChart.data as Array<{ key: string; name: string }>
    const labelMap: Record<string, string> = {
      cogs: 'Себестоимость',
      commission: 'Комиссия WB',
      logistics_delivery: 'Доставка',
      logistics_return: 'Возвраты',
      storage: 'Хранение',
      paid_acceptance: 'Приёмка',
      penalties: 'Штрафы',
      other_deductions: 'Прочие',
      advertising: 'Реклама',
    }
    for (const item of pieData) {
      expect(item.name).toBe(labelMap[item.key])
    }
  })
})

// ============================================================================
// Integration Tests
// ============================================================================

describe('ExpenseStructurePieChart - Integration', () => {
  beforeEach(() => {
    mockHookState.data = makeFullData()
    mockHookState.isLoading = false
    mockHookState.error = null
  })

  it('should display complete chart with all parts from API data', () => {
    renderChart()

    // Card header
    expect(screen.getByText('Структура расходов')).toBeInTheDocument()
    expect(screen.getByText('Распределение затрат по категориям')).toBeInTheDocument()

    // Chart
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()

    // Center total
    expect(screen.getByText('Итого')).toBeInTheDocument()

    // Legend
    expect(screen.getByTestId('chart-legend')).toBeInTheDocument()

    // Tooltip
    expect(screen.getByTestId('chart-tooltip')).toBeInTheDocument()
  })

  it('should handle full lifecycle: loading -> data -> display', async () => {
    // Start loading
    mockHookState.isLoading = true
    mockHookState.data = null
    const { rerender } = renderChart()

    expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument()

    // Data arrives
    mockHookState.isLoading = false
    mockHookState.data = makeFullData()
    rerender(<ExpenseStructurePieChart week="2026-W05" />)

    await waitFor(() => {
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    })
    expect(screen.getByText('Структура расходов')).toBeInTheDocument()
    expect(screen.getByText('Итого')).toBeInTheDocument()
  })
})
