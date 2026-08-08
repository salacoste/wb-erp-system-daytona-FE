/**
 * NEW-2 — Communications hooks tests.
 *
 * Covers useFeedbacks / useQuestions / useChats / useClaims / useUnreadBadge /
 * usePinnedFeedbacks (fetch + error via MSW server.use), enabled gating, and
 * query-key identity (cabinet-switch isolation). Mirrors useFinances discipline.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import {
  useFeedbacks,
  useQuestions,
  useChats,
  useClaims,
  useUnreadBadge,
  usePinnedFeedbacks,
  communicationsQueryKeys,
} from '../useCommunications'
import { renderHookWithClient, setupMockAuth, clearMockAuth } from '@/test/test-utils'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

describe('useCommunications hooks', () => {
  beforeEach(() => {
    setupMockAuth()
  })
  afterEach(() => {
    clearMockAuth()
    vi.clearAllMocks()
  })

  describe('useFeedbacks', () => {
    it('fetches feedbacks (rows + counts)', async () => {
      const { result } = renderHookWithClient(() => useFeedbacks({ isUnanswered: true }))
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.data?.rows.length).toBeGreaterThan(0)
      expect(result.current.data?.total).toBe(2)
      expect(result.current.data?.unansweredCount).toBe(2)
    })

    it('surfaces isError on a 503', async () => {
      server.use(
        http.get(`${API_BASE_URL}/v1/communications/feedbacks`, () =>
          HttpResponse.json({ message: 'unavailable' }, { status: 503 })
        )
      )
      const { result } = renderHookWithClient(() => useFeedbacks())
      await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 3000 })
    })

    it('does not fire when enabled is false', async () => {
      const { result } = renderHookWithClient(() => useFeedbacks({}, { enabled: false }))
      await new Promise(r => setTimeout(r, 50))
      expect(result.current.fetchStatus).toBe('idle')
    })
  })

  describe('useQuestions', () => {
    it('fetches questions (rows + total)', async () => {
      const { result } = renderHookWithClient(() => useQuestions())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.data?.rows.length).toBeGreaterThan(0)
      expect(result.current.data?.total).toBe(1)
    })
  })

  describe('useChats', () => {
    it('fetches the thread list when no chatId', async () => {
      const { result } = renderHookWithClient(() => useChats())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.data).toHaveProperty('threads')
    })

    it('fetches a thread + messages when chatId is set', async () => {
      const { result } = renderHookWithClient(() => useChats({ chatId: 'chat-1' }))
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.data).toHaveProperty('messages')
      expect(result.current.data).toHaveProperty('thread')
    })
  })

  describe('useClaims', () => {
    it('fetches claims (rows + total)', async () => {
      const { result } = renderHookWithClient(() => useClaims())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.data?.rows.length).toBeGreaterThan(0)
    })
  })

  describe('useUnreadBadge', () => {
    it('fetches the unread flags', async () => {
      const { result } = renderHookWithClient(() => useUnreadBadge())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.data?.hasNewFeedbacks).toBe(true)
      expect(result.current.data?.hasNewQuestions).toBe(false)
    })
  })

  describe('usePinnedFeedbacks', () => {
    it('keeps the live SDK `data` envelope', async () => {
      const { result } = renderHookWithClient(() => usePinnedFeedbacks())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.data?.data.length).toBeGreaterThan(0)
      expect(result.current.data?.next).toBe(2)
    })
  })

  describe('queryKeys', () => {
    it('scopes feedbacks key by the full query', () => {
      const a = communicationsQueryKeys.feedbacks({ isUnanswered: true })
      const b = communicationsQueryKeys.feedbacks({ isUnanswered: false })
      expect(a).not.toEqual(b)
    })

    it('scopes chats key by chatId (list vs thread isolation)', () => {
      expect(communicationsQueryKeys.chats(undefined)).not.toEqual(
        communicationsQueryKeys.chats('chat-1')
      )
    })

    it('collapses empty-string chatId to the list-mode cache entry (no collision)', () => {
      // '' and undefined must share ONE threads-list entry (MEDIUM cache-collision fix).
      expect(communicationsQueryKeys.chats('')).toEqual(communicationsQueryKeys.chats(undefined))
    })

    it('scopes pinned key by nmId', () => {
      expect(communicationsQueryKeys.pinned({ nmId: 1 })).not.toEqual(
        communicationsQueryKeys.pinned({ nmId: 2 })
      )
    })

    it('shares a stable base key across all communications queries', () => {
      expect(communicationsQueryKeys.all).toEqual(['communications'])
      expect(communicationsQueryKeys.unread()[0]).toBe('communications')
    })
  })
})
