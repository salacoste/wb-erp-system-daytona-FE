/**
 * Cabinet-related TypeScript types
 * Epic 66-FE: Added tax system + VAT fields (Story 66.1)
 *
 * Barrel re-export — split into domain files for file size compliance.
 * All existing imports from '@/types/cabinet' continue to work unchanged.
 */

// Core: cabinet interface, tax/VAT, CRUD, API error
export type {
  TaxSystem,
  VatRate,
  Cabinet,
  UpdateCabinetTaxRequest,
  CreateCabinetRequest,
  ProductSyncTask,
  CreateCabinetResponse,
  CabinetCreationOperationState,
  UpdateWbTokenRequest,
  UpdateWbTokenResponse,
  ApiError,
} from './core'

export { VAT_RATES, TAX_SYSTEM_LABELS, TAX_SYSTEM_OPTIONS, VAT_RATE_LABELS } from './core'

// External services: Jam, Seller Info, Token Health, Seller Rating
export type {
  JamTier,
  JamStatusReason,
  JamStatusResponse,
  SellerInfoReason,
  SellerInfoResponse,
  TokenHealthResponse,
  SellerRatingReason,
  SellerRatingResponse,
} from './external-services'

export {
  JAM_TIER_LABELS,
  JAM_TIER_LEVEL,
  isJamTierSufficient,
  JAM_STATUS_REASON_LABELS,
  SELLER_INFO_REASON_LABELS,
  SELLER_RATING_REASON_LABELS,
} from './external-services'
