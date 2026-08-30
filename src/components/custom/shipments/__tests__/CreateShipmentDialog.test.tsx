import { useRef, useState } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { CreateShipmentDialog } from '../CreateShipmentDialog'

const mockMutateAsync = vi.fn()
const mockPush = vi.fn()
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
  useRouter: () => ({ push: mockPush }),
}))

function FocusHarness() {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)}>
        Открыть создание
      </button>
      <CreateShipmentDialog
        open={open}
        onClose={() => setOpen(false)}
        returnFocusRef={triggerRef}
      />
    </>
  )
}

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
    expect(screen.getByRole('radiogroup', { name: 'Способ доставки' })).toBeVisible()
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
      expect(screen.getByLabelText('Название')).toHaveFocus()
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
    expect(screen.getByRole('status')).toHaveTextContent('Создаём отправку')
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
      expect(mockPush).toHaveBeenCalledWith('/shipments/s-new')
    })
  })

  it('preserves the per-pallet request shape and omits the vehicle cost', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockResolvedValueOnce({ id: 's-pallet' })
    renderWithProviders(<CreateShipmentDialog {...defaultProps} />)

    await user.type(screen.getByLabelText('Название'), 'Паллетная отправка')
    await user.click(screen.getByText('За паллету'))
    await user.type(screen.getByLabelText('Стоимость за паллету (₽)'), '2500.5')
    await user.click(screen.getByRole('button', { name: 'Создать' }))

    await waitFor(() =>
      expect(mockMutateAsync).toHaveBeenCalledWith({
        name: 'Паллетная отправка',
        deliveryMode: 'PER_PALLET',
        palletRate: 2500.5,
        createdBy: 'test@test.com',
      })
    )
  })

  it('shows error message when submit fails', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockRejectedValueOnce(new Error('Duplicate name'))
    renderWithProviders(<CreateShipmentDialog {...defaultProps} />)

    await user.type(screen.getByLabelText('Название'), 'Дубликат')
    await user.type(screen.getByLabelText('Общая стоимость доставки (₽)'), '5000')
    await user.click(screen.getByRole('button', { name: 'Создать' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Duplicate name')
    })
  })

  it('focuses the cost input when it is the first invalid field', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateShipmentDialog {...defaultProps} />)

    await user.type(screen.getByLabelText('Название'), 'Валидное название')
    await user.click(screen.getByRole('button', { name: 'Создать' }))

    expect(screen.getByLabelText('Общая стоимость доставки (₽)')).toHaveFocus()
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

  it('returns focus to the exact invoking action after cancellation', async () => {
    const user = userEvent.setup()
    renderWithProviders(<FocusHarness />)

    const trigger = screen.getByRole('button', { name: 'Открыть создание' })
    await user.click(trigger)
    expect(screen.getByLabelText('Название')).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Отмена' }))
    await waitFor(() => expect(trigger).toHaveFocus())
  })
})
