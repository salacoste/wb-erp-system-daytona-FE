/**
 * TDD Unit Tests for CreateSupplyModal component
 * Story 53.3-FE: Create Supply Flow
 * Epic 53-FE: Supply Management UI
 *
 * Tests written BEFORE implementation (TDD approach)
 * Focus: Modal behavior, form validation, accessibility, success/error flows
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { axe, toHaveNoViolations } from 'jest-axe'

// Extend expect with axe matchers
expect.extend(toHaveNoViolations)

// Mock next/navigation - using vi.hoisted to avoid hoisting issues
const { mockPush } = vi.hoisted(() => ({
  mockPush: vi.fn(),
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
  }),
}))

// Mock toast from sonner - using vi.hoisted to avoid hoisting issues
const { mockToast } = vi.hoisted(() => ({
  mockToast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))
vi.mock('sonner', () => ({
  toast: mockToast,
}))

// Mock API module - using vi.hoisted to avoid hoisting issues
const { mockCreateSupply } = vi.hoisted(() => ({
  mockCreateSupply: vi.fn(),
}))
vi.mock('@/lib/api/supplies', () => ({
  createSupply: (data: unknown) => mockCreateSupply(data),
  suppliesQueryKeys: {
    all: ['supplies'],
    list: (params?: unknown) => ['supplies', 'list', params],
  },
}))

// Import component after mocks
import { CreateSupplyModal } from '../CreateSupplyModal'
import {
  mockCreatedSupplyWithName,
  mockCreatedSupplyGenerated,
  mockValidationErrorNameTooLong,
  mockServerError,
  mockNetworkError,
  mockForbiddenError,
  mockRateLimitError,
} from '@/test/fixtures/supplies-mutations'

// Test query client factory
const createTestQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })

// Test wrapper with providers
function renderWithProviders(
  ui: React.ReactElement,
  queryClient?: QueryClient
): ReturnType<typeof render> {
  const client = queryClient ?? createTestQueryClient()
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe('CreateSupplyModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateSupply.mockResolvedValue(mockCreatedSupplyWithName)
  })

  // ==========================================================================
  // AC2: Modal Display & Visibility
  // ==========================================================================

  describe('AC2: Modal Display & Visibility', () => {
    it('renders nothing when open is false', () => {
      renderWithProviders(<CreateSupplyModal open={false} onOpenChange={vi.fn()} />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('renders modal when open is true', () => {
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('has max-width of 400px', () => {
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog.className).toMatch(/max-w-\[400px\]|max-w-sm/)
    })

    it('displays title "Новая поставка"', () => {
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      expect(screen.getByText('Новая поставка')).toBeInTheDocument()
    })

    it('displays description "Создайте поставку для группировки заказов"', () => {
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      expect(screen.getByText('Создайте поставку для группировки заказов')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // AC3: Modal Form
  // ==========================================================================

  describe('AC3: Modal Form - Name Input', () => {
    it('renders name input field', () => {
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('has label "Название поставки (опционально)"', () => {
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      expect(screen.getByLabelText(/название поставки/i)).toBeInTheDocument()
    })

    it('has placeholder "Например: Поставка на склад Коледино"', () => {
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('placeholder', 'Например: Поставка на склад Коледино')
    })

    it('allows typing in the name input', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'Моя поставка')

      expect(input).toHaveValue('Моя поставка')
    })

    it.skip('accepts empty input (name is optional)', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('')

      // Submit should work with empty name
      const submitButton = screen.getByRole('button', { name: /создать$/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockCreateSupply).toHaveBeenCalledWith({ name: undefined })
      })
    })

    it.skip('allows name up to 100 characters', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      const input = screen.getByRole('textbox')
      const maxLengthName = 'А'.repeat(100)
      await user.type(input, maxLengthName)

      expect(input).toHaveValue(maxLengthName)
    })

    it.skip('shows error when name exceeds 100 characters', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      const input = screen.getByRole('textbox')
      const tooLongName = 'А'.repeat(101)
      await user.type(input, tooLongName)

      // Trigger validation by submitting
      const submitButton = screen.getByRole('button', { name: /создать$/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/максимум 100 символов/i)).toBeInTheDocument()
      })
    })
  })

  // ==========================================================================
  // AC4: Modal Actions
  // ==========================================================================

  describe('AC4: Modal Actions - Cancel Button', () => {
    it('renders "Отмена" button', () => {
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      expect(screen.getByRole('button', { name: /отмена/i })).toBeInTheDocument()
    })

    it('closes modal when "Отмена" button is clicked', async () => {
      const onOpenChange = vi.fn()
      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={onOpenChange} />)

      const cancelButton = screen.getByRole('button', { name: /отмена/i })
      await user.click(cancelButton)

      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    it.skip('resets form when cancelled', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={onOpenChange} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'Some text')
      expect(input).toHaveValue('Some text')

      const cancelButton = screen.getByRole('button', { name: /отмена/i })
      await user.click(cancelButton)

      // Re-render with open true to check form was reset
      // This tests that the component properly resets internal state
    })
  })

  describe('AC4: Modal Actions - Submit Button', () => {
    it('renders "Создать" button', () => {
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      expect(screen.getByRole('button', { name: /создать$/i })).toBeInTheDocument()
    })

    it.skip('submits form when "Создать" button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'Моя поставка')

      const submitButton = screen.getByRole('button', { name: /создать$/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockCreateSupply).toHaveBeenCalledWith({ name: 'Моя поставка' })
      })
    })

    it.skip('submits form with undefined name when input is empty', async () => {
      mockCreateSupply.mockResolvedValue(mockCreatedSupplyGenerated)
      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      const submitButton = screen.getByRole('button', { name: /создать$/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockCreateSupply).toHaveBeenCalledWith({ name: undefined })
      })
    })
  })

  describe('AC4: Modal Actions - Keyboard Navigation', () => {
    it.skip('submits form when Enter key is pressed in input', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'Моя поставка{Enter}')

      await waitFor(() => {
        expect(mockCreateSupply).toHaveBeenCalledWith({ name: 'Моя поставка' })
      })
    })

    it.skip('closes modal when Escape key is pressed', async () => {
      const onOpenChange = vi.fn()
      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={onOpenChange} />)

      await user.keyboard('{Escape}')

      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  // ==========================================================================
  // Modal Close Behavior
  // ==========================================================================

  describe('Modal Close Behavior', () => {
    it.skip('calls onOpenChange when X button is clicked', async () => {
      const onOpenChange = vi.fn()
      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={onOpenChange} />)

      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    it.skip('calls onOpenChange when clicking outside modal (backdrop)', async () => {
      const onOpenChange = vi.fn()
      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={onOpenChange} />)

      const overlay = document.querySelector('[data-radix-dialog-overlay]')
      if (overlay) {
        await user.click(overlay)
        expect(onOpenChange).toHaveBeenCalledWith(false)
      }
    })
  })

  // ==========================================================================
  // AC9: Loading State
  // ==========================================================================

  describe('AC9: Loading State', () => {
    it.skip('shows loading spinner on submit button during mutation', async () => {
      // Make the mutation hang
      mockCreateSupply.mockImplementation(() => new Promise(() => {}))

      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      const submitButton = screen.getByRole('button', { name: /создать$/i })
      await user.click(submitButton)

      await waitFor(() => {
        // Check for Loader2 spinner or similar loading indicator
        expect(screen.getByRole('button', { name: /создание/i })).toBeInTheDocument()
      })
    })

    it.skip('changes button text to "Создание..." during mutation', async () => {
      mockCreateSupply.mockImplementation(() => new Promise(() => {}))

      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      const submitButton = screen.getByRole('button', { name: /создать$/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/создание\.\.\./i)).toBeInTheDocument()
      })
    })

    it.skip('disables submit button during mutation', async () => {
      mockCreateSupply.mockImplementation(() => new Promise(() => {}))

      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      const submitButton = screen.getByRole('button', { name: /создать$/i })
      await user.click(submitButton)

      await waitFor(() => {
        const loadingButton = screen.getByRole('button', { name: /создание/i })
        expect(loadingButton).toBeDisabled()
      })
    })

    it.skip('disables name input during mutation', async () => {
      mockCreateSupply.mockImplementation(() => new Promise(() => {}))

      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      const input = screen.getByRole('textbox')
      const submitButton = screen.getByRole('button', { name: /создать$/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(input).toBeDisabled()
      })
    })

    it.skip('keeps cancel button enabled during mutation', async () => {
      mockCreateSupply.mockImplementation(() => new Promise(() => {}))

      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      const submitButton = screen.getByRole('button', { name: /создать$/i })
      await user.click(submitButton)

      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /отмена/i })
        expect(cancelButton).not.toBeDisabled()
      })
    })
  })

  // ==========================================================================
  // AC7: Success Flow - Redirect
  // ==========================================================================

  describe('AC7: Success Flow', () => {
    it.skip('closes modal on successful creation', async () => {
      const onOpenChange = vi.fn()
      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={onOpenChange} />)

      const submitButton = screen.getByRole('button', { name: /создать$/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false)
      })
    })

    it.skip('navigates to supply detail page on success', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'Моя поставка')

      const submitButton = screen.getByRole('button', { name: /создать$/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/supplies/sup_123abc')
      })
    })

    it.skip('resets form after successful creation', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'Моя поставка')

      const submitButton = screen.getByRole('button', { name: /создать$/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled()
      })

      // Form should be reset (check after re-opening)
    })

    it.skip('does not show success toast (redirect is confirmation)', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      const submitButton = screen.getByRole('button', { name: /создать$/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled()
      })

      // No success toast should be shown
      expect(mockToast.success).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // AC8: Error Handling
  // ==========================================================================

  describe('AC8: Error Handling', () => {
    it.skip('shows error toast on API failure', async () => {
      mockCreateSupply.mockRejectedValue(new Error('Ошибка сервера'))

      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      const submitButton = screen.getByRole('button', { name: /создать$/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          expect.stringContaining('Не удалось создать поставку')
        )
      })
    })

    it.skip('keeps modal open on error for retry', async () => {
      mockCreateSupply.mockRejectedValue(new Error('Ошибка'))

      const onOpenChange = vi.fn()
      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={onOpenChange} />)

      const submitButton = screen.getByRole('button', { name: /создать$/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalled()
      })

      // Modal should NOT close on error
      expect(onOpenChange).not.toHaveBeenCalledWith(false)
    })

    it.skip('shows network error message', async () => {
      mockCreateSupply.mockRejectedValue(mockNetworkError)

      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      const submitButton = screen.getByRole('button', { name: /создать$/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          expect.stringContaining('Проверьте соединение')
        )
      })
    })

    it.skip('shows server error message', async () => {
      mockCreateSupply.mockRejectedValue(mockServerError)

      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      const submitButton = screen.getByRole('button', { name: /создать$/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(expect.stringContaining('Ошибка сервера'))
      })
    })

    it.skip('shows rate limit error message', async () => {
      mockCreateSupply.mockRejectedValue(mockRateLimitError)

      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      const submitButton = screen.getByRole('button', { name: /создать$/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          expect.stringContaining('Слишком много запросов')
        )
      })
    })

    it.skip('shows forbidden error message', async () => {
      mockCreateSupply.mockRejectedValue(mockForbiddenError)

      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      const submitButton = screen.getByRole('button', { name: /создать$/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(expect.stringContaining('Нет доступа'))
      })
    })

    it.skip('allows retry after error', async () => {
      mockCreateSupply
        .mockRejectedValueOnce(new Error('Ошибка'))
        .mockResolvedValueOnce(mockCreatedSupplyWithName)

      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      const submitButton = screen.getByRole('button', { name: /создать$/i })

      // First attempt fails
      await user.click(submitButton)
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalled()
      })

      // Second attempt succeeds
      await user.click(submitButton)
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled()
      })
    })
  })

  // ==========================================================================
  // AC10: Accessibility (WCAG 2.1 AA)
  // ==========================================================================

  describe('AC10: Accessibility', () => {
    it.skip('has role="dialog" attribute', () => {
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it.skip('has aria-modal="true" attribute', () => {
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
    })

    it.skip('has aria-labelledby pointing to title', () => {
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-labelledby')
    })

    it.skip('has aria-describedby pointing to description', () => {
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-describedby')
    })

    it.skip('traps focus inside modal when open', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      const dialog = screen.getByRole('dialog')
      const focusableElements = dialog.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )

      expect(focusableElements.length).toBeGreaterThan(0)

      // Tab through focusable elements - focus should stay within modal
      for (let i = 0; i < focusableElements.length + 2; i++) {
        await user.tab()
        expect(dialog.contains(document.activeElement)).toBe(true)
      }
    })

    it.skip('sets initial focus on name input', () => {
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      const input = screen.getByRole('textbox')
      expect(document.activeElement).toBe(input)
    })

    it.skip('returns focus to trigger element on close', async () => {
      const onOpenChange = vi.fn()
      const user = userEvent.setup()

      render(
        <QueryClientProvider client={createTestQueryClient()}>
          <button data-testid="trigger">Open Modal</button>
          <CreateSupplyModal open={true} onOpenChange={onOpenChange} />
        </QueryClientProvider>
      )

      const trigger = screen.getByTestId('trigger')
      trigger.focus()

      await user.keyboard('{Escape}')

      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    it.skip('form input has associated label', () => {
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveAccessibleName(/название поставки/i)
    })

    it.skip('error messages announced to screen readers', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'А'.repeat(101))

      const submitButton = screen.getByRole('button', { name: /создать$/i })
      await user.click(submitButton)

      await waitFor(() => {
        const errorMessage = screen.getByText(/максимум 100 символов/i)
        expect(errorMessage).toHaveAttribute('role', 'alert')
      })
    })

    it.skip('close button has accessible name', () => {
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      const closeButton = screen.getByRole('button', { name: /close/i })
      expect(closeButton).toBeInTheDocument()
    })

    it.skip('has no accessibility violations', async () => {
      const { container } = renderWithProviders(
        <CreateSupplyModal open={true} onOpenChange={vi.fn()} />
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it.skip('handles whitespace-only name as empty', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      const input = screen.getByRole('textbox')
      await user.type(input, '   ')

      const submitButton = screen.getByRole('button', { name: /создать$/i })
      await user.click(submitButton)

      await waitFor(() => {
        // Whitespace-only should be treated as undefined/empty
        expect(mockCreateSupply).toHaveBeenCalledWith({ name: undefined })
      })
    })

    it.skip('trims whitespace from name', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      const input = screen.getByRole('textbox')
      await user.type(input, '  Моя поставка  ')

      const submitButton = screen.getByRole('button', { name: /создать$/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockCreateSupply).toHaveBeenCalledWith({ name: 'Моя поставка' })
      })
    })

    it.skip('handles special characters in name', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      const input = screen.getByRole('textbox')
      const specialName = 'Поставка №123 (склад "Коледино")'
      await user.type(input, specialName)

      const submitButton = screen.getByRole('button', { name: /создать$/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockCreateSupply).toHaveBeenCalledWith({ name: specialName })
      })
    })

    it.skip('prevents double submission on rapid clicks', async () => {
      mockCreateSupply.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockCreatedSupplyWithName), 100))
      )

      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      const submitButton = screen.getByRole('button', { name: /создать$/i })

      // Rapid clicks
      await user.click(submitButton)
      await user.click(submitButton)
      await user.click(submitButton)

      await waitFor(() => {
        // Only one API call should be made
        expect(mockCreateSupply).toHaveBeenCalledTimes(1)
      })
    })
  })
})

// Suppress unused fixture warnings - fixtures are used in commented test code
void mockCreatedSupplyWithName
void mockCreatedSupplyGenerated
void mockValidationErrorNameTooLong
void mockServerError
void mockNetworkError
void mockForbiddenError
void mockRateLimitError
