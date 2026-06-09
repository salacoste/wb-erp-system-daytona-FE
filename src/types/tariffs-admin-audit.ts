/**
 * Tariff Admin Audit & Response Types
 * Extracted from tariffs-admin.ts for file-size compliance.
 * Epic 52-FE: Story 52-FE.7 - Page Layout, Types & Integration
 */

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
  data: import('./tariffs-admin').TariffSettingsDto
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
  data: import('./tariffs-admin').TariffSettingsDto
  meta: {
    version_id: number
    effective_from: string
    status: 'scheduled'
  }
}
