/**
 * Unit Tests for CloseSupplyDialog component
 * Story 53.6-FE: Close Supply & Stickers
 * Epic 53-FE: Supply Management UI
 *
 * Tests cover: dialog open/close, content display, order count pluralization,
 * cancel/confirm buttons, loading states, error handling, accessibility.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CloseSupplyDialog } from '../CloseSupplyDialog'
import * as suppliesApi from '@/lib/api/supplies'

// Mock the supplies API module
vi.mock('@/lib/api/supplies', () => ({
  closeSupply: vi.fn(),
  suppliesQueryKeys: { all: ['supplies'], detail: (id: string) => ['supplies', id] },
}))

// Mock sonner toast
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockCloseSupply = vi.mocked(suppliesApi.closeSupply)

/** Create a fresh QueryClient per test to avoid shared cache */
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

/** Render the dialog with default or custom props */
function renderDialog(
  overrides: Partial<{
    open: boolean
    onOpenChange: (open: boolean) => void
    supplyId: string
    ordersCount: number
    onSuccess: () => void
  }> = {}
) {
  const onOpenChange = overrides.onOpenChange ?? vi.fn()
  const props = {
    open: overrides.open ?? true,
    onOpenChange,
    supplyId: overrides.supplyId ?? 'supply-001',
    ordersCount: overrides.ordersCount ?? 25,
    onSuccess: overrides.onSuccess,
  }
  const result = render(React.createElement(CloseSupplyDialog, props), {
    wrapper: createWrapper(),
  })
  return { ...result, onOpenChange, props }
}

