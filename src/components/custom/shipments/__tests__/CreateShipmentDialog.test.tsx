import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { CreateShipmentDialog } from '../CreateShipmentDialog'

const mockMutateAsync = vi.fn()
let mockIsPending = false

vi.mock('@/hooks/use-shipments', () => ({
  useCreateShipment: () => ({
    mutateAsync: mockMutateAsync,
    get isPending() {
      return mockIsPending
    },
  }),
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: { user: { email: string } }) => unknown) =>
    selector({ user: { email: 'test@test.com' } }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('CreateShipmentDialog', () => {
  const defaultProps = { open: true, onClose: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
    mockIsPending = false
  })

  it('renders dialog title', () => {
    renderWithProviders(<CreateShipmentDialog {...defaultProps} />)
    expect(screen.getByText('Создать отправку')).toBeInTheDocument()
  })

  it('renders name input, delivery mode radio, and cost input', () => {
    renderWithProviders(<CreateShipmentDialog {...defaultProps} />)
    expect(screen.getByLabelText('Название')).toBeInTheDocument()
    expect(screen.getByText('Фиксированная стоимость')).toBeInTheDocument()
    expect(screen.getByText('За паллету')).toBeInTheDocument()
    expect(screen.getByLabelText('Общая стоимость доставки (₽)')).toBeInTheDocument()
  })

  it('shows validation errors on empty submit', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateShipmentDialog {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: 'Создать' }))

    await waitFor(() => {
      expect(screen.getByText('Название обязательно')).toBeInTheDocument()
      expect(screen.getByText('Введите число больше 0')).toBeInTheDocument()
    })
  })

  it('sets aria-invalid on inputs with errors', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateShipmentDialog {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: 'Создать' }))

    await waitFor(() => {
      expect(screen.getByLabelText('Название')).toHaveAttribute('aria-invalid', 'true')
    })
  })

  it('switches cost label when delivery mode changes', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateShipmentDialog {...defaultProps} />)

    expect(screen.getByLabelText('Общая стоимость доставки (₽)')).toBeInTheDocument()

    await user.click(screen.getByText('За паллету'))

    expect(screen.getByLabelText('Стоимость за паллету (₽)')).toBeInTheDocument()
  })

  it('disables submit button during pending mutation', () => {
    mockIsPending = true
    renderWithProviders(<CreateShipmentDialog {...defaultProps} />)
    expect(screen.getByRole('button', { name: /создание/i })).toBeDisabled()
  })

  it('calls mutateAsync with form data on valid submit', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockResolvedValueOnce({ id: 's-new' })
    renderWithProviders(<CreateShipmentDialog {...defaultProps} />)

    await user.type(screen.getByLabelText('Название'), 'Новая отправка')
    await user.type(screen.getByLabelText('Общая стоимость доставки (₽)'), '15000')
    await user.click(screen.getByRole('button', { name: 'Создать' }))

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        name: 'Новая отправка',
        deliveryMode: 'FIXED_VEHICLE',
        totalDeliveryCost: 15000,
        createdBy: 'test@test.com',
      })
    })
  })

  it('shows error message when submit fails', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockRejectedValueOnce(new Error('Duplicate name'))
    renderWithProviders(<CreateShipmentDialog {...defaultProps} />)

    await user.type(screen.getByLabelText('Название'), 'Дубликат')
    await user.type(screen.getByLabelText('Общая стоимость доставки (₽)'), '5000')
    await user.click(screen.getByRole('button', { name: 'Создать' }))

    await waitFor(() => {
      expect(screen.getByText('Duplicate name')).toBeInTheDocument()
    })
  })

  it('clears cost value when switching delivery mode', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateShipmentDialog {...defaultProps} />)

    const costInput = screen.getByLabelText('Общая стоимость доставки (₽)')
    await user.type(costInput, '15000')
    expect(costInput).toHaveValue(15000)

    await user.click(screen.getByText('За паллету'))

    const newCostInput = screen.getByLabelText('Стоимость за паллету (₽)')
    expect(newCostInput).toHaveValue(null)
  })
})
