/**
 * useTrainAiModel + parseTrainErrorMessage tests — Story 109.4-FE.
 * AC-1: parseTrainErrorMessage pure helper (5 cases).
 * AC-1: useTrainAiModel mutation — invokes postModelTrain, invalidates cache.
 * AC-7: test plan per story spec.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  parseTrainErrorMessage,
  useTrainAiModel,
  type InsufficientDataErrorBody,
} from '../useTrainAiModel'
import { aiModelsKeys } from '../useAiModels'
import { ApiError } from '@/types/api'
import * as modelsApi from '@/lib/api/ai/models'
import * as authStore from '@/stores/authStore'

vi.mock('@/lib/api/ai/models')
vi.mock('@/stores/authStore')

const mockPostModelTrain = vi.mocked(modelsApi.postModelTrain)
const mockUseAuthStore = vi.mocked(authStore.useAuthStore)

const CABINET_ID = 'cab-train-123'

// ── parseTrainErrorMessage — pure helper tests (no React render) ──────────────

describe('parseTrainErrorMessage', () => {
  it('null → UNKNOWN with fallback message', () => {
    const result = parseTrainErrorMessage(null)
    expect(result.code).toBe('UNKNOWN')
    expect(result.message).toContain('Ошибка запуска обучения')
  })

  it('undefined → UNKNOWN with fallback message', () => {
    const result = parseTrainErrorMessage(undefined)
    expect(result.code).toBe('UNKNOWN')
    expect(result.message).toContain('Ошибка запуска обучения')
  })

  it('ApiError 422 with structured body → INSUFFICIENT_DATA + interpolated message', () => {
    const body: InsufficientDataErrorBody = {
      error: { code: 'INSUFFICIENT_DATA', message: 'Not enough data' },
      weeksCollected: 8,
      weeksRequired: 12,
      cogsCoveragePct: 75,
    }
    const err = new ApiError('Insufficient data', 422, body)
    const result = parseTrainErrorMessage(err)
    expect(result.code).toBe('INSUFFICIENT_DATA')
    // ru-RU: formatPercentageInt emits "75 %" with a real U+00A0 NBSP (not normalized here)
    expect(result.message).toBe(
      `Недостаточно данных: собрано 8/12 нед., покрытие COGS 75${String.fromCharCode(0xa0)}%`
    )
    expect(result.details).toEqual(body)
  })

  it('ApiError 422 with malformed body → INSUFFICIENT_DATA + generic message', () => {
    const err = new ApiError('Insufficient data', 422, { unexpected: true })
    const result = parseTrainErrorMessage(err)
    expect(result.code).toBe('INSUFFICIENT_DATA')
    expect(result.message).toBe('Недостаточно данных для обучения')
    expect(result.details).toBeUndefined()
  })

  it('ApiError 429 → RATE_LIMIT + rate-limit message', () => {
    const err = new ApiError('Too Many Requests', 429, null)
    const result = parseTrainErrorMessage(err)
    expect(result.code).toBe('RATE_LIMIT')
    expect(result.message).toBe('Превышен лимит обучения, попробуйте через час')
  })

  it('ApiError 500 → UNKNOWN + error.message interpolated', () => {
    const err = new ApiError('Internal Server Error', 500, null)
    const result = parseTrainErrorMessage(err)
    expect(result.code).toBe('UNKNOWN')
    expect(result.message).toBe('Ошибка запуска обучения: Internal Server Error')
  })

  it('plain Error (non-ApiError) → UNKNOWN + error.message interpolated', () => {
    const err = new Error('network failure')
    const result = parseTrainErrorMessage(err)
    expect(result.code).toBe('UNKNOWN')
    expect(result.message).toBe('Ошибка запуска обучения: network failure')
  })
})

// ── useTrainAiModel mutation hook tests ───────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return {
    queryClient,
    wrapper: ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockUseAuthStore.mockImplementation((selector: any) => selector({ cabinetId: CABINET_ID }))
})

describe('useTrainAiModel', () => {
  it('invokes postModelTrain with { modelType } body on mutate(modelType)', async () => {
    mockPostModelTrain.mockResolvedValueOnce({
      status: 'queued',
      modelType: 'sales_forecast',
      message: undefined,
    })
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useTrainAiModel(), { wrapper })

    act(() => {
      result.current.mutate('sales_forecast')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockPostModelTrain).toHaveBeenCalledWith({ modelType: 'sales_forecast' })
  })

  it('invokes postModelTrain with demand_forecast modelType', async () => {
    mockPostModelTrain.mockResolvedValueOnce({
      status: 'queued',
      modelType: 'demand_forecast',
      message: undefined,
    })
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useTrainAiModel(), { wrapper })

    act(() => {
      result.current.mutate('demand_forecast')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockPostModelTrain).toHaveBeenCalledWith({ modelType: 'demand_forecast' })
  })

  it('invalidates aiModelsKeys.list(cabinetId) on success', async () => {
    mockPostModelTrain.mockResolvedValueOnce({
      status: 'queued',
      modelType: 'sales_forecast',
      message: undefined,
    })
    const { queryClient, wrapper } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useTrainAiModel(), { wrapper })

    act(() => {
      result.current.mutate('sales_forecast')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: aiModelsKeys.list(CABINET_ID),
    })
  })

  it('202 duplicate path → mutation success, status is duplicate, no error', async () => {
    mockPostModelTrain.mockResolvedValueOnce({
      status: 'duplicate',
      modelType: 'sales_forecast',
      message: 'Already training',
    })
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useTrainAiModel(), { wrapper })

    act(() => {
      result.current.mutate('sales_forecast')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.status).toBe('duplicate')
    expect(result.current.isError).toBe(false)
  })

  it('422 ApiError → mutation fails, error.status is 422, error.data has structured body', async () => {
    const body: InsufficientDataErrorBody = {
      error: { code: 'INSUFFICIENT_DATA', message: 'Not enough data' },
      weeksCollected: 5,
      weeksRequired: 12,
      cogsCoveragePct: 40,
    }
    const apiErr = new ApiError('Insufficient data', 422, body)
    mockPostModelTrain.mockRejectedValueOnce(apiErr)
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useTrainAiModel(), { wrapper })

    act(() => {
      result.current.mutate('sales_forecast')
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.status).toBe(422)
    const errBody = result.current.error?.data as InsufficientDataErrorBody
    expect(errBody.weeksCollected).toBe(5)
    expect(errBody.weeksRequired).toBe(12)
    expect(errBody.cogsCoveragePct).toBe(40)
  })
})
