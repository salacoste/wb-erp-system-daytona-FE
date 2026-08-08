/**
 * NEW-2 — Communications API client boundary tests.
 *
 * Locks the `getChats` API-boundary collapse: an empty-string OR undefined
 * chatId MUST produce a request to `/v1/communications/chats` with NO
 * `?chatId=` query param (so list mode is selected and the cache key is shared).
 * The collapse is otherwise only asserted at the query-key layer
 * (useCommunications.test.ts); this test pins the API boundary itself.
 *
 * `apiClient.get` is mocked so no network call fires.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '@/lib/api-client'
import { getChats } from '../communications'

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ threads: [] }),
  },
}))

const apiGetMock = apiClient.get as unknown as ReturnType<typeof vi.fn>

describe('getChats — API-boundary collapse (chatId undefined/"" → list mode)', () => {
  beforeEach(() => {
    apiGetMock.mockReset()
    apiGetMock.mockResolvedValue({ threads: [] })
  })

  it('omits ?chatId= when chatId is undefined', async () => {
    await getChats(undefined)
    expect(apiGetMock).toHaveBeenCalledTimes(1)
    const endpoint = apiGetMock.mock.calls[0][0] as string
    expect(endpoint).toBe('/v1/communications/chats')
    expect(endpoint).not.toContain('chatId')
  })

  it('omits ?chatId= when chatId is empty string (collapse to list mode)', async () => {
    await getChats('')
    expect(apiGetMock).toHaveBeenCalledTimes(1)
    const endpoint = apiGetMock.mock.calls[0][0] as string
    expect(endpoint).toBe('/v1/communications/chats')
    expect(endpoint).not.toContain('chatId')
  })

  it('forwards ?chatId= when a chatId is provided (thread mode)', async () => {
    apiGetMock.mockResolvedValue({ thread: null, messages: [] })
    await getChats('chat-1')
    expect(apiGetMock).toHaveBeenCalledTimes(1)
    const endpoint = apiGetMock.mock.calls[0][0] as string
    expect(endpoint).toBe('/v1/communications/chats?chatId=chat-1')
  })
})
