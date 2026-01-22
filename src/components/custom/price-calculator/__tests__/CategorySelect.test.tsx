/**
 * TDD Tests for CategorySelect Component
 * Story 44.16-FE: Category Selection with Search
 * Epic 44: Price Calculator UI (Frontend)
 *
 * TDD RED Phase: These tests define expected behavior
 * Run: npm test -- CategorySelect.test.tsx
 */

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Component under test (to be created or use existing CategorySelector)
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

/**
 * Mock data: Simulates 7346 WB categories
 * Structure matches GET /v1/tariffs/commissions response
 */
const mockCategories: CategoryCommission[] = [
  {
    parentID: 100,
    parentName: 'Красота',
    subjectID: 1001,
    subjectName: 'Скрабы',
    paidStorageKgvp: 32.5,
    kgvpMarketplace: 35.5,
    kgvpSupplier: 12,
    kgvpSupplierExpress: 6,
  },
  {
    parentID: 100,
    parentName: 'Красота',
    subjectID: 1002,
    subjectName: 'Шампуни',
    paidStorageKgvp: 28.0,
    kgvpMarketplace: 31.0,
    kgvpSupplier: 10,
    kgvpSupplierExpress: 5,
  },
  {
    parentID: 200,
    parentName: 'Электроника',
    subjectID: 2001,
    subjectName: 'Смартфоны',
    paidStorageKgvp: 15.0,
    kgvpMarketplace: 18.0,
    kgvpSupplier: 8,
    kgvpSupplierExpress: 4,
  },
  {
    parentID: 300,
    parentName: 'Одежда',
    subjectID: 3001,
    subjectName: 'Платья',
    paidStorageKgvp: 25.0,
    kgvpMarketplace: 28.0,
    kgvpSupplier: 10,
    kgvpSupplierExpress: 5,
  },
  {
    parentID: 400,
    parentName: 'Спорт',
    subjectID: 4001,
    subjectName: 'Гантели',
    paidStorageKgvp: 20.0,
    kgvpMarketplace: 23.0,
    kgvpSupplier: 9,
    kgvpSupplierExpress: 4,
  },
]

