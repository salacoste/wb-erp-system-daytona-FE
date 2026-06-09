/**
 * Product Search Helper Functions
 * Extracted from ProductSearchComponents.tsx for file-size compliance.
 * Shared formatting utilities for product display.
 */

import type { ProductWithDimensions } from '@/types/product'
import { mmToCm } from '@/lib/dimension-utils'

/** Format dimensions for display: "40×30×5 см (6.0 л)" */
export function formatDimensionsDisplay(product: ProductWithDimensions): string | null {
  if (!product.dimensions) return null
  const l = mmToCm(product.dimensions.length_mm)
  const w = mmToCm(product.dimensions.width_mm)
  const h = mmToCm(product.dimensions.height_mm)
  const vol = product.dimensions.volume_liters.toFixed(1)
  return `${l}×${w}×${h} см (${vol} л)`
}

/** Format category for display: "Женская одежда → Платья" */
export function formatCategoryDisplay(product: ProductWithDimensions): string | null {
  if (!product.category_hierarchy) return null
  const { parent_name, subject_name } = product.category_hierarchy
  return parent_name ? `${parent_name} → ${subject_name}` : subject_name
}
