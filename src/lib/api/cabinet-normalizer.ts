/**
 * Cabinet Boundary Normalizers — Story 89.1-FE
 * Absorbs backend shape drift for cabinet, jam-status, seller-info, token-health.
 */

import type {
  Cabinet,
  JamStatusResponse,
  JamTier,
  SellerInfoResponse,
  SellerRatingResponse,
  TaxSystem,
  TokenHealthResponse,
} from '@/types/cabinet'

// Coerce a backend tier to a JamTier. Unrecognised/missing → 'unknown' (a real JamTier member).
function toJamTier(raw: unknown): JamTier {
  const s = String(raw ?? 'unknown').toLowerCase()
  if (s === 'none' || s === 'standard' || s === 'advanced') return s
  return 'unknown'
}

const VALID_TAX_SYSTEMS = new Set<TaxSystem>(['usn6', 'usn15', 'manual'])

function toTaxSystem(raw: unknown): TaxSystem | null {
  return VALID_TAX_SYSTEMS.has(raw as TaxSystem) ? (raw as TaxSystem) : null
}

export function normalizeCabinetResponse(raw: unknown): Cabinet {
  const r = (raw ?? {}) as Record<string, unknown>
  return {
    id: String(r.id ?? ''),
    name: String(r.name ?? ''),
    taxSystem: toTaxSystem(r.taxSystem ?? r.tax_system),
    taxRate: r.taxRate != null ? Number(r.taxRate) : r.tax_rate != null ? Number(r.tax_rate) : null,
    vatPayer: Boolean(r.vatPayer ?? r.vat_payer ?? false),
    vatRate: r.vatRate != null ? Number(r.vatRate) : r.vat_rate != null ? Number(r.vat_rate) : null,
  } as Cabinet
}

export function normalizeJamStatusResponse(raw: unknown): JamStatusResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  return {
    available: Boolean(r.available ?? true),
    tier: toJamTier(r.tier ?? r.jamTier ?? r.jam_tier),
    reason: (r.reason ?? null) as string | null,
  } as JamStatusResponse
}

export function normalizeSellerInfoResponse(raw: unknown): SellerInfoResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  return {
    available: Boolean(r.available ?? true),
    name: String(r.name ?? ''),
    sid: String(r.sid ?? ''),
    tradeMark: String(r.tradeMark ?? r.trademark ?? r.trade_mark ?? ''),
    reason: (r.reason ?? null) as string | null,
  } as SellerInfoResponse
}

export function normalizeTokenHealthResponse(raw: unknown): TokenHealthResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  return {
    healthy: Boolean(r.healthy ?? r.isHealthy ?? r.is_healthy ?? true),
    lastCheckedAt: String(r.lastCheckedAt ?? r.last_checked_at ?? ''),
    errorCount: Number(r.errorCount ?? r.error_count ?? 0),
  } as TokenHealthResponse
}

export function normalizeSellerRatingResponse(raw: unknown): SellerRatingResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  return {
    valuation: r.valuation != null ? Number(r.valuation) : null,
    feedbackCount: r.feedbackCount != null ? Number(r.feedbackCount) : null,
    available: Boolean(r.available ?? false),
    reason: (r.reason ?? null) as string | null,
  } as SellerRatingResponse
}
