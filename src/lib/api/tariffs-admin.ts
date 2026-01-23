// ============================================================================
// Tariff Settings Admin API Client
// Epic 52-FE: Story 52-FE.7 - Page Layout, Types & Integration
// Backend Reference: Request #101 - Epic 52 Tariff Settings Admin API
// ============================================================================

import { apiClient } from '../api-client'
import type {
  TariffSettingsDto,
  UpdateTariffSettingsDto,
  ScheduleTariffVersionDto,
  TariffVersion,
  TariffAuditResponse,
  TariffAuditParams,
} from '@/types/tariffs-admin'

const BASE_URL = '/v1/tariffs/settings'

// ============================================================================
// GET Endpoints (Read Operations)
// ============================================================================

/**
 * GET /v1/tariffs/settings
 * Fetch current tariff settings (active version based on effective_from)
 *
 * @returns Current tariff settings
 */
export async function getTariffSettings(): Promise<TariffSettingsDto> {
  return apiClient.get<TariffSettingsDto>(BASE_URL)
}

/**
 * GET /v1/tariffs/settings/history
 * Fetch all tariff versions sorted by effective_from descending
 *
 * @returns Array of tariff versions with status (scheduled/active/expired)
 */
export async function getTariffVersionHistory(): Promise<TariffVersion[]> {
  const response = await apiClient.get<{ data: TariffVersion[] }>(
    `${BASE_URL}/history`,
    { skipDataUnwrap: true }
  )
  return response.data
}

/**
 * GET /v1/tariffs/settings/audit
 * Fetch audit trail with optional filters and pagination
 *
 * @param params - Optional filters: page, limit, field_name
 * @returns Paginated audit log entries
 */
export async function getTariffAuditLog(
  params: TariffAuditParams = {}
): Promise<TariffAuditResponse> {
  const searchParams = new URLSearchParams()

  if (params.page) {
    searchParams.set('page', String(params.page))
  }
  if (params.limit) {
    searchParams.set('limit', String(params.limit))
  }
  if (params.field_name) {
    searchParams.set('field_name', params.field_name)
  }

  const query = searchParams.toString()
  return apiClient.get<TariffAuditResponse>(
    `${BASE_URL}/audit${query ? `?${query}` : ''}`,
    { skipDataUnwrap: true }
  )
}

// ============================================================================
// Mutation Endpoints (Write Operations - Rate Limited: 10 req/min)
// ============================================================================

/**
 * PUT /v1/tariffs/settings
 * Full replacement of current tariff settings (Admin only)
 * Rate Limited: 10 requests per minute
 *
 * @param data - Complete tariff settings
 * @returns Updated tariff settings
 */
export async function putTariffSettings(
  data: TariffSettingsDto
): Promise<TariffSettingsDto> {
  return apiClient.put<TariffSettingsDto>(BASE_URL, data)
}

/**
 * PATCH /v1/tariffs/settings
 * Partial update of current tariff settings (Admin only)
 * Rate Limited: 10 requests per minute
 *
 * @param data - Partial tariff settings (only changed fields)
 * @returns Updated tariff settings
 */
export async function patchTariffSettings(
  data: UpdateTariffSettingsDto
): Promise<TariffSettingsDto> {
  return apiClient.patch<TariffSettingsDto>(BASE_URL, data)
}

/**
 * POST /v1/tariffs/settings/schedule
 * Create future tariff version (Admin only)
 * Rate Limited: 10 requests per minute
 *
 * Validation rules:
 * - effective_from must be future date (not today or past)
 * - effective_from must be unique (no duplicate dates)
 * - Maximum 10 scheduled versions allowed
 *
 * @param data - Tariff settings with required effective_from date
 * @returns Created version info
 */
export async function scheduleTariffVersion(
  data: ScheduleTariffVersionDto
): Promise<TariffVersion> {
  return apiClient.post<TariffVersion>(`${BASE_URL}/schedule`, data)
}

/**
 * DELETE /v1/tariffs/settings/:id
 * Delete scheduled tariff version (Admin only)
 * Only versions with status="scheduled" can be deleted
 *
 * @param id - Version ID to delete
 * @returns void (204 No Content)
 */
export async function deleteTariffVersion(id: number): Promise<void> {
  return apiClient.delete<void>(`${BASE_URL}/${id}`)
}
