/**
 * Expenses Page Tests
 * Tests for src/app/(dashboard)/settings/expenses/page.tsx
 *
 * Covers: loading, empty, data states; month picker; dialog open/close; delete
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@/test/utils/test-utils'
import type { ExpenseItem } from '@/types/expenses'

// Mock hooks
const mockUseExpensesList = vi.fn()
const mockUseDeleteExpense = vi.fn(() => ({
  mutate: vi.fn(),
  isPending: false,
}))

vi.mock('@/hooks/useExpensesCRUD', () => ({
  useExpensesList: (...args: unknown[]) => mockUseExpensesList(...args),
  useDeleteExpense: () => mockUseDeleteExpense(),
}))

// Mock child components with data-testid
vi.mock('../components/ExpenseSummaryCards', () => ({
  ExpenseSummaryCards: ({ month }: { month: string }) => (
    <div data-testid="expense-summary-cards" data-month={month}>
      ExpenseSummaryCards
    </div>
  ),
}))

vi.mock('../components/ExpenseFormDialog', () => ({
  ExpenseFormDialog: ({
    open,
    onOpenChange,
    month,
    editingExpense,
  }: {
    open: boolean
    onOpenChange: (open: boolean) => void
    month: string
    editingExpense?: ExpenseItem | null
  }) => (
    <div
      data-testid="expense-form-dialog"
      data-open={String(open)}
      data-month={month}
      data-editing={editingExpense ? editingExpense.id : 'none'}
    >
      <button data-testid="dialog-close" onClick={() => onOpenChange(false)}>
        CloseDialog
      </button>
    </div>
  ),
}))

// Import after mocks
import ExpensesPage from '../page'

// Fixtures
const mockExpenses: ExpenseItem[] = [
  {
    id: 'exp-1',
    cabinetId: 'cab-1',
    category: 'rent',
    amount: 50000,
    month: '2026-06',
    description: 'Office rent',
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'exp-2',
    cabinetId: 'cab-1',
    category: 'salary',
    amount: 120000,
    month: '2026-06',
    description: null,
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
  },
]

function setupHookReturn(
  overrides: Partial<{
    data: ExpenseItem[] | undefined
    isLoading: boolean
    isError: boolean
    isFetching: boolean
    refetch: () => void
  }>
) {
  mockUseExpensesList.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
    ...overrides,
  })
}

describe('ExpensesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseDeleteExpense.mockReturnValue({ mutate: vi.fn(), isPending: false })
  })

  describe('Page structure', () => {
    beforeEach(() => {
      setupHookReturn({ data: [], isLoading: false })
    })

    it('renders page title "Операционные расходы"', () => {
      render(<ExpensesPage />)
      expect(
        screen.getByRole('heading', { name: /операционные расходы/i, level: 1 })
      ).toBeInTheDocument()
    })

    it('renders subtitle text', () => {
      render(<ExpensesPage />)
      expect(screen.getByText(/учёт и управление операционными расходами/i)).toBeInTheDocument()
    })

    it('renders "Добавить расход" button', () => {
      render(<ExpensesPage />)
      expect(screen.getByRole('button', { name: /добавить расход/i })).toBeInTheDocument()
    })

    it('renders month selector input', () => {
      render(<ExpensesPage />)
      expect(screen.getByLabelText(/выбрать месяц/i)).toBeInTheDocument()
    })

    it('renders ExpenseSummaryCards', () => {
      render(<ExpensesPage />)
      expect(screen.getByTestId('expense-summary-cards')).toBeInTheDocument()
    })

    it('renders ExpenseFormDialog', () => {
      render(<ExpensesPage />)
      expect(screen.getByTestId('expense-form-dialog')).toBeInTheDocument()
    })
  })

  describe('Loading state', () => {
    beforeEach(() => {
      setupHookReturn({ data: undefined, isLoading: true })
    })

    it('announces the named loading state', () => {
      render(<ExpensesPage />)
      expect(screen.getByRole('heading', { name: /загружаем расходы/i })).toBeInTheDocument()
    })

    it('does not render table during loading', () => {
      render(<ExpensesPage />)
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })

    it('does not present an unknown saved count as zero', () => {
      render(<ExpensesPage />)
      expect(screen.queryByText(/сохранено расходов/i)).not.toBeInTheDocument()
    })
  })

  describe('Empty state', () => {
    beforeEach(() => {
      setupHookReturn({ data: [], isLoading: false })
    })

    it('renders "Нет расходов" message', () => {
      render(<ExpensesPage />)
      expect(screen.getByText(/нет расходов/i)).toBeInTheDocument()
    })

    it('renders "Добавить первый расход" button', () => {
      render(<ExpensesPage />)
      expect(screen.getByRole('button', { name: /добавить первый расход/i })).toBeInTheDocument()
    })

    it('does not render table when empty', () => {
      render(<ExpensesPage />)
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })

    it('shows zero only for a successful empty result', () => {
      render(<ExpensesPage />)
      expect(screen.getByText(/сохранено расходов/i)).toBeInTheDocument()
      expect(screen.getByText('0')).toBeInTheDocument()
    })
  })

  describe('Error state', () => {
    it('distinguishes a failed list from an empty result and retries', () => {
      const refetch = vi.fn()
      setupHookReturn({ data: undefined, isLoading: false, isError: true, refetch })
      render(<ExpensesPage />)

      expect(
        screen.getByRole('heading', { name: /не удалось загрузить расходы/i })
      ).toBeInTheDocument()
      expect(screen.queryByText(/нет расходов за этот месяц/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/сохранено расходов/i)).not.toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: /повторить загрузку/i }))
      expect(refetch).toHaveBeenCalledOnce()
    })
  })

  describe('Data state', () => {
    beforeEach(() => {
      setupHookReturn({ data: mockExpenses, isLoading: false })
    })

    it('renders expense table with rows', () => {
      render(<ExpensesPage />)
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('renders category labels in table rows', () => {
      render(<ExpensesPage />)
      expect(screen.getByText('Аренда')).toBeInTheDocument()
      expect(screen.getByText('Зарплата')).toBeInTheDocument()
    })

    it('renders formatted amounts in table rows', () => {
      render(<ExpensesPage />)
      // formatCurrency(50000) includes currency symbol
      expect(screen.getByText(/50.*000/)).toBeInTheDocument()
    })

    it('renders description or dash for null description', () => {
      render(<ExpensesPage />)
      expect(screen.getByText('Office rent')).toBeInTheDocument()
      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('renders edit and delete buttons per row', () => {
      render(<ExpensesPage />)
      const editButtons = screen.getAllByRole('button', { name: /изменить/i })
      const deleteButtons = screen.getAllByRole('button', { name: /удалить/i })
      expect(editButtons).toHaveLength(2)
      expect(deleteButtons).toHaveLength(2)
    })

    it('renders correct table headers', () => {
      render(<ExpensesPage />)
      expect(screen.getByText('Категория')).toBeInTheDocument()
      expect(screen.getByText('Сумма')).toBeInTheDocument()
      expect(screen.getByText('Описание')).toBeInTheDocument()
      expect(screen.getByText('Действия')).toBeInTheDocument()
    })
  })

  describe('Month picker', () => {
    beforeEach(() => {
      setupHookReturn({ data: [], isLoading: false })
    })

    it('renders month input with current month default', () => {
      render(<ExpensesPage />)
      const monthInput = screen.getByLabelText(/выбрать месяц/i) as HTMLInputElement
      // Should be current month in YYYY-MM format
      expect(monthInput.value).toMatch(/^\d{4}-\d{2}$/)
    })

    it('updates month value on change', () => {
      render(<ExpensesPage />)
      const monthInput = screen.getByLabelText(/выбрать месяц/i) as HTMLInputElement
      fireEvent.change(monthInput, { target: { value: '2026-01' } })
      expect(monthInput.value).toBe('2026-01')
    })

    it('passes month to ExpenseSummaryCards', () => {
      render(<ExpensesPage />)
      const summaryCards = screen.getByTestId('expense-summary-cards')
      expect(summaryCards).toHaveAttribute('data-month')
    })

    it('passes updated month to ExpenseSummaryCards after change', () => {
      render(<ExpensesPage />)
      const monthInput = screen.getByLabelText(/выбрать месяц/i) as HTMLInputElement
      fireEvent.change(monthInput, { target: { value: '2025-12' } })
      const summaryCards = screen.getByTestId('expense-summary-cards')
      expect(summaryCards).toHaveAttribute('data-month', '2025-12')
    })

    it('keeps a cleared month explicit instead of showing successful zero data', () => {
      render(<ExpensesPage />)
      const monthInput = screen.getByLabelText(/выбрать месяц/i)
      fireEvent.change(monthInput, { target: { value: '' } })

      const error = document.getElementById('month-selector-error')
      expect(error).toHaveTextContent('Выберите корректный месяц')
      expect(monthInput).toHaveAttribute('aria-invalid', 'true')
      expect(monthInput).toHaveAttribute('aria-describedby', error!.id)
      expect(
        screen.getByRole('heading', { name: /выберите корректный месяц/i })
      ).toBeInTheDocument()
      expect(screen.queryByTestId('expense-summary-cards')).not.toBeInTheDocument()
      expect(screen.queryByText(/нет расходов за этот месяц/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/сохранено расходов/i)).not.toBeInTheDocument()
      expect(mockUseExpensesList).toHaveBeenLastCalledWith('')
    })
  })

  describe('Dialog interactions', () => {
    beforeEach(() => {
      setupHookReturn({ data: mockExpenses, isLoading: false })
    })

    it('opens dialog when "Добавить расход" is clicked', () => {
      render(<ExpensesPage />)
      const addButton = screen.getByRole('button', { name: /добавить расход/i })
      fireEvent.click(addButton)
      const dialog = screen.getByTestId('expense-form-dialog')
      expect(dialog).toHaveAttribute('data-open', 'true')
      expect(dialog).toHaveAttribute('data-editing', 'none')
    })

    it('opens dialog with editing expense when "Изменить" is clicked', () => {
      render(<ExpensesPage />)
      const editButtons = screen.getAllByRole('button', { name: /изменить/i })
      fireEvent.click(editButtons[0])
      const dialog = screen.getByTestId('expense-form-dialog')
      expect(dialog).toHaveAttribute('data-open', 'true')
      expect(dialog).toHaveAttribute('data-editing', 'exp-1')
    })

    it('opens dialog with no editing expense when add button clicked after edit', () => {
      render(<ExpensesPage />)
      const editButtons = screen.getAllByRole('button', { name: /изменить/i })
      fireEvent.click(editButtons[0])
      const addButton = screen.getByRole('button', { name: /добавить расход/i })
      fireEvent.click(addButton)
      const dialog = screen.getByTestId('expense-form-dialog')
      expect(dialog).toHaveAttribute('data-editing', 'none')
    })
  })

  describe('Delete action', () => {
    it('calls deleteMutation.mutate only after confirmation', () => {
      const mockMutate = vi.fn()
      mockUseDeleteExpense.mockReturnValue({ mutate: mockMutate, isPending: false })
      setupHookReturn({ data: mockExpenses, isLoading: false })

      render(<ExpensesPage />)
      const deleteButtons = screen.getAllByRole('button', { name: /удалить/i })
      fireEvent.click(deleteButtons[0])
      expect(mockMutate).not.toHaveBeenCalled()
      fireEvent.click(screen.getByRole('button', { name: /подтвердить удаление/i }))
      expect(mockMutate).toHaveBeenCalledWith(
        'exp-1',
        expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
      )
    })

    it('disables the selected confirmation when mutation is pending', () => {
      mockUseDeleteExpense.mockReturnValue({ mutate: vi.fn(), isPending: true })
      setupHookReturn({ data: mockExpenses, isLoading: false })

      render(<ExpensesPage />)
      const deleteButtons = screen.getAllByRole('button', { name: /удалить/i })
      fireEvent.click(deleteButtons[0])
      expect(screen.getByRole('button', { name: /удаление расхода/i })).toBeDisabled()
    })
  })

  describe('Empty state add button', () => {
    it('opens dialog when "Добавить первый расход" is clicked', () => {
      setupHookReturn({ data: [], isLoading: false })
      render(<ExpensesPage />)
      const addFirstBtn = screen.getByRole('button', { name: /добавить первый расход/i })
      fireEvent.click(addFirstBtn)
      const dialog = screen.getByTestId('expense-form-dialog')
      expect(dialog).toHaveAttribute('data-open', 'true')
      expect(dialog).toHaveAttribute('data-editing', 'none')
    })
  })
})
