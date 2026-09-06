/**
 * fe-d3-family — error-fallback sanitization pins for the four supply/sticker/
 * document mutation hooks (useCloseSupply, useCreateSupply, useGenerateStickers,
 * useDownloadDocument).
 *
 * Defect class (same as FE-D3 in WbTokenForm): the UNMAPPED-STATUS fallback
 * branch of each hook-local getErrorMessage echoed raw apiError.message to the
 * toast — a hostile/buggy server can embed connection strings, stack frames or
 * JWTs there. After migration the fallback must equal
 * sanitizeFallbackMessage(raw) (canonical home: src/lib/sanitize-fallback-message.ts).
 *
 * Also pinned per hook: benign RU messages pass through, ONE domain branch stays
 * byte-identical, and the mutation rejects with the ORIGINAL error instance
 * (FE-D1 error-transport canon — no re-wrapping).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import { ApiError } from '@/types/api'
import { renderHookWithClient } from '@/test/test-utils'
import { useCloseSupply } from '../useCloseSupply'
import { useCreateSupply } from '../useCreateSupply'
import { useGenerateStickers } from '../useGenerateStickers'
import { useDownloadDocument } from '../useDownloadDocument'
import { closeSupply, createSupply, generateStickers, downloadDocument } from '@/lib/api/supplies'
import { sanitizeFallbackMessage } from '@/lib/sanitize-fallback-message'

vi.mock('@/lib/api/supplies', () => ({
  suppliesQueryKeys: {
    all: ['supplies'],
    list: (filters: unknown) => ['supplies', 'list', filters],
    detail: (id: string) => ['supplies', 'detail', id],
    documents: (id: string) => ['supplies', 'documents', id],
  },
  closeSupply: vi.fn(),
  createSupply: vi.fn(),
  generateStickers: vi.fn(),
  downloadDocument: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}))

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

/** Hostile fallback payload: connection string + V8 frame + JWT, newline-joined. */
const HOSTILE_MESSAGE = [
  'Ошибка БД: postgres://admin:s3cret@db.internal:5432/wb',
  '    at closeSupply (/app/src/supplies.service.ts:88:13)',
  'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.sigPart',
].join('\n')

/** 502 is mapped in NONE of the four hooks → all land in the fallback branch. */
// Real ApiError instances (anti-pattern #3: no Object.assign status fakes) —
// keeps instanceof-based consumers honest if the hooks ever add class checks.
function hostileError(): ApiError {
  return new ApiError(HOSTILE_MESSAGE, 502)
}

const BENIGN_MESSAGE = 'Заказ не найден в указанной поставке'

function benignError(): ApiError {
  return new ApiError(BENIGN_MESSAGE, 502)
}

