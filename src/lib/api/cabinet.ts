/**
 * Cabinet Tax & VAT Settings API Client
 * Epic 66-FE, Story 66.1: Types & API Layer
 *
 * Backend endpoints: GET/PUT /v1/cabinets/:id
 * @see docs/request-backend/156-EPIC-72-TAX-ACCOUNTING-FRONTEND-INTEGRATION.md
 */

import { apiClient } from '../api-client'
import type { Cabinet, UpdateCabinetTaxRequest } from '@/types/cabinet'

/**
 * GET /v1/cabinets/:id
 * Fetch cabinet details including tax and VAT settings.
 */
export async function getCabinetTaxSettings(cabinetId: string): Promise<Cabinet> {
  return apiClient.get<Cabinet>(`/v1/cabinets/${cabinetId}`)
}

/**
 * PUT /v1/cabinets/:id
 * Update cabinet tax + VAT settings.
 *
 * Backend validation:
 * - taxSystem='manual' → taxRate required (0-100)
 * - taxSystem='usn6'/'usn15' → taxRate auto-cleared
 * - vatPayer=true → vatRate required (0, 5, 20, 22)
 * - vatPayer=false → vatRate auto-cleared
 */
export async function updateCabinetTaxSettings(
  cabinetId: string,
  data: UpdateCabinetTaxRequest
): Promise<Cabinet> {
  return apiClient.put<Cabinet>(`/v1/cabinets/${cabinetId}`, data)
}
