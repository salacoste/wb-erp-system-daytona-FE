import { act, renderHook, waitFor } from '@testing-library/react'
import type { ImportStatusResponse } from '@/types/storage-analytics'
import { beforeEach, describe, expect, it, vi } from 'vitest'

interface ImportStatusHolder {
  value: ImportStatusResponse | undefined
}

const mocks = vi.hoisted(() => {
  const statusData: ImportStatusHolder = { value: undefined }
  return {
    invalidateQueries: vi.fn(),
    mutateAsync: vi.fn(),
    statusData,
    useImportStatus: vi.fn(),
  }
})

const nonterminalStatuses: ImportStatusResponse['status'][] = ['pending', 'processing', 'unknown']

vi.mock('@/hooks/useStorageAnalytics', () => ({
  usePaidStorageImport: () => ({
    isPending: false,
    mutateAsync: mocks.mutateAsync,
  }),
  useImportStatus: (importId: string | null, options: { refetchInterval: number | false }) => {
    mocks.useImportStatus(importId, options)
    return { data: mocks.statusData.value }
  },
  useInvalidateStorageQueries: () => mocks.invalidateQueries,
}))

import { useStorageImport } from '../useStorageImport'

const setDateRange = (
  result: ReturnType<typeof renderHook<ReturnType<typeof useStorageImport>, never>>['result']
) => {
  act(() => {
    result.current.setDateFrom('2026-08-01')
    result.current.setDateTo('2026-08-08')
  })
}

const startImport = async (
  result: ReturnType<typeof renderHook<ReturnType<typeof useStorageImport>, never>>['result']
) => {
  await act(async () => {
    await result.current.handleStartImport()
  })
}

describe('useStorageImport - Story 169.12 authoritative contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.statusData.value = undefined
    mocks.mutateAsync.mockResolvedValue({
      import_id: 'paid-storage-import-1',
      status: 'pending',
      date_range: { from: '2026-08-01', to: '2026-08-08' },
      message: 'Import accepted',
    })
  })

  it('sends the exact paid-storage date payload and treats accepted pending as processing', async () => {
    const { result } = renderHook(() => useStorageImport(vi.fn()))
    setDateRange(result)

    await startImport(result)

    expect(mocks.mutateAsync).toHaveBeenCalledWith({
      dateFrom: '2026-08-01',
      dateTo: '2026-08-08',
    })
    expect(result.current.importState).toEqual({
      status: 'processing',
      importId: 'paid-storage-import-1',
    })
    expect(mocks.useImportStatus).toHaveBeenLastCalledWith('paid-storage-import-1', {
      refetchInterval: 2000,
    })
  })

  it.each(nonterminalStatuses)('keeps polling while the normalized status is %s', async status => {
    const { result, rerender } = renderHook(() => useStorageImport(vi.fn()))
    setDateRange(result)
    await startImport(result)

    mocks.statusData.value = { import_id: 'paid-storage-import-1', status }
    rerender()

    expect(result.current.importState).toEqual({
      status: 'processing',
      importId: 'paid-storage-import-1',
    })
    expect(mocks.useImportStatus).toHaveBeenLastCalledWith('paid-storage-import-1', {
      refetchInterval: 2000,
    })
    expect(mocks.invalidateQueries).not.toHaveBeenCalled()
  })

  it('preserves an authoritative completed row count of zero', async () => {
    const { result, rerender } = renderHook(() => useStorageImport(vi.fn()))
    setDateRange(result)
    await startImport(result)

    mocks.statusData.value = {
      import_id: 'paid-storage-import-1',
      status: 'completed',
      rows_imported: 0,
    }
    rerender()

    await waitFor(() => {
      expect(result.current.importState).toEqual({ status: 'success', rowsImported: 0 })
    })
    expect(mocks.invalidateQueries).toHaveBeenCalledTimes(1)
    expect(mocks.useImportStatus).toHaveBeenLastCalledWith(null, { refetchInterval: false })
  })

  it('keeps a missing completed row count unavailable instead of fabricating zero', async () => {
    const { result, rerender } = renderHook(() => useStorageImport(vi.fn()))
    setDateRange(result)
    await startImport(result)

    mocks.statusData.value = {
      import_id: 'paid-storage-import-1',
      status: 'completed',
    }
    rerender()

    await waitFor(() => {
      expect(result.current.importState).toEqual({ status: 'success', rowsImported: undefined })
    })
  })

  it('carries the nested authoritative failure message and stable code without raw details', async () => {
    const { result, rerender } = renderHook(() => useStorageImport(vi.fn()))
    setDateRange(result)
    await startImport(result)

    mocks.statusData.value = {
      import_id: 'paid-storage-import-1',
      status: 'failed',
      error_message: 'compatibility message',
      error: {
        code: 'UNKNOWN_QUEUE_STATE',
        message: 'Не удалось определить состояние очереди',
        details: { internalQueuePayload: 'must not reach presentation state' },
      },
    }
    rerender()

    await waitFor(() => {
      expect(result.current.importState).toEqual({
        status: 'error',
        code: 'UNKNOWN_QUEUE_STATE',
        message: 'Не удалось определить состояние очереди',
      })
    })
    expect(result.current.importState).not.toHaveProperty('details')
    expect(mocks.useImportStatus).toHaveBeenLastCalledWith(null, { refetchInterval: false })
    expect(mocks.invalidateQueries).not.toHaveBeenCalled()
  })

  it('uses a safe generic failure fallback and retains the selected whole range for retry', async () => {
    const { result, rerender } = renderHook(() => useStorageImport(vi.fn()))
    setDateRange(result)
    await startImport(result)

    mocks.statusData.value = { import_id: 'paid-storage-import-1', status: 'failed' }
    rerender()

    await waitFor(() => {
      expect(result.current.importState).toEqual({
        status: 'error',
        code: undefined,
        message: 'Ошибка импорта',
      })
    })

    act(() => result.current.handleReset())
    expect(result.current.importState).toEqual({ status: 'idle' })
    expect(result.current.dateFrom).toBe('2026-08-01')
    expect(result.current.dateTo).toBe('2026-08-08')
  })
})
