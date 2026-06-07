/**
 * Shipment Calculation response types — Epic 122-FE (#193 §2).
 * Extracted from shipment-cost.ts to respect 200-line file limit.
 *
 * /calculate returns native numbers (not Decimal strings) per #161 §7.1.
 */

/** Raw backend pallet with nested lines */
export interface CalculatePalletResult {
  palletId: string
  palletNumber: number
  palletDeliveryCost: number
  palletTotalVolume: number
  lines: CalculatePalletLine[]
}

export interface CalculatePalletLine {
  boxLineId: string
  nmId: number
  boxCount: number
  totalUnits: number
  boxVolume: number
  totalVolume: number
  volumeShare: number
  unitCostRub: number
  allocatedDeliveryCost: number
  deliveryCostPerUnit: number
  finalCostPerUnit: number
  finalCostLine: number
}

/** FE-canonical flat result — normalized from nested pallet/lines structure */
export interface CalculateShipmentResponse {
  shipmentId: string
  deliveryMode: string
  totalDeliveryCost: number
  totalFinalCost: number
  calculatedAt: string
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

/** /confirm response — shortened ConfirmShipmentResponseDto */
export interface ConfirmShipmentResponse {
  shipmentId: string
  status: 'CONFIRMED'
  confirmedAt: string
  confirmedBy: string
  snapshotCount: number
  totalFinalCost: number
}

/** /recalculate response — shortened RecalculateShipmentResponseDto */
export interface RecalculateShipmentResponse {
  shipmentId: string
  status: 'CONFIRMED'
  recalculatedAt: string
  snapshotCount: number
  previousSnapshotCount: number
  totalFinalCost: number
}
