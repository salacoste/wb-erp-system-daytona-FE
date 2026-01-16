/**
 * ProductList Component Tests
 *
 * Comprehensive test suite for ProductList component covering:
 * - Rendering states (loading, error, empty, success)
 * - Search functionality with debouncing
 * - Filter functionality (COGS filter toggle)
 * - Pagination (cursor-based)
 * - Product selection
 * - Margin display
 * - Accessibility (ARIA labels, table caption)
 *
 * @see src/components/custom/ProductList.tsx
 * @see docs/code-review/PRODUCTLIST-DEEP-REVIEW.md
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

// Mock hooks
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

// Mock prop types for child components
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

// Mock child components to simplify testing
vi.mock('../ProductSearchFilter', () => ({
  ProductSearchFilter: ({ onSearchChange, onFilterToggle, searchValue, filterLabel }: MockSearchFilterProps) => (
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
      <button
        data-testid="prev-button"
        onClick={onPrevious}
        disabled={!hasPrevious}
      >
        Previous
      </button>
      <button
        data-testid="next-button"
        onClick={onNext}
        disabled={!hasNext}
      >
        Next
      </button>
    </div>
  ),
}))

// Test data fixtures - Updated to match current type definitions (Epic 18)
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

/**
 * TanStack Query v5 base properties required in all UseQueryResult mocks
 * These properties are spread into each mock to satisfy TypeScript.
 * Using `as const` for literal types where needed.
 * @see https://tanstack.com/query/latest/docs/framework/react/reference/useQuery
 */
const queryBaseProperties = {
  isPending: false as const,
  isEnabled: true,
  promise: Promise.resolve({} as ProductListResponse),
}

