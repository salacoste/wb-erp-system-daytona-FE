/**
 * Unit tests for CategorySelector component
 * Story 44.16-FE: Category Selection with Search
 * Epic 44: Price Calculator UI (Frontend)
 */

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CategorySelector } from '../CategorySelector'
import type { CategoryCommission } from '@/types/tariffs'
import type { CategoryAutoFillState } from '@/types/price-calculator'

// Mock scrollIntoView for cmdk (not available in JSDOM)
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

// Mock useCommissions hook
vi.mock('@/hooks/useCommissions', () => ({
  useCommissions: vi.fn(),
}))

// Import the mocked hook
import { useCommissions } from '@/hooks/useCommissions'
const mockUseCommissions = vi.mocked(useCommissions)

// Sample test data
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
]

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('CategorySelector', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseCommissions.mockReturnValue({
      data: { commissions: mockCategories, meta: { total: 3, cached: true, cache_ttl_seconds: 86400, fetched_at: '' } },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useCommissions>)
  })

  describe('Rendering', () => {
    it('should render the category label', () => {
      render(<CategorySelector value={null} onChange={mockOnChange} fulfillmentType="FBO" />, { wrapper: createWrapper() })
      expect(screen.getByText('Категория товара')).toBeInTheDocument()
    })

    it('should show placeholder when no value selected', () => {
      render(<CategorySelector value={null} onChange={mockOnChange} fulfillmentType="FBO" />, { wrapper: createWrapper() })
      expect(screen.getByText('Выберите категорию...')).toBeInTheDocument()
    })

    it('should show selected category name with arrow format', () => {
      render(<CategorySelector value={mockCategories[0]} onChange={mockOnChange} fulfillmentType="FBO" />, { wrapper: createWrapper() })
      expect(screen.getByText('Одежда → Платья')).toBeInTheDocument()
    })

    it('should show commission badge for selected category', () => {
      render(<CategorySelector value={mockCategories[0]} onChange={mockOnChange} fulfillmentType="FBO" />, { wrapper: createWrapper() })
      expect(screen.getByText('25%')).toBeInTheDocument()
    })

    it('should show FBS commission when fulfillmentType is FBS', () => {
      render(<CategorySelector value={mockCategories[0]} onChange={mockOnChange} fulfillmentType="FBS" />, { wrapper: createWrapper() })
      expect(screen.getByText('28%')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('should show loading skeleton when isLoading', () => {
      mockUseCommissions.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useCommissions>)

      render(<CategorySelector value={null} onChange={mockOnChange} fulfillmentType="FBO" />, { wrapper: createWrapper() })
      expect(screen.getByText('Категория товара')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('should show error state with retry button', () => {
      const mockRefetch = vi.fn()
      mockUseCommissions.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('API Error'),
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useCommissions>)

      render(<CategorySelector value={null} onChange={mockOnChange} fulfillmentType="FBO" />, { wrapper: createWrapper() })
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

      render(<CategorySelector value={null} onChange={mockOnChange} fulfillmentType="FBO" />, { wrapper: createWrapper() })
      await user.click(screen.getByRole('button', { name: 'Повторить' }))
      expect(mockRefetch).toHaveBeenCalled()
    })
  })

  describe('Dropdown Interactions', () => {
    it('should open dropdown on click', async () => {
      const user = userEvent.setup()
      render(<CategorySelector value={null} onChange={mockOnChange} fulfillmentType="FBO" />, { wrapper: createWrapper() })

      await user.click(screen.getByRole('combobox'))
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Поиск категории...')).toBeInTheDocument()
      })
    })

    it('should show categories in dropdown', async () => {
      const user = userEvent.setup()
      render(<CategorySelector value={null} onChange={mockOnChange} fulfillmentType="FBO" />, { wrapper: createWrapper() })

      await user.click(screen.getByRole('combobox'))
      await waitFor(() => {
        expect(screen.getByText('Одежда → Платья')).toBeInTheDocument()
        expect(screen.getByText('Электроника → Смартфоны')).toBeInTheDocument()
      })
    })

    it('should call onChange when category selected', async () => {
      const user = userEvent.setup()
      render(<CategorySelector value={null} onChange={mockOnChange} fulfillmentType="FBO" />, { wrapper: createWrapper() })

      await user.click(screen.getByRole('combobox'))
      await waitFor(() => {
        expect(screen.getByText('Электроника → Смартфоны')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Электроника → Смартфоны'))
      expect(mockOnChange).toHaveBeenCalledWith(mockCategories[1])
    })
  })

  describe('Search/Filter', () => {
    it('should filter categories by search query', async () => {
      const user = userEvent.setup()
      render(<CategorySelector value={null} onChange={mockOnChange} fulfillmentType="FBO" />, { wrapper: createWrapper() })

      await user.click(screen.getByRole('combobox'))
      const searchInput = await screen.findByPlaceholderText('Поиск категории...')
      await user.type(searchInput, 'Электроника')

      await waitFor(() => {
        expect(screen.getByText('Электроника → Смартфоны')).toBeInTheDocument()
      }, { timeout: 500 })
    })

    it('should show empty message when no results', async () => {
      const user = userEvent.setup()
      render(<CategorySelector value={null} onChange={mockOnChange} fulfillmentType="FBO" />, { wrapper: createWrapper() })

      await user.click(screen.getByRole('combobox'))
      const searchInput = await screen.findByPlaceholderText('Поиск категории...')
      await user.type(searchInput, 'несуществующая категория')

      await waitFor(() => {
        expect(screen.getByText('Категории не найдены')).toBeInTheDocument()
      }, { timeout: 500 })
    })
  })

  describe('Clear Selection', () => {
    it('should show clear button when value is selected', () => {
      render(<CategorySelector value={mockCategories[0]} onChange={mockOnChange} fulfillmentType="FBO" />, { wrapper: createWrapper() })
      expect(screen.getByText('Очистить выбор')).toBeInTheDocument()
    })

    it('should call onChange with null when cleared', async () => {
      const user = userEvent.setup()
      render(<CategorySelector value={mockCategories[0]} onChange={mockOnChange} fulfillmentType="FBO" />, { wrapper: createWrapper() })

      await user.click(screen.getByText('Очистить выбор'))
      expect(mockOnChange).toHaveBeenCalledWith(null)
    })

    it('should not show clear button when disabled', () => {
      render(<CategorySelector value={mockCategories[0]} onChange={mockOnChange} fulfillmentType="FBO" disabled />, { wrapper: createWrapper() })
      expect(screen.queryByText('Очистить выбор')).not.toBeInTheDocument()
    })
  })

  describe('High Commission Warning', () => {
    it('should show destructive badge for high commission (>25%)', () => {
      render(<CategorySelector value={mockCategories[2]} onChange={mockOnChange} fulfillmentType="FBO" />, { wrapper: createWrapper() })
      const badge = screen.getByText('30%')
      expect(badge).toHaveClass('bg-destructive')
    })

    it('should show secondary badge for normal commission (<=25%)', () => {
      render(<CategorySelector value={mockCategories[1]} onChange={mockOnChange} fulfillmentType="FBO" />, { wrapper: createWrapper() })
      const badge = screen.getByText('15%')
      expect(badge).toHaveClass('bg-secondary')
    })
  })

  describe('Auto-fill State (Story 44.26b)', () => {
    const autoFillState: CategoryAutoFillState = {
      source: 'auto',
      isLocked: true,
      originalCategory: {
        subject_id: mockCategories[0].subjectID,
        subject_name: mockCategories[0].subjectName,
        parent_id: mockCategories[0].parentID,
        parent_name: mockCategories[0].parentName,
      },
    }

    it('should show lock icon when isLocked', () => {
      render(
        <CategorySelector
          value={mockCategories[0]}
          onChange={mockOnChange}
          fulfillmentType="FBO"
          autoFillState={autoFillState}
        />,
        { wrapper: createWrapper() }
      )
      expect(screen.getByText('Категория из карточки товара WB')).toBeInTheDocument()
    })

    it('should disable combobox when isLocked', () => {
      render(
        <CategorySelector
          value={mockCategories[0]}
          onChange={mockOnChange}
          fulfillmentType="FBO"
          autoFillState={autoFillState}
        />,
        { wrapper: createWrapper() }
      )
      expect(screen.getByRole('combobox')).toBeDisabled()
    })

    it('should show auto-fill badge when source is auto', () => {
      render(
        <CategorySelector
          value={mockCategories[0]}
          onChange={mockOnChange}
          fulfillmentType="FBO"
          autoFillState={autoFillState}
        />,
        { wrapper: createWrapper() }
      )
      expect(screen.getByText('Автозаполнено')).toBeInTheDocument()
    })
  })

  describe('Disabled State', () => {
    it('should disable combobox when disabled prop is true', () => {
      render(<CategorySelector value={null} onChange={mockOnChange} fulfillmentType="FBO" disabled />, { wrapper: createWrapper() })
      expect(screen.getByRole('combobox')).toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('should have correct aria-label', () => {
      render(<CategorySelector value={null} onChange={mockOnChange} fulfillmentType="FBO" />, { wrapper: createWrapper() })
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-label', 'Выбрать категорию товара')
    })

    it('should have aria-expanded attribute', async () => {
      const user = userEvent.setup()
      render(<CategorySelector value={null} onChange={mockOnChange} fulfillmentType="FBO" />, { wrapper: createWrapper() })

      const combobox = screen.getByRole('combobox')
      expect(combobox).toHaveAttribute('aria-expanded', 'false')

      await user.click(combobox)
      await waitFor(() => {
        expect(combobox).toHaveAttribute('aria-expanded', 'true')
      })
    })
  })

  describe('Error Display', () => {
    it('should show error message when error prop provided', () => {
      render(
        <CategorySelector
          value={null}
          onChange={mockOnChange}
          fulfillmentType="FBO"
          error="Выберите категорию"
        />,
        { wrapper: createWrapper() }
      )
      expect(screen.getByText('Выберите категорию')).toBeInTheDocument()
    })

    it('should apply error styling to combobox', () => {
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
})
