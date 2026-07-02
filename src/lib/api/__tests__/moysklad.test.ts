/**
 * Boundary normalizer tests — МойСклад (Phase 1 MVP).
 * Contract: docs/request-backend/221-moysklad-integration-backend-contract.md
 *
 * Covers: null preservation (AP#8 — nmId/matchedBy/article/buyPrice → null, never 0),
 * kopeck→rubles conversion, response-shape ({count,total,rows}) handling,
 * match-strategy enum coercion, variant type + backend `moyskadType` typo.
 */

import { describe, it, expect, vi } from 'vitest'
import {
  mapMoyskladMapping,
  getMoyskladMappings,
  getMoyskladHealth,
  getMoyskladOrganizations,
} from '../moysklad'
import { apiClient } from '../../api-client'
import {
  moyskladMappingsRawFixture,
  moyskladMappingsEmptyFixture,
  moyskladHealthFixture,
  moyskladOrganizationsFixture,
} from '@/test/fixtures/moysklad-empty'

vi.mock('../../api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const mockedGet = vi.mocked(apiClient.get)

describe('mapMoyskladMapping', () => {
  it('converts buyPriceKopeck (string BigInt) to rubles', () => {
    const m = mapMoyskladMapping(moyskladMappingsRawFixture.rows[0])
    // "7080000" kopeck → 70800.00 ₽
    expect(m.buyPriceRub).toBe(70800)
    expect(m.moyskladType).toBe('PRODUCT')
    expect(m.matchedBy).toBe('VENDOR_CODE')
    expect(m.nmId).toBe(12345678)
  })

  it('preserves null money as null (AP#8 — never 0)', () => {
    const m = mapMoyskladMapping(moyskladMappingsRawFixture.rows[1])
    expect(m.buyPriceRub).toBeNull()
    expect(m.matchedBy).toBe('MANUAL')
    expect(m.moyskladType).toBe('VARIANT')
  })

  it('preserves null nmId/matchedBy/article on pending rows (rendered «не привязан»)', () => {
    const m = mapMoyskladMapping(moyskladMappingsRawFixture.rows[2])
    expect(m.nmId).toBeNull()
    expect(m.matchedBy).toBeNull()
    expect(m.moyskladArticle).toBeNull()
    expect(m.lastSyncedAt).toBeNull()
    // buy price still present even when pending (500000 kopeck → 5000 ₽)
    expect(m.buyPriceRub).toBe(5000)
  })

  it('returns safe defaults for null input', () => {
    const m = mapMoyskladMapping(null)
    expect(m.id).toBe('')
    // Unknown/absent type → null (Defensive Frontend — never silently PRODUCT).
    expect(m.moyskladType).toBeNull()
    expect(m.nmId).toBeNull()
    expect(m.matchedBy).toBeNull()
    expect(m.buyPriceRub).toBeNull()
  })

  it('coerces an unknown matchedBy string to null (pending)', () => {
    const m = mapMoyskladMapping({ id: 'x', moyskladAssortmentId: 'a', matchedBy: 'WEIRD' })
    expect(m.matchedBy).toBeNull()
  })

  it('coerces an unknown type value to null (Defensive FE — indicate, never PRODUCT)', () => {
    // Fixture row 4 has moyskladType='SERVICE' — an unknown assortment kind.
    const m = mapMoyskladMapping(moyskladMappingsRawFixture.rows[3])
    expect(m.moyskladType).toBeNull()
  })

  it('handles the backend `moyskadType` typo when moyskladType is absent', () => {
    const m = mapMoyskladMapping({ id: 'x', moyskladAssortmentId: 'a', moyskadType: 'VARIANT' })
    expect(m.moyskladType).toBe('VARIANT')
  })
})

describe('response-shape handling (skipDataUnwrap)', () => {
  it('getMoyskladMappings reads {count,total,rows} envelope', async () => {
    mockedGet.mockResolvedValueOnce(moyskladMappingsRawFixture)
    const res = await getMoyskladMappings({ matched: false })
    expect(mockedGet).toHaveBeenCalledWith(
      '/v1/moysklad/mappings?matched=false',
      expect.objectContaining({ skipDataUnwrap: true })
    )
    expect(res.count).toBe(4)
    expect(res.total).toBe(435)
    expect(res.rows).toHaveLength(4)
    expect(res.rows[0].buyPriceRub).toBe(70800)
  })

  it('getMoyskladMappings builds query with limit/offset for positive ints', async () => {
    mockedGet.mockResolvedValueOnce(moyskladMappingsEmptyFixture)
    await getMoyskladMappings({ limit: 50, offset: 10 })
    expect(mockedGet).toHaveBeenCalledWith(
      '/v1/moysklad/mappings?limit=50&offset=10',
      expect.objectContaining({ skipDataUnwrap: true })
    )
  })

  it('getMoyskladMappings omits limit=0 (backend treats 0 as absent)', async () => {
    mockedGet.mockResolvedValueOnce(moyskladMappingsEmptyFixture)
    await getMoyskladMappings({ limit: 0 })
    expect(mockedGet).toHaveBeenCalledWith(
      '/v1/moysklad/mappings',
      expect.objectContaining({ skipDataUnwrap: true })
    )
  })

  it('getMoyskladHealth returns flat object', async () => {
    mockedGet.mockResolvedValueOnce(moyskladHealthFixture)
    const h = await getMoyskladHealth()
    expect(h.tokenConfigured).toBe(true)
    expect(h.readOnly).toBe(true)
    expect(h.orgId).toBe('org-123')
  })

  it('getMoyskladOrganizations reads {rows} envelope', async () => {
    mockedGet.mockResolvedValueOnce(moyskladOrganizationsFixture)
    const orgs = await getMoyskladOrganizations()
    expect(orgs).toHaveLength(1)
    expect(orgs[0].name).toBe('ООО Ромашка')
    expect(orgs[0].inn).toBe('7700000000')
  })
})
