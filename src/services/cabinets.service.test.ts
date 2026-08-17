import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleCreateCabinet } from './cabinets.service'
import { createCabinet } from '@/lib/api'
import { updateCabinetTaxSettings } from '@/lib/api/cabinet'
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
    expect(updateCabinetTaxSettings).toHaveBeenCalledWith(
      'cabinet-id',
      { targetMarginPct: 20 },
      { authToken: mockResponse.newToken, cabinetIdOverride: 'cabinet-id' }
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
      { authToken: mockResponse.newToken, cabinetIdOverride: 'cabinet-id' }
    )
  })
})
