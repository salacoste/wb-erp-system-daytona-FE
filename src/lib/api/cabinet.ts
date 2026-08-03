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
  SellerRatingResponse,
  TokenHealthResponse,
} from '@/types/cabinet'
// Story 89.1-FE: Boundary normalizers — Jam tier falls back to 'unknown' for new tiers
import {
  normalizeCabinetResponse,
  normalizeJamStatusResponse,
  normalizeSellerInfoResponse,
  normalizeSellerRatingResponse,
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
 * PUT /v1/cabinets/:id — update tax/VAT settings.
 * F-42: normalize the echoed cabinet too (if the backend returns one) so a consumer
 * reading the mutation result gets the same canonical shape as the GET path — e.g.
 * taxSystem:null stays null instead of leaking the raw 'none'/snake_case shape.
 */
export async function updateCabinetTaxSettings(
  cabinetId: string,
  data: UpdateCabinetTaxRequest
): Promise<Cabinet> {
  const { targetMarginPct, ...existingSettings } = data
  const requestBody =
    targetMarginPct === undefined
      ? existingSettings
      : { ...existingSettings, target_margin_pct: targetMarginPct }
  const raw = await apiClient.put<unknown>(`/v1/cabinets/${cabinetId}`, requestBody)
  return normalizeCabinetResponse(raw)
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

/**
 * GET /v1/cabinets/:id/seller-rating
 * Seller valuation (0–5 scale) + feedback count. Cached 1h.
 * Graceful: available=false when token lacks "Questions & Reviews" category.
 */
export async function getSellerRating(cabinetId: string): Promise<SellerRatingResponse> {
  const raw = await apiClient.get<unknown>(`/v1/cabinets/${cabinetId}/seller-rating`)
  return normalizeSellerRatingResponse(raw)
}
