import { axe, toHaveNoViolations } from 'jest-axe'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@/test/utils/test-utils'
import type { ExpenseItem } from '@/types/expenses'

expect.extend(toHaveNoViolations)

const mockDeleteMutate = vi.fn()
let deletePending = false

vi.mock('@/hooks/useExpensesCRUD', () => ({
  useDeleteExpense: () => ({ mutate: mockDeleteMutate, isPending: deletePending }),
}))

import { ExpenseTable } from '../ExpenseTable'

const expenses: ExpenseItem[] = [
  {
    id: 'exp-1',
    cabinetId: 'cab-1',
    category: 'rent',
    amount: 50000,
    month: '2026-06',
    description: 'Аренда большого офиса',
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
  },
]

describe('ExpenseTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deletePending = false
  })

  it('retains identity, ruble value, period, status, and named actions', () => {
    render(<ExpenseTable expenses={expenses} onEdit={vi.fn()} onDeleteSuccessFocus={vi.fn()} />)

    expect(screen.getByRole('table', { name: /расходы за июнь 2026/i })).toBeInTheDocument()
    expect(screen.getByText(/50.*000.*₽/)).toBeInTheDocument()
    expect(screen.getByText('Июнь 2026')).toBeInTheDocument()
    expect(screen.getByText('Сохранён')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /изменить расход аренда, 50.*000.*₽/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /удалить расход аренда, 50.*000.*₽/i })
    ).toBeInTheDocument()
  })

  it('requires confirmation before deleting the selected expense', async () => {
    const user = userEvent.setup()
    render(<ExpenseTable expenses={expenses} onEdit={vi.fn()} onDeleteSuccessFocus={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /удалить расход аренда/i }))
    expect(mockDeleteMutate).not.toHaveBeenCalled()
    expect(screen.getByRole('alertdialog', { name: /удалить расход/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /подтвердить удаление расхода аренда/i }))
    expect(mockDeleteMutate).toHaveBeenCalledWith(
      'exp-1',
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    )
  })

  it('cancels without deleting and returns focus to the invoking action', async () => {
    const user = userEvent.setup()
    render(<ExpenseTable expenses={expenses} onEdit={vi.fn()} onDeleteSuccessFocus={vi.fn()} />)
    const trigger = screen.getByRole('button', { name: /удалить расход аренда/i })

    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: /отмена/i }))

    expect(mockDeleteMutate).not.toHaveBeenCalled()
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('exposes the selected delete pending state', async () => {
    deletePending = true
    const user = userEvent.setup()
    render(<ExpenseTable expenses={expenses} onEdit={vi.fn()} onDeleteSuccessFocus={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /удалить расход аренда/i }))

    expect(screen.getByRole('button', { name: /удаление расхода аренда/i })).toBeDisabled()
    expect(screen.getByRole('alertdialog')).toHaveAttribute('aria-busy', 'true')
  })

  it('keeps the dialog open and reports a delete failure', async () => {
    mockDeleteMutate.mockImplementationOnce(
      (_id: string, options: { onError: (error: Error) => void }) =>
        options.onError(new Error('failed'))
    )
    const user = userEvent.setup()
    render(<ExpenseTable expenses={expenses} onEdit={vi.fn()} onDeleteSuccessFocus={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /удалить расход аренда/i }))
    await user.click(screen.getByRole('button', { name: /подтвердить удаление расхода аренда/i }))

    expect(screen.getByRole('alert')).toHaveTextContent(/не удалось удалить расход/i)
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })

  it.each([
    ['the last row', expenses],
    [
      'a row with a remaining neighbour',
      [...expenses, { ...expenses[0], id: 'exp-2', category: 'salary' as const, amount: 120000 }],
    ],
  ])('moves focus to the stable success target after deleting %s', async (_case, records) => {
    const onDeleteSuccessFocus = vi.fn()
    mockDeleteMutate.mockImplementationOnce((_id: string, options: { onSuccess: () => void }) =>
      options.onSuccess()
    )
    const user = userEvent.setup()
    render(
      <ExpenseTable
        expenses={records}
        onEdit={vi.fn()}
        onDeleteSuccessFocus={onDeleteSuccessFocus}
      />
    )

    await user.click(screen.getByRole('button', { name: /удалить расход аренда/i }))
    await user.click(screen.getByRole('button', { name: /подтвердить удаление расхода аренда/i }))

    await waitFor(() => expect(onDeleteSuccessFocus).toHaveBeenCalledOnce())
  })

  it.each(['', '2026-13', 'not-a-month'])(
    'keeps malformed month %j explicitly unavailable',
    month => {
      render(
        <ExpenseTable
          expenses={[{ ...expenses[0], month }]}
          onEdit={vi.fn()}
          onDeleteSuccessFocus={vi.fn()}
        />
      )

      expect(screen.getAllByText('Период недоступен')).not.toHaveLength(0)
      expect(
        screen.getByRole('table', { name: /расходы за период недоступен/i })
      ).toBeInTheDocument()
    }
  )

  it('keeps a non-finite amount explicitly unavailable in data and action names', async () => {
    const user = userEvent.setup()
    render(
      <ExpenseTable
        expenses={[{ ...expenses[0], amount: Number.NaN }]}
        onEdit={vi.fn()}
        onDeleteSuccessFocus={vi.fn()}
      />
    )

    expect(screen.getByRole('cell', { name: 'Сумма недоступна' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /изменить расход аренда, сумма недоступна/i })
    ).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: /удалить расход аренда, сумма недоступна/i })
    )
    expect(screen.getByRole('alertdialog')).toHaveTextContent(/аренда, сумма недоступна/i)
    expect(screen.queryByText(/NaN|не число/i)).not.toBeInTheDocument()
  })

  it('provides a named focusable region for a horizontally scrollable table', () => {
    render(<ExpenseTable expenses={expenses} onEdit={vi.fn()} onDeleteSuccessFocus={vi.fn()} />)

    expect(screen.getByRole('region', { name: /таблица расходов за июнь 2026/i })).toHaveAttribute(
      'tabindex',
      '0'
    )
  })

  it('has no obvious accessibility violations', async () => {
    const { container } = render(
      <ExpenseTable expenses={expenses} onEdit={vi.fn()} onDeleteSuccessFocus={vi.fn()} />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
