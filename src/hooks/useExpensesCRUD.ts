/**
 * TanStack Query hooks for Expenses CRUD
 * Data layer for /v1/expenses/* endpoints
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import {
  getExpenses,
  getExpensesSummary,
  createExpense,
  updateExpense,
  deleteExpense,
  expenseQueryKeys,
} from '@/lib/api/expenses'
import type { ExpenseItem, CreateExpensePayload, UpdateExpensePayload } from '@/types/expenses'

/** Query: fetch expenses for a given month */
export function useExpensesList(month: string) {
  return useQuery({
    queryKey: expenseQueryKeys.list(month),
    queryFn: () => getExpenses(month),
    enabled: !!month,
    staleTime: 60_000,
    gcTime: 300_000,
    retry: 1,
  })
}

/** Query: fetch expense summary for a date range */
export function useExpensesSummary(from: string, to: string) {
  return useQuery({
    queryKey: expenseQueryKeys.summary(from, to),
    queryFn: () => getExpensesSummary(from, to),
    enabled: !!from && !!to,
    staleTime: 60_000,
    gcTime: 300_000,
    retry: 1,
  })
}

/** Mutation: create a new expense */
export function useCreateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateExpensePayload): Promise<ExpenseItem> => {
      logger.debug('[Expenses] Creating expense', data)
      return createExpense(data)
    },
    onSuccess: result => {
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.all })
      toast.success('Расход добавлен', {
        description: `${result.month}`,
      })
    },
    onError: (error: Error) => {
      logger.error('[Expenses] Create failed', error)
      toast.error('Ошибка добавления расхода', {
        description: 'Попробуйте ещё раз',
      })
    },
  })
}

/** Mutation: update an existing expense */
export function useUpdateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: UpdateExpensePayload
    }): Promise<ExpenseItem> => {
      logger.debug('[Expenses] Updating expense', id, data)
      return updateExpense(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.all })
      toast.success('Расход обновлён')
    },
    onError: (error: Error) => {
      logger.error('[Expenses] Update failed', error)
      toast.error('Ошибка обновления расхода', {
        description: 'Попробуйте ещё раз',
      })
    },
  })
}

/** Mutation: delete an expense */
export function useDeleteExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string): Promise<void> => {
      logger.debug('[Expenses] Deleting expense', id)
      return deleteExpense(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.all })
      toast.success('Расход удалён')
    },
    onError: (error: Error) => {
      logger.error('[Expenses] Delete failed', error)
      toast.error('Ошибка удаления расхода', {
        description: 'Попробуйте ещё раз',
      })
    },
  })
}
