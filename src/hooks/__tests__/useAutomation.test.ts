/**
 * AT1: useCannedRules / useInstallCannedRule hook tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createTestQueryClient, createQueryWrapper } from '@/test/utils/test-utils'

const mockGetCannedRules = vi.fn()
const mockInstallCannedRule = vi.fn()

vi.mock('@/lib/api/automation', () => ({
  getCannedRules: () => mockGetCannedRules(),
  installCannedRule: (...args: unknown[]) => mockInstallCannedRule(...args),
  automationQueryKeys: {
    cannedRules: ['automation', 'canned-rules'],
    rules: ['automation', 'rules'],
    ruleDetail: (id: string) => ['automation', 'rules', id],
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
import { useCannedRules, useInstallCannedRule } from '../useAutomation'

describe('useCannedRules (AT1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches the canned-rules gallery', async () => {
    mockGetCannedRules.mockResolvedValue([
      {
        key: 'low-stock-notify',
        name: 'Низкий остаток',
        description: 'd',
        category: 'notify',
        trigger: 'STOCK_LEVEL',
        action: 'NOTIFY',
      },
    ])
    const { result } = renderHook(() => useCannedRules(), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetCannedRules).toHaveBeenCalled()
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0].key).toBe('low-stock-notify')
  })
})

describe('useInstallCannedRule (AT1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('installs, invalidates canned-rules + rules, toasts success', async () => {
    mockInstallCannedRule.mockResolvedValue({ id: 'rule-1', name: 'X', enabled: true })
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useInstallCannedRule(), {
      wrapper: createQueryWrapper(queryClient),
    })

    result.current.mutate({ key: 'low-stock-notify' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockInstallCannedRule).toHaveBeenCalledWith('low-stock-notify', {})
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['automation', 'canned-rules'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['automation', 'rules'] })
    expect(toast.success).toHaveBeenCalledWith('Шаблон установлен')
  })

  it('forwards a name override in the body', async () => {
    mockInstallCannedRule.mockResolvedValue({ id: 'r', name: 'copy', enabled: true })
    const { result } = renderHook(() => useInstallCannedRule(), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    })

    result.current.mutate({ key: 'k', body: { name: 'copy' } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockInstallCannedRule).toHaveBeenCalledWith('k', { name: 'copy' })
  })

  it('toasts a friendly RU message on 409 (duplicate name)', async () => {
    mockInstallCannedRule.mockRejectedValueOnce(
      new ApiError('Duplicate rule name', 409, {})
    )
    const { result } = renderHook(() => useInstallCannedRule(), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    })

    result.current.mutate({ key: 'k' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Правило с таким именем уже существует')
  })

  it('toasts a friendly RU message on 404 (unknown template)', async () => {
    mockInstallCannedRule.mockRejectedValueOnce(
      new ApiError('Template not found', 404, {})
    )
    const { result } = renderHook(() => useInstallCannedRule(), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    })

    result.current.mutate({ key: 'missing' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Шаблон не найден')
  })
})
