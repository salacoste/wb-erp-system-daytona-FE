/**
 * Unit tests for BulkCogsForm component with marginRecalculation UI
 * Request #118/119 - Backend fix for automatic margin recalculation
 * Reference: docs/pages/products/COGS-BULK-UPLOAD-CHANGES.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, renderHook, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BulkCogsForm } from '../BulkCogsForm'
import { useBulkCogsSubmit } from '../bulk-cogs/useBulkCogsSubmit'
import { createQueryWrapper } from '@/test/utils/test-utils'

// Mock hooks
vi.mock('@/hooks/useProducts', () => ({
  useProducts: vi.fn(),
}))

vi.mock('@/hooks/useBulkCogsAssignmentWithPolling', () => ({
  useBulkCogsAssignmentWithPolling: vi.fn(),
}))

import { useProducts } from '@/hooks/useProducts'
import { useBulkCogsAssignmentWithPolling } from '@/hooks/useBulkCogsAssignmentWithPolling'

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}))

const mockProducts = [
  { nm_id: '12345678', sa_name: 'Product 1', brand: 'Brand A', has_cogs: false },
  { nm_id: '87654321', sa_name: 'Product 2', brand: 'Brand B', has_cogs: false },
]
const mockBulkMutate = vi.fn()

describe('BulkCogsForm - marginRecalculation UI', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock useProducts to return test data
    vi.mocked(useProducts).mockReturnValue({
      data: { products: mockProducts, pagination: { total: 2 } },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as never)

    // Mock useBulkCogsAssignmentWithPolling to return default values
    vi.mocked(useBulkCogsAssignmentWithPolling).mockReturnValue({
      mutate: mockBulkMutate,
      isPending: false,
      data: undefined,
      isPolling: false,
      pollingAttempts: 0,
      pollingTimeout: false,
      pollingStrategy: {
        interval: 3000,
        maxAttempts: 20,
        estimatedTime: 60000,
      },
    } as never)
  })

  // ==========================================================================
  // Component Rendering Tests
  // ==========================================================================

  describe('component rendering', () => {
    it('should render without crashing', () => {
      render(<BulkCogsForm />, { wrapper: createQueryWrapper() })
      expect(screen.getByText(/назначить себестоимость/i)).toBeInTheDocument()
    })

    it('should display product list', () => {
      render(<BulkCogsForm />, { wrapper: createQueryWrapper() })
      expect(screen.getByText('12345678')).toBeInTheDocument()
      expect(screen.getByText('Product 1')).toBeInTheDocument()
      expect(screen.getByText('87654321')).toBeInTheDocument()
      expect(screen.getByText('Product 2')).toBeInTheDocument()
      expect(
        screen.getByRole('table', { name: 'Товары без назначенной себестоимости' })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('region', { name: 'Товары без назначенной себестоимости' })
      ).toHaveAttribute('tabindex', '0')
      expect(screen.getByRole('checkbox', { name: 'Выбрать все' })).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: 'Выбрать 12345678' })).toBeInTheDocument()
    })

    it('opens a named preview with the selected products and exact bulk value', async () => {
      const user = userEvent.setup()
      render(<BulkCogsForm />, { wrapper: createQueryWrapper() })

      await user.click(screen.getByRole('checkbox', { name: 'Выбрать 12345678' }))
      await user.type(screen.getByLabelText(/себестоимость/i), '125.50')
      await user.click(screen.getByRole('button', { name: /Просмотреть \(1 товаров\)/ }))

      const preview = screen.getByRole('dialog', { name: 'Подтверждение массового назначения' })
      expect(preview).toBeVisible()
      expect(within(preview).getByText('Product 1')).toBeVisible()
      expect(within(preview).getByText(/125,50/)).toBeVisible()
    })

    it('keeps the bulk form visible and disabled while submission is pending', () => {
      vi.mocked(useBulkCogsAssignmentWithPolling).mockReturnValue({
        mutate: mockBulkMutate,
        isPending: true,
        data: undefined,
        isPolling: false,
        pollingAttempts: 0,
        pollingTimeout: false,
        pollingStrategy: { interval: 3000, maxAttempts: 20, estimatedTime: 60000 },
      } as never)

      render(<BulkCogsForm />, { wrapper: createQueryWrapper() })

      expect(screen.getByRole('button', { name: /Обработка/ })).toBeDisabled()
      expect(screen.getByText('Product 1')).toBeVisible()
    })

    it('retains the selected bulk draft when a background product refresh fails', async () => {
      const user = userEvent.setup()
      vi.mocked(useProducts).mockReturnValue({
        data: { products: mockProducts, pagination: { total: 2 } },
        isLoading: false,
        isError: true,
        error: new Error('Refresh failed'),
        refetch: vi.fn(),
      } as never)

      render(<BulkCogsForm />, { wrapper: createQueryWrapper() })
      await user.click(screen.getByRole('checkbox', { name: 'Выбрать 12345678' }))
      await user.type(screen.getByLabelText(/себестоимость/i), '125')

      expect(screen.getByText('Refresh failed')).toBeVisible()
      expect(screen.getByRole('checkbox', { name: 'Выбрать 12345678' })).toBeChecked()
      expect(screen.getByLabelText(/себестоимость/i)).toHaveValue(125)
    })
  })

  describe('owner-state submission outcomes', () => {
    const options = () => ({
      selectedProducts: new Set(['12345678', '87654321']),
      onPreviewClose: vi.fn(),
      onShowResults: vi.fn(),
      onResetForm: vi.fn(),
      onClearSelection: vi.fn(),
      onSetSelection: vi.fn(),
      onSuccess: vi.fn(),
    })

    it('keeps invalid bulk COGS input associated with its visible validation summary', () => {
      const callbacks = options()
      const { result } = renderHook(() => useBulkCogsSubmit(callbacks))

      act(() =>
        result.current.handleSubmit({ unit_cost_rub: 'not-a-number', valid_from: '', notes: '' })
      )

      expect(result.current.validationErrors.length).toBeGreaterThan(0)
      expect(callbacks.onPreviewClose).toHaveBeenCalledTimes(1)
      expect(mockBulkMutate).not.toHaveBeenCalled()
    })

    it('reports all-success exactly once and clears the completed bulk draft', () => {
      const callbacks = options()
      const { result } = renderHook(() => useBulkCogsSubmit(callbacks))

      act(() =>
        result.current.handleSubmit({ unit_cost_rub: '100', valid_from: '2026-09-01', notes: '' })
      )
      const mutationOptions = mockBulkMutate.mock.calls[0][1]
      act(() => mutationOptions.onSuccess({ succeeded: 2, failed: 0, results: [] }))

      expect(callbacks.onShowResults).toHaveBeenCalledTimes(1)
      expect(callbacks.onResetForm).toHaveBeenCalledTimes(1)
      expect(callbacks.onClearSelection).toHaveBeenCalledTimes(1)
    })

    it('reports partial success and preserves failed rows for retry', () => {
      const callbacks = options()
      const { result } = renderHook(() => useBulkCogsSubmit(callbacks))

      act(() =>
        result.current.handleSubmit({ unit_cost_rub: '100', valid_from: '2026-09-01', notes: '' })
      )
      const mutationOptions = mockBulkMutate.mock.calls[0][1]
      act(() => mutationOptions.onSuccess({ succeeded: 1, failed: 1, results: [] }))

      expect(callbacks.onShowResults).toHaveBeenCalledTimes(1)
      expect(callbacks.onResetForm).not.toHaveBeenCalled()
      expect(callbacks.onClearSelection).not.toHaveBeenCalled()
    })

    it('reports all-failed and conflicting submissions without claiming success', () => {
      const callbacks = options()
      const { result } = renderHook(() => useBulkCogsSubmit(callbacks))

      act(() =>
        result.current.handleSubmit({ unit_cost_rub: '100', valid_from: '2026-09-01', notes: '' })
      )
      const mutationOptions = mockBulkMutate.mock.calls[0][1]
      act(() => mutationOptions.onError(new Error('409 conflicting row')))

      expect(callbacks.onPreviewClose).toHaveBeenCalledTimes(1)
      expect(callbacks.onShowResults).not.toHaveBeenCalled()
      expect(callbacks.onResetForm).not.toHaveBeenCalled()
    })
  })
})
