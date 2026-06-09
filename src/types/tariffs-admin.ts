// Tariff Settings Admin Types
// Epic 52-FE: Story 52-FE.7 - Page Layout, Types & Integration
// Backend Reference: Request #101 - Epic 52 Tariff Settings Admin API

/**
 * Version status calculated from effective dates
 * - scheduled: effective_from > today
 * - active: effective_from <= today <= effective_until (or null)
 * - expired: effective_until < today
 */
export type TariffVersionStatus = 'scheduled' | 'active' | 'expired'

/**
 * 21 tracked audit fields for tariff settings changes
 * Used for filtering audit log and validation
 */
export const TRACKED_TARIFF_FIELDS = [
  'acceptanceBoxRatePerLiter',
  'acceptancePalletRate',
  'logisticsVolumeTiers',
  'logisticsLargeFirstLiterRate',
  'logisticsLargeAdditionalLiterRate',
  'returnLogisticsFboRate',
  'returnLogisticsFbsRate',
  'defaultCommissionFboPct',
  'defaultCommissionFbsPct',
  'storageFreeDays',
  'fixationClothingDays',
  'fixationOtherDays',
  'clothingCategories',
  'fbsUsesFboLogisticsRates',
  'logisticsFbsVolumeTiers',
  'logisticsFbsLargeFirstLiterRate',
  'logisticsFbsLargeAdditionalLiterRate',
  'effectiveFrom',
  'source',
  'notes',
] as const

export type TrackedTariffField = (typeof TRACKED_TARIFF_FIELDS)[number]

/** Volume tier for logistics pricing
 * Backend stores tiers sorted by fromLiters ascending
 */
export interface LogisticsVolumeTier {
  fromLiters: number
  toLiters: number
  rateRub: number
}

/**
 * Full tariff settings DTO (21 fields)
 * Response from GET /v1/tariffs/settings
 */
export interface TariffSettingsDto {
  // Acceptance (2 fields)
  acceptanceBoxRatePerLiter: number
  acceptancePalletRate: number

  // Logistics (3 fields + tiers)
  logisticsVolumeTiers: LogisticsVolumeTier[]
  logisticsLargeFirstLiterRate: number
  logisticsLargeAdditionalLiterRate: number

  // Returns (2 fields)
  returnLogisticsFboRate: number
  returnLogisticsFbsRate: number

  // Commission (2 fields) - percentages 0-100
  defaultCommissionFboPct: number
  defaultCommissionFbsPct: number

  // Storage (3 fields) - non-negative integers
  storageFreeDays: number
  // Backend OMITS these from GET /v1/tariffs/settings — optional so the read
  // normalizer leaves them undefined and the form default fires (request #101).
  fixationClothingDays?: number
  fixationOtherDays?: number

  // FBS-specific (4+ fields)
  fbsUsesFboLogisticsRates: boolean
  logisticsFbsVolumeTiers?: LogisticsVolumeTier[]
  logisticsFbsLargeFirstLiterRate?: number
  logisticsFbsLargeAdditionalLiterRate?: number
  clothingCategories?: string[]

  // Meta (3 fields)
  effectiveFrom?: string
  source?: 'manual' | 'api'
  notes?: string
}

/**
 * Update request for PUT/PATCH endpoints
 * Partial allowed for PATCH, full required for PUT
 */
export type UpdateTariffSettingsDto = Partial<TariffSettingsDto>

/**
 * Schedule request for creating future version
 * POST /v1/tariffs/settings/schedule
 * effective_from is required and must be future date (YYYY-MM-DD)
 */
export interface ScheduleTariffVersionDto extends Partial<TariffSettingsDto> {
  effective_from: string // YYYY-MM-DD, must be future date
}

/** Version history item from GET /v1/tariffs/settings/history
 */
export interface TariffVersion {
  id: number
  effective_from: string
  effective_until: string | null
  status: TariffVersionStatus
  source: 'manual' | 'api'
  notes?: string
  created_at: string
  updated_by: string
}

// Audit, response, and schedule types extracted for file-size compliance
export type {
  TariffAuditEntry,
  TariffAuditResponse,
  TariffAuditParams,
  TariffSettingsResponse,
  ScheduleTariffResponse,
} from './tariffs-admin-audit'
