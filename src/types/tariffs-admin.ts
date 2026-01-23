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
  fixationClothingDays: number
  fixationOtherDays: number

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

/** Audit log entry from GET /v1/tariffs/settings/audit
 * Tracks field-level changes with user context
 */
export interface TariffAuditEntry {
  id: number
  action: 'UPDATE' | 'CREATE' | 'DELETE'
  field_name: string
  old_value: string | null
  new_value: string | null
  user_id: string
  user_email: string
  ip_address: string
  created_at: string
}

/**
 * Audit log response with pagination
 */
export interface TariffAuditResponse {
  data: TariffAuditEntry[]
  meta: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

/**
 * Query params for audit log endpoint
 */
export interface TariffAuditParams {
  page?: number
  limit?: number
  field_name?: string
}

/** Response from PUT/PATCH endpoints
 * Includes meta with updated_at and updated_by
 */
export interface TariffSettingsResponse {
  data: TariffSettingsDto
  meta: {
    updated_at: string
    updated_by: string
    fields_updated?: string[]
  }
}

/**
 * Response from POST /v1/tariffs/settings/schedule
 */
export interface ScheduleTariffResponse {
  data: TariffSettingsDto
  meta: {
    version_id: number
    effective_from: string
    status: 'scheduled'
  }
}
