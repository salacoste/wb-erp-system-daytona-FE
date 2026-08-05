/**
 * Unit Tests for CreateSupplyModal component
 * Story 53.3-FE: Create Supply Flow
 * Epic 53-FE: Supply Management UI
 *
 * Focus: Modal display, form validation, cancel behavior
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useRef, useState } from 'react'
import { render, screen } from '@testing-library/react'
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
import { mockCreatedSupplyWithName } from '@/test/fixtures/supplies-mutations'

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

    it('returns focus to the external trigger when the controlled modal closes', async () => {
      const user = userEvent.setup()

      function ControlledModal() {
        const [open, setOpen] = useState(false)
        const triggerRef = useRef<HTMLButtonElement>(null)

        return (
          <>
            <button ref={triggerRef} type="button" onClick={() => setOpen(true)}>
              Создать поставку
            </button>
            <CreateSupplyModal open={open} onOpenChange={setOpen} returnFocusRef={triggerRef} />
          </>
        )
      }

      renderWithProviders(<ControlledModal />)
      const trigger = screen.getByRole('button', { name: 'Создать поставку' })

      await user.click(trigger)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      await user.keyboard('{Escape}')

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(trigger).toHaveFocus()
    })
  })

  describe('AC4: Modal Actions - Submit Button', () => {
    it('renders "Создать" button', () => {
      renderWithProviders(<CreateSupplyModal open={true} onOpenChange={vi.fn()} />)

      expect(screen.getByRole('button', { name: /создать$/i })).toBeInTheDocument()
    })
  })
})

// Suppress unused fixture warnings
void mockCreatedSupplyWithName
