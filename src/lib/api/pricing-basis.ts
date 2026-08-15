/**
 * Pricing Basis API Client (SPP-1.3)
 * GET/PUT /v1/pricing/basis — cabinet-level repricing price basis setting.
 *
 * 'STOREFRONT_SESSION' is reserved on the backend (PUT → 400) and deliberately
 * absent from the FE union. The normalizer INDICATES unknown values
 * (Defensive Frontend: never silently relabel a financial surface) by passing
 * 'UNKNOWN' through — the badge renders a neutral «Неизвестный базис» chip
 * instead of guessing 'SELLER'.
 */

import { apiClient } from '../api-client'
import { asRecord } from './normalizer-helpers'
import type { PriceBasis, PriceBasisOrUnknown } from '@/types/price-recommendations'

const BASE = '/v1/pricing/basis'

/**
 * Normalize an unknown priceBasis value to the FE-supported union or 'UNKNOWN'.
 * Only the two supported values map to themselves; anything else (null/missing/
 * future enum members like STOREFRONT_SESSION) → 'UNKNOWN' — rendered as a
 * distinct badge, never silently folded to SELLER.
 */
export function normalizePriceBasis(raw: unknown): PriceBasisOrUnknown {
  if (raw === 'SELLER' || raw === 'STOREFRONT_ANON') return raw
  return 'UNKNOWN'
}

/** Narrow to the two settable values (toggle/select only accept these). */
export function isSettablePriceBasis(value: PriceBasisOrUnknown): value is PriceBasis {
  return value === 'SELLER' || value === 'STOREFRONT_ANON'
}

/** GET /v1/pricing/basis → current cabinet price basis. */
export async function getPricingBasis(): Promise<PriceBasisOrUnknown> {
  const raw = await apiClient.get<unknown>(BASE, { skipDataUnwrap: true })
  return normalizePriceBasis(asRecord(raw).priceBasis)
}

/** PUT /v1/pricing/basis {priceBasis} → echoes the persisted basis. */
export async function updatePricingBasis(basis: PriceBasis): Promise<PriceBasisOrUnknown> {
  // Runtime guard mirrors the TS union: only the two supported values leave the client.
  if (basis !== 'SELLER' && basis !== 'STOREFRONT_ANON') {
    throw new Error(`Unsupported price basis: ${String(basis)}`)
  }
  const raw = await apiClient.put<unknown>(BASE, { priceBasis: basis })
  return normalizePriceBasis(asRecord(raw).priceBasis)
}
