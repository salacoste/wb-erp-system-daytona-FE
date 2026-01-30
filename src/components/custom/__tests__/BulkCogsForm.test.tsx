/**
 * Unit tests for BulkCogsForm component with marginRecalculation UI
 * Request #118/119 - Backend fix for automatic margin recalculation
 * Reference: docs/pages/products/COGS-BULK-UPLOAD-CHANGES.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BulkCogsForm } from '../BulkCogsForm'
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
      mutate: vi.fn(),
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
    })
  })
})