/** Last (and per-test only) toast.error payload. */
function lastToastError(): string {
  const calls = vi.mocked(toast.error).mock.calls
  const first = calls.at(-1)?.[0]
  // typeof guard narrows sonner's `string | ReactNode` param without a cast.
  if (typeof first !== 'string') {
    throw new Error(`toast.error payload was not a string: ${String(first)}`)
  }
  return first
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useCloseSupply — error fallback sanitization (fe-d3-family)', () => {
  it('sanitizes the unmapped-status fallback (no verbatim echo of raw error)', async () => {
    vi.mocked(closeSupply).mockRejectedValueOnce(hostileError())
    const { result } = renderHookWithClient(() => useCloseSupply())
    await expect(result.current.mutateAsync('supply-001')).rejects.toBeDefined()
    await waitFor(() => expect(result.current.isError).toBe(true))
    const shown = lastToastError()
    expect(shown).toBe(sanitizeFallbackMessage(HOSTILE_MESSAGE))
    expect(shown).not.toBe(HOSTILE_MESSAGE)
    expect(shown).toContain('Ошибка БД')
    expect(shown).not.toContain('postgres://')
    expect(shown).not.toContain('s3cret')
    expect(shown).not.toContain('closeSupply')
    expect(shown).not.toContain('eyJ')
  })

  it('passes a benign RU message through the fallback untouched', async () => {
    vi.mocked(closeSupply).mockRejectedValueOnce(benignError())
    const { result } = renderHookWithClient(() => useCloseSupply())
    await expect(result.current.mutateAsync('supply-001')).rejects.toBeDefined()
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(lastToastError()).toBe(BENIGN_MESSAGE)
  })

  it('domain branch: EMPTY_SUPPLY code keeps its specific copy', async () => {
    vi.mocked(closeSupply).mockRejectedValueOnce(
      Object.assign(new Error('empty'), { code: 'EMPTY_SUPPLY' })
    )
    const { result } = renderHookWithClient(() => useCloseSupply())
    await expect(result.current.mutateAsync('supply-001')).rejects.toBeDefined()
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(lastToastError()).toBe('Невозможно закрыть пустую поставку')
  })

  it('rejects with the original error instance (FE-D1: no re-wrapping)', async () => {
    const err = hostileError()
    vi.mocked(closeSupply).mockRejectedValueOnce(err)
    const onError = vi.fn()
    const { result } = renderHookWithClient(() => useCloseSupply({ onError }))
    await expect(result.current.mutateAsync('supply-001')).rejects.toBe(err)
    await waitFor(() => expect(onError).toHaveBeenCalledWith(err))
  })
})

describe('useCreateSupply — error fallback sanitization (fe-d3-family)', () => {
  const SUPPLY_REQUEST = { name: 'Поставка мая' }

  it('sanitizes the unmapped-status fallback (no verbatim echo of raw error)', async () => {
    vi.mocked(createSupply).mockRejectedValueOnce(hostileError())
    const { result } = renderHookWithClient(() => useCreateSupply())
    await expect(result.current.mutateAsync(SUPPLY_REQUEST)).rejects.toBeDefined()
    await waitFor(() => expect(result.current.isError).toBe(true))
    const shown = lastToastError()
    expect(shown).toBe(`Не удалось создать поставку: ${sanitizeFallbackMessage(HOSTILE_MESSAGE)}`)
    expect(shown).not.toContain('postgres://')
    expect(shown).not.toContain('s3cret')
    expect(shown).not.toContain('eyJ')
  })

  it('passes a benign RU message through the fallback untouched', async () => {
    vi.mocked(createSupply).mockRejectedValueOnce(benignError())
    const { result } = renderHookWithClient(() => useCreateSupply())
    await expect(result.current.mutateAsync(SUPPLY_REQUEST)).rejects.toBeDefined()
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(lastToastError()).toBe(`Не удалось создать поставку: ${BENIGN_MESSAGE}`)
  })

  it('domain branch: 429 keeps its specific copy', async () => {
    vi.mocked(createSupply).mockRejectedValueOnce(new ApiError('rl', 429))
    const { result } = renderHookWithClient(() => useCreateSupply())
    await expect(result.current.mutateAsync(SUPPLY_REQUEST)).rejects.toBeDefined()
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(lastToastError()).toBe('Не удалось создать поставку: Слишком много запросов. Подождите.')
  })

  it('rejects with the original error instance (FE-D1: no re-wrapping)', async () => {
    const err = hostileError()
    vi.mocked(createSupply).mockRejectedValueOnce(err)
    const { result } = renderHookWithClient(() => useCreateSupply())
    await expect(result.current.mutateAsync(SUPPLY_REQUEST)).rejects.toBe(err)
  })
})