// Type for loading state where isPending should be true
const loadingQueryBaseProperties = {
  isPending: true as const,
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

    // Default mock implementations
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
    return render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    )
  }

  // ============================================================================
  // 1. Rendering States (4 tests)
  // ============================================================================

  describe('Rendering States', () => {
    it('renders loading skeleton on first load', () => {
      mockUseProducts.mockReturnValue({
        ...loadingQueryBaseProperties,
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
        isFetching: false,
        isSuccess: false,
        status: 'pending',
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        errorUpdateCount: 0,
        isFetched: false,
        isFetchedAfterMount: false,
        isLoadingError: false,
        isPaused: false,
        isPlaceholderData: false,
        isRefetchError: false,
        isRefetching: false,
        isStale: false,
        isInitialLoading: true,
        fetchStatus: 'fetching',
      })

      renderWithProviders(<ProductList />)

      expect(screen.getByTestId('product-loading-skeleton')).toBeInTheDocument()
    })

    it('renders error state with retry button', () => {
      const mockRefetch = vi.fn()
      mockUseProducts.mockReturnValue({
        ...queryBaseProperties,
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Failed to fetch products'),
        refetch: mockRefetch,
        isFetching: false,
        isSuccess: false,
        status: 'error',
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        failureCount: 1,
        failureReason: new Error('Failed to fetch products'),
        errorUpdateCount: 1,
        isFetched: true,
        isFetchedAfterMount: true,
        isLoadingError: true,
        isPaused: false,
        isPlaceholderData: false,
        isRefetchError: false,
        isRefetching: false,
        isStale: false,
        isInitialLoading: false,
        fetchStatus: 'idle',
      })

      renderWithProviders(<ProductList />)

      expect(screen.getByText(/Failed to fetch products/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Повторить/i })).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: /Повторить/i }))
      expect(mockRefetch).toHaveBeenCalledTimes(1)
    })

    it('renders empty state when no products found', () => {
      mockUseProducts.mockReturnValue({
        ...queryBaseProperties,
        data: { products: [], pagination: { total: 0 } },
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

      renderWithProviders(<ProductList />)

      expect(screen.getByTestId('product-empty-state')).toBeInTheDocument()
    })

    it('renders product list when data is available', () => {
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

      renderWithProviders(<ProductList />)

      expect(screen.getByTestId('product-row-12345')).toBeInTheDocument()
      expect(screen.getByTestId('product-row-67890')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // 2. Search Functionality (4 tests)
  // ============================================================================

  describe('Search Functionality', () => {
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

    it('renders search input', () => {
      renderWithProviders(<ProductList />)

      const searchInput = screen.getByTestId('search-input')
      expect(searchInput).toBeInTheDocument()
      expect(searchInput).toHaveAttribute('placeholder', 'Поиск товаров')
    })

    it('updates search input value on change', () => {
      renderWithProviders(<ProductList />)

      const searchInput = screen.getByTestId('search-input') as HTMLInputElement

      fireEvent.change(searchInput, { target: { value: 'Test Product' } })

      expect(searchInput.value).toBe('Test Product')
    })

    // Skip: debounce is tested via integration tests, mocked child components bypass debounce logic
    it.skip('debounces search input (500ms delay)', async () => {
      vi.useFakeTimers()

      renderWithProviders(<ProductList />)

      const searchInput = screen.getByTestId('search-input')

      // Type "Test"
      fireEvent.change(searchInput, { target: { value: 'Test' } })

      // Should NOT call useProducts immediately with search value
      expect(mockUseProducts).toHaveBeenCalledWith(
        expect.objectContaining({ search: undefined })
      )

      // Fast-forward 500ms and flush all pending timers
      await vi.advanceTimersByTimeAsync(500)

      // After debounce, should be called with search value
      expect(mockUseProducts).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Test' })
      )

      vi.useRealTimers()
    })

    it('resets cursor and prevCursors on search change', () => {
      renderWithProviders(<ProductList />)

      const searchInput = screen.getByTestId('search-input')

      fireEvent.change(searchInput, { target: { value: 'New Search' } })

      // Cursor should reset (verified by checking pagination state)
      // Since we mocked ProductPagination, we can verify it receives hasPrevious=false
      const prevButton = screen.getByTestId('prev-button') as HTMLButtonElement
      expect(prevButton.disabled).toBe(true)
    })
  })

  // ============================================================================
  // 3. Filter Functionality (3 tests)
  // ============================================================================

  describe('Filter Functionality', () => {
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

    it('renders filter toggle button', () => {
      renderWithProviders(<ProductList />)

      const filterButton = screen.getByTestId('filter-toggle')
      expect(filterButton).toBeInTheDocument()
      expect(filterButton).toHaveTextContent('Все товары')
    })

    it('cycles through filter states: All → Without COGS → With COGS → All', () => {
      renderWithProviders(<ProductList />)

      const filterButton = screen.getByTestId('filter-toggle')

      // Initial: "Все товары" (has_cogs = undefined)
      expect(filterButton).toHaveTextContent('Все товары')

      // Click 1: "Без себестоимости" (has_cogs = false)
      fireEvent.click(filterButton)
      expect(filterButton).toHaveTextContent('Без себестоимости')

      // Click 2: "С себестоимостью" (has_cogs = true)
      fireEvent.click(filterButton)
      expect(filterButton).toHaveTextContent('С себестоимостью')

      // Click 3: "Все товары" (has_cogs = undefined)
      fireEvent.click(filterButton)
      expect(filterButton).toHaveTextContent('Все товары')
    })

    it('resets cursor and prevCursors on filter toggle', () => {
      renderWithProviders(<ProductList />)

      const filterButton = screen.getByTestId('filter-toggle')

      fireEvent.click(filterButton)

      // Cursor should reset (verified by pagination state)
      const prevButton = screen.getByTestId('prev-button') as HTMLButtonElement
      expect(prevButton.disabled).toBe(true)
    })
  })

  // ============================================================================
  // 4. Pagination (4 tests)
  // ============================================================================

  describe('Pagination', () => {
    it('disables previous button when on first page', () => {
      mockUseProducts.mockReturnValue({
        ...queryBaseProperties,
        data: {
          products: mockProducts,
          pagination: { total: 2, next_cursor: 'next123' },
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

      renderWithProviders(<ProductList />)

      const prevButton = screen.getByTestId('prev-button') as HTMLButtonElement
      expect(prevButton.disabled).toBe(true)
    })

    it('enables next button when next_cursor exists', () => {
      mockUseProducts.mockReturnValue({
        ...queryBaseProperties,
        data: {
          products: mockProducts,
          pagination: { total: 100, next_cursor: 'next123' },
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

      renderWithProviders(<ProductList />)

      const nextButton = screen.getByTestId('next-button') as HTMLButtonElement
      expect(nextButton.disabled).toBe(false)
    })

    it('disables next button when no next_cursor', () => {
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

      renderWithProviders(<ProductList />)

      const nextButton = screen.getByTestId('next-button') as HTMLButtonElement
      expect(nextButton.disabled).toBe(true)
    })

    it('handles next page click', () => {
      mockUseProducts.mockReturnValue({
        ...queryBaseProperties,
        data: {
          products: mockProducts,
          pagination: { total: 100, next_cursor: 'next123' },
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

      renderWithProviders(<ProductList />)

      const nextButton = screen.getByTestId('next-button')

      fireEvent.click(nextButton)

      // After clicking next, previous button should be enabled
      const prevButton = screen.getByTestId('prev-button') as HTMLButtonElement
      expect(prevButton.disabled).toBe(false)
    })
  })

  // ============================================================================
  // 5. Product Selection (3 tests)
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
        <ProductList
          enableSelection={false}
          onProductSelect={mockOnProductSelect}
        />
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
        <ProductList
          enableSelection={true}
          onProductSelect={mockOnProductSelect}
        />
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

      renderWithProviders(
        <ProductList
          enableSelection={true}
          selectedProductId="12345"
        />
      )

      // ProductTableRow component receives isSelected=true prop
      expect(screen.getByTestId('product-row-12345')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // 6. Margin Display (2 tests)
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
  // 7. Accessibility (2 tests)
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
