/**
 * AT1: useCannedRules / useInstallCannedRule hook tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createTestQueryClient, createQueryWrapper } from '@/test/utils/test-utils'

const mockGetCannedRules = vi.fn()
const mockInstallCannedRule = vi.fn()
const mockGetInstalledRules = vi.fn()
const mockGetInstalledRule = vi.fn()
const mockUpdateInstalledRule = vi.fn()

vi.mock('@/lib/api/automation', () => ({
  getCannedRules: () => mockGetCannedRules(),
  installCannedRule: (...args: unknown[]) => mockInstallCannedRule(...args),
  getInstalledRules: (...args: unknown[]) => mockGetInstalledRules(...args),
  automationQueryKeys: {
    cannedRules: ['automation', 'canned-rules'],
    rules: ['automation', 'rules'],
    installedRules: (params?: unknown) => ['automation', 'rules', 'installed', params ?? null],
    ruleDetail: (id: string) => ['automation', 'rules', id],
  },
}))

vi.mock('@/lib/api/installed-rule-detail', () => ({
  getInstalledRule: (...args: unknown[]) => mockGetInstalledRule(...args),
  updateInstalledRule: (...args: unknown[]) => mockUpdateInstalledRule(...args),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import { toast } from 'sonner'
import { ApiError } from '@/types/api'
import {
  useCannedRules,
  useInstallCannedRule,
  useInstalledRule,
  useInstalledRules,
  useUpdateInstalledRule,
} from '../useAutomation'

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

describe('useInstalledRules (163.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches installed rules and forwards params to getInstalledRules', async () => {
    mockGetInstalledRules.mockResolvedValue([
      { id: 'rule-1', name: 'X', trigger: 'STOCK_LEVEL', action: 'NOTIFY', enabled: true },
    ])
    const params = { enabled: true, limit: 10 }
    const { result } = renderHook(() => useInstalledRules(params), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetInstalledRules).toHaveBeenCalledWith(params)
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0].id).toBe('rule-1')
  })

  it('calls getInstalledRules with undefined when no params given', async () => {
    mockGetInstalledRules.mockResolvedValue([])
    const { result } = renderHook(() => useInstalledRules(), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetInstalledRules).toHaveBeenCalledWith(undefined)
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
    mockInstallCannedRule.mockRejectedValueOnce(new ApiError('Duplicate rule name', 409, {}))
    const { result } = renderHook(() => useInstallCannedRule(), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    })

    result.current.mutate({ key: 'k' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Правило с таким именем уже существует')
  })

  it('toasts a friendly RU message on 404 (unknown template)', async () => {
    mockInstallCannedRule.mockRejectedValueOnce(new ApiError('Template not found', 404, {}))
    const { result } = renderHook(() => useInstallCannedRule(), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    })

    result.current.mutate({ key: 'missing' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Шаблон не найден')
  })
})

describe('useInstalledRule (163.3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches the rule detail for an id', async () => {
    mockGetInstalledRule.mockResolvedValue({
      id: 'r1',
      name: 'N',
      trigger: 'STOCK_LEVEL',
      action: 'NOTIFY',
      enabled: true,
    })
    const { result } = renderHook(() => useInstalledRule('r1'), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetInstalledRule).toHaveBeenCalledWith('r1')
    expect(result.current.data?.id).toBe('r1')
  })

  it('does not fetch when id is empty (enabled gate)', () => {
    mockGetInstalledRule.mockResolvedValue({ id: 'r1' })
    renderHook(() => useInstalledRule(''), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    })
    expect(mockGetInstalledRule).not.toHaveBeenCalled()
  })

  it('surfaces a 404 as an error (isError)', async () => {
    // Persistent rejection survives the hook's retry: 1 (query error-path pattern).
    // retry=1 uses TanStack exponential backoff (~1s) → extend waitFor timeout.
    mockGetInstalledRule.mockRejectedValue(new ApiError('Not found', 404, {}))
    const { result } = renderHook(() => useInstalledRule('missing'), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    })
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 4000 })
    expect((result.current.error as ApiError).status).toBe(404)
  })

  it('surfaces a 403 as an error', async () => {
    mockGetInstalledRule.mockRejectedValue(new ApiError('Forbidden', 403, {}))
    const { result } = renderHook(() => useInstalledRule('r1'), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    })
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 4000 })
    expect((result.current.error as ApiError).status).toBe(403)
  })

  it('surfaces a malformed-response (thrown Error) as an error', async () => {
    mockGetInstalledRule.mockRejectedValue(new Error('Некорректный ответ сервера'))
    const { result } = renderHook(() => useInstalledRule('r1'), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    })
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 4000 })
    expect(result.current.error?.message).toMatch(/Некорректный ответ сервера/)
  })
})

describe('useUpdateInstalledRule (163.3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('patches, setQueryData(detail) + invalidates rules, toasts success', async () => {
    const updated = {
      id: 'r1',
      name: 'New',
      trigger: 'STOCK_LEVEL',
      action: 'NOTIFY',
      enabled: true,
    }
    mockUpdateInstalledRule.mockResolvedValue(updated)
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const setSpy = vi.spyOn(queryClient, 'setQueryData')

    const { result } = renderHook(() => useUpdateInstalledRule(), {
      wrapper: createQueryWrapper(queryClient),
    })

    result.current.mutate({ id: 'r1', patch: { name: 'New' } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockUpdateInstalledRule).toHaveBeenCalledWith('r1', { name: 'New' })
    expect(setSpy).toHaveBeenCalledWith(['automation', 'rules', 'r1'], updated)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['automation', 'rules'] })
    expect(toast.success).toHaveBeenCalledWith('Правило обновлено')
  })

  it('toasts a RU message on 400 (validation)', async () => {
    mockUpdateInstalledRule.mockRejectedValueOnce(new ApiError('Bad', 400, {}))
    const { result } = renderHook(() => useUpdateInstalledRule(), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    })
    result.current.mutate({ id: 'r1', patch: { priority: -1 } })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Некорректные данные. Проверьте значения полей.')
  })

  it('toasts a RU message on 403 (authorization)', async () => {
    mockUpdateInstalledRule.mockRejectedValueOnce(new ApiError('Forbidden', 403, {}))
    const { result } = renderHook(() => useUpdateInstalledRule(), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    })
    result.current.mutate({ id: 'r1', patch: { enabled: false } })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Недостаточно прав для изменения правила.')
  })

  it('toasts a RU message on 404 (not found)', async () => {
    mockUpdateInstalledRule.mockRejectedValueOnce(new ApiError('Not found', 404, {}))
    const { result } = renderHook(() => useUpdateInstalledRule(), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    })
    result.current.mutate({ id: 'r1', patch: { name: 'X' } })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Правило не найдено.')
  })

  it('toasts a RU message on 409 (conflict)', async () => {
    mockUpdateInstalledRule.mockRejectedValueOnce(new ApiError('Conflict', 409, {}))
    const { result } = renderHook(() => useUpdateInstalledRule(), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    })
    result.current.mutate({ id: 'r1', patch: { name: 'X' } })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Конфликт: правило было изменено другим сеансом.')
  })
})
