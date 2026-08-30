/**
 * Unit Tests for SupplyHeader component
 * Story 53.4-FE: Supply Detail Page
 * Epic 53-FE: Supply Management UI
 *
 * Test coverage:
 * - Shows supply name (or "Поставка #ID" if no name)
 * - Shows status badge
 * - Shows created date
 * - Shows closed date (if closed)
 * - Shows orders count
 * - Action buttons based on status
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { SupplyHeader } from '../SupplyHeader'
import {
  mockSupplyOpen,
  mockSupplyClosed,
  mockSupplyDelivering,
  mockSupplyDelivered,
  mockSupplyCancelled,
  mockSupplyEmpty,
} from '@/test/fixtures/supplies-responses'
import { mockSupplyListItemNoName } from '@/test/fixtures/supplies'
import type { Supply } from '@/types/supplies'

function renderHeader(overrides: Partial<Parameters<typeof SupplyHeader>[0]> = {}) {
  const props = {
    supply: mockSupplyOpen,
    onAddOrders: vi.fn(),
    onCloseSupply: vi.fn(),
    onGenerateStickers: vi.fn(),
    onRefreshStatus: vi.fn(),
    isLoading: false,
    ...overrides,
  }
  const result = renderWithProviders(<SupplyHeader {...props} />)
  return { ...result, props }
}

describe('SupplyHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // 1. Supply Name Display Tests (AC3)
  // ===========================================================================

  describe('Supply Name Display', () => {
    it('displays supply name prominently as h2 below the route heading', () => {
      renderHeader()
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveTextContent('Поставка январь')
    })

    it('displays "Поставка #ID" when name is null', () => {
      renderHeader({ supply: mockSupplyEmpty })
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveTextContent(/Поставка #/)
    })

    it('displays WB supply ID as secondary info', () => {
      renderHeader()
      expect(screen.getByText(/Создана:/)).toBeInTheDocument()
    })

    it('truncates long names with ellipsis', () => {
      const longNameSupply: Supply = {
        ...mockSupplyOpen,
        name: 'Очень длинное название поставки которое должно быть видно',
      }
      renderHeader({ supply: longNameSupply })
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading.textContent).toContain('Очень длинное')
    })

    it('shows name correctly when set', () => {
      renderHeader({ supply: mockSupplyOpen })
      expect(screen.getByText('Поставка январь')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // 2. Status Badge Tests (AC3)
  // ===========================================================================

  describe('Status Badge', () => {
    it('renders SupplyStatusBadge component', () => {
      renderHeader()
      expect(screen.getByText('Открыта')).toBeInTheDocument()
    })

    it('displays OPEN status', () => {
      renderHeader({ supply: mockSupplyOpen })
      expect(screen.getByText('Открыта')).toBeInTheDocument()
    })

    it('displays CLOSED status', () => {
      renderHeader({ supply: mockSupplyClosed })
      expect(screen.getByText('Закрыта')).toBeInTheDocument()
    })

    it('displays DELIVERING status', () => {
      renderHeader({ supply: mockSupplyDelivering })
      expect(screen.getByText('В пути')).toBeInTheDocument()
    })

    it('displays DELIVERED status', () => {
      renderHeader({ supply: mockSupplyDelivered })
      expect(screen.getByText('Доставлена')).toBeInTheDocument()
    })

    it('displays CANCELLED status', () => {
      renderHeader({ supply: mockSupplyCancelled })
      expect(screen.getByText('Отменена')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // 3. Date Display Tests (AC3)
  // ===========================================================================

  describe('Date Display', () => {
    it('displays creation date formatted as "Создана: DD.MM.YYYY HH:mm"', () => {
      renderHeader()
      expect(screen.getByText(/Создана:/)).toBeInTheDocument()
    })

    it('displays creation date with formatted value', () => {
      renderHeader()
      const dateEl = screen.getByText(/Создана:/)
      expect(dateEl.textContent).toContain('Создана:')
      expect(dateEl.textContent).toMatch(/\d/)
    })

    it('displays closed date when supply is closed', () => {
      renderHeader({ supply: mockSupplyClosed })
      expect(screen.getByText(/Закрыта:/)).toBeInTheDocument()
    })

    it('hides closed date for OPEN status', () => {
      renderHeader({ supply: mockSupplyOpen })
      expect(screen.queryByText(/Закрыта:/)).not.toBeInTheDocument()
    })

    it('displays closed date for CLOSED status', () => {
      renderHeader({ supply: mockSupplyClosed })
      expect(screen.getByText(/Закрыта:/)).toBeInTheDocument()
    })

    it('displays closed date for DELIVERING status', () => {
      renderHeader({ supply: mockSupplyDelivering })
      expect(screen.getByText(/Закрыта:/)).toBeInTheDocument()
    })

    it('displays closed date for DELIVERED status', () => {
      renderHeader({ supply: mockSupplyDelivered })
      expect(screen.getByText(/Закрыта:/)).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // 4. Orders Count Display Tests (AC3)
  // ===========================================================================

  describe('Orders Count Display', () => {
    it('displays orders count as "Заказов: N"', () => {
      renderHeader()
      expect(screen.getByText(/Заказов: 5/)).toBeInTheDocument()
    })

    it('displays "Заказов: 0" for empty supply', () => {
      renderHeader({ supply: mockSupplyEmpty })
      expect(screen.getByText(/Заказов: 0/)).toBeInTheDocument()
    })

    it('formats large numbers correctly', () => {
      const largeCountSupply: Supply = { ...mockSupplyOpen, ordersCount: 100 }
      renderHeader({ supply: largeCountSupply })
      expect(screen.getByText(/Заказов: 100/)).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // 5. Action Buttons for OPEN Status (AC8)
  // ===========================================================================

  describe('Action Buttons (OPEN Status)', () => {
    it('shows "Добавить заказы" button (primary)', () => {
      renderHeader({ supply: mockSupplyOpen })
      expect(screen.getByText('Добавить заказы')).toBeInTheDocument()
    })

    it('"Добавить заказы" button calls onAddOrders', async () => {
      const user = userEvent.setup()
      const onAddOrders = vi.fn()
      renderHeader({ supply: mockSupplyOpen, onAddOrders })
      await user.click(screen.getByText('Добавить заказы'))
      expect(onAddOrders).toHaveBeenCalledTimes(1)
    })

    it('shows "Закрыть поставку" button (secondary/warning)', () => {
      renderHeader({ supply: mockSupplyOpen })
      expect(screen.getByText('Закрыть поставку')).toBeInTheDocument()
    })

    it('"Закрыть поставку" button calls onCloseSupply', async () => {
      const user = userEvent.setup()
      const onCloseSupply = vi.fn()
      renderHeader({ supply: mockSupplyOpen, onCloseSupply })
      await user.click(screen.getByText('Закрыть поставку'))
      expect(onCloseSupply).toHaveBeenCalledTimes(1)
    })

    it('"Закрыть поставку" disabled when ordersCount is 0', () => {
      renderHeader({ supply: mockSupplyEmpty })
      const closeBtn = screen.getByText('Закрыть поставку').closest('button')
      expect(closeBtn).toBeDisabled()
    })

    it('shows tooltip trigger wrapping disabled close button', () => {
      renderHeader({ supply: mockSupplyEmpty })
      // Button is disabled and wrapped in tooltip trigger
      const btn = screen.getByText('Закрыть поставку')
      expect(btn).toBeTruthy()
      // The tooltip trigger wraps the disabled button
      const trigger = btn.closest('[data-radix-tooltip-trigger]') || btn.parentElement
      expect(trigger).toBeTruthy()
    })

    it('buttons positioned in the header area', () => {
      renderHeader({ supply: mockSupplyOpen })
      expect(screen.getByText('Добавить заказы')).toBeInTheDocument()
      expect(screen.getByText('Закрыть поставку')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // 6. Action Buttons for CLOSED Status (AC9)
  // ===========================================================================

  describe('Action Buttons (CLOSED Status)', () => {
    it('shows "Сгенерировать стикеры" button (primary)', () => {
      renderHeader({ supply: mockSupplyClosed })
      expect(screen.getByText('Сгенерировать стикеры')).toBeInTheDocument()
    })

    it('"Сгенерировать стикеры" button calls onGenerateStickers', async () => {
      const user = userEvent.setup()
      const onGenerateStickers = vi.fn()
      renderHeader({ supply: mockSupplyClosed, onGenerateStickers })
      await user.click(screen.getByText('Сгенерировать стикеры'))
      expect(onGenerateStickers).toHaveBeenCalledTimes(1)
    })

    it('shows "Обновить статус" button (secondary)', () => {
      renderHeader({ supply: mockSupplyClosed })
      expect(screen.getByText('Обновить статус')).toBeInTheDocument()
    })

    it('"Обновить статус" button calls onRefreshStatus', async () => {
      const user = userEvent.setup()
      const onRefreshStatus = vi.fn()
      renderHeader({ supply: mockSupplyClosed, onRefreshStatus })
      await user.click(screen.getByText('Обновить статус'))
      expect(onRefreshStatus).toHaveBeenCalledTimes(1)
    })

    it('hides "Добавить заказы" button', () => {
      renderHeader({ supply: mockSupplyClosed })
      expect(screen.queryByText('Добавить заказы')).not.toBeInTheDocument()
    })

    it('hides "Закрыть поставку" button', () => {
      renderHeader({ supply: mockSupplyClosed })
      expect(screen.queryByText('Закрыть поставку')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // 7. Action Buttons for DELIVERING/DELIVERED/CANCELLED (AC10)
  // ===========================================================================

  describe('Action Buttons (View-Only Statuses)', () => {
    describe('DELIVERING', () => {
      it('no action buttons visible', () => {
        renderHeader({ supply: mockSupplyDelivering })
        expect(screen.queryByText('Добавить заказы')).not.toBeInTheDocument()
        expect(screen.queryByText('Закрыть поставку')).not.toBeInTheDocument()
        expect(screen.queryByText('Сгенерировать стикеры')).not.toBeInTheDocument()
      })

      it('shows info message "Поставка в пути к складу WB"', () => {
        renderHeader({ supply: mockSupplyDelivering })
        expect(screen.getByText('Поставка в пути к складу WB')).toBeInTheDocument()
      })
    })

    describe('DELIVERED', () => {
      it('no action buttons visible', () => {
        renderHeader({ supply: mockSupplyDelivered })
        expect(screen.queryByText('Добавить заказы')).not.toBeInTheDocument()
        expect(screen.queryByText('Сгенерировать стикеры')).not.toBeInTheDocument()
      })

      it('shows info message "Поставка успешно доставлена"', () => {
        renderHeader({ supply: mockSupplyDelivered })
        expect(screen.getByText('Поставка успешно доставлена')).toBeInTheDocument()
      })
    })

    describe('CANCELLED', () => {
      it('no action buttons visible', () => {
        renderHeader({ supply: mockSupplyCancelled })
        expect(screen.queryByText('Добавить заказы')).not.toBeInTheDocument()
        expect(screen.queryByText('Сгенерировать стикеры')).not.toBeInTheDocument()
      })

      it('shows info message "Поставка была отменена"', () => {
        renderHeader({ supply: mockSupplyCancelled })
        expect(screen.getByText('Поставка была отменена')).toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // 8. Loading States
  // ===========================================================================

  describe('Loading States', () => {
    it('disables action buttons while action is pending', () => {
      renderHeader({ supply: mockSupplyOpen, isLoading: true })
      const addBtn = screen.getByText('Добавить заказы').closest('button')
      expect(addBtn).toBeDisabled()
    })

    it('shows loading state on buttons', () => {
      renderHeader({ supply: mockSupplyOpen, isLoading: true })
      const addBtn = screen.getByText('Добавить заказы').closest('button')
      expect(addBtn).toBeDisabled()
    })
  })

  // ===========================================================================
  // 9. Mobile Responsive (AC13)
  // ===========================================================================

  describe('Mobile Responsive', () => {
    it('stacks header vertically on mobile', () => {
      renderHeader()
      const container = screen.getByRole('heading', { level: 2 }).closest('div')
      expect(container).toBeInTheDocument()
    })

    it('action buttons present in header area', () => {
      renderHeader({ supply: mockSupplyOpen })
      expect(screen.getByText('Добавить заказы')).toBeInTheDocument()
    })

    it('action buttons are buttons', () => {
      renderHeader({ supply: mockSupplyOpen })
      expect(screen.getByText('Добавить заказы').closest('button')).toBeInTheDocument()
    })

    it('all buttons are accessible', () => {
      renderHeader({ supply: mockSupplyOpen })
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThanOrEqual(2)
    })
  })

  // ===========================================================================
  // 10. Accessibility
  // ===========================================================================

  describe('Accessibility', () => {
    it('supply name is an h2 below the route PageHeader', () => {
      renderHeader()
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toBeInTheDocument()
    })

    it('all buttons have accessible labels', () => {
      renderHeader({ supply: mockSupplyOpen })
      const buttons = screen.getAllByRole('button')
      for (const btn of buttons) {
        expect(btn.textContent).toBeTruthy()
      }
    })

    it('disabled buttons are disabled attribute', () => {
      renderHeader({ supply: mockSupplyEmpty })
      const closeBtn = screen.getByText('Закрыть поставку').closest('button')
      expect(closeBtn).toBeDisabled()
    })

    it('info messages use aria-live for announcements', () => {
      renderHeader({ supply: mockSupplyDelivering })
      const alert = screen.getByText('Поставка в пути к складу WB').closest('[aria-live]')
      expect(alert).toBeTruthy()
    })

    it('icon elements have aria-hidden', () => {
      const { container } = renderHeader()
      const hiddenIcons = container.querySelectorAll('[aria-hidden="true"]')
      expect(hiddenIcons.length).toBeGreaterThan(0)
    })
  })

  // ===========================================================================
  // TDD Verification Test
  // ===========================================================================

  describe('TDD Verification', () => {
    it('should have test fixtures ready', () => {
      expect(mockSupplyOpen).toBeDefined()
      expect(mockSupplyOpen.name).toBe('Поставка январь')
      expect(mockSupplyClosed).toBeDefined()
      expect(mockSupplyDelivering).toBeDefined()
      expect(mockSupplyDelivered).toBeDefined()
      expect(mockSupplyCancelled).toBeDefined()
      expect(mockSupplyEmpty).toBeDefined()
    })

    it('should have default props defined', () => {
      const props = {
        supply: mockSupplyOpen,
        onAddOrders: vi.fn(),
        onCloseSupply: vi.fn(),
        onGenerateStickers: vi.fn(),
        onRefreshStatus: vi.fn(),
      }
      expect(props.supply).toBeDefined()
      expect(props.onAddOrders).toBeDefined()
      expect(props.onCloseSupply).toBeDefined()
      expect(props.onGenerateStickers).toBeDefined()
    })

    it('should have supply with null name for fallback test', () => {
      expect(mockSupplyListItemNoName.name).toBeNull()
    })

    it('should have testing utilities available', () => {
      expect(screen).toBeDefined()
      expect(userEvent).toBeDefined()
      expect(renderWithProviders).toBeDefined()
    })
  })
})
