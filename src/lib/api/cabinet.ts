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
  TokenHealthResponse,
} from '@/types/cabinet'
// Story 89.1-FE: Boundary normalizers — Jam tier falls back to 'unknown' for new tiers
import {
  normalizeCabinetResponse,
  normalizeJamStatusResponse,
  normalizeSellerInfoResponse,
  normalizeTokenHealthResponse,
} from './cabinet-normalizer'

/**
 * GET /v1/cabinets/:id
 * Fetch cabinet details including tax and VAT settings.
 */
export async function getCabinetTaxSettings(cabinetId: string): Promise<Cabinet> {
  const raw = await apiClient.get<unknown>(`/v1/cabinets/${cabinetId}`)
  return normalizeCabinetResponse(raw)
}

/**
 * PUT /v1/cabinets/:id — mutation, remains passthrough (shape controlled by request body)
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
 */
export async function getJamStatus(cabinetId: string): Promise<JamStatusResponse> {
  const raw = await apiClient.get<unknown>(`/v1/cabinets/${cabinetId}/jam-status`)
  return normalizeJamStatusResponse(raw)
}

/**
 * GET /v1/cabinets/:id/seller-info
 * Fetch seller info from WB General API. Backend caches for 1 hour.
 */
export async function getSellerInfo(cabinetId: string): Promise<SellerInfoResponse> {
  const raw = await apiClient.get<unknown>(`/v1/cabinets/${cabinetId}/seller-info`)
  return normalizeSellerInfoResponse(raw)
}

/**
 * GET /v1/cabinets/:id/token-status
 * Token health from Redis — lightweight, no WB API calls.
 */
export async function getTokenHealth(cabinetId: string): Promise<TokenHealthResponse> {
  const raw = await apiClient.get<unknown>(`/v1/cabinets/${cabinetId}/token-status`)
  return normalizeTokenHealthResponse(raw)
}
