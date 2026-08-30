/**
 * Shipment Detail Page Tests
 * Tests for src/app/(dashboard)/shipments/[id]/page.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { ApiError } from '@/types/api'

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
  ShipmentDetailHeader: ({
    shipment,
    onCalculateSuccess,
    onCalculateError,
  }: {
    shipment: { id: string; name?: string | null }
    onCalculateSuccess?: (result: { results?: unknown[] }) => void
    onCalculateError?: (errors: Array<{ code: string; message: string }>) => void
  }) => (
    <div data-testid="shipment-header">
      {shipment.name?.trim() || `Отправка ${shipment.id}`}
      <button type="button" onClick={() => onCalculateSuccess?.({})}>
        Complete without details
      </button>
      <button type="button" onClick={() => onCalculateSuccess?.({ results: [] })}>
        Complete empty
      </button>
      <button
        type="button"
        onClick={() =>
          onCalculateSuccess?.({
            results: [
              {
                nmId: 100,
                productName: 'First',
                unitCostRub: 10,
                deliveryCostPerUnit: 2,
                finalCostPerUnit: 12,
                totalUnits: 5,
                finalCostLine: 60,
              },
            ],
          })
        }
      >
        Complete subset
      </button>
      <button
        type="button"
        onClick={() =>
          onCalculateSuccess?.({
            results: [
              {
                nmId: 100,
                productName: 'First',
                unitCostRub: 10,
                deliveryCostPerUnit: 2,
                finalCostPerUnit: 12,
                totalUnits: 5,
                finalCostLine: 60,
              },
              {
                nmId: 200,
                productName: 'Second',
                unitCostRub: 20,
                deliveryCostPerUnit: 3,
                finalCostPerUnit: 23,
                totalUnits: 4,
                finalCostLine: 92,
              },
            ],
          })
        }
      >
        Complete full
      </button>
      <button
        type="button"
        onClick={() => onCalculateError?.([{ code: 'MISSING_COGS', message: 'No COGS' }])}
      >
        Fail validation
      </button>
    </div>
  ),
}))

vi.mock('@/components/custom/shipments/PalletAccordion', () => ({
  PalletAccordion: () => <div data-testid="pallet-accordion">PalletAccordion</div>,
}))

vi.mock('@/components/custom/shipments/ValidationErrorPanel', () => ({
  ValidationErrorPanel: () => <div data-testid="validation-error-panel">Errors</div>,
  getAffectedBoxLineIds: () => [],
}))

vi.mock('@/components/custom/shipments/CalculationResults', () => ({
  CalculationResults: ({ results }: { results?: Array<{ nmId: number }> }) => (
    <div data-testid="calculation-results">{results?.map(item => item.nmId).join(',')}</div>
  ),
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

    it('keeps route identity and exposes a semantic loading state', () => {
      render(<ShipmentDetailPage />)

      expect(screen.getByRole('heading', { level: 1, name: 'Детали отправки' })).toBeInTheDocument()
      expect(screen.getByRole('region', { name: /загрузка отправки/i })).toHaveAttribute(
        'data-state',
        'loading'
      )
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

      expect(screen.getByTestId('shipment-header')).toHaveTextContent('Отправка shipment-123')
    })

    it('should render the pallet accordion', () => {
      render(<ShipmentDetailPage />)

      expect(screen.getByTestId('pallet-accordion')).toBeInTheDocument()
    })

    it('uses shipment id as the loaded identity fallback', () => {
      mockUseShipment.mockReturnValue({
        data: {
          id: 'shipment-123',
          name: null,
          status: 'DRAFT',
          pallets: [],
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<ShipmentDetailPage />)

      expect(screen.getByTestId('shipment-header')).toHaveTextContent('Отправка shipment-123')
    })

    it('shows a retained partial-calculation limitation when details are absent', async () => {
      const user = userEvent.setup()
      render(<ShipmentDetailPage />)

      await user.click(screen.getByRole('button', { name: 'Complete without details' }))

      expect(screen.getByRole('region', { name: /расчёт выполнен частично/i })).toHaveAttribute(
        'data-state',
        'partial'
      )
      expect(screen.getByText(/детализация по товарам недоступна/i)).toBeInTheDocument()
    })

    it('keeps the partial limitation when a non-empty shipment receives empty results', async () => {
      const user = userEvent.setup()
      mockUseShipment.mockReturnValue({
        data: shipmentWithExpectedLines(),
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      })
      render(<ShipmentDetailPage />)

      await user.click(screen.getByRole('button', { name: 'Complete empty' }))

      expect(screen.getByRole('region', { name: /расчёт выполнен частично/i })).toBeInTheDocument()
    })

    it('retains available results and a limitation when only a subset is returned', async () => {
      const user = userEvent.setup()
      mockUseShipment.mockReturnValue({
        data: shipmentWithExpectedLines(),
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      })
      render(<ShipmentDetailPage />)

      await user.click(screen.getByRole('button', { name: 'Complete subset' }))

      expect(screen.getByTestId('calculation-results')).toHaveTextContent('100')
      expect(screen.getByRole('region', { name: /расчёт выполнен частично/i })).toBeInTheDocument()
    })

    it('clears the limitation only when results cover every expected product', async () => {
      const user = userEvent.setup()
      mockUseShipment.mockReturnValue({
        data: shipmentWithExpectedLines(),
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      })
      render(<ShipmentDetailPage />)

      await user.click(screen.getByRole('button', { name: 'Complete full' }))

      expect(screen.getByTestId('calculation-results')).toHaveTextContent('100,200')
      expect(
        screen.queryByRole('region', { name: /расчёт выполнен частично/i })
      ).not.toBeInTheDocument()
    })

    it('shows a retained limitation for persisted partially calculated rows', () => {
      mockUseShipment.mockReturnValue({
        data: {
          id: 'shipment-123',
          name: 'Partial shipment',
          status: 'DRAFT',
          pallets: [
            {
              id: 'pallet-1',
              boxLines: [
                { id: 'line-1', finalCostPerUnit: '120.00' },
                { id: 'line-2', finalCostPerUnit: null },
              ],
            },
          ],
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<ShipmentDetailPage />)

      expect(screen.getByRole('region', { name: /расчёт выполнен частично/i })).toHaveAttribute(
        'data-state',
        'partial'
      )
      expect(screen.getByText(/не для всех товарных строк/i)).toBeInTheDocument()
    })

    it('moves focus to the validation summary after calculation validation fails', async () => {
      const user = userEvent.setup()
      render(<ShipmentDetailPage />)

      await user.click(screen.getByRole('button', { name: 'Fail validation' }))

      expect(screen.getByTestId('validation-error-panel').parentElement).toHaveFocus()
    })
  })

  describe('Error state', () => {
    beforeEach(() => {
      mockUseShipment.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new ApiError('Hostile backend detail', 500),
        refetch: vi.fn(),
      })
    })

    it('should render error heading', () => {
      render(<ShipmentDetailPage />)

      expect(screen.getByRole('heading', { name: /детали отправки/i })).toBeInTheDocument()
    })

    it('does not expose raw backend error details', () => {
      render(<ShipmentDetailPage />)

      expect(screen.queryByText('Hostile backend detail')).not.toBeInTheDocument()
      expect(screen.getByText(/не удалось загрузить отправку/i)).toBeInTheDocument()
    })

    it('should show retry button', () => {
      render(<ShipmentDetailPage />)

      expect(screen.getByRole('button', { name: /повторить/i })).toBeInTheDocument()
    })

    it('calls refetch from the recoverable terminal error state', async () => {
      const user = userEvent.setup()
      const refetch = vi.fn()
      mockUseShipment.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new ApiError('Service unavailable', 503),
        refetch,
      })
      render(<ShipmentDetailPage />)

      await user.click(screen.getByRole('button', { name: /повторить/i }))

      expect(refetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Not found state', () => {
    it('renders an explicit 404 state with a safe return action', () => {
      mockUseShipment.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new ApiError('Raw not-found detail', 404),
        refetch: vi.fn(),
      })

      render(<ShipmentDetailPage />)

      expect(screen.getByRole('region', { name: /отправка не найдена/i })).toHaveAttribute(
        'data-state',
        'not-found'
      )
      expect(screen.getByRole('link', { name: 'Вернуться к отправкам' })).toHaveAttribute(
        'href',
        '/shipments'
      )
      expect(screen.queryByText('Raw not-found detail')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /повторить/i })).not.toBeInTheDocument()
    })
  })
})

function shipmentWithExpectedLines() {
  return {
    id: 'shipment-123',
    name: 'Calculated shipment',
    status: 'DRAFT',
    pallets: [
      {
        id: 'pallet-1',
        boxLines: [
          { id: 'line-1', nmId: 100, finalCostPerUnit: null },
          { id: 'line-2', nmId: 200, finalCostPerUnit: null },
        ],
      },
    ],
  }
}
