/**
 * Unit tests for useAlerts hooks
 * Tests: useAlertRules, useAlertHistory, useAlertSummary,
 *        useCreateAlertRule, useUpdateAlertRule, useDeleteAlertRule
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import {
  useAlertRules,
  useAlertHistory,
  useAlertSummary,
  useCreateAlertRule,
  useUpdateAlertRule,
  useDeleteAlertRule,
} from '../useAlerts'
import * as alertsApi from '@/lib/api/alerts'
import type { AlertRule, AlertHistoryItem, AlertSummary } from '@/types/alerts'

vi.mock('@/lib/api/alerts')

const mockGetAlertRules = vi.mocked(alertsApi.getAlertRules)
const mockGetAlertHistory = vi.mocked(alertsApi.getAlertHistory)
const mockGetAlertSummary = vi.mocked(alertsApi.getAlertSummary)
const mockCreateAlertRule = vi.mocked(alertsApi.createAlertRule)
const mockUpdateAlertRule = vi.mocked(alertsApi.updateAlertRule)
const mockDeleteAlertRule = vi.mocked(alertsApi.deleteAlertRule)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

const mockRule: AlertRule = {
  id: 'rule-1',
  alertType: 'stockout.risk',
  enabled: true,
  thresholds: { daysLeftWarning: 14 },
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
} as unknown as AlertRule

const mockHistoryItem: AlertHistoryItem = {
  id: 'hist-1',
  alertType: 'stockout.risk',
  severity: 'critical',
  message: 'Stock low',
  nmId: 123,
  triggeredAt: '2025-01-01T00:00:00Z',
  acknowledged: false,
} as unknown as AlertHistoryItem

const mockSummary: AlertSummary = {
  total: 5,
  critical: 2,
  warning: 3,
  info: 0,
} as unknown as AlertSummary

describe('useAlertRules', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches rules on mount', async () => {
    mockGetAlertRules.mockResolvedValueOnce([mockRule])
    const { result } = renderHook(() => useAlertRules(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([mockRule])
  })

  it('is loading before fetch completes', async () => {
    mockGetAlertRules.mockImplementation(() => new Promise(() => {}))
    const { result } = renderHook(() => useAlertRules(), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBe(true)
  })

  it('returns error on failure', async () => {
    mockGetAlertRules.mockRejectedValueOnce(new Error('Server error'))
    mockGetAlertRules.mockRejectedValueOnce(new Error('Server error'))
    const { result } = renderHook(() => useAlertRules(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error).toBeTruthy()
  })
})

describe('useAlertHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches history with default params', async () => {
    mockGetAlertHistory.mockResolvedValueOnce([mockHistoryItem])
    const { result } = renderHook(() => useAlertHistory(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetAlertHistory).toHaveBeenCalledWith({})
    expect(result.current.data).toEqual([mockHistoryItem])
  })

  it('passes params to API', async () => {
    mockGetAlertHistory.mockResolvedValueOnce([])
    const params = { limit: 10, alertType: 'stockout.risk' as const }
    const { result } = renderHook(() => useAlertHistory(params), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetAlertHistory).toHaveBeenCalledWith(params)
  })

  it('returns error on failure', async () => {
    mockGetAlertHistory.mockRejectedValueOnce(new Error('fail'))
    mockGetAlertHistory.mockRejectedValueOnce(new Error('fail'))
    const { result } = renderHook(() => useAlertHistory(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
  })
})

describe('useAlertSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches summary with default 7 days', async () => {
    mockGetAlertSummary.mockResolvedValueOnce(mockSummary)
    const { result } = renderHook(() => useAlertSummary(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetAlertSummary).toHaveBeenCalledWith(7)
  })

  it('fetches summary with custom days', async () => {
    mockGetAlertSummary.mockResolvedValueOnce(mockSummary)
    const { result } = renderHook(() => useAlertSummary(30), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetAlertSummary).toHaveBeenCalledWith(30)
  })
})

describe('useCreateAlertRule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a rule and invalidates rules query', async () => {
    mockCreateAlertRule.mockResolvedValueOnce(mockRule)
    const payload = { alertType: 'stockout.risk' as const, thresholds: { daysLeftWarning: 14 } }

    const { result } = renderHook(() => useCreateAlertRule(), { wrapper: createWrapper() })
    result.current.mutate(payload as never)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockCreateAlertRule).toHaveBeenCalledWith(payload)
  })

  it('returns error on creation failure', async () => {
    mockCreateAlertRule.mockRejectedValueOnce(new Error('Validation failed'))

    const { result } = renderHook(() => useCreateAlertRule(), { wrapper: createWrapper() })
    result.current.mutate({} as never)

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useUpdateAlertRule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates a rule and invalidates cache', async () => {
    mockUpdateAlertRule.mockResolvedValueOnce(mockRule)
    const args = { id: 'rule-1', payload: { enabled: false } }

    const { result } = renderHook(() => useUpdateAlertRule(), { wrapper: createWrapper() })
    result.current.mutate(args as never)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockUpdateAlertRule).toHaveBeenCalledWith('rule-1', { enabled: false })
  })
})

describe('useDeleteAlertRule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes a rule and invalidates cache', async () => {
    mockDeleteAlertRule.mockResolvedValueOnce(undefined as unknown as void)

    const { result } = renderHook(() => useDeleteAlertRule(), { wrapper: createWrapper() })
    result.current.mutate('rule-1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockDeleteAlertRule).toHaveBeenCalledWith('rule-1')
  })

  it('returns error on deletion failure', async () => {
    mockDeleteAlertRule.mockRejectedValueOnce(new Error('Not found'))

    const { result } = renderHook(() => useDeleteAlertRule(), { wrapper: createWrapper() })
    result.current.mutate('rule-999')

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
