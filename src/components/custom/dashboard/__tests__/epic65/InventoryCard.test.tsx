/**
 * TDD Tests for InventoryCard (RED phase)
 * Story 65.9: Inventory (Остатки) with 3 subcategories
 *
 * Tests inventory count display, tooltip breakdown, capitalization,
 * and error/loading states. Components DO NOT EXIST yet.
 *
 * Backend dependency: Request #140 — GET /v1/inventory/summary
 *
 * @see docs/epics/epic-65-dashboard-metrics-parity/stories-wave-3.md
 * @see docs/epics/epic-65-dashboard-metrics-parity/backend-gap-analysis.md
 */

import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'

// Components that DO NOT EXIST yet (TDD RED phase)
import { InventoryCard } from '@/components/custom/dashboard/InventoryCard'
import { CapitalizationCard } from '@/components/custom/dashboard/CapitalizationCard'

// Mock factories
import { createInventorySummaryMock, createEmptyInventoryMock } from './mocks/api-mocks'

// Mock the inventory API module (does not exist yet)
vi.mock('@/lib/api/inventory', () => ({
  getInventorySummary: vi.fn(),
}))

// Mock the hook (does not exist yet)
vi.mock('@/hooks/useInventorySummary', () => ({
  useInventorySummary: vi.fn(),
}))

// =============================================================================
// InventoryCard Tests — Story 65.9
// =============================================================================

