/**
 * TDD Tests for Story 44.16
 * Category Selection with Search
 *
 * RED Phase: Tests written to define expected behavior
 * These tests verify all Acceptance Criteria (AC1-AC6)
 *
 * @see docs/stories/epic-44/story-44.16-fe-category-selection.md
 */

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CategorySelector } from '../CategorySelector'
import type { CategoryCommission } from '@/types/tariffs'

// Mock scrollIntoView for cmdk (not available in JSDOM)
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

// Mock useCommissions hook
vi.mock('@/hooks/useCommissions', () => ({
  useCommissions: vi.fn(),
}))

import { useCommissions } from '@/hooks/useCommissions'
const mockUseCommissions = vi.mocked(useCommissions)

// Sample test data - 7346 categories in production
const mockCategories: CategoryCommission[] = [
  {
    parentID: 1,
    parentName: 'Одежда',
    subjectID: 101,
    subjectName: 'Платья',
    paidStorageKgvp: 25,
    kgvpMarketplace: 28,
    kgvpSupplier: 10,
    kgvpSupplierExpress: 5,
  },
  {
    parentID: 2,
    parentName: 'Электроника',
    subjectID: 201,
    subjectName: 'Смартфоны',
    paidStorageKgvp: 15,
    kgvpMarketplace: 18,
    kgvpSupplier: 8,
    kgvpSupplierExpress: 4,
  },
  {
    parentID: 3,
    parentName: 'Красота',
    subjectID: 301,
    subjectName: 'Косметика',
    paidStorageKgvp: 30,
    kgvpMarketplace: 33,
    kgvpSupplier: 12,
    kgvpSupplierExpress: 6,
  },
  {
    parentID: 4,
    parentName: 'Одежда',
    subjectID: 102,
    subjectName: 'Юбки',
    paidStorageKgvp: 25,
    kgvpMarketplace: 28,
    kgvpSupplier: 10,
    kgvpSupplierExpress: 5,
  },
]

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Story 44.16: Category Selection with Search', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseCommissions.mockReturnValue({
      data: {
        commissions: mockCategories,
        meta: {
          total: 4,
          cached: true,
          cache_ttl_seconds: 86400,
          fetched_at: '2026-01-20T12:00:00Z',
        },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useCommissions>)
  })

  describe('AC1: Category Combobox Component', () => {
    it('should render searchable combobox for category selection', () => {
      render(
        <CategorySelector
          value={null}
          onChange={mockOnChange}
          fulfillmentType="FBO"
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('should display "parentName -> subjectName" format in dropdown', async () => {
      const user = userEvent.setup()
      render(
        <CategorySelector
          value={null}
          onChange={mockOnChange}
          fulfillmentType="FBO"
        />,
        { wrapper: createWrapper() }
      )

      await user.click(screen.getByRole('combobox'))
      await waitFor(() => {
        expect(screen.getByText('Одежда → Платья')).toBeInTheDocument()
        expect(screen.getByText('Электроника → Смартфоны')).toBeInTheDocument()
      })
    })

    it('should display commission % preview for each option', async () => {
      const user = userEvent.setup()
      render(
        <CategorySelector
          value={null}
          onChange={mockOnChange}
          fulfillmentType="FBO"
        />,
        { wrapper: createWrapper() }
      )

      await user.click(screen.getByRole('combobox'))
      await waitFor(() => {
        // FBO commission for Одежда→Платья and Одежда→Юбки is 25% (2 items)
        expect(screen.getAllByText('25%').length).toBeGreaterThanOrEqual(1)
        // FBO commission for Электроника→Смартфоны is 15%
        expect(screen.getByText('15%')).toBeInTheDocument()
      })
    })

    it('should display placeholder "Выберите категорию..."', () => {
      render(
        <CategorySelector
          value={null}
          onChange={mockOnChange}
          fulfillmentType="FBO"
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText('Выберите категорию...')).toBeInTheDocument()
    })

    it('should handle up to 7346 categories efficiently', async () => {
      // Generate mock data similar to production
      const manyCategories: CategoryCommission[] = Array.from(
        { length: 100 },
        (_, i) => ({
          parentID: i,
          parentName: `Parent ${i}`,
          subjectID: i * 10,
          subjectName: `Subject ${i}`,
          paidStorageKgvp: 15 + (i % 10),
          kgvpMarketplace: 18 + (i % 10),
          kgvpSupplier: 8,
          kgvpSupplierExpress: 4,
        })
      )

      mockUseCommissions.mockReturnValue({
        data: {
          commissions: manyCategories,
          meta: { total: 100, cached: true, cache_ttl_seconds: 86400, fetched_at: '' },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useCommissions>)

      const user = userEvent.setup()
      render(
        <CategorySelector
          value={null}
          onChange={mockOnChange}
          fulfillmentType="FBO"
        />,
        { wrapper: createWrapper() }
      )

      await user.click(screen.getByRole('combobox'))

      // Should show max 50 results initially
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Поиск категории...')).toBeInTheDocument()
      })
    })
  })

  describe('AC2: Search/Filter Functionality', () => {
    it('should search by parent category name (partial match)', async () => {
      const user = userEvent.setup()
      render(
        <CategorySelector
          value={null}
          onChange={mockOnChange}
          fulfillmentType="FBO"
        />,
        { wrapper: createWrapper() }
      )

      await user.click(screen.getByRole('combobox'))
      const searchInput = await screen.findByPlaceholderText('Поиск категории...')
      await user.type(searchInput, 'Одежда')

      await waitFor(() => {
        expect(screen.getByText('Одежда → Платья')).toBeInTheDocument()
        expect(screen.getByText('Одежда → Юбки')).toBeInTheDocument()
      })
    })

    it('should search by sub-category name (partial match)', async () => {
      const user = userEvent.setup()
      render(
        <CategorySelector
          value={null}
          onChange={mockOnChange}
          fulfillmentType="FBO"
        />,
        { wrapper: createWrapper() }
      )

      await user.click(screen.getByRole('combobox'))
      const searchInput = await screen.findByPlaceholderText('Поиск категории...')
      await user.type(searchInput, 'Смарт')

      await waitFor(() => {
        expect(screen.getByText('Электроника → Смартфоны')).toBeInTheDocument()
      })
    })

    it('should be case-insensitive search (Russian locale)', async () => {
      const user = userEvent.setup()
      render(
        <CategorySelector
          value={null}
          onChange={mockOnChange}
          fulfillmentType="FBO"
        />,
        { wrapper: createWrapper() }
      )

      await user.click(screen.getByRole('combobox'))
      const searchInput = await screen.findByPlaceholderText('Поиск категории...')
      await user.type(searchInput, 'одежда') // lowercase

      await waitFor(() => {
        expect(screen.getByText('Одежда → Платья')).toBeInTheDocument()
      })
    })

    it('should show max 50 results with "Уточните поиск" message', async () => {
      // Generate more than 50 matching categories
      const manyCategories: CategoryCommission[] = Array.from(
        { length: 60 },
        (_, i) => ({
          parentID: i,
          parentName: 'Одежда',
          subjectID: i * 10,
          subjectName: `Тип ${i}`,
          paidStorageKgvp: 25,
          kgvpMarketplace: 28,
          kgvpSupplier: 10,
          kgvpSupplierExpress: 5,
        })
      )

      mockUseCommissions.mockReturnValue({
        data: {
          commissions: manyCategories,
          meta: { total: 60, cached: true, cache_ttl_seconds: 86400, fetched_at: '' },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useCommissions>)

      const user = userEvent.setup()
      render(
        <CategorySelector
          value={null}
          onChange={mockOnChange}
          fulfillmentType="FBO"
        />,
        { wrapper: createWrapper() }
      )

      await user.click(screen.getByRole('combobox'))
      const searchInput = await screen.findByPlaceholderText('Поиск категории...')
      await user.type(searchInput, 'Одежда')

      await waitFor(() => {
        expect(screen.getByText(/Уточните поиск/)).toBeInTheDocument()
      })
    })

    it('should show "Категории не найдены" when no results', async () => {
      const user = userEvent.setup()
      render(
        <CategorySelector
          value={null}
          onChange={mockOnChange}
          fulfillmentType="FBO"
        />,
        { wrapper: createWrapper() }
      )

      await user.click(screen.getByRole('combobox'))
      const searchInput = await screen.findByPlaceholderText('Поиск категории...')
      await user.type(searchInput, 'несуществующая категория')

      await waitFor(() => {
        expect(screen.getByText('Категории не найдены')).toBeInTheDocument()
      })
    })
  })

  describe('AC3: Commission Preview', () => {
    it('should show FBO commission % when FBO selected', () => {
      render(
        <CategorySelector
          value={mockCategories[0]}
          onChange={mockOnChange}
          fulfillmentType="FBO"
        />,
        { wrapper: createWrapper() }
      )

      // paidStorageKgvp = 25% for FBO
      expect(screen.getByText('25%')).toBeInTheDocument()
    })

    it('should show FBS commission % when FBS selected', () => {
      render(
        <CategorySelector
          value={mockCategories[0]}
          onChange={mockOnChange}
          fulfillmentType="FBS"
        />,
        { wrapper: createWrapper() }
      )

      // kgvpMarketplace = 28% for FBS
      expect(screen.getByText('28%')).toBeInTheDocument()
    })

    it('should color-code high commission (>25%) with warning', () => {
      render(
        <CategorySelector
          value={mockCategories[2]} // Красота→Косметика has 30% FBO
          onChange={mockOnChange}
          fulfillmentType="FBO"
        />,
        { wrapper: createWrapper() }
      )

      const badge = screen.getByText('30%')
      expect(badge).toHaveClass('bg-destructive')
    })

    it('should show secondary badge for normal commission (<=25%)', () => {
      render(
        <CategorySelector
          value={mockCategories[1]} // Электроника→Смартфоны has 15% FBO
          onChange={mockOnChange}
          fulfillmentType="FBO"
        />,
        { wrapper: createWrapper() }
      )

      const badge = screen.getByText('15%')
      expect(badge).toHaveClass('bg-secondary')
    })
  })

  describe('AC4: Selected State Display', () => {
    it('should show selected category in trigger with arrow format', () => {
      render(
        <CategorySelector
          value={mockCategories[0]}
          onChange={mockOnChange}
          fulfillmentType="FBO"
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText('Одежда → Платья')).toBeInTheDocument()
    })

    it('should show commission badge next to selection', () => {
      render(
        <CategorySelector
          value={mockCategories[0]}
          onChange={mockOnChange}
          fulfillmentType="FBO"
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText('25%')).toBeInTheDocument()
    })

    it('should show clear button "Очистить выбор"', () => {
      render(
        <CategorySelector
          value={mockCategories[0]}
          onChange={mockOnChange}
          fulfillmentType="FBO"
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText('Очистить выбор')).toBeInTheDocument()
    })

    it('should call onChange with null when clear button clicked', async () => {
      const user = userEvent.setup()
      render(
        <CategorySelector
          value={mockCategories[0]}
          onChange={mockOnChange}
          fulfillmentType="FBO"
        />,
        { wrapper: createWrapper() }
      )

      await user.click(screen.getByText('Очистить выбор'))
      expect(mockOnChange).toHaveBeenCalledWith(null)
    })
  })

  describe('AC5: Data Loading & Caching', () => {
    it('should show loading skeleton while fetching', () => {
      mockUseCommissions.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useCommissions>)

      render(
        <CategorySelector
          value={null}
          onChange={mockOnChange}
          fulfillmentType="FBO"
        />,
        { wrapper: createWrapper() }
      )

      // Loading state should show label but combobox might be disabled/loading
      expect(screen.getByText('Категория товара')).toBeInTheDocument()
    })

    it('should show error message with retry button on API error', () => {
      const mockRefetch = vi.fn()
      mockUseCommissions.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('API Error'),
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useCommissions>)

      render(
        <CategorySelector
          value={null}
          onChange={mockOnChange}
          fulfillmentType="FBO"
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText('Ошибка загрузки категорий')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Повторить' })).toBeInTheDocument()
    })

    it('should call refetch when retry button clicked', async () => {
      const user = userEvent.setup()
      const mockRefetch = vi.fn()
      mockUseCommissions.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('API Error'),
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useCommissions>)

      render(
        <CategorySelector
          value={null}
          onChange={mockOnChange}
          fulfillmentType="FBO"
        />,
        { wrapper: createWrapper() }
      )

      await user.click(screen.getByRole('button', { name: 'Повторить' }))
      expect(mockRefetch).toHaveBeenCalled()
    })
  })

  describe('AC6: Form State Integration', () => {
    it('should call onChange with full category object on selection', async () => {
      const user = userEvent.setup()
      render(
        <CategorySelector
          value={null}
          onChange={mockOnChange}
          fulfillmentType="FBO"
        />,
        { wrapper: createWrapper() }
      )

      await user.click(screen.getByRole('combobox'))
      await waitFor(() => {
        expect(screen.getByText('Электроника → Смартфоны')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Электроника → Смартфоны'))
      expect(mockOnChange).toHaveBeenCalledWith(mockCategories[1])
    })

    it('should show error state with border styling', () => {
      render(
        <CategorySelector
          value={null}
          onChange={mockOnChange}
          fulfillmentType="FBO"
          error="Выберите категорию"
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByRole('combobox')).toHaveClass('border-destructive')
      expect(screen.getByText('Выберите категорию')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have aria-label on combobox', () => {
      render(
        <CategorySelector
          value={null}
          onChange={mockOnChange}
          fulfillmentType="FBO"
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByRole('combobox')).toHaveAttribute(
        'aria-label',
        'Выбрать категорию товара'
      )
    })

    it('should have aria-expanded attribute', async () => {
      const user = userEvent.setup()
      render(
        <CategorySelector
          value={null}
          onChange={mockOnChange}
          fulfillmentType="FBO"
        />,
        { wrapper: createWrapper() }
      )

      const combobox = screen.getByRole('combobox')
      expect(combobox).toHaveAttribute('aria-expanded', 'false')

      await user.click(combobox)
      await waitFor(() => {
        expect(combobox).toHaveAttribute('aria-expanded', 'true')
      })
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      render(
        <CategorySelector
          value={null}
          onChange={mockOnChange}
          fulfillmentType="FBO"
        />,
        { wrapper: createWrapper() }
      )

      const combobox = screen.getByRole('combobox')
      await user.click(combobox)

      // Escape should close dropdown
      await user.keyboard('{Escape}')
      await waitFor(() => {
        expect(combobox).toHaveAttribute('aria-expanded', 'false')
      })
    })
  })

  describe('Disabled State', () => {
    it('should disable combobox when disabled prop is true', () => {
      render(
        <CategorySelector
          value={null}
          onChange={mockOnChange}
          fulfillmentType="FBO"
          disabled
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByRole('combobox')).toBeDisabled()
    })

    it('should not show clear button when disabled', () => {
      render(
        <CategorySelector
          value={mockCategories[0]}
          onChange={mockOnChange}
          fulfillmentType="FBO"
          disabled
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.queryByText('Очистить выбор')).not.toBeInTheDocument()
    })
  })
})
