/**
 * Expenses API Client
 * CRUD operations for /v1/expenses/* endpoints
 */

import { apiClient } from '@/lib/api-client'
import type {
  ExpenseItem,
  ExpenseSummary,
  CreateExpensePayload,
  UpdateExpensePayload,
} from '@/types/expenses'
import {
  normalizeExpensesResponse,
  normalizeExpenseItem,
  normalizeExpenseSummaryResponse,
} from './expense-normalizer'

export const expenseQueryKeys = {
  all: ['expenses'] as const,
  list: (month: string) => [...expenseQueryKeys.all, 'list', month] as const,
  summary: (from: string, to: string) => [...expenseQueryKeys.all, 'summary', from, to] as const,
}

/** GET /v1/expenses?month=YYYY-MM */
export async function getExpenses(month: string): Promise<ExpenseItem[]> {
  const raw = await apiClient.get<unknown[]>(`/v1/expenses?month=${month}`)
  return normalizeExpensesResponse(raw)
}

/** GET /v1/expenses/summary?from=YYYY-MM&to=YYYY-MM */
export async function getExpensesSummary(from: string, to: string): Promise<ExpenseSummary> {
  const raw = await apiClient.get<unknown>(`/v1/expenses/summary?from=${from}&to=${to}`)
  return normalizeExpenseSummaryResponse(raw)
}

/** POST /v1/expenses */
export async function createExpense(data: CreateExpensePayload): Promise<ExpenseItem> {
  const raw = await apiClient.post<unknown>('/v1/expenses', data)
  return normalizeExpenseItem(raw)
}

/** PUT /v1/expenses/:id */
export async function updateExpense(id: string, data: UpdateExpensePayload): Promise<ExpenseItem> {
  const raw = await apiClient.put<unknown>(`/v1/expenses/${id}`, data)
  return normalizeExpenseItem(raw)
}

/** DELETE /v1/expenses/:id → 204 */
export async function deleteExpense(id: string): Promise<void> {
  await apiClient.delete(`/v1/expenses/${id}`)
}
