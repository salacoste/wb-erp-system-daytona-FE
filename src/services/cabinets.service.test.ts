import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleCreateCabinet } from './cabinets.service'
import { createCabinet } from '@/lib/api'
import { cabinetCreateClaimKey, isCabinetCreateClaim } from '@/lib/cabinetCreationLock'
import { updateCabinetTaxSettings } from '@/lib/api/cabinet'
import { ApiError } from '@/types/api'
import { useAuthStore } from '@/stores/authStore'

// Mock dependencies
vi.mock('@/lib/api', () => ({
  createCabinet: vi.fn(),
}))

vi.mock('@/lib/api/cabinet', () => ({
  updateCabinetTaxSettings: vi.fn(),
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: vi.fn(),
  },
}))

const SESSION_NONCE = 'nonce-a'

/** Store snapshot helper — Story 167.9 settlement requires sessionNonce. */
function mockStore(overrides: Record<string, unknown> = {}) {
  const mockRefreshToken = vi.fn()
  const mockSetCabinetId = vi.fn()
  ;(useAuthStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
    token: 'old-token',
    refreshToken: mockRefreshToken,
    setCabinetId: mockSetCabinetId,
    // D-1 (PB-1): handleCreateCabinet mints-before-capture via this action —
    // the mocked store returns the session's existing nonce (idempotent no-op).
    ensureSessionNonce: () => SESSION_NONCE,
    user: {
      id: 'user-a',
      email: 'test@example.com',
      role: 'Owner' as const,
      cabinet_ids: [],
    },
    sessionNonce: SESSION_NONCE,
    ...overrides,
  })
  return { mockRefreshToken, mockSetCabinetId }
}

const mockResponse = {
  id: 'cabinet-id',
  name: 'Test Cabinet',
  isActive: true,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  newToken: 'new-token-with-updated-cabinet-ids',
  operationId: 'op-uuid',
  status: 'succeeded' as const,
}

