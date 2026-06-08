/**
 * Cabinet External Service Types — Jam, Seller Info, Token Health, Seller Rating
 * Split from cabinet.ts for file size compliance
 */

// --- Jam Subscription Status (GET /v1/cabinets/:id/jam-status) ---

/**
 * Jam subscription tier detected via SDK probe strategy.
 * 'unknown' = the backend returned a tier the FE doesn't recognise; `toJamTier`
 * (cabinet-normalizer) already coerces unrecognised values to 'unknown', so it MUST be a member
 * here — otherwise the label/style/level maps render a blank, unstyled badge (Defensive Frontend).
 */
export type JamTier = 'none' | 'standard' | 'advanced' | 'unknown'

/** Russian labels for Jam subscription tiers */
export const JAM_TIER_LABELS: Record<JamTier, string> = {
  none: 'Нет подписки',
  standard: 'Джем Стандарт',
  advanced: 'Джем Продвинутый',
  unknown: 'Неизвестный тариф',
}

/** Numeric tier levels for comparison (none < standard < advanced). 'unknown' = 0 (fail closed:
 *  an unrecognised tier never satisfies a standard/advanced gate). */
export const JAM_TIER_LEVEL: Record<JamTier, number> = {
  none: 0,
  standard: 1,
  advanced: 2,
  unknown: 0,
}

/** Check if user's Jam tier meets or exceeds the required tier */
export function isJamTierSufficient(userTier: JamTier, requiredTier: JamTier): boolean {
  return JAM_TIER_LEVEL[userTier] >= JAM_TIER_LEVEL[requiredTier]
}

export type JamStatusReason =
  | 'no_products'
  | 'token_error'
  | 'insufficient_permissions'
  | 'timeout'
  | 'wb_api_error'

export const JAM_STATUS_REASON_LABELS: Record<JamStatusReason, string> = {
  no_products: 'Нет товаров',
  token_error: 'Токен невалидный',
  insufficient_permissions: 'Недостаточно прав',
  timeout: 'Таймаут запроса',
  wb_api_error: 'Ошибка WB API',
}

export interface JamStatusResponse {
  tier: JamTier
  available: boolean
  searchTextsLimit: number
  checkedAt: string
  probeCallsMade: number
  reason?: JamStatusReason
}

// --- Seller Info (GET /v1/cabinets/:id/seller-info) ---

export type SellerInfoReason =
  | 'token_error'
  | 'insufficient_permissions'
  | 'timeout'
  | 'wb_api_error'

export const SELLER_INFO_REASON_LABELS: Record<SellerInfoReason, string> = {
  token_error: 'Токен невалидный',
  insufficient_permissions: 'Недостаточно прав',
  timeout: 'Таймаут запроса',
  wb_api_error: 'Ошибка WB API',
}

export interface SellerInfoResponse {
  name: string
  sid: string
  tradeMark: string
  available: boolean
  reason?: SellerInfoReason
}

// --- Token Health (GET /v1/cabinets/:id/token-status) ---

export interface TokenHealthResponse {
  healthy: boolean
  lastError?: string
  lastErrorAt?: string
  firstErrorAt?: string
  errorCount?: number
  lastSuccessAt?: string
  recommendation?: string
}

// --- Seller Rating (GET /v1/cabinets/:id/seller-rating) ---

export type SellerRatingReason =
  | 'token_error'
  | 'insufficient_permissions'
  | 'timeout'
  | 'wb_api_error'
  | 'sdk_version_mismatch'

export const SELLER_RATING_REASON_LABELS: Record<SellerRatingReason, string> = {
  token_error: 'Токен невалидный',
  insufficient_permissions: 'Недостаточно прав (нужна категория «Вопросы и отзывы»)',
  timeout: 'Таймаут запроса',
  wb_api_error: 'Ошибка WB API',
  sdk_version_mismatch: 'Требуется обновление SDK',
}

/** /v1/cabinets/:id/seller-rating — 0–5 scale, cached 1h */
export interface SellerRatingResponse {
  valuation: number | null
  feedbackCount: number | null
  available: boolean
  reason?: SellerRatingReason
}
