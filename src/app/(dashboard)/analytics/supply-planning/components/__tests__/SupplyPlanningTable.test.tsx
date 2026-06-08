import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { SupplyPlanningTable } from '../SupplyPlanningTable'
import type { SupplyPlanningItem, StockoutRisk } from '@/types/supply-planning'

// Mock child components
vi.mock('../SupplyPlanningRow', () => ({
  SupplyPlanningRow: ({ item }: { item: SupplyPlanningItem }) => (
    <tr data-testid={`row-${item.sku_id}`}>
      <td>{item.vendor_code}</td>
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
    vendor_code: 'VC-001',
    product_name: 'Product A',
    stockout_risk: 'critical' as StockoutRisk,
    current_stock: 5,
    avg_daily_sales: 10,
    days_until_stockout: 1,
    total_sales_7d: 70,
    total_sales_30d: 300,
    reorder_value: 50000,
    safety_stock_units: 20,
    in_transit_units: 0,
    warehouse_stock: 5,
  },
  {
    sku_id: 'sku-2',
    vendor_code: 'VC-002',
    product_name: 'Product B',
    stockout_risk: 'healthy' as StockoutRisk,
    current_stock: 100,
    avg_daily_sales: 2,
    days_until_stockout: 50,
    total_sales_7d: 14,
    total_sales_30d: 60,
    reorder_value: 0,
    safety_stock_units: 30,
    in_transit_units: 10,
    warehouse_stock: 90,
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
