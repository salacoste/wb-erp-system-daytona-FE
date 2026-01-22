import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CabinetCreationForm } from './CabinetCreationForm'
import { handleCreateCabinet } from '@/services/cabinets.service'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// Mock dependencies
vi.mock('@/services/cabinets.service', () => ({
  handleCreateCabinet: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('CabinetCreationForm', () => {
  let queryClient: QueryClient
  const mockPush = vi.fn()

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false, gcTime: 0 },
      },
    })
    vi.clearAllMocks()
    ;(useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
    })
  })

  afterEach(() => {
    cleanup()
    queryClient.clear()
  })

  const renderForm = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <CabinetCreationForm />
      </QueryClientProvider>
    )
  }

  it(
    'renders cabinet creation form with name field',
    () => {
      renderForm()

      expect(
        screen.getByLabelText(/название кабинета/i),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /создать кабинет/i }),
      ).toBeInTheDocument()
    },
    { timeout: 5000 },
  )

  it(
    'validates cabinet name minimum length',
    async () => {
    const user = userEvent.setup()
    renderForm()

    const nameInput = screen.getByLabelText(/название кабинета/i)
    await user.type(nameInput, 'A')
    await user.tab()

    await waitFor(
      () => {
        expect(
          screen.getByText(/минимум 2 символа/i),
        ).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
    },
    { timeout: 5000 },
  )

  it(
    'validates cabinet name is required',
    async () => {
    const user = userEvent.setup()
    renderForm()

    const nameInput = screen.getByLabelText(/название кабинета/i)
    // Focus and blur to trigger validation
    await user.click(nameInput)
    await user.tab()

    await waitFor(
      () => {
        expect(
          screen.getByText(/минимум 2 символа/i),
        ).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
    },
    { timeout: 5000 },
  )

  it(
    'calls handleCreateCabinet on valid form submission',
    async () => {
    const user = userEvent.setup()
    const mockHandleCreateCabinet = vi.mocked(handleCreateCabinet)
    mockHandleCreateCabinet.mockResolvedValue({
      cabinet: {
        id: 'cabinet-1',
        name: 'Test Cabinet',
        isActive: true,
        createdAt: '2025-01-12T10:00:00Z',
        updatedAt: '2025-01-12T10:00:00Z',
      },
    })

    renderForm()

    const nameInput = screen.getByLabelText(/название кабинета/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Test Cabinet')
    
    // Small delay to allow form validation
    await new Promise((resolve) => setTimeout(resolve, 100))
    
    const submitButton = screen.getByRole('button', { name: /создать кабинет/i })
    await user.click(submitButton)

    await waitFor(
      () => {
        expect(mockHandleCreateCabinet).toHaveBeenCalledWith('Test Cabinet')
      },
      { timeout: 5000 }
    )
    },
    { timeout: 10000 },
  )

  it(
    'shows loading state during submission',
    async () => {
    const user = userEvent.setup()
    const mockHandleCreateCabinet = vi.mocked(handleCreateCabinet)
    let resolvePromise: (value: any) => void
    const promise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    mockHandleCreateCabinet.mockReturnValue(promise as Promise<any>)

    renderForm()

    const nameInput = screen.getByLabelText(/название кабинета/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Test Cabinet')
    
    // Small delay to allow form validation
    await new Promise((resolve) => setTimeout(resolve, 100))
    
    const submitButton = screen.getByRole('button', { name: /создать кабинет/i })
    await user.click(submitButton)

    await waitFor(
      () => {
        expect(
          screen.getByRole('button', { name: /создание.../i }),
        ).toBeInTheDocument()
        expect(screen.getByRole('button')).toBeDisabled()
      },
      { timeout: 3000 }
    )

    // Resolve to complete test
    resolvePromise!({
      cabinet: {
        id: 'cabinet-1',
        name: 'Test Cabinet',
        isActive: true,
        createdAt: '2025-01-12T10:00:00Z',
        updatedAt: '2025-01-12T10:00:00Z',
      },
    })

    await waitFor(
      () => {
        expect(mockHandleCreateCabinet).toHaveBeenCalled()
      },
      { timeout: 3000 }
    )
    },
    { timeout: 10000 },
  )

  it(
    'handles creation errors',
    async () => {
    const user = userEvent.setup()
    const mockHandleCreateCabinet = vi.mocked(handleCreateCabinet)
    mockHandleCreateCabinet.mockRejectedValue(
      new Error('Failed to create cabinet'),
    )

    renderForm()

    const nameInput = screen.getByLabelText(/название кабинета/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Test Cabinet')
    
    // Small delay to allow form validation
    await new Promise((resolve) => setTimeout(resolve, 100))
    
    const submitButton = screen.getByRole('button', { name: /создать кабинет/i })
    await user.click(submitButton)

    await waitFor(
      () => {
        expect(toast.error).toHaveBeenCalled()
      },
      { timeout: 5000 }
    )
    },
    { timeout: 10000 },
  )

  it(
    'navigates to WB token page on success',
    async () => {
    const user = userEvent.setup()
    const mockHandleCreateCabinet = vi.mocked(handleCreateCabinet)
    mockHandleCreateCabinet.mockResolvedValue({
      cabinet: {
        id: 'cabinet-1',
        name: 'Test Cabinet',
        isActive: true,
        createdAt: '2025-01-12T10:00:00Z',
        updatedAt: '2025-01-12T10:00:00Z',
      },
    })

    renderForm()

    const nameInput = screen.getByLabelText(/название кабинета/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Test Cabinet')
    
    // Small delay to allow form validation
    await new Promise((resolve) => setTimeout(resolve, 100))
    
    const submitButton = screen.getByRole('button', { name: /создать кабинет/i })
    await user.click(submitButton)

    await waitFor(
      () => {
        expect(mockHandleCreateCabinet).toHaveBeenCalled()
      },
      { timeout: 5000 }
    )

    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith('/wb-token')
        expect(toast.success).toHaveBeenCalled()
      },
      { timeout: 5000 }
    )
    },
    { timeout: 10000 },
  )
})

