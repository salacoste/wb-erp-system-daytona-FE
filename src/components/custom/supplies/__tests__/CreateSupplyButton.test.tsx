/**
 * Unit Tests for CreateSupplyButton component
 * Story 53.3-FE: Create Supply Flow
 * Epic 53-FE: Supply Management UI
 *
 * Focus: Button rendering, modal trigger
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

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
  })
})
