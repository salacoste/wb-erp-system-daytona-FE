/**
 * ExpenseFormDialog Tests
 * Tests for src/app/(dashboard)/settings/expenses/components/ExpenseFormDialog.tsx
 *
 * Covers: create/edit modes, form submission, cancel, validation, pending state
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/utils/test-utils'
import type { ExpenseItem } from '@/types/expenses'

// Mock mutations
const mockCreateMutate = vi.fn()
const mockUpdateMutate = vi.fn()
let createPending = false
let updatePending = false

vi.mock('@/hooks/useExpensesCRUD', () => ({
  useCreateExpense: () => ({
    mutate: mockCreateMutate,
    isPending: createPending,
  }),
  useUpdateExpense: () => ({
    mutate: mockUpdateMutate,
    isPending: updatePending,
  }),
}))

// Import after mocks
import { ExpenseFormDialog } from '../ExpenseFormDialog'

// Fixtures
const mockExpense: ExpenseItem = {
  id: 'exp-1',
  cabinetId: 'cab-1',
  category: 'rent',
  amount: 50000,
  month: '2026-06',
  description: 'Office rent',
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-01T00:00:00Z',
}

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  month: '2026-06',
  editingExpense: null,
  onReturnFocus: vi.fn(),
}

describe('ExpenseFormDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createPending = false
    updatePending = false
    // Reset mock implementations to default (success)
    mockCreateMutate.mockImplementation((_data: unknown, opts?: { onSuccess?: () => void }) => {
      if (opts?.onSuccess) opts.onSuccess()
    })
    mockUpdateMutate.mockImplementation((_data: unknown, opts?: { onSuccess?: () => void }) => {
      if (opts?.onSuccess) opts.onSuccess()
    })
  })

  describe('Create mode', () => {
    it('renders "Добавить расход" title', () => {
      render(<ExpenseFormDialog {...defaultProps} />)
      expect(screen.getByText('Добавить расход')).toBeInTheDocument()
    })

    it('renders category select field', () => {
      render(<ExpenseFormDialog {...defaultProps} />)
      expect(screen.getByLabelText(/категория/i)).toBeInTheDocument()
    })

    it('renders amount input field', () => {
      render(<ExpenseFormDialog {...defaultProps} />)
      expect(screen.getByLabelText(/сумма/i)).toBeInTheDocument()
    })

    it('renders month input field', () => {
      render(<ExpenseFormDialog {...defaultProps} />)
      expect(screen.getByLabelText(/месяц/i)).toBeInTheDocument()
    })

    it('renders description textarea', () => {
      render(<ExpenseFormDialog {...defaultProps} />)
      expect(screen.getByLabelText(/описание/i)).toBeInTheDocument()
    })

    it('renders submit button with "Добавить" text', () => {
      render(<ExpenseFormDialog {...defaultProps} />)
      expect(screen.getByRole('button', { name: /добавить/i })).toBeInTheDocument()
    })

    it('renders cancel button', () => {
      render(<ExpenseFormDialog {...defaultProps} />)
      expect(screen.getByRole('button', { name: /отмена/i })).toBeInTheDocument()
    })

    it('shows category select trigger', () => {
      render(<ExpenseFormDialog {...defaultProps} />)
      // The category select is rendered via SelectTrigger with id
      expect(screen.getByLabelText(/категория/i)).toBeInTheDocument()
    })
  })

  describe('Edit mode', () => {
    it('renders "Редактировать расход" title', () => {
      render(<ExpenseFormDialog {...defaultProps} editingExpense={mockExpense} />)
      expect(screen.getByText('Редактировать расход')).toBeInTheDocument()
    })

    it('pre-fills amount from editingExpense', () => {
      render(<ExpenseFormDialog {...defaultProps} editingExpense={mockExpense} />)
      const amountInput = screen.getByLabelText(/сумма/i) as HTMLInputElement
      expect(amountInput.value).toBe('50000')
    })

    it('pre-fills description from editingExpense', () => {
      render(<ExpenseFormDialog {...defaultProps} editingExpense={mockExpense} />)
      const descTextarea = screen.getByLabelText(/описание/i) as HTMLTextAreaElement
      expect(descTextarea.value).toBe('Office rent')
    })

    it('hides category select in edit mode', () => {
      render(<ExpenseFormDialog {...defaultProps} editingExpense={mockExpense} />)
      expect(screen.queryByLabelText(/категория/i)).not.toBeInTheDocument()
    })

    it('hides month input in edit mode', () => {
      render(<ExpenseFormDialog {...defaultProps} editingExpense={mockExpense} />)
      expect(screen.queryByLabelText(/месяц/i)).not.toBeInTheDocument()
    })

    it('renders submit button with "Сохранить" text', () => {
      render(<ExpenseFormDialog {...defaultProps} editingExpense={mockExpense} />)
      expect(screen.getByRole('button', { name: /сохранить/i })).toBeInTheDocument()
    })

    it('handles null description gracefully', () => {
      const noDescExpense = { ...mockExpense, description: null }
      render(<ExpenseFormDialog {...defaultProps} editingExpense={noDescExpense} />)
      const descTextarea = screen.getByLabelText(/описание/i) as HTMLTextAreaElement
      expect(descTextarea.value).toBe('')
    })
  })

  describe('Form submission - create', () => {
    it('calls createMutation.mutate with correct payload', async () => {
      render(<ExpenseFormDialog {...defaultProps} />)

      const amountInput = screen.getByLabelText(/сумма/i)
      fireEvent.change(amountInput, { target: { value: '75000' } })

      const descTextarea = screen.getByLabelText(/описание/i)
      fireEvent.change(descTextarea, { target: { value: 'New expense' } })

      const form = amountInput.closest('form')!
      fireEvent.submit(form)

      expect(mockCreateMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 75000,
          description: 'New expense',
          month: '2026-06',
        }),
        expect.objectContaining({ onSuccess: expect.any(Function) })
      )
    })

    it('includes category in create payload', async () => {
      render(<ExpenseFormDialog {...defaultProps} />)

      const amountInput = screen.getByLabelText(/сумма/i)
      fireEvent.change(amountInput, { target: { value: '10000' } })

      const form = amountInput.closest('form')!
      fireEvent.submit(form)

      expect(mockCreateMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          category: expect.any(String),
        }),
        expect.any(Object)
      )
    })

    it('omits description when empty', async () => {
      render(<ExpenseFormDialog {...defaultProps} />)

      const amountInput = screen.getByLabelText(/сумма/i)
      fireEvent.change(amountInput, { target: { value: '10000' } })

      const form = amountInput.closest('form')!
      fireEvent.submit(form)

      expect(mockCreateMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          description: undefined,
        }),
        expect.any(Object)
      )
    })

    it('calls onOpenChange(false) on successful create', async () => {
      const onOpenChange = vi.fn()
      render(<ExpenseFormDialog {...defaultProps} onOpenChange={onOpenChange} />)

      const amountInput = screen.getByLabelText(/сумма/i)
      fireEvent.change(amountInput, { target: { value: '5000' } })

      const form = amountInput.closest('form')!
      fireEvent.submit(form)

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false)
      })
    })
  })

  describe('Form submission - update', () => {
    it('calls updateMutation.mutate with id and data', async () => {
      render(<ExpenseFormDialog {...defaultProps} editingExpense={mockExpense} />)

      const amountInput = screen.getByLabelText(/сумма/i) as HTMLInputElement
      fireEvent.change(amountInput, { target: { value: '55000' } })

      const form = amountInput.closest('form')!
      fireEvent.submit(form)

      expect(mockUpdateMutate).toHaveBeenCalledWith(
        {
          id: 'exp-1',
          data: expect.objectContaining({
            amount: 55000,
            description: 'Office rent',
          }),
        },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      )
    })

    it('does not include category or month in update payload', async () => {
      render(<ExpenseFormDialog {...defaultProps} editingExpense={mockExpense} />)

      const amountInput = screen.getByLabelText(/сумма/i)
      fireEvent.change(amountInput, { target: { value: '55000' } })

      const form = amountInput.closest('form')!
      fireEvent.submit(form)

      const call = mockUpdateMutate.mock.calls[0][0] as {
        id: string
        data: Record<string, unknown>
      }
      expect(call.data).not.toHaveProperty('category')
      expect(call.data).not.toHaveProperty('month')
    })

    it('calls onOpenChange(false) on successful update', async () => {
      const onOpenChange = vi.fn()
      render(
        <ExpenseFormDialog
          {...defaultProps}
          onOpenChange={onOpenChange}
          editingExpense={mockExpense}
        />
      )

      const amountInput = screen.getByLabelText(/сумма/i) as HTMLInputElement
      fireEvent.change(amountInput, { target: { value: '55000' } })

      const form = amountInput.closest('form')!
      fireEvent.submit(form)

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false)
      })
    })
  })

  describe('Cancel', () => {
    it('calls onOpenChange(false) when cancel button clicked', () => {
      const onOpenChange = vi.fn()
      render(<ExpenseFormDialog {...defaultProps} onOpenChange={onOpenChange} />)

      fireEvent.click(screen.getByRole('button', { name: /отмена/i }))
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('Validation', () => {
    it('submit button is disabled when amount is empty', () => {
      render(<ExpenseFormDialog {...defaultProps} />)
      const submitBtn = screen.getByRole('button', { name: /добавить/i })
      expect(submitBtn).toBeDisabled()
    })

    it('submit button is enabled when amount has a value', () => {
      render(<ExpenseFormDialog {...defaultProps} />)
      const amountInput = screen.getByLabelText(/сумма/i)
      fireEvent.change(amountInput, { target: { value: '5000' } })
      const submitBtn = screen.getByRole('button', { name: /добавить/i })
      expect(submitBtn).not.toBeDisabled()
    })

    it('does not submit when amount is zero', () => {
      render(<ExpenseFormDialog {...defaultProps} />)
      const amountInput = screen.getByLabelText(/сумма/i)
      fireEvent.change(amountInput, { target: { value: '0' } })

      const form = amountInput.closest('form')!
      fireEvent.submit(form)

      expect(mockCreateMutate).not.toHaveBeenCalled()
    })

    it('associates a visible validation error and focuses the amount field', () => {
      render(<ExpenseFormDialog {...defaultProps} />)
      const amountInput = screen.getByLabelText(/сумма/i)
      fireEvent.change(amountInput, { target: { value: '0' } })

      fireEvent.submit(amountInput.closest('form')!)

      const error = screen.getByText('Введите сумму от 0,01 ₽ с точностью до копеек')
      expect(amountInput).toHaveAttribute('aria-invalid', 'true')
      expect(amountInput).toHaveAttribute('aria-describedby', error.id)
      expect(amountInput).toHaveFocus()
    })

    it('does not submit when amount is negative', () => {
      render(<ExpenseFormDialog {...defaultProps} />)
      const amountInput = screen.getByLabelText(/сумма/i)
      fireEvent.change(amountInput, { target: { value: '-100' } })

      const form = amountInput.closest('form')!
      fireEvent.submit(form)

      expect(mockCreateMutate).not.toHaveBeenCalled()
    })

    it('rejects sub-cent precision before mutation', () => {
      render(<ExpenseFormDialog {...defaultProps} />)
      const amountInput = screen.getByLabelText(/сумма/i)
      fireEvent.change(amountInput, { target: { value: '0.001' } })

      fireEvent.submit(amountInput.closest('form')!)

      expect(mockCreateMutate).not.toHaveBeenCalled()
      expect(amountInput).toHaveAttribute('aria-invalid', 'true')
      expect(amountInput).toHaveFocus()
    })

    it.each(['.5', '1e3'])('preserves native-valid numeric syntax %s', value => {
      render(<ExpenseFormDialog {...defaultProps} />)
      const amountInput = screen.getByLabelText(/сумма/i)
      fireEvent.change(amountInput, { target: { value } })

      fireEvent.submit(amountInput.closest('form')!)

      expect(mockCreateMutate).toHaveBeenCalledOnce()
    })

    it('associates and focuses a cleared required month without mutation', () => {
      render(<ExpenseFormDialog {...defaultProps} />)
      const amountInput = screen.getByLabelText(/сумма/i)
      const monthInput = screen.getByLabelText(/месяц/i)
      fireEvent.change(amountInput, { target: { value: '100' } })
      fireEvent.change(monthInput, { target: { value: '' } })

      fireEvent.submit(amountInput.closest('form')!)

      const error = screen.getByText('Выберите корректный месяц')
      expect(mockCreateMutate).not.toHaveBeenCalled()
      expect(monthInput).toHaveAttribute('aria-invalid', 'true')
      expect(monthInput).toHaveAttribute('aria-describedby', error.id)
      expect(monthInput).toHaveFocus()
    })
  })

  describe('Pending state', () => {
    it('shows "Сохранение..." when create is pending', () => {
      createPending = true
      render(<ExpenseFormDialog {...defaultProps} />)

      expect(screen.getByRole('button', { name: /сохранение/i })).toBeDisabled()
      expect(screen.getByRole('form')).toHaveAttribute('aria-busy', 'true')
    })

    it('shows "Сохранение..." when update is pending', () => {
      updatePending = true
      render(<ExpenseFormDialog {...defaultProps} editingExpense={mockExpense} />)

      expect(screen.getByRole('button', { name: /сохранение/i })).toBeDisabled()
      expect(screen.getByRole('form')).toHaveAttribute('aria-busy', 'true')
    })

    it('guards all controlled close requests and duplicate submits while create is pending', () => {
      createPending = true
      const onOpenChange = vi.fn()
      render(<ExpenseFormDialog {...defaultProps} onOpenChange={onOpenChange} />)
      const amountInput = screen.getByLabelText(/сумма/i)
      fireEvent.change(amountInput, { target: { value: '5000' } })

      expect(screen.getByRole('button', { name: /отмена/i })).toBeDisabled()
      fireEvent.click(screen.getByRole('button', { name: /закрыть/i }))
      fireEvent.submit(amountInput.closest('form')!)

      expect(onOpenChange).not.toHaveBeenCalledWith(false)
      expect(mockCreateMutate).not.toHaveBeenCalled()
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  describe('Failure state', () => {
    it('keeps values and reports a failed create inside the open dialog', () => {
      mockCreateMutate.mockImplementationOnce((_data: unknown, options: { onError?: () => void }) =>
        options.onError?.()
      )
      const onOpenChange = vi.fn()
      render(<ExpenseFormDialog {...defaultProps} onOpenChange={onOpenChange} />)
      const amountInput = screen.getByLabelText(/сумма/i)
      fireEvent.change(amountInput, { target: { value: '5000' } })

      fireEvent.submit(amountInput.closest('form')!)

      expect(screen.getByRole('alert')).toHaveTextContent(/не удалось сохранить расход/i)
      expect(amountInput).toHaveValue(5000)
      expect(onOpenChange).not.toHaveBeenCalledWith(false)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  describe('Dialog closed', () => {
    it('does not render content when open is false', () => {
      render(<ExpenseFormDialog {...defaultProps} open={false} />)
      expect(screen.queryByText('Добавить расход')).not.toBeInTheDocument()
    })
  })
})
