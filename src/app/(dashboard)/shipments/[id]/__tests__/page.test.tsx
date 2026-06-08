/**
 * Shipment Detail Page Tests
 * Tests for src/app/(dashboard)/shipments/[id]/page.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'

// Mock next/navigation useParams
const mockUseParams = vi.fn()
vi.mock('next/navigation', () => ({
  useParams: <T extends Record<string, string>>(): T => mockUseParams(),
}))

// Mock the useShipment hook
const mockUseShipment = vi.fn()
vi.mock('@/hooks/use-shipments', () => ({
  useShipment: (id: string) => mockUseShipment(id),
}))

// Mock child components
vi.mock('@/components/custom/shipments/ShipmentDetailHeader', () => ({
  ShipmentDetailHeader: () => <div data-testid="shipment-header">Header</div>,
}))

vi.mock('@/components/custom/shipments/PalletAccordion', () => ({
  PalletAccordion: () => <div data-testid="pallet-accordion">PalletAccordion</div>,
}))

vi.mock('@/components/custom/shipments/ValidationErrorPanel', () => ({
  ValidationErrorPanel: () => <div data-testid="validation-error-panel">Errors</div>,
  getAffectedBoxLineIds: () => [],
}))

vi.mock('@/components/custom/shipments/CalculationResults', () => ({
  CalculationResults: () => <div data-testid="calculation-results">Results</div>,
}))

import ShipmentDetailPage from '../page'

describe('ShipmentDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseParams.mockReturnValue({ id: 'shipment-123' })
  })

  describe('Loading state', () => {
    beforeEach(() => {
      mockUseShipment.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
      })
    })

    it('should render without crash', () => {
      render(<ShipmentDetailPage />)
    })

    it('should show loading skeleton', () => {
      const { container } = render(<ShipmentDetailPage />)

      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  describe('Loaded with data', () => {
    beforeEach(() => {
      mockUseShipment.mockReturnValue({
        data: {
          id: 'shipment-123',
          status: 'DRAFT',
          pallets: [],
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      })
    })

    it('should render without crash', () => {
      render(<ShipmentDetailPage />)
    })

    it('should render the shipment header', () => {
      render(<ShipmentDetailPage />)

      expect(screen.getByTestId('shipment-header')).toBeInTheDocument()
    })

    it('should render the pallet accordion', () => {
      render(<ShipmentDetailPage />)

      expect(screen.getByTestId('pallet-accordion')).toBeInTheDocument()
    })
  })

  describe('Error state', () => {
    beforeEach(() => {
      mockUseShipment.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Shipment not found'),
        refetch: vi.fn(),
      })
    })

    it('should render error heading', () => {
      render(<ShipmentDetailPage />)

      expect(screen.getByRole('heading', { name: /детали отправки/i })).toBeInTheDocument()
    })

    it('should render error message', () => {
      render(<ShipmentDetailPage />)

      expect(screen.getByText('Shipment not found')).toBeInTheDocument()
    })

    it('should show retry button', () => {
      render(<ShipmentDetailPage />)

      expect(screen.getByRole('button', { name: /повторить/i })).toBeInTheDocument()
    })
  })
})
