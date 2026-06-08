import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { SupplyPlanningTable } from '../SupplyPlanningTable'
import type { SupplyPlanningItem, StockoutRisk } from '@/types/supply-planning'

// Mock child components
vi.mock('../SupplyPlanningRow', () => ({
  SupplyPlanningRow: ({ item }: { item: SupplyPlanningItem }) => (
    <tr data-testid={`row-${item.sku_id}`}>
      <td>{item.product_name}</td>
    </tr>
  ),
}))

vi.mock('../SupplyTableHeader', () => ({
  SupplyTableHeader: () => (
    <thead>
      <tr>
        <th>Артикул</th>
      </tr>
    </thead>
  ),
}))

vi.mock('../SupplyTablePagination', () => ({
  SupplyTablePagination: ({ totalItems }: { totalItems: number }) => (
    <div data-testid="pagination">Total: {totalItems}</div>
  ),
}))

vi.mock('../useSupplyTableFilters', () => ({
  useSupplyTableFilters: (data: SupplyPlanningItem[]) => ({
    searchQuery: '',
    setSearchQuery: vi.fn(),
    sortField: null,
    sortOrder: null,
    handleSort: vi.fn(),
    handleClearSearch: vi.fn(),
    processedData: data,
  }),
}))

vi.mock('../useSupplyTablePagination', () => ({
  useSupplyTablePagination: (total: number) => ({
    currentPage: 1,
    setCurrentPage: vi.fn(),
    pageSize: 10,
    totalPages: Math.max(1, Math.ceil(total / 10)),
    startIndex: 0,
    endIndex: Math.min(10, total),
    handlePageSizeChange: vi.fn(),
    resetPage: vi.fn(),
    PAGE_SIZE_OPTIONS: [10, 25, 50],
  }),
}))

vi.mock('../supply-table-export', () => ({
  exportSupplyTableCSV: vi.fn(),
}))

const mockItems: SupplyPlanningItem[] = [
  {
    sku_id: 'sku-1',
    product_name: 'Product A',
    current_stock: 5,
    in_transit: 0,
    effective_stock: 5,
    avg_daily_sales: 10,
    velocity_trend: null,
    days_until_stockout: 1,
    stockout_date: '2026-03-10',
    stockout_risk: 'critical' as StockoutRisk,
    safety_stock_units: 20,
    reorder_quantity: 50,
    reorder_status: 'urgent',
    cogs_per_unit: 100,
    has_cogs: true,
    selling_price: 200,
    warehouses: [],
  },
  {
    sku_id: 'sku-2',
    product_name: 'Product B',
    current_stock: 100,
    in_transit: 10,
    effective_stock: 110,
    avg_daily_sales: 2,
    velocity_trend: 'stable',
    days_until_stockout: 50,
    stockout_date: '2026-05-01',
    stockout_risk: 'healthy' as StockoutRisk,
    safety_stock_units: 30,
    reorder_quantity: 0,
    reorder_status: 'ok',
    cogs_per_unit: 50,
    has_cogs: true,
    selling_price: 150,
    warehouses: [],
  },
]

describe('SupplyPlanningTable', () => {
  it('renders search input', () => {
    render(<SupplyPlanningTable data={mockItems} activeFilter={null} onClearFilter={vi.fn()} />)
    expect(screen.getByPlaceholderText('Поиск по артикулу или названию...')).toBeInTheDocument()
  })

  it('renders CSV export button', () => {
    render(<SupplyPlanningTable data={mockItems} activeFilter={null} onClearFilter={vi.fn()} />)
    expect(screen.getByText('CSV')).toBeInTheDocument()
  })

  it('shows "Нет данных" when data is empty', () => {
    render(<SupplyPlanningTable data={[]} activeFilter={null} onClearFilter={vi.fn()} />)
    expect(screen.getByText('Нет данных для отображения')).toBeInTheDocument()
  })

  it('renders table rows for data items', () => {
    render(<SupplyPlanningTable data={mockItems} activeFilter={null} onClearFilter={vi.fn()} />)
    expect(screen.getByTestId('row-sku-1')).toBeInTheDocument()
    expect(screen.getByTestId('row-sku-2')).toBeInTheDocument()
  })

  it('renders pagination when data is present', () => {
    render(<SupplyPlanningTable data={mockItems} activeFilter={null} onClearFilter={vi.fn()} />)
    expect(screen.getByTestId('pagination')).toBeInTheDocument()
  })

  it('shows "Сбросить фильтр" button when activeFilter is set', () => {
    render(<SupplyPlanningTable data={mockItems} activeFilter="critical" onClearFilter={vi.fn()} />)
    expect(screen.getByText('Сбросить фильтр')).toBeInTheDocument()
  })

  it('hides "Сбросить фильтр" when no activeFilter', () => {
    render(<SupplyPlanningTable data={mockItems} activeFilter={null} onClearFilter={vi.fn()} />)
    expect(screen.queryByText('Сбросить фильтр')).not.toBeInTheDocument()
  })
})
