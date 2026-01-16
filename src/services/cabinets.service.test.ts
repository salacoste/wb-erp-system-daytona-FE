import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleCreateCabinet } from './cabinets.service'
import { createCabinet } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

// Mock dependencies
vi.mock('@/lib/api', () => ({
  createCabinet: vi.fn(),
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: vi.fn(),
  },
}))

describe('handleCreateCabinet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should update JWT token after cabinet creation', async () => {
    const mockToken = 'old-token'
    const mockNewToken = 'new-token-with-updated-cabinet-ids'
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      role: 'Owner' as const,
      cabinet_ids: [],
    }
    const mockResponse = {
      id: 'cabinet-id',
      name: 'Test Cabinet',
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      newToken: mockNewToken,
    }

    const mockRefreshToken = vi.fn()
    const mockSetCabinetId = vi.fn()

    ;(useAuthStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
      token: mockToken,
      refreshToken: mockRefreshToken,
      setCabinetId: mockSetCabinetId,
      user: mockUser,
    })

    ;(createCabinet as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)

    const result = await handleCreateCabinet('Test Cabinet')

    // Проверяем, что createCabinet был вызван
    expect(createCabinet).toHaveBeenCalledWith(
      { name: 'Test Cabinet' },
      mockToken,
    )

    // Проверяем, что refreshToken был вызван с новым токеном
    expect(mockRefreshToken).toHaveBeenCalledWith(mockNewToken, mockUser)
    expect(mockRefreshToken).toHaveBeenCalledTimes(1)

    // Проверяем, что setCabinetId был вызван с ID созданного кабинета
    expect(mockSetCabinetId).toHaveBeenCalledWith('cabinet-id')

    // Проверяем возвращаемый результат
    expect(result.cabinet).toEqual({
      id: 'cabinet-id',
      name: 'Test Cabinet',
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    })
  })

  it('should throw error if user not authenticated', async () => {
    ;(useAuthStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
      token: null,
    })

    await expect(handleCreateCabinet('Test Cabinet')).rejects.toThrow(
      'User not authenticated',
    )
  })

  it('should throw error if token update fails', async () => {
    const mockToken = 'old-token'
    const mockNewToken = 'new-token'
    const mockResponse = {
      id: 'cabinet-id',
      name: 'Test Cabinet',
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      newToken: mockNewToken,
    }

    const mockRefreshToken = vi.fn(() => {
      throw new Error('Token update failed')
    })

    ;(useAuthStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
      token: mockToken,
      refreshToken: mockRefreshToken,
      user: null,
    })

    ;(createCabinet as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)

    await expect(handleCreateCabinet('Test Cabinet')).rejects.toThrow(
      'token update failed',
    )
  })
})

