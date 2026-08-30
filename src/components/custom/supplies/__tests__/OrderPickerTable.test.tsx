/**
 * Unit Tests for OrderPickerTable Component
 * Story 53.5-FE: Order Picker Drawer
 * Epic 53-FE: Supply Management UI
 *
 * Test coverage:
 * - Virtualized list with react-window (AC2)
 * - Order row display (AC3)
 * - Multi-select functionality (AC4)
 * - Selection counter (AC5)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { renderWithProviders } from '@/test/utils/test-utils'
import {
  mockOrdersLargeDataset,
  mockOrdersMediumDataset,
  mockOrdersSmallDataset,
  mockOrdersEmpty,
  mockEligibleOrderConfirm,
  mockEligibleOrderComplete,
  mockOrderNoProductName,
  createMockSelectedIds,
  DEFAULT_ROW_HEIGHT,
  MAX_ORDER_SELECTION,
  SUPPLIER_STATUS_LABELS,
} from '@/test/fixtures/order-picker'
import { OrderPickerTable } from '../OrderPickerTable'

expect.extend(toHaveNoViolations)

describe('OrderPickerTable - Story 53.5-FE', () => {
  const mockOnToggleOrder = vi.fn()
  const mockOnToggleAll = vi.fn()

  const defaultProps = {
    orders: mockOrdersMediumDataset,
    selectedIds: new Set<string>(),
    onToggleOrder: mockOnToggleOrder,
    onToggleAll: mockOnToggleAll,
    isAllSelected: false,
    isIndeterminate: false,
    height: 600,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // Helper to render with providers
  function renderTable(overrides: Partial<typeof defaultProps> = {}) {
    return renderWithProviders(<OrderPickerTable {...defaultProps} {...overrides} />)
  }

  // ==========================================================================
  // AC2: Virtualization with react-window
  // ==========================================================================

  describe('AC2: Virtualization with react-window', () => {
    it('renders a virtualized list container', () => {
      renderTable()
      expect(screen.getByRole('list', { name: 'Список заказов' })).toBeInTheDocument()
    })

    it('renders only visible rows, not all 1000', () => {
      renderTable({ orders: mockOrdersLargeDataset })
      const options = screen.getAllByRole('listitem')
      // With height=600 and rowHeight=48, ~11-12 visible + some overscan
      expect(options.length).toBeLessThan(50)
      expect(options.length).toBeGreaterThan(0)
    })

    it('applies correct row height of 48px', () => {
      renderTable({ orders: mockOrdersSmallDataset })
      const options = screen.getAllByRole('listitem')
      for (const opt of options) {
        // react-window sets height via inline style
        const style = opt.style
        expect(style?.height).toBe(`${DEFAULT_ROW_HEIGHT}px`)
      }
    })

    it('respects height prop for the list container', () => {
      renderTable({ height: 400 })
      const listbox = screen.getByRole('list', { name: 'Список заказов' })
      expect(listbox).toHaveStyle({ height: '352px' })
    })

    it('maintains selection state during scroll', () => {
      const selectedIds = createMockSelectedIds(3)
      renderTable({ orders: mockOrdersLargeDataset, selectedIds })
      const selected = screen
        .getAllByRole('listitem')
        .filter(row => within(row).getByRole('checkbox').getAttribute('data-state') === 'checked')
      expect(selected).toHaveLength(3)
    })
  })

  // ==========================================================================
  // Header Row - "Select All" Checkbox
  // ==========================================================================

  describe('Header Row - Select All', () => {
    it('renders header row with select all checkbox', () => {
      renderTable()
      expect(screen.getByLabelText('Выбрать все заказы')).toBeInTheDocument()
    })

    it('header row is outside the virtualized list (always visible)', () => {
      renderTable()
      const listbox = screen.getByRole('list', { name: 'Список заказов' })
      const headerCheckbox = screen.getByLabelText('Выбрать все заказы')
      // Header checkbox should NOT be inside the listbox
      expect(listbox.contains(headerCheckbox)).toBe(false)
    })

    it('shows "Выбрать все (N)" label with order count', () => {
      renderTable({ orders: mockOrdersSmallDataset })
      expect(screen.getByText(/Выбрать все \(10\)/)).toBeInTheDocument()
    })

    it('checkbox unchecked when nothing selected', () => {
      renderTable({ selectedIds: new Set() })
      const checkbox = screen.getByLabelText('Выбрать все заказы')
      expect(checkbox).toHaveAttribute('data-state', 'unchecked')
    })

    it('checkbox checked when all visible selected', () => {
      renderTable({ isAllSelected: true })
      const checkbox = screen.getByLabelText('Выбрать все заказы')
      expect(checkbox).toHaveAttribute('data-state', 'checked')
    })

    it('calls onToggleAll when header checkbox clicked', async () => {
      const user = userEvent.setup()
      renderTable()
      await user.click(screen.getByLabelText('Выбрать все заказы'))
      expect(mockOnToggleAll).toHaveBeenCalledTimes(1)
    })

    it('header checkbox has correct aria-label', () => {
      renderTable()
      expect(screen.getByLabelText('Выбрать все заказы')).toBeInTheDocument()
    })

    it('header has distinct background color class', () => {
      renderTable()
      const headerCheckbox = screen.getByLabelText('Выбрать все заказы')
      // Walk up to the header row container (bg-muted/50 contains slash, escape for selector)
      const parent = headerCheckbox.parentElement
      const headerRow = parent?.closest('[class*="bg-muted"]')
      expect(headerRow).toBeTruthy()
    })
  })

  // ==========================================================================
  // AC3: Order Row Display
  // ==========================================================================

  describe('AC3: Order Row Display', () => {
    it('renders checkbox as first element in each row', () => {
      renderTable({ orders: [mockEligibleOrderConfirm] })
      const row = screen.getByRole('listitem')
      const checkbox = within(row).getByRole('checkbox')
      expect(checkbox).toBeTruthy()
    })

    it('displays order ID with # prefix', () => {
      renderTable({ orders: [mockEligibleOrderConfirm] })
      // orderId is "1234567890", last 8 chars = "34567890"
      expect(screen.getByText('#34567890')).toBeInTheDocument()
    })

    it('order ID has monospace font', () => {
      renderTable({ orders: [mockEligibleOrderConfirm] })
      const idEl = screen.getByText('#34567890')
      expect(idEl.className).toContain('font-mono')
    })

    it('displays vendorCode in the row', () => {
      renderTable({ orders: [mockEligibleOrderConfirm] })
      expect(screen.getByText('SKU-CONFIRM-001')).toBeInTheDocument()
    })

    it('displays sale price formatted as currency', () => {
      renderTable({ orders: [mockEligibleOrderConfirm] })
      // formatCurrency(1200) produces "1 200 ₽"
      const priceText = screen.getByText(/1 200/)
      expect(priceText).toBeInTheDocument()
    })

    it('displays supplier status label as badge', () => {
      renderTable({ orders: [mockEligibleOrderConfirm] })
      expect(screen.getByText('Подтвержден')).toBeInTheDocument()
    })

    it('shows "Завершен" for complete status', () => {
      renderTable({ orders: [mockEligibleOrderComplete] })
      expect(screen.getByText('Завершен')).toBeInTheDocument()
    })

    it('displays em dash for null productName', () => {
      renderTable({ orders: [mockOrderNoProductName] })
      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('truncates long vendor codes with truncate class', () => {
      const longCode = { ...mockEligibleOrderConfirm, vendorCode: 'A'.repeat(80) }
      renderTable({ orders: [longCode] })
      const el = screen.getByText('A'.repeat(80))
      expect(el.className).toContain('truncate')
    })
  })

  // ==========================================================================
  // AC4: Multi-Select Functionality
  // ==========================================================================

  describe('AC4: Multi-Select', () => {
    it('individual checkbox toggles selection', async () => {
      const user = userEvent.setup()
      renderTable({ orders: [mockEligibleOrderConfirm] })
      const checkbox = screen.getByLabelText(`Выбрать заказ #${mockEligibleOrderConfirm.orderId}`)
      await user.click(checkbox)
      expect(mockOnToggleOrder).toHaveBeenCalledWith(mockEligibleOrderConfirm.orderId)
    })

    it('checkbox unchecked for unselected orders', () => {
      renderTable({ orders: [mockEligibleOrderConfirm], selectedIds: new Set() })
      const checkbox = screen.getByLabelText(`Выбрать заказ #${mockEligibleOrderConfirm.orderId}`)
      expect(checkbox).toHaveAttribute('data-state', 'unchecked')
    })

    it('checkbox checked for selected orders', () => {
      const selectedIds = new Set([mockEligibleOrderConfirm.orderId])
      renderTable({ orders: [mockEligibleOrderConfirm], selectedIds })
      const checkbox = screen.getByLabelText(`Выбрать заказ #${mockEligibleOrderConfirm.orderId}`)
      expect(checkbox).toHaveAttribute('data-state', 'checked')
    })

    it('clicking row toggles selection', async () => {
      const user = userEvent.setup()
      renderTable({ orders: [mockEligibleOrderConfirm] })
      const rowAction = screen.getByRole('button', {
        name: `Переключить выбор заказа #${mockEligibleOrderConfirm.orderId}`,
      })
      await user.click(rowAction)
      expect(mockOnToggleOrder).toHaveBeenCalledWith(mockEligibleOrderConfirm.orderId)
    })

    it('selected row uses the semantic primary highlight', () => {
      const selectedIds = new Set([mockEligibleOrderConfirm.orderId])
      renderTable({ orders: [mockEligibleOrderConfirm], selectedIds })
      const row = screen.getByRole('listitem')
      expect(row.className).toContain('bg-primary/10')
    })

    it('checkbox has aria-label with order ID', () => {
      renderTable({ orders: [mockEligibleOrderConfirm] })
      const checkbox = screen.getByLabelText(`Выбрать заказ #${mockEligibleOrderConfirm.orderId}`)
      expect(checkbox).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Row Interaction
  // ==========================================================================

  describe('Row Interaction', () => {
    it('keeps the list item non-focusable and exposes a separate row action', () => {
      renderTable({ orders: [mockEligibleOrderConfirm] })
      const row = screen.getByRole('listitem')
      const checkbox = within(row).getByRole('checkbox')
      const rowAction = within(row).getByRole('button', {
        name: `Переключить выбор заказа #${mockEligibleOrderConfirm.orderId}`,
      })

      expect(row).not.toHaveAttribute('tabindex')
      expect(rowAction).not.toContainElement(checkbox)
      expect(rowAction).toHaveAttribute('aria-pressed', 'false')
    })

    it('cursor is pointer on row hover', () => {
      renderTable({ orders: [mockEligibleOrderConfirm] })
      const rowAction = screen.getByRole('button', {
        name: `Переключить выбор заказа #${mockEligibleOrderConfirm.orderId}`,
      })
      expect(rowAction.className).toContain('cursor-pointer')
    })

    it('checkbox click toggles only once', async () => {
      const user = userEvent.setup()
      renderTable({ orders: [mockEligibleOrderConfirm] })
      const checkbox = screen.getByLabelText(`Выбрать заказ #${mockEligibleOrderConfirm.orderId}`)
      await user.click(checkbox)
      // Only one call: from the checkbox, not the row
      expect(mockOnToggleOrder).toHaveBeenCalledTimes(1)
    })
  })

  // ==========================================================================
  // Empty & Edge Cases
  // ==========================================================================

  describe('Empty & Edge Cases', () => {
    it('shows empty state when orders array is empty', () => {
      renderTable({ orders: mockOrdersEmpty })
      expect(screen.getByText('Нет доступных заказов')).toBeInTheDocument()
    })

    it('shows empty state description when no orders', () => {
      renderTable({ orders: mockOrdersEmpty })
      expect(screen.getByText('Нет заказов для добавления в поставку')).toBeInTheDocument()
    })

    it('handles single order correctly', () => {
      renderTable({ orders: [mockEligibleOrderConfirm] })
      expect(screen.getAllByRole('listitem')).toHaveLength(1)
      expect(screen.getByText('SKU-CONFIRM-001')).toBeInTheDocument()
    })

    it('handles orders with null productName', () => {
      renderTable({ orders: [mockOrderNoProductName] })
      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('does not render list when orders are empty', () => {
      renderTable({ orders: mockOrdersEmpty })
      expect(screen.queryByRole('list', { name: 'Список заказов' })).not.toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Accessibility
  // ==========================================================================

  describe('Accessibility', () => {
    it('has no automated accessibility violations', async () => {
      const { container } = renderTable({ orders: mockOrdersSmallDataset })

      expect(await axe(container)).toHaveNoViolations()
    })

    it('uses the react-window list role as the accessible collection', () => {
      renderTable()
      expect(screen.getByRole('list', { name: 'Список заказов' })).toBeInTheDocument()
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    it('rows have role="listitem"', () => {
      renderTable({ orders: mockOrdersSmallDataset })
      const options = screen.getAllByRole('listitem')
      expect(options.length).toBeGreaterThan(0)
    })

    it('selected rows expose a checked checkbox', () => {
      const selectedIds = new Set([mockEligibleOrderConfirm.orderId])
      renderTable({ orders: [mockEligibleOrderConfirm], selectedIds })
      const row = screen.getByRole('listitem')
      expect(within(row).getByRole('checkbox')).toHaveAttribute('data-state', 'checked')
    })

    it('unselected rows expose an unchecked checkbox', () => {
      renderTable({ orders: [mockEligibleOrderConfirm], selectedIds: new Set() })
      const row = screen.getByRole('listitem')
      expect(within(row).getByRole('checkbox')).toHaveAttribute('data-state', 'unchecked')
    })

    it('all checkboxes have accessible labels', () => {
      renderTable({ orders: [mockEligibleOrderConfirm] })
      expect(
        screen.getByLabelText(`Выбрать заказ #${mockEligibleOrderConfirm.orderId}`)
      ).toBeInTheDocument()
    })

    it('does not expose listbox-only selection attributes', () => {
      renderTable()
      const list = screen.getByRole('list', { name: 'Список заказов' })
      expect(list).not.toHaveAttribute('aria-multiselectable')
    })
  })

  // ==========================================================================
  // TDD Verification (existing - fixture validation)
  // ==========================================================================

  describe('TDD Verification', () => {
    it('should have large dataset for virtualization tests', () => {
      expect(mockOrdersLargeDataset).toBeDefined()
      expect(mockOrdersLargeDataset.length).toBe(1000)
    })

    it('should have medium and small datasets', () => {
      expect(mockOrdersMediumDataset.length).toBe(100)
      expect(mockOrdersSmallDataset.length).toBe(10)
      expect(mockOrdersEmpty).toEqual([])
    })

    it('should have correct row height constant', () => {
      expect(DEFAULT_ROW_HEIGHT).toBe(48)
    })

    it('should have correct max selection constant', () => {
      expect(MAX_ORDER_SELECTION).toBe(1000)
    })

    it('should have individual order fixtures', () => {
      expect(mockEligibleOrderConfirm).toBeDefined()
      expect(mockEligibleOrderConfirm.supplierStatus).toBe('confirm')
      expect(mockEligibleOrderComplete.supplierStatus).toBe('complete')
      expect(mockOrderNoProductName.productName).toBeNull()
    })

    it('should have status labels in Russian', () => {
      expect(SUPPLIER_STATUS_LABELS.confirm).toBe('Подтвержден')
      expect(SUPPLIER_STATUS_LABELS.complete).toBe('Завершен')
    })

    it('should have selected IDs helper', () => {
      const ids = createMockSelectedIds(5)
      expect(ids.size).toBe(5)
      expect(ids.has('order-0000000001')).toBe(true)
    })

    it('should have default props defined', () => {
      expect(defaultProps.orders.length).toBe(100)
      expect(defaultProps.height).toBe(600)
      expect(defaultProps.selectedIds.size).toBe(0)
    })
  })
})