describe('InventoryCard', () => {
  const mockData = createInventorySummaryMock()

  /**
   * AC-65.9.1: Card "Остатки" shows total `N шт` with breakdown icon
   */
  describe('total inventory display', () => {
    it('renders total inventory count formatted with "шт" suffix', () => {
      renderWithProviders(<InventoryCard data={mockData} isLoading={false} />)

      // totalStock = 2988 (onWarehouse + inWayToClient + inWayFromClient)
      expect(screen.getByText(/2\s?988/)).toBeInTheDocument()
      expect(screen.getByText(/шт/)).toBeInTheDocument()
    })

    it('verifies total = onWarehouse + inWayToClient + inWayFromClient', () => {
      const data = createInventorySummaryMock({
        totalStock: 500,
        onWarehouse: 400,
        inWayToClient: 70,
        inWayFromClient: 30,
      })

      renderWithProviders(<InventoryCard data={data} isLoading={false} />)

      // 400 + 70 + 30 = 500
      expect(screen.getByText(/500/)).toBeInTheDocument()
    })
  })

  /**
   * AC-65.9.2: Tooltip/popover with 3 subcategories
   */
  describe('inventory breakdown tooltip', () => {
    it('shows "На складах МП" with onWarehouse value in tooltip', async () => {
      const user = userEvent.setup()
      renderWithProviders(<InventoryCard data={mockData} isLoading={false} />)

      // Trigger tooltip/popover
      const triggerElement = screen.getByTestId('inventory-breakdown-trigger')
      await user.hover(triggerElement)

      await waitFor(() => {
        expect(screen.getByText('На складах МП')).toBeInTheDocument()
        expect(screen.getByText(/2\s?756/)).toBeInTheDocument()
      })
    })

    it('shows "В пути к клиентам" with inWayToClient value', async () => {
      const user = userEvent.setup()
      renderWithProviders(<InventoryCard data={mockData} isLoading={false} />)

      const triggerElement = screen.getByTestId('inventory-breakdown-trigger')
      await user.hover(triggerElement)

      await waitFor(() => {
        expect(screen.getByText('В пути к клиентам')).toBeInTheDocument()
        expect(screen.getByText(/207/)).toBeInTheDocument()
      })
    })

    it('shows "В пути от клиентов" with inWayFromClient value', async () => {
      const user = userEvent.setup()
      renderWithProviders(<InventoryCard data={mockData} isLoading={false} />)

      const triggerElement = screen.getByTestId('inventory-breakdown-trigger')
      await user.hover(triggerElement)

      await waitFor(() => {
        expect(screen.getByText('В пути от клиентов')).toBeInTheDocument()
        expect(screen.getByText(/25/)).toBeInTheDocument()
      })
    })
  })

  /**
   * AC-65.9.7: Last updated date displayed
   */
  describe('snapshot metadata', () => {
    it('displays snapshot date', () => {
      renderWithProviders(<InventoryCard data={mockData} isLoading={false} />)

      // snapshotDate: '2026-02-14' should display in some format
      expect(screen.getByText(/14\.02\.2026/)).toBeInTheDocument()
    })
  })

  /**
   * AC-65.9.6: Graceful handling when no inventory data
   */
  describe('error and empty states', () => {
    it('shows skeleton while loading', () => {
      const { container } = renderWithProviders(<InventoryCard data={null} isLoading={true} />)

      expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    })

    it('shows "—" when data is null', () => {
      renderWithProviders(<InventoryCard data={null} isLoading={false} />)

      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('handles API error gracefully with error message', () => {
      renderWithProviders(
        <InventoryCard data={null} isLoading={false} error={new Error('Network error')} />
      )

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('shows import prompt when no snapshot data exists', () => {
      renderWithProviders(
        <InventoryCard
          data={null}
          isLoading={false}
          noDataMessage="Нет данных. Импортируйте остатки"
        />
      )

      expect(screen.getByText(/Импортируйте остатки/)).toBeInTheDocument()
    })
  })

  describe('zero inventory', () => {
    it('displays "0 шт" when all stock values are zero', () => {
      const emptyData = createEmptyInventoryMock()

      renderWithProviders(<InventoryCard data={emptyData} isLoading={false} />)

      expect(screen.getByText(/0/)).toBeInTheDocument()
      expect(screen.getByText(/шт/)).toBeInTheDocument()
    })
  })
})

// =============================================================================
// CapitalizationCard Tests — Story 65.9 (AC-65.9.3, AC-65.9.4, AC-65.9.5)
// =============================================================================

describe('CapitalizationCard', () => {
  const mockData = createInventorySummaryMock()

  /**
   * AC-65.9.3: Capitalization by COGS card shows currency
   */
  describe('capitalization by COGS', () => {
    it('renders capitalizationByCogs formatted as currency', () => {
      renderWithProviders(
        <CapitalizationCard
          type="cogs"
          value={mockData.capitalizationByCogs}
          cogsCoveragePct={mockData.cogsCoveragePct}
          isLoading={false}
        />
      )

      // 1 485 600 ₽
      expect(screen.getByText(/1\s?485\s?600/)).toBeInTheDocument()
      expect(screen.getByText(/₽/)).toBeInTheDocument()
    })

    /**
     * AC-65.9.5: When COGS not filled, show "—" or partial note
     */
    it('shows "—" when capitalizationByCogs is null (no COGS data)', () => {
      renderWithProviders(
        <CapitalizationCard type="cogs" value={null} cogsCoveragePct={0} isLoading={false} />
      )

      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('shows partial coverage warning when cogsCoveragePct < 100%', () => {
      renderWithProviders(
        <CapitalizationCard type="cogs" value={1485600} cogsCoveragePct={72.5} isLoading={false} />
      )

      // Should indicate partial COGS coverage
      expect(screen.getByText(/72,5/)).toBeInTheDocument()
    })
  })

  /**
   * AC-65.9.4: Capitalization by retail card shows currency
   */
  describe('capitalization by retail', () => {
    it('renders capitalizationByRetail formatted as currency', () => {
      renderWithProviders(
        <CapitalizationCard
          type="retail"
          value={mockData.capitalizationByRetail}
          isLoading={false}
        />
      )

      // 2 297 861 ₽
      expect(screen.getByText(/2\s?297\s?861/)).toBeInTheDocument()
      expect(screen.getByText(/₽/)).toBeInTheDocument()
    })
  })

  describe('zero inventory capitalization', () => {
    it('shows "0 ₽" when inventory is zero', () => {
      renderWithProviders(<CapitalizationCard type="retail" value={0} isLoading={false} />)

      expect(screen.getByText(/0/)).toBeInTheDocument()
      expect(screen.getByText(/₽/)).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('shows skeleton while loading', () => {
      const { container } = renderWithProviders(
        <CapitalizationCard type="cogs" value={null} isLoading={true} />
      )

      expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    })
  })

  describe('tooltip breakdown', () => {
    it('shows capitalization calculation breakdown in tooltip', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <CapitalizationCard
          type="cogs"
          value={1485600}
          inventoryCount={2988}
          avgCogs={497}
          isLoading={false}
        />
      )

      const triggerElement = screen.getByTestId('capitalization-tooltip-trigger')
      await user.hover(triggerElement)

      await waitFor(() => {
        // Tooltip shows inventory count * avg cogs = capitalization
        expect(screen.getByText(/2\s?988/)).toBeInTheDocument()
      })
    })
  })
})
