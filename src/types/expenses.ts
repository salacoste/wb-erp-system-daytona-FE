/**
 * Expense CRUD Types
 * API contract for /v1/expenses/* endpoints
 */

export const EXPENSE_CATEGORIES = ['rent', 'salary', 'packaging', 'transport', 'other'] as const
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export interface ExpenseCategoryConfig {
  value: ExpenseCategory
  label: string
}

/** Russian labels for expense categories */
export const EXPENSE_CATEGORY_CONFIG: ExpenseCategoryConfig[] = [
  { value: 'rent', label: 'Аренда' },
  { value: 'salary', label: 'Зарплата' },
  { value: 'packaging', label: 'Упаковка' },
  { value: 'transport', label: 'Транспорт' },
  { value: 'other', label: 'Прочее' },
]

export function getExpenseCategoryLabel(category: string): string {
  const config = EXPENSE_CATEGORY_CONFIG.find(c => c.value === category)
  return config?.label ?? category
}

export interface ExpenseItem {
  id: string
  cabinetId: string
  category: ExpenseCategory
  amount: number
  month: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface ExpenseSummary {
  total: number
  byCategory: Record<ExpenseCategory, number>
  byMonth: Array<{ month: string; total: number }>
}

export interface CreateExpensePayload {
  category: ExpenseCategory
  amount: number
  month: string
  description?: string
}

export interface UpdateExpensePayload {
  amount?: number
  description?: string
}
