import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/lib/api-client'
import { updateCabinetTaxSettings } from '../cabinet'

vi.mock('@/lib/api-client', () => ({
  apiClient: { put: vi.fn() },
}))

describe('updateCabinetTaxSettings target margin boundary', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each([0, 20, null])('maps canonical %s to the writable snake-case field', async value => {
    vi.mocked(apiClient.put).mockResolvedValue({ targetMarginPct: value })

    const result = await updateCabinetTaxSettings('cab-1', { targetMarginPct: value })

    expect(apiClient.put).toHaveBeenCalledWith(
      '/v1/cabinets/cab-1',
      {
        target_margin_pct: value,
      },
      undefined
    )
    expect(result.targetMarginPct).toBe(value)
  })

  it('does not add the target field when it is absent', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ taxSystem: 'usn6' })

    await updateCabinetTaxSettings('cab-1', { taxSystem: 'usn6' })

    expect(apiClient.put).toHaveBeenCalledWith(
      '/v1/cabinets/cab-1',
      {
        taxSystem: 'usn6',
      },
      undefined
    )
  })

  it('returns a complete normalized cabinet suitable for cache seeding', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({
      id: 'cab-1',
      name: 'Cabinet',
      description: 'Primary cabinet',
      is_active: true,
      created_at: '2026-08-01T10:00:00.000Z',
      updated_at: '2026-08-03T10:00:00.000Z',
      target_margin_pct: 20,
    })

    const result = await updateCabinetTaxSettings('cab-1', { targetMarginPct: 20 })

    expect(result).toEqual(
      expect.objectContaining({
        id: 'cab-1',
        name: 'Cabinet',
        description: 'Primary cabinet',
        isActive: true,
        createdAt: '2026-08-01T10:00:00.000Z',
        updatedAt: '2026-08-03T10:00:00.000Z',
        targetMarginPct: 20,
      })
    )
  })
})
