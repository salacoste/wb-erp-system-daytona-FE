/**
 * Price Elasticity API Client + Normalizer
 * GET /v1/products/price-elasticity (batch)
 * GET /v1/products/price-elasticity/{nmId} (single SKU)
 *
 * @see ../test-api/99-pricing.http
 */

import { apiClient } from '@/lib/api-client'
import { toCount, toNullableNumber, toStr, asRecord } from './normalizer-helpers'
import type {
  PriceElasticityBatchParams,
  PriceElasticityBatchResponse,
  PriceElasticitySkuResponse,
  PriceElasticityItem,
  ElasticityConfidenceKey,
} from '@/types/price-elasticity'

// ---------------------------------------------------------------------------
// Boundary Normalizer (backend shape → frontend-canonical)
// ---------------------------------------------------------------------------

const VALID_CONFIDENCE = new Set<string>(['high', 'medium', 'low'])

function toConfidence(raw: unknown): ElasticityConfidenceKey {
  return typeof raw === 'string' && VALID_CONFIDENCE.has(raw)
    ? (raw as ElasticityConfidenceKey)
    : 'low'
}

function normalizeElasticityItem(raw: unknown): PriceElasticityItem {
  const r = asRecord(raw)
  return {
    nmId: toCount(r.nmId),
    elasticity: toCount(r.elasticity),
    rSquared: toCount(r.rSquared),
    dataPoints: toCount(r.dataPoints),
    source: toStr(r.source),
    confidence: toConfidence(r.confidence),
  }
}

function normalizeByConfidence(raw: unknown): Record<ElasticityConfidenceKey, number> {
  if (!raw || typeof raw !== 'object') return { high: 0, medium: 0, low: 0 }
  const r = raw as Record<string, unknown>
  return {
    high: toCount(r.high),
    medium: toCount(r.medium),
    low: toCount(r.low),
  }
}

function normalizeBatchResponse(raw: unknown): PriceElasticityBatchResponse {
  const r = asRecord(raw)
  return {
    items: Array.isArray(r.items) ? r.items.map(normalizeElasticityItem) : [],
    total: toCount(r.total),
    byConfidence: normalizeByConfidence(r.byConfidence),
  }
}

function normalizeSkuResponse(raw: unknown): PriceElasticitySkuResponse {
  const r = asRecord(raw)
  return {
    nmId: toCount(r.nmId),
    elasticity: toCount(r.elasticity),
    rSquared: toCount(r.rSquared),
    dataPoints: toCount(r.dataPoints),
    source: toStr(r.source),
    confidence: toConfidence(r.confidence),
    profitMaxPrice: toNullableNumber(r.profitMaxPrice),
  }
}

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

/** GET /v1/products/price-elasticity (batch) */
export async function getPriceElasticityBatch(
  params: PriceElasticityBatchParams = {}
): Promise<PriceElasticityBatchResponse> {
  const sp = new URLSearchParams()
  if (params.limit != null) sp.set('limit', String(params.limit))
  if (params.offset != null) sp.set('offset', String(params.offset))
  const qs = sp.toString()
  const raw = await apiClient.get<unknown>(`/v1/products/price-elasticity${qs ? `?${qs}` : ''}`, {
    skipDataUnwrap: true,
  })
  return normalizeBatchResponse(raw)
}

/** GET /v1/products/price-elasticity/{nmId} */
export async function getPriceElasticitySku(nmId: number): Promise<PriceElasticitySkuResponse> {
  const raw = await apiClient.get<unknown>(`/v1/products/price-elasticity/${nmId}`, {
    skipDataUnwrap: true,
  })
  return normalizeSkuResponse(raw)
}

// ---------------------------------------------------------------------------
// Query Key Factory
// ---------------------------------------------------------------------------

export const priceElasticityQueryKeys = {
  all: ['price-elasticity'] as const,
  batch: (params: PriceElasticityBatchParams) =>
    [...priceElasticityQueryKeys.all, 'batch', params] as const,
  sku: (nmId: number) => [...priceElasticityQueryKeys.all, 'sku', nmId] as const,
}
