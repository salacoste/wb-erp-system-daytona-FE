/**
 * Unit tests for tariff-error-handler (Story — tariff admin) — regression coverage added iter-148.
 *
 * handleTariffApiError maps unknown errors → a typed TariffErrorResult with UI side effects (toast,
 * router redirect on 403, rate-limit store reset on 429). sonner + the store are mocked; the real
 * ApiError constructor is used (anti-pattern #3); router bridged via `as unknown as` (anti-pattern #4).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { ApiError } from '@/types/api'

const { toastErrorMock, resetMock } = vi.hoisted(() => ({
  toastErrorMock: vi.fn(),
  resetMock: vi.fn(),
}))
vi.mock('sonner', () => ({ toast: { error: toastErrorMock } }))
vi.mock('@/stores/tariffRateLimitStore', () => ({
  useTariffRateLimitStore: { getState: () => ({ reset: resetMock }) },
}))

import {
  handleTariffApiError,
  isRecoverableError,
  requiresRedirect,
  type TariffErrorResult,
} from '@/lib/tariff-error-handler'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('handleTariffApiError — non-ApiError', () => {
  it('maps a plain Error to network with its message', () => {
    expect(handleTariffApiError(new Error('boom'))).toEqual({ type: 'network', message: 'boom' })
    expect(toastErrorMock).toHaveBeenCalledWith('boom')
  })
  it('maps a non-Error throwable to a generic network message', () => {
    expect(handleTariffApiError('oops')).toEqual({ type: 'network', message: 'Ошибка сети' })
  })
})

describe('handleTariffApiError — ApiError by status', () => {
  it('400 → validation with parsed errors + joined message', () => {
    const err = new ApiError('bad', 400, { errors: [{ field: 'price', message: 'too low' }] })
    expect(handleTariffApiError(err)).toEqual({
      type: 'validation',
      message: 'too low',
      errors: [{ field: 'price', message: 'too low' }],
    })
  })
  it('400 with no structured errors → falls back to the error message', () => {
    expect(handleTariffApiError(new ApiError('Validation failed', 400, {}))).toEqual({
      type: 'validation',
      message: 'Validation failed',
      errors: [],
    })
  })
  it('403 → permission, and redirects when a router is provided', () => {
    const router = { push: vi.fn() } as unknown as AppRouterInstance
    expect(handleTariffApiError(new ApiError('no', 403), router)).toEqual({
      type: 'permission',
      message: 'Требуется роль Admin',
    })
    expect(router.push).toHaveBeenCalledWith('/dashboard')
  })
  it('409 → conflict', () => {
    expect(handleTariffApiError(new ApiError('dup', 409))).toEqual({
      type: 'conflict',
      message: 'Версия на эту дату уже существует',
    })
  })
  it('429 → rate_limit (retryAfter from data) + resets the rate-limit store', () => {
    const result = handleTariffApiError(new ApiError('slow', 429, { retryAfter: 120 }))
    expect(result).toEqual({
      type: 'rate_limit',
      message: 'Превышен лимит запросов',
      retryAfterSeconds: 120,
    })
    expect(resetMock).toHaveBeenCalledTimes(1)
    expect(toastErrorMock).toHaveBeenCalledWith(expect.stringContaining('2 мин.'))
  })
  it('429 → defaults to 60s when retryAfter is absent', () => {
    const result = handleTariffApiError(new ApiError('slow', 429, {}))
    expect(result.retryAfterSeconds).toBe(60)
  })
  it('other statuses → network with the error message', () => {
    expect(handleTariffApiError(new ApiError('Server boom', 500))).toEqual({
      type: 'network',
      message: 'Server boom',
    })
  })
})

describe('isRecoverableError / requiresRedirect', () => {
  const make = (type: TariffErrorResult['type']): TariffErrorResult => ({ type, message: 'x' })
  it('recoverable = network | rate_limit', () => {
    expect(isRecoverableError(make('network'))).toBe(true)
    expect(isRecoverableError(make('rate_limit'))).toBe(true)
    expect(isRecoverableError(make('validation'))).toBe(false)
    expect(isRecoverableError(make('permission'))).toBe(false)
    expect(isRecoverableError(make('conflict'))).toBe(false)
  })
  it('requiresRedirect = permission only', () => {
    expect(requiresRedirect(make('permission'))).toBe(true)
    expect(requiresRedirect(make('network'))).toBe(false)
    expect(requiresRedirect(make('rate_limit'))).toBe(false)
  })
})
