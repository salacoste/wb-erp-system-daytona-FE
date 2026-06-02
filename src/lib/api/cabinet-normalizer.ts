/**
 * Cabinet Boundary Normalizers — Story 89.1-FE
 * Absorbs backend shape drift for cabinet, jam-status, seller-info, token-health.
 * Mutation (updateCabinetTaxSettings) remains passthrough.
 *
 * JamStatusResponse normalizer falls back to 'unknown' for unrecognized tiers
 * (same pattern as authStore.normalizeUser for role-case — Story 84.2).
 */

import type {
  Cabinet,
  JamStatusResponse,
  SellerInfoResponse,
  TaxSystem,
  TokenHealthResponse,
} from '@/types/cabinet'

// Must match JamTier union in src/types/cabinet.ts:112
const VALID_JAM_TIERS = new Set(['none', 'standard', 'advanced'])

function toJamTier(raw: unknown): string {
  const s = String(raw ?? 'unknown').toLowerCase()
  return VALID_JAM_TIERS.has(s) ? s : 'unknown'
}

// Must match TaxSystem union in src/types/cabinet.ts:7. F-42: the backend sends
// taxSystem:null when the seller hasn't configured it; the old String(... ?? 'none')
// produced 'none' (not a valid TaxSystem) → the radio group matched no option and
// rendered blank. Preserve null (→ "Не настроена" selected) and reject unknown values.
const VALID_TAX_SYSTEMS = new Set<TaxSystem>(['usn6', 'usn15', 'manual'])

function toTaxSystem(raw: unknown): TaxSystem | null {
  return VALID_TAX_SYSTEMS.has(raw as TaxSystem) ? (raw as TaxSystem) : null
}

export function normalizeCabinetResponse(raw: unknown): Cabinet {
  const r = (raw ?? {}) as Record<string, unknown>
  return {
    ...r,
    id: String(r.id ?? ''),
    name: String(r.name ?? ''),
    taxSystem: toTaxSystem(r.taxSystem ?? r.tax_system),
    taxRate: r.taxRate != null ? Number(r.taxRate) : r.tax_rate != null ? Number(r.tax_rate) : null,
    vatPayer: Boolean(r.vatPayer ?? r.vat_payer ?? false),
    vatRate: r.vatRate != null ? Number(r.vatRate) : r.vat_rate != null ? Number(r.vat_rate) : null,
  } as unknown as Cabinet
}

export function normalizeJamStatusResponse(raw: unknown): JamStatusResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  return {
    ...r,
    available: Boolean(r.available ?? true),
    tier: toJamTier(r.tier ?? r.jamTier ?? r.jam_tier),
    reason: (r.reason ?? null) as string | null,
  } as unknown as JamStatusResponse
}

export function normalizeSellerInfoResponse(raw: unknown): SellerInfoResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  return {
    ...r,
    available: Boolean(r.available ?? true),
    name: String(r.name ?? ''),
    sid: String(r.sid ?? ''),
    // Type uses camelCase `tradeMark` (src/types/cabinet.ts:175)
    tradeMark: String(r.tradeMark ?? r.trademark ?? r.trade_mark ?? ''),
    reason: (r.reason ?? null) as string | null,
  } as unknown as SellerInfoResponse
}

export function normalizeTokenHealthResponse(raw: unknown): TokenHealthResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  return {
    ...r,
    healthy: Boolean(r.healthy ?? r.isHealthy ?? r.is_healthy ?? true),
    lastCheckedAt: String(r.lastCheckedAt ?? r.last_checked_at ?? ''),
    errorCount: Number(r.errorCount ?? r.error_count ?? 0),
  } as unknown as TokenHealthResponse
}