describe('handleCreateCabinet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // FE-D5: the cross-tab create claim lives in localStorage — clear it between
    // tests so a tombstone from a prior uncertain test cannot fail-close the next.
    window.localStorage.clear()
  })

  it('commits token/cabinet when the initiating session is still live', async () => {
    const { mockRefreshToken, mockSetCabinetId } = mockStore()
    const mockUser = (useAuthStore.getState() as { user: unknown }).user
    ;(createCabinet as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)
    ;(updateCabinetTaxSettings as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockResponse,
      targetMarginPct: 20,
    })

    const result = await handleCreateCabinet('Test Cabinet', 20)

    // Immutable initiating context: explicit token + Story 167.8 idempotency key
    expect(createCabinet).toHaveBeenCalledWith(
      { name: 'Test Cabinet' },
      { token: 'old-token', idempotencyKey: expect.any(String) }
    )
    const context = (createCabinet as ReturnType<typeof vi.fn>).mock.calls[0][1] as {
      idempotencyKey: string
    }
    expect(context.idempotencyKey).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    )

    expect(mockRefreshToken).toHaveBeenCalledWith(mockResponse.newToken, mockUser)
    expect(mockSetCabinetId).toHaveBeenCalledWith('cabinet-id')

    // Story 167.9 (review fix HIGH-1): the margin PUT runs with the JUST-COMMITTED
    // transport context (newToken + created cabinet id), never live-store state.
    // D-2 pass-2: the pin also opts out of reactive 401 replay.
    expect(updateCabinetTaxSettings).toHaveBeenCalledWith(
      'cabinet-id',
      { targetMarginPct: 20 },
      {
        authToken: mockResponse.newToken,
        cabinetIdOverride: 'cabinet-id',
        allowReactiveRefresh: false,
      }
    )

    // LOW-4: token + active cabinet are installed BEFORE the authenticated margin PUT
    const order = vi.mocked(updateCabinetTaxSettings).mock.invocationCallOrder[0]
    expect(mockSetCabinetId.mock.invocationCallOrder[0]).toBeLessThan(order)

    expect(result.status).toBe('applied')
    expect(result.cabinet).toEqual({
      id: 'cabinet-id',
      name: 'Test Cabinet',
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      targetMarginPct: 20,
    })
    expect(result.operationId).toBe('op-uuid')
  })

  it('should throw error if user not authenticated', async () => {
    mockStore({ token: null })

    await expect(handleCreateCabinet('Test Cabinet', 20)).rejects.toThrow('User not authenticated')
  })

  it('should throw error if token update fails in the live session', async () => {
    mockStore({
      refreshToken: vi.fn(() => {
        throw new Error('Token update failed')
      }),
    })
    ;(createCabinet as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)

    await expect(handleCreateCabinet('Test Cabinet', 20)).rejects.toThrow('token update failed')
    expect(updateCabinetTaxSettings).not.toHaveBeenCalled()
  })

  it('rejects when target margin persistence fails after creation', async () => {
    mockStore()
    ;(createCabinet as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)
    ;(updateCabinetTaxSettings as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('API unavailable')
    )

    await expect(handleCreateCabinet('Test Cabinet', 0)).rejects.toThrow(
      'target margin could not be saved'
    )
    expect(updateCabinetTaxSettings).toHaveBeenCalledWith(
      'cabinet-id',
      { targetMarginPct: 0 },
      {
        authToken: mockResponse.newToken,
        cabinetIdOverride: 'cabinet-id',
        allowReactiveRefresh: false,
      }
    )
  })

  // FE-D5 review pass 1 (F1c): the claim disposition must be settlement-aware —
  // success must NOT strand a tombstone; POST-landed-but-auth-write-failed must.
  describe('FE-D5 cross-tab claim lifecycle', () => {
    const claimKey = cabinetCreateClaimKey('user-a')

    it('a fully-applied create REMOVES the claim (no tombstone after success)', async () => {
      mockStore()
      ;(createCabinet as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)
      ;(updateCabinetTaxSettings as ReturnType<typeof vi.fn>).mockResolvedValue({
        ...mockResponse,
        targetMarginPct: 20,
      })

      const result = await handleCreateCabinet('Test Cabinet', 20)

      expect(result.status).toBe('applied')
      expect(window.localStorage.getItem(claimKey)).toBeNull()
    })

    it('POST landed but auth-write failed ⇒ settled-uncertain tombstone (CABINET-BROWSER-04)', async () => {
      mockStore({
        refreshToken: vi.fn(() => {
          throw new Error('Token update failed')
        }),
      })
      ;(createCabinet as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)

      await expect(handleCreateCabinet('Test Cabinet', 20)).rejects.toThrow('token update failed')

      const raw = window.localStorage.getItem(claimKey)
      expect(raw).not.toBeNull()
      expect(JSON.parse(raw!)).toMatchObject({ phase: 'settled-uncertain' })
    })

    // N1 + R3 + wave 4: rejection classification. R3: the wire layer wraps
    // every throwable as ApiError, so a NON-ApiError rejection is a LOCAL
    // throw (no POST could land) ⇒ claim REMOVED. Wave-4 mandate: wire-
    // ambiguous ApiErrors (status 0 / 5xx) transition the claim to
    // 'failed-ambiguous' KEEPING its key — the deliberate retry reuses it
    // (BE replay collapses any landed ghost POST ⇒ never a duplicate).
    describe('N1/R3/wave-4 wire-ambiguous rejection classification', () => {
      it('non-ApiError LOCAL rejection ⇒ claim REMOVED + ORIGINAL error instance rethrown', async () => {
        mockStore()
        const networkDrop = new TypeError('Failed to fetch')
        ;(createCabinet as ReturnType<typeof vi.fn>).mockRejectedValue(networkDrop)

        await expect(handleCreateCabinet('Test Cabinet', 20)).rejects.toBe(networkDrop)

        // Local throw ⇒ no POST could have landed ⇒ removal is duplication-safe
        expect(window.localStorage.getItem(claimKey)).toBeNull()
      })

      it('ApiError 4xx (server answered) ⇒ claim REMOVED, retry stays legal', async () => {
        mockStore()
        const validation = new ApiError('Cabinet name rejected', 400)
        ;(createCabinet as ReturnType<typeof vi.fn>).mockRejectedValue(validation)

        await expect(handleCreateCabinet('Test Cabinet', 20)).rejects.toBe(validation)

        expect(window.localStorage.getItem(claimKey)).toBeNull()
      })

      it('ApiError status 0 ⇒ failed-ambiguous claim WITH key preserved (NOT a tombstone)', async () => {
        mockStore()
        const offline = new ApiError('Network unreachable', 0)
        ;(createCabinet as ReturnType<typeof vi.fn>).mockRejectedValue(offline)

        await expect(handleCreateCabinet('Test Cabinet', 20)).rejects.toBe(offline)

        const raw = window.localStorage.getItem(claimKey)
        expect(raw).not.toBeNull()
        expect(JSON.parse(raw!)).toMatchObject({
          phase: 'failed-ambiguous',
          idempotencyKey: expect.any(String),
        })
      })

      it('ApiError 5xx ⇒ failed-ambiguous claim (server never answered cleanly)', async () => {
        mockStore()
        const unavailable = new ApiError('Backend temporarily unavailable', 503)
        ;(createCabinet as ReturnType<typeof vi.fn>).mockRejectedValue(unavailable)

        await expect(handleCreateCabinet('Test Cabinet', 20)).rejects.toBe(unavailable)

        expect(JSON.parse(window.localStorage.getItem(claimKey)!)).toMatchObject({
          phase: 'failed-ambiguous',
        })
      })

      it('CABINET-BROWSER-02 shape: deliberate retry after an ambiguous failure REUSES the SAME key', async () => {
        mockStore()
        const offline = new ApiError('Route aborted mid-flight', 0)
        ;(createCabinet as ReturnType<typeof vi.fn>)
          .mockRejectedValueOnce(offline)
          .mockResolvedValueOnce(mockResponse)
        ;(updateCabinetTaxSettings as ReturnType<typeof vi.fn>).mockResolvedValue({
          ...mockResponse,
          targetMarginPct: 20,
        })

        await expect(handleCreateCabinet('Test Cabinet', 20)).rejects.toBe(offline)
        const ambiguousClaim: unknown = JSON.parse(window.localStorage.getItem(claimKey)!)
        expect(isCabinetCreateClaim(ambiguousClaim)).toBe(true)
        if (!isCabinetCreateClaim(ambiguousClaim)) return

        // Deliberate retry: adopts the failed-ambiguous claim and replays its key
        const retry = await handleCreateCabinet('Test Cabinet', 20)
        expect(retry.status).toBe('applied')

        const calls = vi.mocked(createCabinet).mock.calls
        expect(calls).toHaveLength(2)
        expect(calls[0][1].idempotencyKey).toBe(ambiguousClaim.idempotencyKey)
        expect(calls[1][1].idempotencyKey).toBe(ambiguousClaim.idempotencyKey)
        // Applied retry ⇒ claim fully removed afterwards
        expect(window.localStorage.getItem(claimKey)).toBeNull()
      })
    })
  })
})
