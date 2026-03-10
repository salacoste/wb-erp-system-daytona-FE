import type { UseFormSetValue } from 'react-hook-form'
import type { Warehouse } from '@/types/warehouse'
import type { FormData } from './usePriceCalculatorForm'
import type { AcceptanceTariff, AcceptanceCostResult } from '@/lib/acceptance-cost-utils'
import type { BoxTypeId } from '@/lib/box-type-utils'
import type { TariffSystem, SupplyDateTariffs, ExtractedTariffs } from '@/lib/tariff-system-utils'

/**
 * Props for useWarehouseFormState hook
 * Story 44.27-FE: Warehouse & Coefficients Integration
 */
export interface UseWarehouseFormStateProps {
  setValue: UseFormSetValue<FormData>
  lengthCm: number
  widthCm: number
  heightCm: number
  /** Delivery box type ID: 2=Boxes, 5=Pallets, 6=Supersafe */
  boxType: BoxTypeId
  /** Number of units per package (for per-unit cost calculation) */
  unitsPerPackage: number
  /** Optional acceptance tariff from admin settings */
  acceptanceTariff?: AcceptanceTariff
  /** Initial warehouse ID from preset (selected after warehouses load) */
  initialWarehouseId?: number | null
}

export interface UseWarehouseFormStateReturn {
  warehouseId: number | null
  /** Daily storage cost per unit (RUB/day) for TurnoverDaysInput */
  dailyStorageCost: number
  /** Current storage_rub value from form */
  storageRub: number
  volumeLiters: number
  /** Calculated logistics forward cost (auto-fill) */
  logisticsForwardRub: number
  /** Whether logistics forward was auto-filled (vs manually set) */
  isLogisticsAutoFilled: boolean
  /** Calculated logistics reverse cost (auto-fill) */
  logisticsReverseRub: number
  /** Whether logistics reverse was auto-filled (vs manually set) */
  isLogisticsReverseAutoFilled: boolean
  /** Current acceptance coefficient from delivery date selection */
  acceptanceCoefficient: number
  /** Calculated acceptance cost with formula for display */
  acceptanceCost: AcceptanceCostResult
  handleWarehouseChange: (id: number | null, warehouse: Warehouse | null) => void
  /** Set warehouse by ID from loaded warehouses list (for preset restoration) */
  setWarehouseById: (id: number, warehouses: Warehouse[]) => void
  /** Handler for TurnoverDaysInput storage_rub emission */
  handleStorageRubChange: (value: number) => void
  /** Handler for manual logistics forward override */
  handleLogisticsForwardChange: (value: number) => void
  /** Handler for manual logistics reverse override */
  handleLogisticsReverseChange: (value: number) => void
  /** Handler for delivery date change with optional supply tariffs */
  handleDeliveryDateChange: (
    date: string | null,
    coefficient: number,
    supplyData?: SupplyDateTariffs
  ) => void
  // Story 44.27: Method to get warehouse object for API request
  getWarehouseForApi: (warehouses: Warehouse[]) => Warehouse | null
  // Story 44.40: Two Tariff Systems Integration
  /** Active tariff system ('inventory' for today/no date, 'supply' for future) */
  tariffSystem: TariffSystem
  /** SUPPLY tariffs for selected date (null if using INVENTORY) */
  supplyTariffs: SupplyDateTariffs | null
  /** Effective tariffs extracted from the active system */
  effectiveTariffs: ExtractedTariffs
}