const mockCommissionsResponse = {
  commissions: mockCategories,
  meta: {
    total: 5,
    cached: true,
    cache_ttl_seconds: 86400,
    fetched_at: '2026-01-21T12:00:00Z',
  },
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('CategorySelect - Story 44.16 TDD Tests', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseCommissions.mockReturnValue({
      data: mockCommissionsResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useCommissions>)
  })

  // =========================================================================
  // AC1: Category Combobox Component
  // =========================================================================
  describe('AC1: Category Combobox Component', () => {
    it('renders dropdown with placeholder text', () => {
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

    it('renders combobox with correct ARIA role', () => {
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

    it('displays category in "parentName → subjectName" format', () => {
      render(
        <CategorySelector
          value={mockCategories[0]}
          onChange={mockOnChange}
          fulfillmentType="FBO"
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText('Красота → Скрабы')).toBeInTheDocument()
    })

    it('displays commission percentage badge for selected category', () => {
      render(
        <CategorySelector
          value={mockCategories[0]}
          onChange={mockOnChange}
          fulfillmentType="FBO"
        />,
        { wrapper: createWrapper() }
      )

      // FBO commission for Скрабы is 32.5%
      expect(screen.getByText('32.5%')).toBeInTheDocument()
    })
  })

  // =========================================================================
  // AC2: Search/Filter Functionality
  // =========================================================================
  describe('AC2: Search/Filter Functionality', () => {
    it('filters categories by parent category name', async () => {
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
      await user.type(searchInput, 'Красота')

      await waitFor(
        () => {
          expect(screen.getByText('Красота → Скрабы')).toBeInTheDocument()
          expect(screen.getByText('Красота → Шампуни')).toBeInTheDocument()
        },
        { timeout: 500 }
      )
    })

    it('filters categories by sub-category name', async () => {
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
      await user.type(searchInput, 'Смартфоны')

      await waitFor(
        () => {
          expect(screen.getByText('Электроника → Смартфоны')).toBeInTheDocument()
        },
        { timeout: 500 }
      )
    })

    it('performs case-insensitive search (Russian locale)', async () => {
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
      await user.type(searchInput, 'красота') // lowercase

      await waitFor(
        () => {
          expect(screen.getByText('Красота → Скрабы')).toBeInTheDocument()
        },
        { timeout: 500 }
      )
    })

    it('shows empty message when no categories match search', async () => {
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
      await user.type(searchInput, 'несуществующая категория xyz')

      await waitFor(
        () => {
          expect(screen.getByText('Категории не найдены')).toBeInTheDocument()
        },
        { timeout: 500 }
      )
    })

    it('limits visible results to max 50 with truncation message', async () => {
      // Create 60 mock categories
      const manyCategories = Array.from({ length: 60 }, (_, i) => ({
        parentID: i + 1000,
        parentName: `Категория ${i}`,
        subjectID: i + 10000,
        subjectName: `Подкатегория ${i}`,
        paidStorageKgvp: 20,
        kgvpMarketplace: 23,
        kgvpSupplier: 10,
        kgvpSupplierExpress: 5,
      }))

      mockUseCommissions.mockReturnValue({
        data: { commissions: manyCategories, meta: { total: 60, cached: true, cache_ttl_seconds: 86400, fetched_at: '' } },
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

      await waitFor(() => {
        expect(
          screen.getByText(/Показаны первые 50 результатов/i)
        ).toBeInTheDocument()
      })
    })
  })

  // =========================================================================
  // AC3: Commission Preview
  // =========================================================================
  describe('AC3: Commission Preview', () => {
    it('shows FBO commission when FBO fulfillment type selected', () => {
      render(
        <CategorySelector
          value={mockCategories[0]}
          onChange={mockOnChange}
          fulfillmentType="FBO"
        />,
        { wrapper: createWrapper() }
      )

      // Скрабы FBO = 32.5%
      expect(screen.getByText('32.5%')).toBeInTheDocument()
    })

    it('shows FBS commission when FBS fulfillment type selected', () => {
      render(
        <CategorySelector
          value={mockCategories[0]}
          onChange={mockOnChange}
          fulfillmentType="FBS"
        />,
        { wrapper: createWrapper() }
      )

      // Скрабы FBS = 35.5%
      expect(screen.getByText('35.5%')).toBeInTheDocument()
    })

    it('shows destructive badge variant for high commission (>25%)', () => {
      render(
        <CategorySelector
          value={mockCategories[0]} // 32.5% commission
          onChange={mockOnChange}
          fulfillmentType="FBO"
        />,
        { wrapper: createWrapper() }
      )

      const badge = screen.getByText('32.5%')
      expect(badge).toHaveClass('bg-destructive')
    })

    it('shows secondary badge variant for normal commission (<=25%)', () => {
      render(
        <CategorySelector
          value={mockCategories[2]} // Смартфоны 15%
          onChange={mockOnChange}
          fulfillmentType="FBO"
        />,
        { wrapper: createWrapper() }
      )

      const badge = screen.getByText('15%')
      expect(badge).toHaveClass('bg-secondary')
    })
  })

  // =========================================================================
  // AC4: Selected State Display
  // =========================================================================
  describe('AC4: Selected State Display', () => {
    it('displays selected category in trigger button', () => {
      render(
        <CategorySelector
          value={mockCategories[3]} // Одежда → Платья
          onChange={mockOnChange}
          fulfillmentType="FBO"
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText('Одежда → Платья')).toBeInTheDocument()
    })

    it('shows clear button when category is selected', () => {
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

    it('calls onChange with null when clear button clicked', async () => {
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

    it('hides clear button when disabled', () => {
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

  // =========================================================================
  // AC5: Data Loading & Caching
  // =========================================================================
  describe('AC5: Data Loading & Caching', () => {
    it('shows loading skeleton while fetching categories', () => {
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

      // Should show label even during loading
      expect(screen.getByText('Категория товара')).toBeInTheDocument()
    })

    it('shows error state with retry button on API failure', () => {
      mockUseCommissions.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
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

      expect(screen.getByText('Ошибка загрузки категорий')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Повторить' })).toBeInTheDocument()
    })

    it('calls refetch when retry button is clicked', async () => {
      const mockRefetch = vi.fn()
      mockUseCommissions.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
        refetch: mockRefetch,
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

      await user.click(screen.getByRole('button', { name: 'Повторить' }))
      expect(mockRefetch).toHaveBeenCalled()
    })
  })

  // =========================================================================
  // AC6: Accessibility (WCAG 2.1 AA)
  // =========================================================================
  describe('Accessibility', () => {
    it('has correct aria-label on combobox', () => {
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

    it('has aria-expanded attribute that updates on open/close', async () => {
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

    it('supports keyboard navigation - Enter to open', async () => {
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
      combobox.focus()
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Поиск категории...')).toBeInTheDocument()
      })
    })

    it('disables combobox when disabled prop is true', () => {
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
  })

  // =========================================================================
  // Error Display
  // =========================================================================
  describe('Error Display', () => {
    it('shows validation error message when error prop provided', () => {
      render(
        <CategorySelector
          value={null}
          onChange={mockOnChange}
          fulfillmentType="FBO"
          error="Категория обязательна для расчёта"
        />,
        { wrapper: createWrapper() }
      )

      expect(
        screen.getByText('Категория обязательна для расчёта')
      ).toBeInTheDocument()
    })

    it('applies destructive border style on error', () => {
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
    })
  })

  // =========================================================================
  // Selection Callback
  // =========================================================================
  describe('Selection Callback', () => {
    it('calls onChange with selected category object', async () => {
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

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          parentID: 200,
          parentName: 'Электроника',
          subjectID: 2001,
          subjectName: 'Смартфоны',
        })
      )
    })

    it('closes dropdown after selection', async () => {
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
        expect(screen.getByText('Спорт → Гантели')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Спорт → Гантели'))

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false')
      })
    })
  })
})
