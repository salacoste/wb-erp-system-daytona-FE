/**
 * Shipment Calculations API client
 * Epic 76-FE, Story 76.4: Calculate / Story 76.5: Confirm + Recalculate
 * Source: docs/request-backend/161-SHIPMENT-COST-ALLOCATION.md §7-9
 */

import { apiClient } from '@/lib/api-client'
import type { CalculateShipmentResponse, Shipment } from '@/types/shipment-cost'

/** POST /v1/shipments/:id/calculate — no body, returns calculation results per SKU */
export async function calculateShipment(shipmentId: string): Promise<CalculateShipmentResponse> {
  return apiClient.post<CalculateShipmentResponse>(`/v1/shipments/${shipmentId}/calculate`)
}

/** POST /v1/shipments/:id/confirm — auto-calculates then confirms, DRAFT→CONFIRMED */
export async function confirmShipment(shipmentId: string, confirmedBy: string): Promise<Shipment> {
  return apiClient.post<Shipment>(`/v1/shipments/${shipmentId}/confirm`, { confirmedBy })
}

/** POST /v1/shipments/:id/recalculate — recalculates a CONFIRMED shipment with fresh COGS */
export async function recalculateShipment(shipmentId: string): Promise<CalculateShipmentResponse> {
  return apiClient.post<CalculateShipmentResponse>(`/v1/shipments/${shipmentId}/recalculate`)
}
