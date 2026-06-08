/**
 * FCU (Full Cost Unit) calculation types for shipment cost allocation.
 * Extracted from shipment-cost.ts for 200-line max-lines compliance.
 * Epic 76-FE: Calculate / Confirm / Recalculate response types.
 */

/** /calculate response — returns numbers (not Decimal strings); validation failure throws ApiError */
export interface CalculateShipmentResponse {
  results: CalculationResultItem[]
}

export interface CalculationResultItem {
  nmId: number
  productName: string
  unitCostRub: number
  deliveryCostPerUnit: number
  finalCostPerUnit: number
  totalUnits: number
  finalCostLine: number
}

/** /confirm response — shortened ConfirmShipmentResponseDto, NOT full ShipmentResponseDto */
export interface ConfirmShipmentResponse {
  shipmentId: string
  status: 'CONFIRMED'
  confirmedAt: string // ISO 8601
  confirmedBy: string
  snapshotCount: number
  totalFinalCost: number
}

/** /recalculate response — shortened RecalculateShipmentResponseDto */
export interface RecalculateShipmentResponse {
  shipmentId: string
  status: 'CONFIRMED'
  recalculatedAt: string // ISO 8601
  snapshotCount: number
  previousSnapshotCount: number
  totalFinalCost: number
}
