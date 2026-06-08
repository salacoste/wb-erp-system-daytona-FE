/**
 * Route builder helpers for dynamic routes.
 * Extracted from routes.ts for line-cap compliance.
 */

import { ROUTES } from '@/lib/routes'

/** Build supply detail route with specific supply ID. Epic 53-FE */
export const buildSupplyDetailRoute = (supplyId: string): string => {
  return `/supplies/${supplyId}`
}

/** Build shipment detail route with specific shipment ID. Epic 76-FE */
export const buildShipmentDetailRoute = (shipmentId: string): string => {
  return `/shipments/${shipmentId}`
}

export const buildCampaignDetailRoute = (advertId: number): string => {
  return `/analytics/advertising/campaigns/${advertId}`
}

/**
 * Build model performance detail route.
 * Story 109.5-FE: dynamic route /analytics/models/[id]/performance.
 */
export const buildModelPerformanceRoute = (modelId: string): string => {
  return `${ROUTES.ANALYTICS.MODELS}/${modelId}/performance`
}

/** Build model evaluations list route. Story 110.1-FE */
export const buildModelEvaluationsRoute = (modelId: string): string =>
  `${ROUTES.ANALYTICS.MODELS}/${modelId}/evaluations`

/** Build model SKU accuracy table route. Story 110.1-FE */
export const buildModelSkuAccuracyRoute = (modelId: string): string =>
  `${ROUTES.ANALYTICS.MODELS}/${modelId}/evaluations/sku-accuracy`

/**
 * Build Unified Product Analytics route for a given nmId. Epic 120-FE Story 120.5.
 * nmId is opaque ID — callers with numeric nmId must String() it (AP#10).
 */
export const buildProductAnalyticsRoute = (nmId: string): string =>
  `${ROUTES.ANALYTICS.PRODUCT}/${nmId}`
