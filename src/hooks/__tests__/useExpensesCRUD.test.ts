/**
 * Unit Tests for Expenses CRUD Hooks
 * Tests for src/hooks/useExpensesCRUD.ts
 *
 * Covers: useExpensesList, useExpensesSummary, useCreateExpense,
 * useUpdateExpense, useDeleteExpense (queries, mutations, cache invalidation, toasts)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import type { ExpenseItem, ExpenseSummary } from '@/types/expenses'

// Mock API module
vi.mock('@/lib/api/expenses', () => ({
  getExpenses: vi.fn(),
  getExpensesSummary: vi.fn(),
  createExpense: vi.fn(),
  updateExpense: vi.fn(),
  deleteExpense: vi.fn(),
  expenseQueryKeys: {
    all: ['expenses'] as const,
    list: (month: string) => ['expenses', 'list', month] as const,
    summary: (from: string, to: string) => ['expenses', 'summary', from, to] as const,
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

// Import mocked modules after mock setup
import { toast } from 'sonner'
import {
  getExpenses,
  getExpensesSummary,
  createExpense,
  updateExpense,
  deleteExpense,
  expenseQueryKeys,
} from '@/lib/api/expenses'
import {
  useExpensesList,
  useExpensesSummary,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from '../useExpensesCRUD'

// Fixtures
const mockExpenseItem: ExpenseItem = {
  id: 'exp-1',
  cabinetId: 'cab-1',
  category: 'rent',
  amount: 50000,
  month: '2026-06',
  description: 'Office rent',
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-01T00:00:00Z',
}

const mockSummary: ExpenseSummary = {
  total: 150000,
  byCategory: {
    rent: 50000,
    salary: 60000,
    packaging: 15000,
    transport: 10000,
    other: 15000,
  },
  byMonth: [{ month: '2026-06', total: 150000 }],
}

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children)
  }
}

function createWrapperWithClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children)
  return { client, wrapper }
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ============================================================================
// useExpensesList
// ============================================================================

describe('useExpensesList', () => {
  it('returns expenses for a given month', async () => {
    vi.mocked(getExpenses).mockResolvedValueOnce([mockExpenseItem])
    const { result } = renderHook(() => useExpensesList('2026-06'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].id).toBe('exp-1')
  })

  it('passes month parameter to getExpenses', async () => {
    vi.mocked(getExpenses).mockResolvedValueOnce([])
    const { result } = renderHook(() => useExpensesList('2026-05'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getExpenses).toHaveBeenCalledWith('2026-05')
  })

  it('returns loading state initially', () => {
    vi.mocked(getExpenses).mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useExpensesList('2026-06'), {
      wrapper: createWrapper(),
    })
    expect(result.current.isLoading).toBe(true)
  })

  it('returns error state on API failure', async () => {
    vi.mocked(getExpenses).mockRejectedValue(new Error('Network error'))
    const { result } = renderHook(() => useExpensesList('2026-06'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error).toBeInstanceOf(Error)
  })

  it('returns empty array when no expenses', async () => {
    vi.mocked(getExpenses).mockResolvedValueOnce([])
    const { result } = renderHook(() => useExpensesList('2026-01'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it('is disabled when month is empty', () => {
    vi.mocked(getExpenses).mockResolvedValueOnce([])
    const { result } = renderHook(() => useExpensesList(''), {
      wrapper: createWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
    expect(getExpenses).not.toHaveBeenCalled()
  })
})

// ============================================================================
// useExpensesSummary
// ============================================================================

describe('useExpensesSummary', () => {
  it('returns summary for a date range', async () => {
    vi.mocked(getExpensesSummary).mockResolvedValueOnce(mockSummary)
    const { result } = renderHook(() => useExpensesSummary('2026-06', '2026-06'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.total).toBe(150000)
    expect(result.current.data!.byCategory.rent).toBe(50000)
  })

  it('passes from and to parameters to getExpensesSummary', async () => {
    vi.mocked(getExpensesSummary).mockResolvedValueOnce(mockSummary)
    const { result } = renderHook(() => useExpensesSummary('2026-01', '2026-06'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getExpensesSummary).toHaveBeenCalledWith('2026-01', '2026-06')
  })

  it('returns loading state initially', () => {
    vi.mocked(getExpensesSummary).mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useExpensesSummary('2026-06', '2026-06'), {
      wrapper: createWrapper(),
    })
    expect(result.current.isLoading).toBe(true)
  })

  it('returns error state on API failure', async () => {
    vi.mocked(getExpensesSummary).mockRejectedValue(new Error('Server error'))
    const { result } = renderHook(() => useExpensesSummary('2026-06', '2026-06'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error).toBeInstanceOf(Error)
  })

  it('is disabled when from or to is empty', () => {
    vi.mocked(getExpensesSummary).mockResolvedValueOnce(mockSummary)
    const { result } = renderHook(() => useExpensesSummary('', '2026-06'), {
      wrapper: createWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
    expect(getExpensesSummary).not.toHaveBeenCalled()
  })
})

// ============================================================================
// useCreateExpense
// ============================================================================

describe('useCreateExpense', () => {
  const payload = {
    category: 'rent' as const,
    amount: 50000,
    month: '2026-06',
    description: 'Office rent',
  }

  it('calls createExpense API with correct payload', async () => {
    vi.mocked(createExpense).mockResolvedValueOnce(mockExpenseItem)
    const { result } = renderHook(() => useCreateExpense(), {
      wrapper: createWrapper(),
    })
    result.current.mutate(payload)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(createExpense).toHaveBeenCalledWith(payload)
  })

  it('returns created expense on success', async () => {
    vi.mocked(createExpense).mockResolvedValueOnce(mockExpenseItem)
    const { result } = renderHook(() => useCreateExpense(), {
      wrapper: createWrapper(),
    })
    result.current.mutate(payload)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.id).toBe('exp-1')
    expect(result.current.data!.category).toBe('rent')
  })

  it('shows success toast on creation', async () => {
    vi.mocked(createExpense).mockResolvedValueOnce(mockExpenseItem)
    const { result } = renderHook(() => useCreateExpense(), {
      wrapper: createWrapper(),
    })
    result.current.mutate(payload)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Расход добавлен', {
      description: '2026-06',
    })
  })

  it('invalidates expense queries on success', async () => {
    vi.mocked(createExpense).mockResolvedValueOnce(mockExpenseItem)
    const { client, wrapper } = createWrapperWithClient()
    const spy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useCreateExpense(), { wrapper })
    result.current.mutate(payload)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: expenseQueryKeys.all })
  })

  it('shows error toast on failure', async () => {
    vi.mocked(createExpense).mockRejectedValueOnce(new Error('Server error'))
    const { result } = renderHook(() => useCreateExpense(), {
      wrapper: createWrapper(),
    })
    result.current.mutate(payload)
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Ошибка добавления расхода', {
      description: 'Попробуйте ещё раз',
    })
  })

  it('does not invalidate queries on error', async () => {
    vi.mocked(createExpense).mockRejectedValueOnce(new Error('Fail'))
    const { client, wrapper } = createWrapperWithClient()
    const spy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useCreateExpense(), { wrapper })
    result.current.mutate(payload)
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(spy).not.toHaveBeenCalled()
  })

  it('returns isPending during mutation', async () => {
    vi.mocked(createExpense).mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useCreateExpense(), {
      wrapper: createWrapper(),
    })
    result.current.mutate(payload)
    await waitFor(() => expect(result.current.isPending).toBe(true))
  })
})

// ============================================================================
// useUpdateExpense
// ============================================================================

describe('useUpdateExpense', () => {
  const updateArgs = {
    id: 'exp-1',
    data: { amount: 55000, description: 'Updated rent' },
  }

  it('calls updateExpense API with id and data', async () => {
    const updated = { ...mockExpenseItem, amount: 55000 }
    vi.mocked(updateExpense).mockResolvedValueOnce(updated)
    const { result } = renderHook(() => useUpdateExpense(), {
      wrapper: createWrapper(),
    })
    result.current.mutate(updateArgs)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(updateExpense).toHaveBeenCalledWith('exp-1', updateArgs.data)
  })

  it('shows success toast on update', async () => {
    vi.mocked(updateExpense).mockResolvedValueOnce(mockExpenseItem)
    const { result } = renderHook(() => useUpdateExpense(), {
      wrapper: createWrapper(),
    })
    result.current.mutate(updateArgs)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Расход обновлён')
  })

  it('invalidates expense queries on success', async () => {
    vi.mocked(updateExpense).mockResolvedValueOnce(mockExpenseItem)
    const { client, wrapper } = createWrapperWithClient()
    const spy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateExpense(), { wrapper })
    result.current.mutate(updateArgs)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: expenseQueryKeys.all })
  })

  it('shows error toast on failure', async () => {
    vi.mocked(updateExpense).mockRejectedValueOnce(new Error('Update failed'))
    const { result } = renderHook(() => useUpdateExpense(), {
      wrapper: createWrapper(),
    })
    result.current.mutate(updateArgs)
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Ошибка обновления расхода', {
      description: 'Попробуйте ещё раз',
    })
  })

  it('returns updated expense on success', async () => {
    const updated = { ...mockExpenseItem, amount: 55000, description: 'Updated rent' }
    vi.mocked(updateExpense).mockResolvedValueOnce(updated)
    const { result } = renderHook(() => useUpdateExpense(), {
      wrapper: createWrapper(),
    })
    result.current.mutate(updateArgs)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.amount).toBe(55000)
  })
})

// ============================================================================
// useDeleteExpense
// ============================================================================

describe('useDeleteExpense', () => {
  it('calls deleteExpense API with id', async () => {
    vi.mocked(deleteExpense).mockResolvedValueOnce(undefined)
    const { result } = renderHook(() => useDeleteExpense(), {
      wrapper: createWrapper(),
    })
    result.current.mutate('exp-1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(deleteExpense).toHaveBeenCalledWith('exp-1')
  })

  it('shows success toast on deletion', async () => {
    vi.mocked(deleteExpense).mockResolvedValueOnce(undefined)
    const { result } = renderHook(() => useDeleteExpense(), {
      wrapper: createWrapper(),
    })
    result.current.mutate('exp-1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Расход удалён')
  })

  it('invalidates expense queries on success', async () => {
    vi.mocked(deleteExpense).mockResolvedValueOnce(undefined)
    const { client, wrapper } = createWrapperWithClient()
    const spy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteExpense(), { wrapper })
    result.current.mutate('exp-1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: expenseQueryKeys.all })
  })

  it('shows error toast on failure', async () => {
    vi.mocked(deleteExpense).mockRejectedValueOnce(new Error('Delete failed'))
    const { result } = renderHook(() => useDeleteExpense(), {
      wrapper: createWrapper(),
    })
    result.current.mutate('exp-1')
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Ошибка удаления расхода', {
      description: 'Попробуйте ещё раз',
    })
  })

  it('does not invalidate queries on error', async () => {
    vi.mocked(deleteExpense).mockRejectedValueOnce(new Error('Fail'))
    const { client, wrapper } = createWrapperWithClient()
    const spy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteExpense(), { wrapper })
    result.current.mutate('exp-1')
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(spy).not.toHaveBeenCalled()
  })

  it('returns isPending during mutation', async () => {
    vi.mocked(deleteExpense).mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useDeleteExpense(), {
      wrapper: createWrapper(),
    })
    result.current.mutate('exp-1')
    await waitFor(() => expect(result.current.isPending).toBe(true))
  })
})

// ============================================================================
// Query Keys
// ============================================================================

describe('expenseQueryKeys', () => {
  it('generates correct base key', () => {
    expect(expenseQueryKeys.all).toEqual(['expenses'])
  })

  it('generates list key with month', () => {
    expect(expenseQueryKeys.list('2026-06')).toEqual(['expenses', 'list', '2026-06'])
  })

  it('generates unique list keys for different months', () => {
    expect(expenseQueryKeys.list('2026-05')).not.toEqual(expenseQueryKeys.list('2026-06'))
  })

  it('generates summary key with from/to', () => {
    expect(expenseQueryKeys.summary('2026-01', '2026-06')).toEqual([
      'expenses',
      'summary',
      '2026-01',
      '2026-06',
    ])
  })

  it('generates unique summary keys for different ranges', () => {
    expect(expenseQueryKeys.summary('2026-01', '2026-06')).not.toEqual(
      expenseQueryKeys.summary('2026-01', '2026-07')
    )
  })
})
