/**
 * Unit tests for ProductSearchSelect component
 * Story 44.26a-FE: Product Search & Delivery Date Selection
 * Epic 44: Price Calculator UI (Frontend)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProductSearchSelect } from '../ProductSearchSelect'
import {
  mockProductWithFullData,
  mockProductWithFullData2,
  mockProductWithoutPhoto,
  mockProductWithLongName,
} from '@/test/fixtures/products-dimensions'

// Mock the hook
const mockUseProductsWithDimensions = vi.fn()
vi.mock('@/hooks/useProductsWithDimensions', () => ({
  useProductsWithDimensions: () => mockUseProductsWithDimensions(),
}))

// Test wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('ProductSearchSelect', () => {
  const defaultProps = {
    value: null as string | null,
    onChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseProductsWithDimensions.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
  })

  // ==========================================================================
  // Rendering Tests
  // ==========================================================================

  describe('rendering', () => {
    it('renders label with optional hint', () => {
      render(<ProductSearchSelect {...defaultProps} />, { wrapper: createWrapper() })

      expect(screen.getByText('Товар (опционально)')).toBeInTheDocument()
    })

    it('renders search button with placeholder text', () => {
      render(<ProductSearchSelect {...defaultProps} />, { wrapper: createWrapper() })

      expect(
        screen.getByRole('combobox', { name: /поиск товара/i })
      ).toBeInTheDocument()
      expect(
        screen.getByText(/поиск по sku, артикулу или названию/i)
      ).toBeInTheDocument()
    })

    it('renders helper text when no product selected', () => {
      render(<ProductSearchSelect {...defaultProps} />, { wrapper: createWrapper() })

      expect(screen.getByText(/или введите данные вручную ниже/i)).toBeInTheDocument()
    })

    it('does not render helper text when product is selected', () => {
      render(
        <ProductSearchSelect
          {...defaultProps}
          value="147205694"
          selectedProductName="Платье летнее"
        />,
        { wrapper: createWrapper() }
      )

      expect(
        screen.queryByText(/или введите данные вручную ниже/i)
      ).not.toBeInTheDocument()
    })

    it('renders tooltip button for help content', () => {
      render(<ProductSearchSelect {...defaultProps} />, { wrapper: createWrapper() })

      // FieldTooltip button should be present (tooltip content appears on hover)
      const tooltipButtons = document.querySelectorAll('[data-state="closed"]')
      expect(tooltipButtons.length).toBeGreaterThan(0)
    })
  })

  // ==========================================================================
  // Selected Product Card Tests
  // ==========================================================================

  describe('selected product display', () => {
    it('shows selected product card when product is selected', () => {
      render(
        <ProductSearchSelect
          {...defaultProps}
          value="147205694"
          selectedProductName="Платье летнее"
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText(/платье летнее/i)).toBeInTheDocument()
      expect(screen.getByText(/nmId: 147205694/i)).toBeInTheDocument()
    })

    it('shows clear button when product is selected', () => {
      render(
        <ProductSearchSelect
          {...defaultProps}
          value="147205694"
          selectedProductName="Платье летнее"
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByRole('button', { name: /очистить/i })).toBeInTheDocument()
    })

    it('does not show clear button when disabled', () => {
      render(
        <ProductSearchSelect
          {...defaultProps}
          value="147205694"
          selectedProductName="Платье летнее"
          disabled
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.queryByRole('button', { name: /очистить/i })).not.toBeInTheDocument()
    })

    it('calls onChange with null when clear is clicked', async () => {
      const onChange = vi.fn()
      render(
        <ProductSearchSelect
          {...defaultProps}
          value="147205694"
          selectedProductName="Платье летнее"
          onChange={onChange}
        />,
        { wrapper: createWrapper() }
      )

      const clearButton = screen.getByRole('button', { name: /очистить/i })
      await userEvent.click(clearButton)

      expect(onChange).toHaveBeenCalledWith(null, null)
    })
  })

  // ==========================================================================
  // Search Functionality Tests
  // ==========================================================================

  describe('search functionality', () => {
    it('opens popover when search button is clicked', async () => {
      render(<ProductSearchSelect {...defaultProps} />, { wrapper: createWrapper() })

      const searchButton = screen.getByRole('combobox', { name: /поиск товара/i })
      await userEvent.click(searchButton)

      expect(searchButton).toHaveAttribute('aria-expanded', 'true')
    })

    it('shows loading skeleton while searching', async () => {
      mockUseProductsWithDimensions.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      })

      render(<ProductSearchSelect {...defaultProps} />, { wrapper: createWrapper() })

      const searchButton = screen.getByRole('combobox', { name: /поиск товара/i })
      await userEvent.click(searchButton)

      // Loading skeletons should be visible
      const skeletons = document.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('shows "Товары не найдены" when no results', async () => {
      mockUseProductsWithDimensions.mockReturnValue({
        data: { products: [] },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<ProductSearchSelect {...defaultProps} />, { wrapper: createWrapper() })

      const searchButton = screen.getByRole('combobox', { name: /поиск товара/i })
      await userEvent.click(searchButton)

      // Type to trigger search (min 2 chars)
      const input = screen.getByPlaceholderText(/поиск по sku/i)
      await userEvent.type(input, 'несуществующий')

      await waitFor(() => {
        expect(screen.getByText(/товары не найдены/i)).toBeInTheDocument()
      })
    })

    it('shows min chars message when search is less than 2 chars', async () => {
      render(<ProductSearchSelect {...defaultProps} />, { wrapper: createWrapper() })

      const searchButton = screen.getByRole('combobox', { name: /поиск товара/i })
      await userEvent.click(searchButton)

      // Don't type anything
      expect(
        screen.getByText(/введите минимум 2 символа для поиска/i)
      ).toBeInTheDocument()
    })

    it('shows product results when search returns data', async () => {
      mockUseProductsWithDimensions.mockReturnValue({
        data: { products: [mockProductWithFullData, mockProductWithFullData2] },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<ProductSearchSelect {...defaultProps} />, { wrapper: createWrapper() })

      const searchButton = screen.getByRole('combobox', { name: /поиск товара/i })
      await userEvent.click(searchButton)

      const input = screen.getByPlaceholderText(/поиск по sku/i)
      await userEvent.type(input, 'платье')

      await waitFor(() => {
        expect(screen.getByText(/147205694/)).toBeInTheDocument()
        expect(screen.getByText(/DRESS-001/)).toBeInTheDocument()
      })
    })
  })

  // ==========================================================================
  // Product Selection Tests
  // ==========================================================================

  describe('product selection', () => {
    it('calls onChange with product data when product is selected', async () => {
      const onChange = vi.fn()
      mockUseProductsWithDimensions.mockReturnValue({
        data: { products: [mockProductWithFullData] },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<ProductSearchSelect {...defaultProps} onChange={onChange} />, {
        wrapper: createWrapper(),
      })

      const searchButton = screen.getByRole('combobox', { name: /поиск товара/i })
      await userEvent.click(searchButton)

      const input = screen.getByPlaceholderText(/поиск по sku/i)
      await userEvent.type(input, 'пл')

      await waitFor(() => {
        expect(screen.getByText(/147205694/)).toBeInTheDocument()
      })

      const productItem = screen.getByText(/147205694/).closest('[role="option"]')
      if (productItem) {
        await userEvent.click(productItem)
      }

      expect(onChange).toHaveBeenCalledWith(
        mockProductWithFullData.nm_id,
        expect.objectContaining({
          nm_id: mockProductWithFullData.nm_id,
          sa_name: mockProductWithFullData.sa_name,
        })
      )
    })

    it('stores nm_id as STRING (not number)', async () => {
      const onChange = vi.fn()
      mockUseProductsWithDimensions.mockReturnValue({
        data: { products: [mockProductWithFullData] },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<ProductSearchSelect {...defaultProps} onChange={onChange} />, {
        wrapper: createWrapper(),
      })

      const searchButton = screen.getByRole('combobox', { name: /поиск товара/i })
      await userEvent.click(searchButton)

      const input = screen.getByPlaceholderText(/поиск по sku/i)
      await userEvent.type(input, 'пл')

      await waitFor(() => {
        expect(screen.getByText(/147205694/)).toBeInTheDocument()
      })

      const productItem = screen.getByText(/147205694/).closest('[role="option"]')
      if (productItem) {
        await userEvent.click(productItem)
      }

      // Verify nm_id is string, not number
      expect(typeof onChange.mock.calls[0][0]).toBe('string')
      expect(onChange.mock.calls[0][0]).toBe('147205694')
    })
  })

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe('error handling', () => {
    it('shows error message when API fails', async () => {
      mockUseProductsWithDimensions.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('API Error'),
        refetch: vi.fn(),
      })

      render(<ProductSearchSelect {...defaultProps} />, { wrapper: createWrapper() })

      const searchButton = screen.getByRole('combobox', { name: /поиск товара/i })
      await userEvent.click(searchButton)

      const input = screen.getByPlaceholderText(/поиск по sku/i)
      await userEvent.type(input, 'пл')

      await waitFor(() => {
        expect(screen.getByText(/ошибка поиска/i)).toBeInTheDocument()
      })
    })

    it('shows retry button on error', async () => {
      const refetch = vi.fn()
      mockUseProductsWithDimensions.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('API Error'),
        refetch,
      })

      render(<ProductSearchSelect {...defaultProps} />, { wrapper: createWrapper() })

      const searchButton = screen.getByRole('combobox', { name: /поиск товара/i })
      await userEvent.click(searchButton)

      const input = screen.getByPlaceholderText(/поиск по sku/i)
      await userEvent.type(input, 'пл')

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /повторить/i })).toBeInTheDocument()
      })
    })

    it('calls refetch when retry is clicked', async () => {
      const refetch = vi.fn()
      mockUseProductsWithDimensions.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('API Error'),
        refetch,
      })

      render(<ProductSearchSelect {...defaultProps} />, { wrapper: createWrapper() })

      const searchButton = screen.getByRole('combobox', { name: /поиск товара/i })
      await userEvent.click(searchButton)

      const input = screen.getByPlaceholderText(/поиск по sku/i)
      await userEvent.type(input, 'пл')

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /повторить/i })).toBeInTheDocument()
      })

      const retryButton = screen.getByRole('button', { name: /повторить/i })
      await userEvent.click(retryButton)

      expect(refetch).toHaveBeenCalled()
    })

    it('displays error message from props', () => {
      render(<ProductSearchSelect {...defaultProps} error="Ошибка валидации" />, {
        wrapper: createWrapper(),
      })

      expect(screen.getByText(/ошибка валидации/i)).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Accessibility Tests
  // ==========================================================================

  describe('accessibility', () => {
    it('has proper ARIA attributes on combobox', () => {
      render(<ProductSearchSelect {...defaultProps} />, { wrapper: createWrapper() })

      const combobox = screen.getByRole('combobox', { name: /поиск товара/i })
      expect(combobox).toHaveAttribute('aria-expanded', 'false')
      expect(combobox).toHaveAttribute('aria-label', 'Поиск товара')
    })

    it('updates aria-expanded when opened', async () => {
      render(<ProductSearchSelect {...defaultProps} />, { wrapper: createWrapper() })

      const combobox = screen.getByRole('combobox', { name: /поиск товара/i })
      await userEvent.click(combobox)

      expect(combobox).toHaveAttribute('aria-expanded', 'true')
    })

    it('shows skeleton when disabled with no value', () => {
      render(<ProductSearchSelect {...defaultProps} disabled />, {
        wrapper: createWrapper(),
      })

      // When disabled with no value, component shows skeleton
      const skeleton = document.querySelector('.animate-pulse')
      expect(skeleton).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Edge Cases Tests
  // ==========================================================================

  describe('edge cases', () => {
    it('handles product without photo', async () => {
      mockUseProductsWithDimensions.mockReturnValue({
        data: { products: [mockProductWithoutPhoto] },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<ProductSearchSelect {...defaultProps} />, { wrapper: createWrapper() })

      const searchButton = screen.getByRole('combobox', { name: /поиск товара/i })
      await userEvent.click(searchButton)

      const input = screen.getByPlaceholderText(/поиск по sku/i)
      await userEvent.type(input, 'товар')

      await waitFor(() => {
        expect(screen.getByText(/147205704/)).toBeInTheDocument()
      })

      // Should show placeholder icon instead of image
      const placeholderIcon = document.querySelector('svg')
      expect(placeholderIcon).toBeInTheDocument()
    })

    it('truncates long product names', async () => {
      mockUseProductsWithDimensions.mockReturnValue({
        data: { products: [mockProductWithLongName] },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<ProductSearchSelect {...defaultProps} />, { wrapper: createWrapper() })

      const searchButton = screen.getByRole('combobox', { name: /поиск товара/i })
      await userEvent.click(searchButton)

      const input = screen.getByPlaceholderText(/поиск по sku/i)
      await userEvent.type(input, 'дл')

      await waitFor(() => {
        expect(screen.getByText(/147205703/)).toBeInTheDocument()
      })

      // Product name element should have truncate class
      const nameElement = screen.getByText(/очень длинное название/i)
      expect(nameElement.className).toContain('truncate')
    })
  })
})
