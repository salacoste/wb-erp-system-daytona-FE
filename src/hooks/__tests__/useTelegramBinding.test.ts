/**
 * Unit tests for useTelegramBinding hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useTelegramBinding, telegramQueryKeys } from '../useTelegramBinding'

// Mock API module
const mockStartTelegramBinding = vi.fn()
const mockGetBindingStatus = vi.fn()
const mockUnbindTelegram = vi.fn()

vi.mock('@/lib/api/notifications', () => ({
  startTelegramBinding: (...args: unknown[]) => mockStartTelegramBinding(...args),
  getBindingStatus: (...args: unknown[]) => mockGetBindingStatus(...args),
  unbindTelegram: (...args: unknown[]) => mockUnbindTelegram(...args),
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn() },
}))

const createWrapper = () => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

describe('useTelegramBinding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetBindingStatus.mockResolvedValue({ bound: false, telegram_username: null })
    mockStartTelegramBinding.mockResolvedValue({
      binding_code: 'ABC123',
      deep_link: 'https://t.me/bot?start=ABC123',
      expires_in: 300,
    })
    mockUnbindTelegram.mockResolvedValue(undefined)
  })

  it('returns initial state', async () => {
    const { result } = renderHook(() => useTelegramBinding(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isCheckingStatus).toBe(false)
    })

    expect(result.current.isBound).toBe(false)
    expect(result.current.isStartingBinding).toBe(false)
    expect(result.current.isUnbinding).toBe(false)
    expect(result.current.bindingError).toBeNull()
    expect(result.current.unbindError).toBeNull()
  })

  it('fetches binding status on mount', async () => {
    renderHook(() => useTelegramBinding(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(mockGetBindingStatus).toHaveBeenCalled()
    })
  })

  it('sets isBound when status reports bound', async () => {
    mockGetBindingStatus.mockResolvedValue({
      bound: true,
      telegram_username: 'testuser',
    })

    const { result } = renderHook(() => useTelegramBinding(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isBound).toBe(true)
    })

    expect(result.current.status?.bound).toBe(true)
    expect(result.current.status?.telegram_username).toBe('testuser')
  })

  it('starts binding via mutation', async () => {
    const { result } = renderHook(() => useTelegramBinding(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isCheckingStatus).toBe(false)
    })

    result.current.startBinding({ language: 'ru' })

    await waitFor(() => {
      expect(mockStartTelegramBinding).toHaveBeenCalledWith({ language: 'ru' })
    })
  })

  it('unbinds via mutation', async () => {
    const { result } = renderHook(() => useTelegramBinding(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isCheckingStatus).toBe(false)
    })

    result.current.unbind()

    await waitFor(() => {
      expect(mockUnbindTelegram).toHaveBeenCalled()
    })
  })

  it('exposes checkStatus refetch function', async () => {
    const { result } = renderHook(() => useTelegramBinding(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isCheckingStatus).toBe(false)
    })

    expect(typeof result.current.checkStatus).toBe('function')
  })

  it('telegramQueryKeys has correct structure', () => {
    expect(telegramQueryKeys.all).toEqual(['telegram'])
    expect(telegramQueryKeys.status()).toEqual(['telegram', 'status'])
    expect(telegramQueryKeys.preferences()).toEqual(['telegram', 'preferences'])
  })
})
