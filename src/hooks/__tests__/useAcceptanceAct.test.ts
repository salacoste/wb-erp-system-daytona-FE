/**
 * Story O5: useUploadAcceptanceAct / useDownloadAcceptanceAct hook tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createTestQueryClient, createQueryWrapper } from '@/test/utils/test-utils'

const mockUpload = vi.fn()
const mockDownload = vi.fn()
const mockFileToBase64 = vi.fn()

vi.mock('@/lib/api/supplies', () => ({
  uploadAcceptanceAct: (...args: unknown[]) => mockUpload(...args),
  downloadAcceptanceAct: (...args: unknown[]) => mockDownload(...args),
  fileToBase64: (...args: unknown[]) => mockFileToBase64(...args),
  detectAcceptanceActFormat: (name: string) =>
    name.endsWith('.zip') ? 'zip' : name.endsWith('.xlsx') ? 'xlsx' : null,
  suppliesQueryKeys: {
    detail: (id: string) => ['supplies', 'detail', id],
    documents: (id: string) => ['supplies', 'documents', id],
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import { toast } from 'sonner'
import { ApiError } from '@/types/api'
import { useUploadAcceptanceAct, useDownloadAcceptanceAct } from '../useAcceptanceAct'

describe('useUploadAcceptanceAct (Story O5)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFileToBase64.mockResolvedValue('AAA')
  })

  it('encodes the file, uploads, invalidates detail+documents, toasts', async () => {
    const meta = {
      id: 'doc-1',
      docType: 'ACCEPTANCE_ACT',
      format: 'xlsx',
      fileSize: 3,
      generatedAt: '2026-07-05T00:00:00Z',
      expiresAt: null,
    }
    mockUpload.mockResolvedValue(meta)
    const file = new File(['x'], 'act.xlsx', { type: 'application/vnd.ms-excel' })
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUploadAcceptanceAct(), {
      wrapper: createQueryWrapper(queryClient),
    })

    result.current.mutate({ supplyId: 'supply-1', file })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockFileToBase64).toHaveBeenCalledWith(file)
    expect(mockUpload).toHaveBeenCalledWith('supply-1', {
      file: 'AAA',
      filename: 'act.xlsx',
      format: 'xlsx',
    })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['supplies', 'detail', 'supply-1'] })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['supplies', 'documents', 'supply-1'],
    })
    expect(toast.success).toHaveBeenCalledWith('Акт приёмки загружен')
  })

  it('rejects an unsupported extension before uploading', async () => {
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useUploadAcceptanceAct(), {
      wrapper: createQueryWrapper(queryClient),
    })

    result.current.mutate({ supplyId: 'supply-1', file: new File(['x'], 'act.pdf') })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockUpload).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith('Поддерживаются только файлы .xlsx и .zip')
  })

  it('rejects an oversized file (>25MB) before encoding', async () => {
    const big = new File([new ArrayBuffer(26 * 1024 * 1024)], 'big.xlsx')
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useUploadAcceptanceAct(), {
      wrapper: createQueryWrapper(queryClient),
    })

    result.current.mutate({ supplyId: 'supply-1', file: big })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockFileToBase64).not.toHaveBeenCalled()
    expect(mockUpload).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith('Файл слишком большой (макс. 25 МБ)')
  })
})

describe('useDownloadAcceptanceAct (Story O5)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // jsdom doesn't implement URL.createObjectURL — stub it.
    Object.assign(globalThis.URL, {
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn(),
    })
  })

  it('downloads the act and toasts success', async () => {
    const blob = new Blob(['x'])
    mockDownload.mockResolvedValue(blob)

    const { result } = renderHook(() => useDownloadAcceptanceAct(), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    })

    result.current.mutate({ supplyId: 'supply-1', filename: 'act.xlsx' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockDownload).toHaveBeenCalledWith('supply-1')
    expect(toast.success).toHaveBeenCalledWith('Акт приёмки скачан')
  })

  it('surfaces a friendly Russian toast on 404 (act not stored)', async () => {
    mockDownload.mockRejectedValueOnce(new ApiError('Acceptance act not found', 404, {}))
    const { result } = renderHook(() => useDownloadAcceptanceAct(), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    })

    result.current.mutate({ supplyId: 'supply-1', filename: 'act.xlsx' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Акт приёмки ещё не загружен')
  })
})
