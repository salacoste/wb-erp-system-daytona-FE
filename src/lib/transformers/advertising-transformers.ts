/**
 * Advertising Analytics Data Transformers - Epic 37 Story 37.1
 *
 * Transforms backend API responses to frontend-compatible types.
 * Request #88: Supports new nested structure for merged groups.
 *
 * @see docs/request-backend/88-epic-37-individual-product-metrics.md
 * @see frontend/docs/stories/epic-37/STORY-37.1-INTEGRATION-PLAN.md
 */

import type { AdvertisingGroup } from '@/types/advertising-analytics';

/**
 * Transform backend merged group response to frontend AdvertisingGroup.
 *
 * NOTE: As of Request #88, backend already returns the exact structure
 * we need, so this is mostly a pass-through with type validation.
 *
 * @param backendItem - Raw backend response item
 * @returns Validated AdvertisingGroup or null if invalid
 */
export function transformMergedGroup(
  backendItem: unknown
): AdvertisingGroup | null {
  const item = backendItem as any;

  // Type guard: verify it's a merged_group or individual type
  if (item.type !== 'merged_group' && item.type !== 'individual') {
    console.warn('[Transformer] Invalid type:', item.type);
    return null;
  }

  // Verify required fields exist
  if (!item.aggregateMetrics || !Array.isArray(item.products)) {
    console.warn('[Transformer] Missing required fields:', {
      hasAggregateMetrics: !!item.aggregateMetrics,
      hasProducts: Array.isArray(item.products),
    });
    return null;
  }

  // For merged groups, imtId is required
  if (item.type === 'merged_group' && !item.imtId) {
    console.warn('[Transformer] merged_group requires imtId');
    return null;
  }

  // Validate mainProduct exists
  if (!item.mainProduct?.nmId) {
    console.warn('[Transformer] Invalid mainProduct:', item.mainProduct);
    return null;
  }

  // Return as-is (backend structure matches frontend)
  return item as AdvertisingGroup;
}

/**
 * Transform array of backend items, filtering only valid merged/individual groups.
 *
 * @param backendData - Array of raw backend response items
 * @returns Array of validated AdvertisingGroup items
 *
 * @example
 * const apiResponse = await getAdvertisingAnalytics({ groupBy: 'imtId' });
 * const groups = transformMergedGroups(apiResponse.data);
 */
export function transformMergedGroups(
  backendData: unknown[]
): AdvertisingGroup[] {
  if (!Array.isArray(backendData)) {
    console.error('[Transformer] Expected array, got:', typeof backendData);
    return [];
  }

  const transformed = backendData
    .map(transformMergedGroup)
    .filter((item): item is AdvertisingGroup => item !== null);

  return transformed;
}

/**
 * Filter only merged_group types (exclude standalone products).
 *
 * Use this when you only want grouped products, not individual ones.
 *
 * @param groups - Array of AdvertisingGroup items
 * @returns Only merged_group types
 */
export function filterMergedGroupsOnly(
  groups: AdvertisingGroup[]
): AdvertisingGroup[] {
  return groups.filter((group) => group.type === 'merged_group');
}

/**
 * Filter only individual types (standalone products).
 *
 * @param groups - Array of AdvertisingGroup items
 * @returns Only individual types
 */
export function filterIndividualProductsOnly(
  groups: AdvertisingGroup[]
): AdvertisingGroup[] {
  return groups.filter((group) => group.type === 'individual');
}
