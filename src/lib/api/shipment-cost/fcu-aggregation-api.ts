/**
 * FCU Aggregation API client
 * Epic 77-FE, Story 77.4: Per-SKU Final Cost from latest confirmed shipment
 * Endpoint spec: docs/request-backend/162-FCU-AGGREGATION-ENDPOINT.md
 */

import { apiClient } from '@/lib/api-client'
import { normalizeFcuBySkuList } from './fcu-aggregation-normalizer'

/** Per-SKU FCU data from the most recently confirmed shipment */
export interface FcuBySkuItem {
  /** Wildberries article ID */
  nmId: number
  /** Product name / vendor code */
  productName: string
  /** PCU — Production Cost per Unit */
  latestPcu: number
  /**
   * DCU — Delivery Cost per Unit (₽/unit).
   * null = "unknown — no confirmed shipment yet" (CLAUDE.md anti-pattern #8).
   * Consumers MUST null-narrow before arithmetic (e.g., `dcu != null ? dcu * units : null`).
   */
  latestDcu: number | null
  /**
   * FCU — Final Cost per Unit = PCU + DCU (₽/unit).
   * null = "unknown — no confirmed shipment yet" (CLAUDE.md anti-pattern #8).
   * Consumers MUST null-narrow before arithmetic.
   */
  latestFcu: number | null
  /** UUID of the source shipment */
  shipmentId: string
  /** Human-readable shipment name (COALESCE'd to '' by backend) */
  shipmentName: string
  /** ISO timestamp of shipment confirmation */
  confirmedAt: string
}

/**
 * GET /v1/shipment-cost/by-sku — per-SKU FCU from latest confirmed shipment.
 * Standard data unwrap (NOT skipDataUnwrap).
 */
export async function getFcuBySku(week?: string): Promise<FcuBySkuItem[]> {
  const url = week
    ? `/v1/shipment-cost/by-sku?week=${encodeURIComponent(week)}`
    : '/v1/shipment-cost/by-sku'
  const raw = await apiClient.get<unknown>(url)
  return normalizeFcuBySkuList(raw)
}