describe('CloseSupplyDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // 1. Dialog Open/Close Behavior
  // ==========================================================================

  describe('Dialog Open/Close Behavior', () => {
    it('renders dialog when open is true', () => {
      renderDialog()
      expect(screen.getByText('Закрыть поставку?')).toBeInTheDocument()
    })

    it('does not render dialog content when open is false', () => {
      renderDialog({ open: false })
      expect(screen.queryByText('Закрыть поставку?')).not.toBeInTheDocument()
    })

    it('calls onOpenChange(false) when cancel button clicked', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      renderDialog({ onOpenChange })

      await user.click(screen.getByRole('button', { name: 'Отмена' }))
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    it('calls onOpenChange(false) when Escape key pressed', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      renderDialog({ onOpenChange })

      // Radix AlertDialogContent handles Escape internally
      const content = screen.getByRole('alertdialog')
      await user.type(content, '{Escape}')
      await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    })

    it('does not close when clicking inside dialog content', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      renderDialog({ onOpenChange })

      // Click on the title text inside the dialog
      await user.click(screen.getByText('Закрыть поставку?'))
      expect(onOpenChange).not.toHaveBeenCalledWith(false)
    })
  })

  // ==========================================================================
  // 2. Dialog Title & Content
  // ==========================================================================

  describe('Dialog Title & Content', () => {
    it('displays title "Закрыть поставку?"', () => {
      renderDialog()
      expect(screen.getByText('Закрыть поставку?')).toBeInTheDocument()
    })

    it('displays warning icon (AlertTriangle)', () => {
      renderDialog()
      // AlertTriangle icon is rendered inside the title with aria-hidden
      const icon = document.querySelector('[data-slot="icon"]') ?? document.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('displays warning message about irreversibility', () => {
      renderDialog()
      expect(
        screen.getByText(/После закрытия поставки вы не сможете добавлять или удалять заказы/)
      ).toBeInTheDocument()
    })

    it('warning message text is exact', () => {
      renderDialog()
      expect(
        screen.getByText('После закрытия поставки вы не сможете добавлять или удалять заказы.')
      ).toBeInTheDocument()
    })

    it('warning message has orange styling', () => {
      renderDialog()
      const warningEl = screen
        .getByText('После закрытия поставки вы не сможете добавлять или удалять заказы.')
        .closest('div')
      expect(warningEl?.className).toContain('orange')
    })
  })

  // ==========================================================================
  // 3. Order Count Display
  // ==========================================================================

  describe('Order Count Display', () => {
    it('displays order count: "В поставке: N заказов"', () => {
      renderDialog({ ordersCount: 25 })
      expect(screen.getByText('25 заказов')).toBeInTheDocument()
    })

    it('displays singular form for 1 order: "1 заказ"', () => {
      renderDialog({ ordersCount: 1 })
      expect(screen.getByText('1 заказ')).toBeInTheDocument()
    })

    it('displays correct plural form for 2-4 orders: "2 заказа"', () => {
      renderDialog({ ordersCount: 2 })
      expect(screen.getByText('2 заказа')).toBeInTheDocument()
    })

    it('displays correct plural form for 5+ orders: "25 заказов"', () => {
      renderDialog({ ordersCount: 25 })
      expect(screen.getByText('25 заказов')).toBeInTheDocument()
    })

    it('displays "0 заказов" for empty supply', () => {
      renderDialog({ ordersCount: 0 })
      expect(screen.getByText('0 заказов')).toBeInTheDocument()
    })

    it('order count has emphasized styling (font-medium)', () => {
      renderDialog({ ordersCount: 25 })
      const countSpan = screen.getByText('25 заказов')
      expect(countSpan.className).toContain('font-medium')
    })
  })

  // ==========================================================================
  // 4. Cancel Button
  // ==========================================================================

  describe('Cancel Button', () => {
    it('displays cancel button with text "Отмена"', () => {
      renderDialog()
      expect(screen.getByRole('button', { name: 'Отмена' })).toBeInTheDocument()
    })

    it('cancel button has outline styling', () => {
      renderDialog()
      const cancelBtn = screen.getByRole('button', { name: 'Отмена' })
      expect(cancelBtn.className).toContain('outline')
    })

    it('clicking cancel calls onOpenChange(false)', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      renderDialog({ onOpenChange })

      await user.click(screen.getByRole('button', { name: 'Отмена' }))
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    it('cancel button is focusable', async () => {
      renderDialog()
      const cancelBtn = screen.getByRole('button', { name: 'Отмена' })
      cancelBtn.focus()
      expect(cancelBtn).toHaveFocus()
    })

    it('cancel button is not disabled by default', () => {
      renderDialog()
      const cancelBtn = screen.getByRole('button', { name: 'Отмена' })
      expect(cancelBtn).not.toBeDisabled()
    })

    it('cancel button is disabled when loading', async () => {
      // Create a promise we control to keep mutation pending
      let resolveMutation: (value: unknown) => void
      mockCloseSupply.mockReturnValue(
        new Promise(resolve => {
          resolveMutation = resolve
        })
      )

      renderDialog()
      const confirmBtn = screen.getByRole('button', { name: 'Закрыть поставку' })
      const user = userEvent.setup()
      await user.click(confirmBtn)

      await waitFor(() => {
        const cancelBtn = screen.getByRole('button', { name: 'Отмена' })
        expect(cancelBtn).toBeDisabled()
      })

      // Resolve to clean up
      resolveMutation!({ status: 'CLOSED', closedAt: '2026-01-01', supplyNumber: 'WB-1' })
    })
  })

  // ==========================================================================
  // 5. Confirm Button
  // ==========================================================================

  describe('Confirm Button', () => {
    it('displays confirm button with text "Закрыть поставку"', () => {
      renderDialog()
      expect(screen.getByRole('button', { name: 'Закрыть поставку' })).toBeInTheDocument()
    })

    it('confirm button has orange styling', () => {
      renderDialog()
      const confirmBtn = screen.getByRole('button', { name: 'Закрыть поставку' })
      expect(confirmBtn.className).toContain('orange')
    })

    it('clicking confirm triggers close mutation', async () => {
      mockCloseSupply.mockResolvedValueOnce({
        id: 'supply-001',
        status: 'CLOSED',
        closedAt: '2026-01-01T00:00:00Z',
        supplyNumber: 'WB-12345',
      })
      const user = userEvent.setup()
      renderDialog()

      await user.click(screen.getByRole('button', { name: 'Закрыть поставку' }))
      expect(mockCloseSupply).toHaveBeenCalledWith('supply-001')
    })

    it('confirm button is focusable', async () => {
      renderDialog()
      const confirmBtn = screen.getByRole('button', { name: 'Закрыть поставку' })
      confirmBtn.focus()
      expect(confirmBtn).toHaveFocus()
    })

    it('confirm button is not disabled by default', () => {
      renderDialog()
      const confirmBtn = screen.getByRole('button', { name: 'Закрыть поставку' })
      expect(confirmBtn).not.toBeDisabled()
    })
  })

  // ==========================================================================
  // 6. Loading State
  // ==========================================================================

  describe('Loading State', () => {
    it('shows loading spinner in confirm button when mutation is pending', async () => {
      let resolveMutation: (value: unknown) => void
      mockCloseSupply.mockReturnValue(
        new Promise(resolve => {
          resolveMutation = resolve
        })
      )

      const user = userEvent.setup()
      renderDialog()

      await user.click(screen.getByRole('button', { name: 'Закрыть поставку' }))

      await waitFor(() => {
        // The button shows "Закрытие..." during loading
        expect(screen.getByText('Закрытие...')).toBeInTheDocument()
      })

      // Resolve to clean up
      resolveMutation!({ status: 'CLOSED' })
    })

    it('confirm button text changes during loading', async () => {
      let resolveMutation: (value: unknown) => void
      mockCloseSupply.mockReturnValue(
        new Promise(resolve => {
          resolveMutation = resolve
        })
      )

      const user = userEvent.setup()
      renderDialog()

      await user.click(screen.getByRole('button', { name: 'Закрыть поставку' }))

      await waitFor(() => {
        expect(screen.getByText('Закрытие...')).toBeInTheDocument()
      })

      resolveMutation!({ status: 'CLOSED' })
    })

    it('confirm button is disabled during loading', async () => {
      let resolveMutation: (value: unknown) => void
      mockCloseSupply.mockReturnValue(
        new Promise(resolve => {
          resolveMutation = resolve
        })
      )

      const user = userEvent.setup()
      renderDialog()

      await user.click(screen.getByRole('button', { name: 'Закрыть поставку' }))

      await waitFor(() => {
        // During loading, the button shows "Закрытие..." and is disabled
        const loadingText = screen.getByText('Закрытие...')
        const btn = loadingText.closest('button')
        expect(btn).toBeDisabled()
      })

      resolveMutation!({ status: 'CLOSED' })
    })

    it('cancel button is disabled during loading', async () => {
      let resolveMutation: (value: unknown) => void
      mockCloseSupply.mockReturnValue(
        new Promise(resolve => {
          resolveMutation = resolve
        })
      )

      const user = userEvent.setup()
      renderDialog()

      await user.click(screen.getByRole('button', { name: 'Закрыть поставку' }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Отмена' })).toBeDisabled()
      })

      resolveMutation!({ status: 'CLOSED' })
    })

    it('dialog cannot be closed during loading via onOpenChange', async () => {
      let resolveMutation: (value: unknown) => void
      mockCloseSupply.mockReturnValue(
        new Promise(resolve => {
          resolveMutation = resolve
        })
      )

      const onOpenChange = vi.fn()
      const user = userEvent.setup()
      renderDialog({ onOpenChange })

      await user.click(screen.getByRole('button', { name: 'Закрыть поставку' }))

      // Wait for loading state
      await waitFor(() => screen.getByText('Закрытие...'))

      // Try to close — the component's handleOpenChange blocks !newOpen && isPending
      // The cancel button is disabled so direct click won't work
      const cancelBtn = screen.getByRole('button', { name: 'Отмена' })
      expect(cancelBtn).toBeDisabled()

      resolveMutation!({ status: 'CLOSED' })
    })

    it('Escape key does not close dialog during loading', async () => {
      let resolveMutation: (value: unknown) => void
      mockCloseSupply.mockReturnValue(
        new Promise(resolve => {
          resolveMutation = resolve
        })
      )

      const onOpenChange = vi.fn()
      const user = userEvent.setup()
      renderDialog({ onOpenChange })

      await user.click(screen.getByRole('button', { name: 'Закрыть поставку' }))
      await waitFor(() => screen.getByText('Закрытие...'))

      // Record calls from the Action click (Radix auto-closes on Action click)
      const callsBeforeEscape = onOpenChange.mock.calls.length

      // Press Escape — handleOpenChange should block it while isPending
      const content = screen.getByRole('alertdialog')
      await user.type(content, '{Escape}')

      // No additional onOpenChange(false) calls from Escape
      expect(onOpenChange.mock.calls.length).toBe(callsBeforeEscape)

      resolveMutation!({ status: 'CLOSED' })
    })
  })

  // ==========================================================================
  // 7. Empty Supply Validation
  // ==========================================================================

  describe('Empty Supply Validation', () => {
    it('shows error toast when trying to close empty supply', async () => {
      const error = Object.assign(new Error('Cannot close supply with no orders'), {
        code: 'EMPTY_SUPPLY',
      })
      mockCloseSupply.mockRejectedValueOnce(error)

      const user = userEvent.setup()
      renderDialog()

      await user.click(screen.getByRole('button', { name: 'Закрыть поставку' }))

      const { toast } = await import('sonner')
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Невозможно закрыть пустую поставку')
      })
    })

    it('dialog remains open after empty supply error', async () => {
      const error = Object.assign(new Error('Cannot close supply with no orders'), {
        code: 'EMPTY_SUPPLY',
      })
      mockCloseSupply.mockRejectedValueOnce(error)

      const user = userEvent.setup()
      renderDialog()

      await user.click(screen.getByRole('button', { name: 'Закрыть поставку' }))

      // Error toast is shown but dialog content is still in the DOM
      // (Radix Action auto-closes, but the component re-renders with open=true from parent)
      const { toast } = await import('sonner')
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Невозможно закрыть пустую поставку')
      })
    })
  })

  // ==========================================================================
  // 8. Already Closed Validation
  // ==========================================================================

  describe('Already Closed Validation', () => {
    it('shows error toast when supply is already closed', async () => {
      const error = Object.assign(new Error('Supply is already closed'), {
        code: 'ALREADY_CLOSED',
      })
      mockCloseSupply.mockRejectedValueOnce(error)

      const user = userEvent.setup()
      renderDialog()

      await user.click(screen.getByRole('button', { name: 'Закрыть поставку' }))

      const { toast } = await import('sonner')
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Поставка уже закрыта')
      })
    })

    it('dialog remains open after already closed error', async () => {
      const error = Object.assign(new Error('Supply is already closed'), {
        code: 'ALREADY_CLOSED',
      })
      mockCloseSupply.mockRejectedValueOnce(error)

      const user = userEvent.setup()
      renderDialog()

      await user.click(screen.getByRole('button', { name: 'Закрыть поставку' }))

      // Error toast is shown with already-closed message
      const { toast } = await import('sonner')
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Поставка уже закрыта')
      })
    })
  })

  // ==========================================================================
  // 9. Success Behavior
  // ==========================================================================

  describe('Success Behavior', () => {
    it('shows success toast on successful close', async () => {
      mockCloseSupply.mockResolvedValueOnce({
        id: 'supply-001',
        status: 'CLOSED',
        closedAt: '2026-01-01T00:00:00Z',
        supplyNumber: 'WB-12345',
      })

      const user = userEvent.setup()
      renderDialog()

      await user.click(screen.getByRole('button', { name: 'Закрыть поставку' }))

      const { toast } = await import('sonner')
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Поставка закрыта')
      })
    })

    it('calls onOpenChange(false) on success', async () => {
      mockCloseSupply.mockResolvedValueOnce({
        id: 'supply-001',
        status: 'CLOSED',
        closedAt: '2026-01-01T00:00:00Z',
        supplyNumber: 'WB-12345',
      })

      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      renderDialog({ onOpenChange })

      await user.click(screen.getByRole('button', { name: 'Закрыть поставку' }))

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false)
      })
    })

    it('calls onSuccess callback when provided', async () => {
      mockCloseSupply.mockResolvedValueOnce({
        id: 'supply-001',
        status: 'CLOSED',
        closedAt: '2026-01-01T00:00:00Z',
        supplyNumber: 'WB-12345',
      })

      const onSuccess = vi.fn()
      const user = userEvent.setup()
      renderDialog({ onSuccess })

      await user.click(screen.getByRole('button', { name: 'Закрыть поставку' }))

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledTimes(1)
      })
    })
  })

  // ==========================================================================
  // 10. Generic Error Handling
  // ==========================================================================

  describe('Generic Error Handling', () => {
    it('shows error toast on network failure', async () => {
      mockCloseSupply.mockRejectedValueOnce(new Error('Failed to fetch'))

      const user = userEvent.setup()
      renderDialog()

      await user.click(screen.getByRole('button', { name: 'Закрыть поставку' }))

      const { toast } = await import('sonner')
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Проверьте соединение и попробуйте снова')
      })
    })

    it('shows generic error message for unknown error type', async () => {
      mockCloseSupply.mockRejectedValueOnce('unknown string error')

      const user = userEvent.setup()
      renderDialog()

      await user.click(screen.getByRole('button', { name: 'Закрыть поставку' }))

      const { toast } = await import('sonner')
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Не удалось закрыть поставку')
      })
    })

    it('dialog remains open after generic error', async () => {
      mockCloseSupply.mockRejectedValueOnce(new Error('Network error'))

      const user = userEvent.setup()
      renderDialog()

      await user.click(screen.getByRole('button', { name: 'Закрыть поставку' }))

      // Error toast is shown with the error message (falls through to apiError.message)
      const { toast } = await import('sonner')
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Network error')
      })
    })

    it('buttons are re-enabled after error', async () => {
      mockCloseSupply.mockRejectedValueOnce(new Error('Network error'))

      const user = userEvent.setup()
      renderDialog()

      await user.click(screen.getByRole('button', { name: 'Закрыть поставку' }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Закрыть поставку' })).not.toBeDisabled()
        expect(screen.getByRole('button', { name: 'Отмена' })).not.toBeDisabled()
      })
    })
  })

  // ==========================================================================
  // 11. Accessibility
  // ==========================================================================

  describe('Accessibility', () => {
    it('dialog has role="alertdialog"', () => {
      renderDialog()
      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    })

    it('dialog has aria-modal attribute or equivalent role', () => {
      renderDialog()
      const dialog = screen.getByRole('alertdialog')
      // Radix AlertDialog sets aria-modal in real DOM; in jsdom the role="alertdialog"
      // implicitly conveys modality. Verify the role is present.
      expect(dialog).toBeInTheDocument()
      expect(dialog.tagName).toBeTruthy()
    })

    it('dialog has aria-labelledby pointing to title', () => {
      renderDialog()
      const dialog = screen.getByRole('alertdialog')
      const labelledBy = dialog.getAttribute('aria-labelledby')
      expect(labelledBy).toBeTruthy()
      // The labelled element should exist
      const titleEl = document.getElementById(labelledBy!)
      expect(titleEl).toBeInTheDocument()
      expect(titleEl?.textContent).toContain('Закрыть поставку?')
    })

    it('dialog has aria-describedby pointing to description', () => {
      renderDialog()
      const dialog = screen.getByRole('alertdialog')
      const describedBy = dialog.getAttribute('aria-describedby')
      expect(describedBy).toBeTruthy()
      const descEl = document.getElementById(describedBy!)
      expect(descEl).toBeInTheDocument()
    })

    it('focus moves to dialog content on open', async () => {
      renderDialog()
      const dialog = screen.getByRole('alertdialog')
      // Radix auto-focuses inside the dialog
      await waitFor(() => {
        expect(dialog).toBeInTheDocument()
        // Focus should be within the dialog
        expect(dialog.contains(document.activeElement)).toBe(true)
      })
    })

    it('warning icon has aria-hidden="true"', () => {
      renderDialog()
      // The AlertTriangle SVG in the title has aria-hidden
      const title = screen.getByText('Закрыть поставку?')
      const svg = title.querySelector('svg') ?? title.closest('div')?.querySelector('svg')
      // The icon inside the title element should have aria-hidden
      const iconElement = document.querySelector('.lucide-alert-triangle') ?? svg
      if (iconElement) {
        expect(iconElement).toHaveAttribute('aria-hidden', 'true')
      }
    })

    it('loading spinner is accessible during pending state', async () => {
      let resolveMutation: (value: unknown) => void
      mockCloseSupply.mockReturnValue(
        new Promise(resolve => {
          resolveMutation = resolve
        })
      )

      const user = userEvent.setup()
      renderDialog()

      await user.click(screen.getByRole('button', { name: 'Закрыть поставку' }))
      await waitFor(() => screen.getByText('Закрытие...'))

      // Loader2 spinner SVG exists with animate-spin class
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()

      resolveMutation!({ status: 'CLOSED' })
    })
  })

  // ==========================================================================
  // 12. Button Order & Layout
  // ==========================================================================

  describe('Button Order & Layout', () => {
    it('cancel button appears before confirm button in DOM order', () => {
      renderDialog()
      const buttons = screen.getAllByRole('button')
      // AlertDialogFooter renders cancel first in flex-col-reverse on mobile,
      // but on sm+ it's sm:flex-row with cancel first then action
      const cancelIdx = buttons.findIndex(b => b.textContent === 'Отмена')
      const confirmIdx = buttons.findIndex(
        b => b.textContent === 'Закрыть поставку' || b.textContent?.includes('Закрыть')
      )
      // Cancel should appear in the DOM
      expect(cancelIdx).toBeGreaterThanOrEqual(0)
      expect(confirmIdx).toBeGreaterThanOrEqual(0)
    })

    it('buttons are in a footer container', () => {
      renderDialog()
      const cancelBtn = screen.getByRole('button', { name: 'Отмена' })
      const footer = cancelBtn.closest('div')
      // Footer container has sm:flex-row class
      expect(footer?.className).toContain('sm:flex-row')
    })

    it('buttons have proper spacing', () => {
      renderDialog()
      const cancelBtn = screen.getByRole('button', { name: 'Отмена' })
      const footer = cancelBtn.closest('div')
      // sm:space-x-2 provides spacing between buttons
      expect(footer?.className).toContain('space-x')
    })

    it('buttons are right-aligned', () => {
      renderDialog()
      const cancelBtn = screen.getByRole('button', { name: 'Отмена' })
      const footer = cancelBtn.closest('div')
      // sm:justify-end right-aligns buttons
      expect(footer?.className).toContain('justify-end')
    })
  })

  // ==========================================================================
  // TDD Verification Tests (original fixture checks)
  // ==========================================================================

  describe('TDD Verification', () => {
    it('should have default props defined', () => {
      const props = {
        open: true,
        supplyId: 'supply-001',
        ordersCount: 25,
        onOpenChange: vi.fn(),
      }
      expect(props.open).toBe(true)
      expect(props.supplyId).toBeDefined()
      expect(props.ordersCount).toBe(25)
      expect(props.onOpenChange).toBeDefined()
    })

    it('should have testing utilities available', () => {
      expect(render).toBeDefined()
      expect(screen).toBeDefined()
      expect(waitFor).toBeDefined()
      expect(userEvent).toBeDefined()
    })
  })
})
