/**
 * Cabinet Tax & VAT Settings API Client
 * Epic 66-FE, Story 66.1: Types & API Layer
 *
 * Backend endpoints: GET/PUT /v1/cabinets/:id
 * @see docs/request-backend/156-EPIC-72-TAX-ACCOUNTING-FRONTEND-INTEGRATION.md
 */

import { apiClient } from '../api-client'
import type {
  Cabinet,
  UpdateCabinetTaxRequest,
  JamStatusResponse,
  SellerInfoResponse,
} from '@/types/cabinet'

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

/**
 * GET /v1/cabinets/:id/jam-status
 * Detect Jam subscription tier via SDK v3.3.0 probe strategy.
 * Backend caches result; probe calls are expensive.
 */
export async function getJamStatus(cabinetId: string): Promise<JamStatusResponse> {
  return apiClient.get<JamStatusResponse>(`/v1/cabinets/${cabinetId}/jam-status`)
}

/**
 * GET /v1/cabinets/:id/seller-info
 * Fetch seller info from WB General API. Backend caches for 1 hour.
 */
export async function getSellerInfo(cabinetId: string): Promise<SellerInfoResponse> {
  return apiClient.get<SellerInfoResponse>(`/v1/cabinets/${cabinetId}/seller-info`)
}
