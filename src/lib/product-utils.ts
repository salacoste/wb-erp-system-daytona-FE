/**
 * Product Utility Functions
 * Story 44.33-FE: Frontend Type Mismatch & Field Name Fixes
 *
 * Helper functions for displaying product category data from category_hierarchy.
 * Handles null/undefined values gracefully for UI components.
 */

import type { CategoryHierarchy } from '@/types/product'

/**
 * Get display name for product category
 * Shows full hierarchy: "Parent → Subject"
 *
 * @example
 * getCategoryDisplayName({ subject_name: 'Платья', parent_name: 'Женская одежда' })
 * // Returns: "Женская одежда → Платья"
 *
 * getCategoryDisplayName(null)
 * // Returns: "Без категории"
 */
export function getCategoryDisplayName(
  category: CategoryHierarchy | null | undefined
): string {
  if (!category) return 'Без категории'

  if (category.parent_name) {
    return `${category.parent_name} → ${category.subject_name}`
  }

  return category.subject_name
}

/**
 * Get leaf category name (subject_name)
 *
 * @example
 * getCategoryName({ subject_name: 'Платья', parent_name: 'Женская одежда' })
 * // Returns: "Платья"
 *
 * getCategoryName(null)
 * // Returns: "Без категории"
 */
export function getCategoryName(
  category: CategoryHierarchy | null | undefined
): string {
  return category?.subject_name || 'Без категории'
}

/**
 * Get root category name (parent_name)
 *
 * @example
 * getParentCategoryName({ subject_name: 'Платья', parent_name: 'Женская одежда' })
 * // Returns: "Женская одежда"
 *
 * getParentCategoryName({ subject_name: 'Электроника', parent_name: null })
 * // Returns: "—"
 *
 * getParentCategoryName(null)
 * // Returns: "—"
 */
export function getParentCategoryName(
  category: CategoryHierarchy | null | undefined
): string {
  return category?.parent_name || '—'
}

/**
 * Get leaf category ID (subject_id)
 *
 * @example
 * getCategoryId({ subject_id: 105, subject_name: 'Платья' })
 * // Returns: 105
 *
 * getCategoryId(null)
 * // Returns: null
 */
export function getCategoryId(
  category: CategoryHierarchy | null | undefined
): number | null {
  return category?.subject_id ?? null
}
