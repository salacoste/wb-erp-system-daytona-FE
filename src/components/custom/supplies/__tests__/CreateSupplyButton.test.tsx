/**
 * TDD Unit Tests for CreateSupplyButton component
 * Story 53.3-FE: Create Supply Flow
 * Epic 53-FE: Supply Management UI
 *
 * Tests written BEFORE implementation (TDD approach)
 * Focus: Button rendering, modal trigger, accessibility
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

// Mock toast from sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock API module
vi.mock('@/lib/api/supplies', () => ({
  createSupply: vi.fn(),
  suppliesQueryKeys: {
    all: ['supplies'],
    list: (params?: unknown) => ['supplies', 'list', params],
  },
}))

// Import component after mocks
import { CreateSupplyButton } from '../CreateSupplyButton'

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

describe('CreateSupplyButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // AC1: Button Rendering
  // ==========================================================================

  describe('AC1: Button Rendering', () => {
    it('renders button with correct label "Создать поставку"', () => {
      renderWithProviders(<CreateSupplyButton />)

      expect(screen.getByRole('button', { name: /создать поставку/i })).toBeInTheDocument()
    })

    it('renders Plus icon from Lucide', () => {
      renderWithProviders(<CreateSupplyButton />)

      const button = screen.getByRole('button', { name: /создать поставку/i })
      const icon = button.querySelector('svg')
      expect(icon).toBeInTheDocument()
      // Plus icon has specific path or className
    })

    it.skip('uses primary variant (red background)', () => {
      renderWithProviders(<CreateSupplyButton />)

      const button = screen.getByRole('button', { name: /создать поставку/i })
      // Check for primary button styling (bg-red or primary variant)
      expect(button.className).toMatch(/bg-|primary/)
    })
  })

  // ==========================================================================
  // Modal Trigger
  // ==========================================================================

  describe('Modal Trigger', () => {
    it('opens CreateSupplyModal on click', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyButton />)

      const button = screen.getByRole('button', { name: /создать поставку/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })

    it('modal has correct title when opened', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyButton />)

      const button = screen.getByRole('button', { name: /создать поставку/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Новая поставка')).toBeInTheDocument()
      })
    })

    it.skip('can close modal and reopen', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyButton />)

      const button = screen.getByRole('button', { name: /создать поставку/i })

      // Open modal
      await user.click(button)
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Close modal with Escape
      await user.keyboard('{Escape}')
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })

      // Reopen modal
      await user.click(button)
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })
  })

  // ==========================================================================
  // Keyboard Activation
  // ==========================================================================

  describe('Keyboard Activation', () => {
    it.skip('opens modal on Enter key press', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyButton />)

      const button = screen.getByRole('button', { name: /создать поставку/i })
      button.focus()
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })

    it.skip('opens modal on Space key press', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyButton />)

      const button = screen.getByRole('button', { name: /создать поставку/i })
      button.focus()
      await user.keyboard(' ')

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })
  })

  // ==========================================================================
  // Disabled State
  // ==========================================================================

  describe('Disabled State', () => {
    it.skip('can be disabled via prop', () => {
      renderWithProviders(<CreateSupplyButton disabled={true} />)

      const button = screen.getByRole('button', { name: /создать поставку/i })
      expect(button).toBeDisabled()
    })

    it.skip('does not open modal when disabled', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CreateSupplyButton disabled={true} />)

      const button = screen.getByRole('button', { name: /создать поставку/i })
      await user.click(button)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it.skip('has correct styling when disabled', () => {
      renderWithProviders(<CreateSupplyButton disabled={true} />)

      const button = screen.getByRole('button', { name: /создать поставку/i })
      expect(button.className).toMatch(/disabled|opacity-50|cursor-not-allowed/)
    })
  })

  // ==========================================================================
  // Accessibility
  // ==========================================================================

  describe('Accessibility', () => {
    it.skip('has no accessibility violations', async () => {
      const { container } = renderWithProviders(<CreateSupplyButton />)

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it.skip('button is focusable', () => {
      renderWithProviders(<CreateSupplyButton />)

      const button = screen.getByRole('button', { name: /создать поставку/i })
      button.focus()
      expect(document.activeElement).toBe(button)
    })

    it.skip('button has accessible name', () => {
      renderWithProviders(<CreateSupplyButton />)

      const button = screen.getByRole('button', { name: /создать поставку/i })
      expect(button).toHaveAccessibleName()
    })
  })
})
