/**
 * Price Elasticity Types
 * GET /v1/products/price-elasticity (batch) and
 * GET /v1/products/price-elasticity/{nmId} (single SKU)
 *
 * @see ../test-api/99-pricing.http
 */

/** Confidence level labels (Russian) */
export const ElasticityConfidence = {
  high: 'Высокая',
  medium: 'Средняя',
  low: 'Низкая',
} as const

export type ElasticityConfidenceKey = keyof typeof ElasticityConfidence

/** Batch params for GET /v1/products/price-elasticity */
export interface PriceElasticityBatchParams {
  limit?: number
  offset?: number
}

/** Single item from batch response */
export interface PriceElasticityItem {
  nmId: number
  elasticity: number
  rSquared: number
  dataPoints: number
  source: string
  confidence: ElasticityConfidenceKey
}

/** Batch response: GET /v1/products/price-elasticity */
export interface PriceElasticityBatchResponse {
  items: PriceElasticityItem[]
  total: number
  byConfidence: Record<ElasticityConfidenceKey, number>
}

/** Single-SKU response: GET /v1/products/price-elasticity/{nmId} */
export interface PriceElasticitySkuResponse {
  nmId: number
  elasticity: number
  rSquared: number
  dataPoints: number
  source: string
  confidence: ElasticityConfidenceKey
  profitMaxPrice: number | null
}
