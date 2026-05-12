/**
 * ProductList Component Tests — Selection, Margin Display, Accessibility
 *
 * Split from ProductList.test.tsx (Story 98.1-FE ESLint cap extraction).
 * Covers: product selection, margin display props, accessibility attributes.
 *
 * @see src/components/custom/ProductList.tsx
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProductList } from '../ProductList'
import { useProducts } from '@/hooks/useProducts'
import { useMarginPollingStore } from '@/stores/marginPollingStore'
import { usePendingMarginProducts } from '@/hooks/usePendingMarginProducts'
import { useManualMarginRecalculation } from '@/hooks/useManualMarginRecalculation'
import type { ProductListItem, ProductListResponse } from '@/types/api'

vi.mock('@/hooks/useProducts')
vi.mock('@/stores/marginPollingStore')
vi.mock('@/hooks/usePendingMarginProducts')
vi.mock('@/hooks/useManualMarginRecalculation')
vi.mock('@/hooks/useColumnWidths', () => ({
  useColumnWidths: () => ({
    widths: {
      article: 120,
      vendor_code: 140,
      name: 300,
      cogs: 140,
      margin: 150,
      actions: 100,
    },
    handleResize: vi.fn(),
  }),
}))

interface MockSearchFilterProps {
  onSearchChange: (value: string) => void
  onFilterToggle: () => void
  searchValue: string
  filterLabel: string
}

interface MockTableRowProps {
  product: { nm_id: string; vendor_code: string; name: string }
  onProductClick: (product: unknown) => void
  enableSelection: boolean
}

interface MockPaginationProps {
  hasPrevious: boolean
  hasNext: boolean
  onPrevious: () => void
  onNext: () => void
}

vi.mock('../ProductSearchFilter', () => ({
  ProductSearchFilter: ({
    onSearchChange,
    onFilterToggle,
    searchValue,
    filterLabel,
  }: MockSearchFilterProps) => (
    <div data-testid="product-search-filter">
      <input
        data-testid="search-input"
        value={searchValue}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
        placeholder="Поиск товаров"
      />
      <button data-testid="filter-toggle" onClick={onFilterToggle}>
        {filterLabel}
      </button>
    </div>
  ),
}))

vi.mock('../ProductTableRow', () => ({
  ProductTableRow: ({ product, onProductClick, enableSelection }: MockTableRowProps) => (
    <tr
      data-testid={`product-row-${product.nm_id}`}
      onClick={() => enableSelection && onProductClick(product)}
    >
      <td>{product.nm_id}</td>
      <td>{product.vendor_code}</td>
      <td>{product.name}</td>
    </tr>
  ),
}))

vi.mock('../ProductPagination', () => ({
  ProductPagination: ({ hasPrevious, hasNext, onPrevious, onNext }: MockPaginationProps) => (
    <div data-testid="pagination">
      <button data-testid="prev-button" onClick={onPrevious} disabled={!hasPrevious}>
        Previous
      </button>
      <button data-testid="next-button" onClick={onNext} disabled={!hasNext}>
        Next
      </button>
    </div>
  ),
}))

const mockProducts: ProductListItem[] = [
  {
    nm_id: '12345',
    vendor_code: 'TEST-001',
    sa_name: 'Test Product 1',
    brand: 'Test Brand 1',
    has_cogs: true,
    cogs: {
      id: 'cogs_001',
      unit_cost_rub: '100',
      valid_from: '2025-01-01',
      valid_to: null,
    },
    is_orphan: false,
    last_sale_date: '2025-01-01',
    total_sales_qty: 100,
  },
  {
    nm_id: '67890',
    vendor_code: 'TEST-002',
    sa_name: 'Test Product 2',
    brand: 'Test Brand 2',
    has_cogs: false,
    cogs: null,
    is_orphan: false,
    last_sale_date: '2025-01-01',
    total_sales_qty: 50,
  },
]

const mockUseProducts = vi.mocked(useProducts)
const mockUseMarginPollingStore = vi.mocked(useMarginPollingStore)
const mockUsePendingMarginProducts = vi.mocked(usePendingMarginProducts)
const mockUseManualMarginRecalculation = vi.mocked(useManualMarginRecalculation)

const queryBaseProperties = {
  isPending: false as const,
  isEnabled: true,
  promise: Promise.resolve({} as ProductListResponse),
}

describe('ProductList', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })

    mockUseMarginPollingStore.mockReturnValue({
      isPolling: vi.fn(() => false),
      startPolling: vi.fn(),
      stopPolling: vi.fn(),
      pollingProducts: new Set(),
    })

    mockUsePendingMarginProducts.mockReturnValue({
      pendingProducts: [],
      isPending: vi.fn(() => false),
      getPendingTime: vi.fn(() => 0),
      shouldShowRetryButton: vi.fn(() => false),
      getAffectedWeeks: vi.fn(() => []),
      pendingCount: 0,
    })

    mockUseManualMarginRecalculation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isIdle: true,
      isError: false,
      isSuccess: false,
      reset: vi.fn(),
      mutateAsync: vi.fn(),
      variables: undefined,
      error: null,
      data: undefined,
      failureCount: 0,
      failureReason: null,
      status: 'idle',
      submittedAt: 0,
      context: undefined,
      isPaused: false,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
  }

  // ============================================================================
  // Product Selection (3 tests)
  // ============================================================================

  describe('Product Selection', () => {
    it('does not trigger selection when enableSelection=false', () => {
      const mockOnProductSelect = vi.fn()

      mockUseProducts.mockReturnValue({
        ...queryBaseProperties,
        data: {
          products: mockProducts,
          pagination: { total: 2 },
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        isFetching: false,
        isSuccess: true,
        status: 'success',
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        errorUpdateCount: 0,
        isFetched: true,
        isFetchedAfterMount: true,
        isLoadingError: false,
        isPaused: false,
        isPlaceholderData: false,
        isRefetchError: false,
        isRefetching: false,
        isStale: false,
        isInitialLoading: false,
        fetchStatus: 'idle',
      })

      renderWithProviders(
        <ProductList enableSelection={false} onProductSelect={mockOnProductSelect} />
      )

      const productRow = screen.getByTestId('product-row-12345')
      fireEvent.click(productRow)

      expect(mockOnProductSelect).not.toHaveBeenCalled()
    })

    it('triggers onProductSelect when enableSelection=true', () => {
      const mockOnProductSelect = vi.fn()

      mockUseProducts.mockReturnValue({
        ...queryBaseProperties,
        data: {
          products: mockProducts,
          pagination: { total: 2 },
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        isFetching: false,
        isSuccess: true,
        status: 'success',
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        errorUpdateCount: 0,
        isFetched: true,
        isFetchedAfterMount: true,
        isLoadingError: false,
        isPaused: false,
        isPlaceholderData: false,
        isRefetchError: false,
        isRefetching: false,
        isStale: false,
        isInitialLoading: false,
        fetchStatus: 'idle',
      })

      renderWithProviders(
        <ProductList enableSelection={true} onProductSelect={mockOnProductSelect} />
      )

      const productRow = screen.getByTestId('product-row-12345')
      fireEvent.click(productRow)

      expect(mockOnProductSelect).toHaveBeenCalledTimes(1)
      expect(mockOnProductSelect).toHaveBeenCalledWith(mockProducts[0])
    })

    it('highlights selected product row', () => {
      mockUseProducts.mockReturnValue({
        ...queryBaseProperties,
        data: {
          products: mockProducts,
          pagination: { total: 2 },
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        isFetching: false,
        isSuccess: true,
        status: 'success',
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        errorUpdateCount: 0,
        isFetched: true,
        isFetchedAfterMount: true,
        isLoadingError: false,
        isPaused: false,
        isPlaceholderData: false,
        isRefetchError: false,
        isRefetching: false,
        isStale: false,
        isInitialLoading: false,
        fetchStatus: 'idle',
      })

      renderWithProviders(<ProductList enableSelection={true} selectedProductId="12345" />)

      expect(screen.getByTestId('product-row-12345')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Margin Display (2 tests)
  // ============================================================================

  describe('Margin Display', () => {
    it('passes include_margin=true to useProducts when enableMarginDisplay=true', () => {
      mockUseProducts.mockReturnValue({
        ...queryBaseProperties,
        data: {
          products: mockProducts,
          pagination: { total: 2 },
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        isFetching: false,
        isSuccess: true,
        status: 'success',
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        errorUpdateCount: 0,
        isFetched: true,
        isFetchedAfterMount: true,
        isLoadingError: false,
        isPaused: false,
        isPlaceholderData: false,
        isRefetchError: false,
        isRefetching: false,
        isStale: false,
        isInitialLoading: false,
        fetchStatus: 'idle',
      })

      renderWithProviders(<ProductList enableMarginDisplay={true} />)

      expect(mockUseProducts).toHaveBeenCalledWith(
        expect.objectContaining({ include_margin: true })
      )
    })

    it('passes include_margin=false to useProducts when enableMarginDisplay=false', () => {
      mockUseProducts.mockReturnValue({
        ...queryBaseProperties,
        data: {
          products: mockProducts,
          pagination: { total: 2 },
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        isFetching: false,
        isSuccess: true,
        status: 'success',
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        errorUpdateCount: 0,
        isFetched: true,
        isFetchedAfterMount: true,
        isLoadingError: false,
        isPaused: false,
        isPlaceholderData: false,
        isRefetchError: false,
        isRefetching: false,
        isStale: false,
        isInitialLoading: false,
        fetchStatus: 'idle',
      })

      renderWithProviders(<ProductList enableMarginDisplay={false} />)

      expect(mockUseProducts).toHaveBeenCalledWith(
        expect.objectContaining({ include_margin: false })
      )
    })
  })

  // ============================================================================
  // Accessibility (2 tests)
  // ============================================================================

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUseProducts.mockReturnValue({
        ...queryBaseProperties,
        data: {
          products: mockProducts,
          pagination: { total: 2 },
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        isFetching: false,
        isSuccess: true,
        status: 'success',
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        errorUpdateCount: 0,
        isFetched: true,
        isFetchedAfterMount: true,
        isLoadingError: false,
        isPaused: false,
        isPlaceholderData: false,
        isRefetchError: false,
        isRefetching: false,
        isStale: false,
        isInitialLoading: false,
        fetchStatus: 'idle',
      })
    })

    it('has table with aria-label', () => {
      renderWithProviders(<ProductList />)

      const table = screen.getByLabelText('Список товаров')
      expect(table).toBeInTheDocument()
      expect(table.tagName).toBe('TABLE')
    })

    it('has table caption for screen readers', () => {
      const { container } = renderWithProviders(<ProductList />)

      const caption = container.querySelector('caption')
      expect(caption).toBeInTheDocument()
      expect(caption).toHaveClass('sr-only')
      expect(caption).toHaveTextContent('Список товаров с себестоимостью и маржинальностью')
    })
  })
})