describe('useGenerateStickers — error fallback sanitization (fe-d3-family)', () => {
  const STICKERS_PARAMS = { supplyId: 'supply-001', format: 'png' as const }

  it('sanitizes the unmapped-status fallback (no verbatim echo of raw error)', async () => {
    vi.mocked(generateStickers).mockRejectedValueOnce(hostileError())
    const { result } = renderHookWithClient(() => useGenerateStickers())
    await expect(result.current.mutateAsync(STICKERS_PARAMS)).rejects.toBeDefined()
    await waitFor(() => expect(result.current.isError).toBe(true))
    const shown = lastToastError()
    expect(shown).toBe(sanitizeFallbackMessage(HOSTILE_MESSAGE))
    expect(shown).not.toContain('postgres://')
    expect(shown).not.toContain('s3cret')
    expect(shown).not.toContain('eyJ')
  })

  it('passes a benign RU message through the fallback untouched', async () => {
    vi.mocked(generateStickers).mockRejectedValueOnce(benignError())
    const { result } = renderHookWithClient(() => useGenerateStickers())
    await expect(result.current.mutateAsync(STICKERS_PARAMS)).rejects.toBeDefined()
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(lastToastError()).toBe(BENIGN_MESSAGE)
  })

  it('domain branch: WRONG_STATUS code keeps its specific copy', async () => {
    vi.mocked(generateStickers).mockRejectedValueOnce(
      Object.assign(new Error('status'), { code: 'WRONG_STATUS' })
    )
    const { result } = renderHookWithClient(() => useGenerateStickers())
    await expect(result.current.mutateAsync(STICKERS_PARAMS)).rejects.toBeDefined()
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(lastToastError()).toBe('Стикеры доступны только для закрытых поставок')
  })

  it('rejects with the original error instance (FE-D1: no re-wrapping)', async () => {
    const err = hostileError()
    vi.mocked(generateStickers).mockRejectedValueOnce(err)
    const onError = vi.fn()
    const { result } = renderHookWithClient(() => useGenerateStickers({ onError }))
    await expect(result.current.mutateAsync(STICKERS_PARAMS)).rejects.toBe(err)
    await waitFor(() => expect(onError).toHaveBeenCalledWith(err))
  })
})

describe('useDownloadDocument — error fallback sanitization (fe-d3-family)', () => {
  const DOC_PARAMS = { supplyId: 'supply-001', docType: 'sticker' as const }

  it('sanitizes the unmapped-status fallback (no verbatim echo of raw error)', async () => {
    vi.mocked(downloadDocument).mockRejectedValueOnce(hostileError())
    const { result } = renderHookWithClient(() => useDownloadDocument())
    await expect(result.current.mutateAsync(DOC_PARAMS)).rejects.toBeDefined()
    await waitFor(() => expect(result.current.isError).toBe(true))
    const shown = lastToastError()
    expect(shown).toBe(sanitizeFallbackMessage(HOSTILE_MESSAGE))
    expect(shown).not.toContain('postgres://')
    expect(shown).not.toContain('s3cret')
    expect(shown).not.toContain('eyJ')
  })

  it('passes a benign RU message through the fallback untouched', async () => {
    vi.mocked(downloadDocument).mockRejectedValueOnce(benignError())
    const { result } = renderHookWithClient(() => useDownloadDocument())
    await expect(result.current.mutateAsync(DOC_PARAMS)).rejects.toBeDefined()
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(lastToastError()).toBe(BENIGN_MESSAGE)
  })

  it('domain branch: 404 keeps its specific copy', async () => {
    vi.mocked(downloadDocument).mockRejectedValueOnce(new ApiError('nf', 404))
    const { result } = renderHookWithClient(() => useDownloadDocument())
    await expect(result.current.mutateAsync(DOC_PARAMS)).rejects.toBeDefined()
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(lastToastError()).toBe('Документ не найден')
  })

  it('rejects with the original error instance (FE-D1: no re-wrapping)', async () => {
    const err = hostileError()
    vi.mocked(downloadDocument).mockRejectedValueOnce(err)
    const onError = vi.fn()
    const { result } = renderHookWithClient(() => useDownloadDocument({ onError }))
    await expect(result.current.mutateAsync(DOC_PARAMS)).rejects.toBe(err)
    await waitFor(() => expect(onError).toHaveBeenCalledWith(err))
  })
})
