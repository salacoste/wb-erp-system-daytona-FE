/**
 * Shipment Cost Allocation API barrel
 * Re-exports box-types, sku-packaging, and shipments API functions
 */

export {
  getBoxTypes,
  getBoxType,
  createBoxType,
  updateBoxType,
  deactivateBoxType,
} from './box-types-api'

export {
  getSkuPackaging,
  getSkuPackagingByNmId,
  createSkuPackaging,
  bulkCreateSkuPackaging,
  deleteSkuPackaging,
} from './sku-packaging-api'

export {
  getShipments,
  getShipment,
  createShipment,
  updateShipment,
  deleteShipment,
  addPallet,
  removePallet,
} from './shipments-api'

export { addBoxLine, updateBoxLine, removeBoxLine } from './box-lines-api'

export { getFcuBySku } from './fcu-aggregation-api'
export type { FcuBySkuItem } from './fcu-aggregation-api'

export {
  calculateShipment,
  confirmShipment,
  recalculateShipment,
} from './shipment-calculations-api'
