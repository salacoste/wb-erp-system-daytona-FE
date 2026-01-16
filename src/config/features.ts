/**
 * Feature Flags Configuration
 *
 * Manages feature toggles for progressive rollout and A/B testing.
 *
 * 🎯 USAGE:
 * ```typescript
 * import { features } from '@/config/features'
 *
 * if (features.epic37MergedGroups.enabled) {
 *   // Render Epic 37 UI
 * }
 *
 * if (features.epic37MergedGroups.useRealApi) {
 *   // Call real backend API
 * } else {
 *   // Use mock data
 * }
 * ```
 *
 * 🔧 ENVIRONMENT VARIABLES:
 * - NEXT_PUBLIC_EPIC_37_MERGED_GROUPS_ENABLED (default: true)
 * - NEXT_PUBLIC_EPIC_37_USE_REAL_API (default: false)
 *
 * Set in .env.local or .env.production:
 * ```bash
 * # Enable Epic 37 feature
 * NEXT_PUBLIC_EPIC_37_MERGED_GROUPS_ENABLED=true
 *
 * # Use mock data during development (default)
 * NEXT_PUBLIC_EPIC_37_USE_REAL_API=false
 *
 * # Switch to real API after Story 37.0 complete
 * NEXT_PUBLIC_EPIC_37_USE_REAL_API=true
 * ```
 */

// ============================================================================
// Epic 37: Merged Group Table Display (Склейки)
// ============================================================================

/**
 * Epic 37 Feature Flag Configuration
 *
 * 📋 EPIC: Epic 37 - Merged Group Table Display
 * 📖 Reference: docs/epics/epic-37-merged-group-table-display.md
 * 📖 Implementation Plan: docs/implementation-plans/epic-37-frontend-implementation-plan.md
 *
 * ⚠️ TEMPORARY MOCK DATA MODE (default during development)
 * This flag controls whether to use MOCK DATA or REAL API for Epic 37.
 *
 * 🔄 REPLACEMENT PROCESS (After Story 37.0 Complete):
 * 1. Backend team completes Story 37.0 (Request #88)
 * 2. Execute Story 37.1: API Validation
 * 3. If validation PASS:
 *    a. Set NEXT_PUBLIC_EPIC_37_USE_REAL_API=true in .env.local
 *    b. Test integration with real backend API
 *    c. Verify all features work correctly
 *    d. Set default to true in this file
 * 4. If validation FAIL:
 *    a. Report issues to backend team
 *    b. Keep using mock data until fixes deployed
 *
 * 📍 MOCK DATA LOCATION (DELETE after real API ready):
 * - src/mocks/data/epic-37-merged-groups.ts
 * - Search codebase for "epic-37-merged-groups" to find all usages
 *
 * 🎯 RELATED FILES TO UPDATE (when switching to real API):
 * - src/app/(dashboard)/analytics/advertising/page.tsx (API call)
 * - src/mocks/handlers/advertising.ts (remove mock handler)
 * - src/components/advertising/MergedGroupTable.tsx (remove mock imports)
 */
export interface Epic37FeatureConfig {
  /**
   * Enable/disable Epic 37 Merged Group Table feature
   *
   * When false: Fall back to standard SKU-level table (Epic 33)
   * When true: Show 3-tier rowspan table for merged groups
   *
   * Default: true (feature is ready for production)
   */
  enabled: boolean

  /**
   * Use real backend API vs mock data
   *
   * When false: Use mock data from src/mocks/data/epic-37-merged-groups.ts
   * When true: Call real backend API at /v1/analytics/advertising?group_by=imtId
   *
   * Default: false (mock data during development)
   *
   * ⚠️ CHANGE TO TRUE after Story 37.0 complete and Story 37.1 validation PASS
   */
  useRealApi: boolean

  /**
   * Show debug information in console
   *
   * When true: Log API responses, aggregate calculations, validation results
   * When false: Silent mode (production)
   *
   * Default: false (only in development)
   */
  debug: boolean
}

export const epic37MergedGroups: Epic37FeatureConfig = {
  enabled: process.env.NEXT_PUBLIC_EPIC_37_MERGED_GROUPS_ENABLED === 'true' || true,

  // ✅ Story 37.1 COMPLETE: Real API integration enabled (Request #88)
  // Backend returns nested structure with aggregateMetrics + products[]
  useRealApi: process.env.NEXT_PUBLIC_EPIC_37_USE_REAL_API === 'true' || true,

  debug: process.env.NODE_ENV === 'development',
}

// ============================================================================
// All Feature Flags
// ============================================================================

/**
 * Global feature flags registry
 *
 * Add new feature flags here following the pattern above.
 */
export const features = {
  /**
   * Epic 37: Merged Group Table Display (Склейки)
   *
   * 3-tier rowspan table for product card linking.
   * Shows aggregate metrics + individual product breakdown.
   *
   * Status: ✅ READY (frontend) | ⏳ IN PROGRESS (backend Story 37.0)
   */
  epic37MergedGroups,

  // Add more feature flags here as needed
  // epic38Example: { ... },
}

// ============================================================================
// Type Exports
// ============================================================================

export type Features = typeof features

/**
 * Helper type for feature flag keys
 */
export type FeatureKey = keyof Features
