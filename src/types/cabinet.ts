/**
 * Cabinet-related TypeScript types
 * Epic 66-FE: Added tax system + VAT fields (Story 66.1)
 */

/** Income tax system options — matches backend taxSystem column */
export type TaxSystem = 'usn6' | 'usn15' | 'manual'

/** VAT rate options — legally mandated НДС rates in Russia */
export const VAT_RATES = [0, 5, 20, 22] as const
export type VatRate = (typeof VAT_RATES)[number]

/** Russian labels for tax system options */
export const TAX_SYSTEM_LABELS: Record<TaxSystem, string> = {
  usn6: 'УСН 6% — по доходам',
  usn15: 'УСН 15% — по прибыли',
  manual: 'Пользовательская ставка',
}

/** Tax system options for form selectors (including "not configured") */
export const TAX_SYSTEM_OPTIONS = [
  { value: null as TaxSystem | null, label: 'Не настроена' },
  { value: 'usn6' as TaxSystem, label: TAX_SYSTEM_LABELS.usn6 },
  { value: 'usn15' as TaxSystem, label: TAX_SYSTEM_LABELS.usn15 },
  { value: 'manual' as TaxSystem, label: TAX_SYSTEM_LABELS.manual },
]

/** Russian labels for VAT rate options */
export const VAT_RATE_LABELS: Record<VatRate, string> = {
  0: '0% — экспорт',
  5: '5% — УСН при превышении порога',
  20: '20% — стандартная ставка',
  22: '22% — отдельные категории (с 2025)',
}

export interface Cabinet {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  // Epic 66-FE: Tax settings (Backend Epic 72)
  taxSystem: TaxSystem | null
  taxRate: number | null
  // Epic 66-FE: VAT settings (Backend Task-50)
  vatPayer: boolean
  vatRate: number | null
}

/**
 * Request body for updating cabinet tax + VAT settings.
 * Backend auto-clears taxRate when taxSystem is usn6/usn15.
 * Backend auto-clears vatRate when vatPayer is false.
 */
export interface UpdateCabinetTaxRequest {
  taxSystem?: TaxSystem | null
  taxRate?: number | null
  vatPayer?: boolean
  vatRate?: number | null
}

export interface CreateCabinetRequest {
  name: string
  description?: string
}

export interface ProductSyncTask {
  keyName: string
  taskUuid: string
  status: string
  startedAt?: string | null
  completedAt?: string | null
  error?: string | null
  recommendation?: string | null
}

export interface CreateCabinetResponse {
  id: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  newToken: string // ⚠️ КРИТИЧНО: Новый JWT токен - обязательно обновить!
  productsSyncTasks?: ProductSyncTask[]
}

export interface UpdateWbTokenRequest {
  token: string // Новый WB API токен
}

export interface UpdateWbTokenResponse {
  id: string
  keyName: string
  updatedAt: string
}

export interface ApiError {
  code?: string
  message: string
  details?: Array<{
    field: string
    issue: string
    value?: string
    recommendation?: string
  }>
}

// --- Jam Subscription Status (GET /v1/cabinets/:id/jam-status) ---

/** Jam subscription tier detected via SDK probe strategy */
export type JamTier = 'none' | 'standard' | 'advanced'

/** Russian labels for Jam subscription tiers */
export const JAM_TIER_LABELS: Record<JamTier, string> = {
  none: 'Нет подписки',
  standard: 'Джем Стандарт',
  advanced: 'Джем Продвинутый',
}

/** Numeric tier levels for comparison (none < standard < advanced) */
export const JAM_TIER_LEVEL: Record<JamTier, number> = {
  none: 0,
  standard: 1,
  advanced: 2,
}

/** Check if user's Jam tier meets or exceeds the required tier */
export function isJamTierSufficient(userTier: JamTier, requiredTier: JamTier): boolean {
  return JAM_TIER_LEVEL[userTier] >= JAM_TIER_LEVEL[requiredTier]
}

export interface JamStatusResponse {
  tier: JamTier
  searchTextsLimit: number
  checkedAt: string
  probeCallsMade: number
}

// --- Seller Info (GET /v1/cabinets/:id/seller-info) ---

export interface SellerInfoResponse {
  name: string
  sid: string
  tradeMark: string
}
